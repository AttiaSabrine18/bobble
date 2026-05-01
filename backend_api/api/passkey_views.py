# api/passkey_views.py

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
)
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    ResidentKeyRequirement,
)
from webauthn.helpers.cose import COSEAlgorithmIdentifier
from .models import User, UserPasskey
import json
import base64

# RP (Relying Party) Info
RP_ID = "localhost"
RP_NAME = "Bobble App"
ORIGIN = "http://localhost:3000"


# ✅ Fonction helper pour générer le token avec les claims personnalisés
def get_tokens_for_user(user):
    """Génère un token JWT avec les claims personnalisés"""
    from rest_framework_simplejwt.tokens import RefreshToken
    
    refresh = RefreshToken.for_user(user)
    
    # ✅ Ajouter les claims personnalisés
    refresh['username'] = user.username
    refresh['email'] = user.email
    refresh['user_id'] = user.id
    
    # Ajouter les infos du profil si disponibles
    try:
        if hasattr(user, 'profile'):
            refresh['full_name'] = user.profile.full_name or ''
            refresh['bio'] = user.profile.bio or ''
            refresh['image'] = str(user.profile.image) if user.profile.image else ''
            refresh['verified'] = user.profile.verified
    except:
        pass
    
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


# ─── REGISTRATION ───────────────────────────────────────

@csrf_exempt
def passkey_register_begin(request):
    """Step 1 - Generate registration options"""
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    data = json.loads(request.body)
    email = data.get("email")

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    options = generate_registration_options(
        rp_id=RP_ID,
        rp_name=RP_NAME,
        user_id=str(user.id),
        user_name=user.email,
        user_display_name=user.username,
        authenticator_selection=AuthenticatorSelectionCriteria(
            resident_key=ResidentKeyRequirement.REQUIRED,
            user_verification=UserVerificationRequirement.REQUIRED,
        ),
        supported_pub_key_algs=[COSEAlgorithmIdentifier.ECDSA_SHA_256],
    )

    # Save challenge in session
    request.session["passkey_challenge"] = base64.b64encode(
        options.challenge
    ).decode()
    request.session["passkey_user_id"] = user.id

    import webauthn
    return JsonResponse(webauthn.options_to_json(options), safe=False)


@csrf_exempt
def passkey_register_complete(request):
    """Step 2 - Verify registration response"""
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    data = json.loads(request.body)
    challenge = base64.b64decode(request.session.get("passkey_challenge", ""))
    user_id = request.session.get("passkey_user_id")

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    try:
        verification = verify_registration_response(
            credential=data,
            expected_rp_id=RP_ID,
            expected_origin=ORIGIN,
            expected_challenge=challenge,
        )

        # Save passkey to database
        UserPasskey.objects.create(
            user=user,
            credential_id=base64.b64encode(
                verification.credential_id
            ).decode(),
            public_key=base64.b64encode(
                verification.credential_public_key
            ).decode(),
            sign_count=verification.sign_count,
        )

        # ✅ Retourner le token après inscription
        tokens = get_tokens_for_user(user)
        
        return JsonResponse({
            **tokens,
            "status": "Passkey registered successfully"
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


# ─── AUTHENTICATION ──────────────────────────────────────

@csrf_exempt
def passkey_login_begin(request):
    """Step 1 - Generate authentication options"""
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    data = json.loads(request.body)
    email = data.get("email")

    try:
        user = User.objects.get(email=email)
        passkey = UserPasskey.objects.get(user=user)
    except (User.DoesNotExist, UserPasskey.DoesNotExist):
        return JsonResponse({"error": "No passkey found for this user"}, status=404)

    options = generate_authentication_options(
        rp_id=RP_ID,
        user_verification=UserVerificationRequirement.REQUIRED,
    )

    request.session["passkey_challenge"] = base64.b64encode(
        options.challenge
    ).decode()
    request.session["passkey_user_id"] = user.id

    import webauthn
    return JsonResponse(webauthn.options_to_json(options), safe=False)


@csrf_exempt
def passkey_login_complete(request):
    """Step 2 - Verify authentication response + return JWT"""
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    data = json.loads(request.body)
    challenge = base64.b64decode(request.session.get("passkey_challenge", ""))
    user_id = request.session.get("passkey_user_id")

    try:
        user = User.objects.get(id=user_id)
        passkey = UserPasskey.objects.get(user=user)
    except (User.DoesNotExist, UserPasskey.DoesNotExist):
        return JsonResponse({"error": "User not found"}, status=404)

    try:
        verification = verify_authentication_response(
            credential=data,
            expected_rp_id=RP_ID,
            expected_origin=ORIGIN,
            expected_challenge=challenge,
            credential_public_key=base64.b64decode(passkey.public_key),
            credential_current_sign_count=passkey.sign_count,
        )

        # Update sign count
        passkey.sign_count = verification.new_sign_count
        passkey.save()

        # ✅ Utiliser la fonction helper pour générer le token avec les claims
        tokens = get_tokens_for_user(user)

        return JsonResponse(tokens)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)