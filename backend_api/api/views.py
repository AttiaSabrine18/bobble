from datetime import timezone
import uuid
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Avg, Count, Sum, Q
import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.db.models import Q
from api.models import AccessoryListing, ListingFavorite, MarketplaceMessage, MarketplaceOrder, NeedleListing, User, Pattern, Project, ProjectImage, Comment, Favorite, Queue, YarnBrand, YarnLine, YarnListing, YarnStash, NeedleHook, Follow, Bundle, Purchase ,Group, GroupMembership, ForumThread, ForumReply, Conversation, Message, CraftAlong, CraftAlongParticipant ,MarketplaceSale  
from api.serializer import(
    AccessoryListingSerializer, NeedleListingSerializer, RegisterSerializer, UserSerializer,
    UserExtendedSerializer, ProfileSerializer, TagSerializer,
    PatternSerializer, ProjectSerializer, ProjectImageSerializer,
    CommentSerializer, FavoriteSerializer, QueueSerializer, YarnBrandSerializer, YarnLineSerializer, YarnListingSerializer,
    YarnStashSerializer, NeedleHookSerializer, FollowSerializer,
    BundleSerializer, PurchaseSerializer , 
    GroupSerializer, GroupMembershipSerializer, ForumThreadSerializer, ForumReplySerializer,
    ConversationSerializer, MessageSerializer, CraftAlongSerializer, CraftAlongParticipantSerializer,
)
import stripe
from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated , AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
User = get_user_model()
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics, viewsets, filters
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.exceptions import PermissionDenied
stripe.api_key = settings.STRIPE_SECRET_KEY
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from django.core.mail import EmailMessage
from .utils import generate_invoice
import os
from .ai_service import get_image_vector, find_similar_patterns
from django_filters.rest_framework import DjangoFilterBackend
# ─── Tocken ──────────────────────────────────────────────────

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        token['user_id'] = user.id
        print(f"✅ Token claims: username={user.username}, email={user.email}, user_id={user.id}") 
        # Ajouter les infos du profil
        if hasattr(user, 'profile'):
            token['full_name'] = user.profile.full_name or ''
            token['bio'] = user.profile.bio or ''
            token['image'] = str(user.profile.image) if user.profile.image else ''
            token['verified'] = user.profile.verified
        return token

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

def get_tokens_for_user(user):
    """Génère un token JWT avec les claims personnalisés"""
    refresh = RefreshToken.for_user(user)
    
    # Ajouter les claims personnalisés
    refresh['username'] = user.username
    refresh['email'] = user.email
    refresh['user_id'] = user.id
    
    if hasattr(user, 'profile'):
        refresh['full_name'] = user.profile.full_name or ''
        refresh['bio'] = user.profile.bio or ''
        refresh['image'] = str(user.profile.image) if user.profile.image else ''
        refresh['verified'] = user.profile.verified
    
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }

@api_view(['GET'])
def getRoutes(request):
    routes = [
        '/api/token/',
        '/api/register/',
        '/api/token/refresh/'
    ]
    return Response(routes)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def testEndPoint(request):
    if request.method == 'GET':
        data = f"Congratulation {request.user}, your API just responded to GET request"
        return Response({'response': data}, status=status.HTTP_200_OK)
    elif request.method == 'POST':
        text = "Hello buddy"
        data = f'Congratulation your API just responded to POST request with text: {text}'
        return Response({'response': data}, status=status.HTTP_200_OK)
    return Response({}, status.HTTP_400_BAD_REQUEST)


# ─── PROFILE ─────────────────────────────────────────────────────────────────

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.profile


class PublicProfileView(generics.RetrieveAPIView):
    serializer_class = UserExtendedSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        username = self.kwargs.get('username')
        return get_object_or_404(User, username=username)


# ─── PATTERN ────────────────────────────────────────────────────────────────
    
class PatternViewSet(viewsets.ModelViewSet):
    serializer_class = PatternSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'level', 'is_free']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'price', 'favorites_count']

    def get_queryset(self):
        queryset = Pattern.objects.all().order_by('-created_at')

        username = self.request.query_params.get('author')

        if username:
            queryset = queryset.filter(author__username=username)

        return queryset
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
    def perform_update(self, serializer):
       if self.get_object().author != self.request.user:
            raise PermissionDenied("Not your pattern")
       serializer.save()

def perform_destroy(self, instance):
    if instance.author != self.request.user:
        raise PermissionDenied("Not your pattern")
    instance.delete()
    


# ─── PROJECT ────────────────────────────────────────────────────────────────

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['created_at', 'start_date']

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        project = self.get_object()
        if project.user != request.user:
            return Response(
                {'error': 'Vous ne pouvez modifier que vos propres projets.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        project = self.get_object()
        if project.user != request.user:
            return Response(
                {'error': 'Vous ne pouvez supprimer que vos propres projets.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


# ─── PROJECT IMAGE UPLOAD ────────────────────────────────────────────────────

class ProjectImageUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        image = request.FILES.get('image')

        if not image:
            return Response({'error': 'Aucune image fournie.'}, status=status.HTTP_400_BAD_REQUEST)

        if image.size > 5 * 1024 * 1024:
            return Response({'error': 'Image trop lourde. Maximum 5Mo.'}, status=status.HTTP_400_BAD_REQUEST)

        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        if image.content_type not in allowed_types:
            return Response({'error': 'Format non supporté. Utilisez jpg, png ou webp.'}, status=status.HTTP_400_BAD_REQUEST)

        project_image = ProjectImage.objects.create(
            project=project,
            image=image,
            caption=request.data.get('caption', ''),
            is_main=request.data.get('is_main', False)
        )
        serializer = ProjectImageSerializer(project_image)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ─── COMMENT ────────────────────────────────────────────────────────────────

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        pattern_id = self.kwargs.get('pattern_id')
        if pattern_id:
            return Comment.objects.filter(pattern_id=pattern_id).order_by('-created_at')
        return Comment.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class PatternCommentsView(APIView):
    """Récupérer les commentaires d'un pattern"""
    permission_classes = [AllowAny]
    
    def get(self, request, pattern_id):
        comments = Comment.objects.filter(
            pattern_id=pattern_id
        ).select_related('user', 'user__profile').order_by('-created_at')
        
        data = []
        for comment in comments:
            profile_image = None
            try:
                if hasattr(comment.user, 'profile') and comment.user.profile.image:
                    profile_image = request.build_absolute_uri(comment.user.profile.image.url)
            except:
                pass
            
            data.append({
                'id': comment.id,
                'user_id': comment.user.id,
                'username': comment.user.username,
                'profile_image': profile_image,
                'text': comment.text,
                'rating': comment.rating,
                'created_at': comment.created_at,
            })
        
        # Calculer la note moyenne
        avg_rating = comments.aggregate(avg=Avg('rating'))['avg'] if comments.exists() else 0
        
        return Response({
            'comments': data,
            'count': len(data),
            'average_rating': round(avg_rating, 1) if avg_rating else 0,
        }, status=status.HTTP_200_OK)
# ─── FAVORITE TOGGLE ────────────────────────────────────────────────────────

class FavoriteToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pattern_id):
        pattern = get_object_or_404(Pattern, id=pattern_id)
        favorite, created = Favorite.objects.get_or_create(
            user=request.user, pattern=pattern
        )
        if created:
            pattern.favorites_count += 1
            pattern.save()
            return Response({'status': 'added', 'favorites_count': pattern.favorites_count}, status=status.HTTP_201_CREATED)
        return Response({'status': 'already exists'}, status=status.HTTP_200_OK)

    def delete(self, request, pattern_id):
        pattern = get_object_or_404(Pattern, id=pattern_id)
        favorite = Favorite.objects.filter(user=request.user, pattern=pattern).first()
        if favorite:
            favorite.delete()
            pattern.favorites_count = max(0, pattern.favorites_count - 1)
            pattern.save()
            return Response({'status': 'removed', 'favorites_count': pattern.favorites_count}, status=status.HTTP_200_OK)
        return Response({'error': 'Favori introuvable.'}, status=status.HTTP_404_NOT_FOUND)

class UserFavoritesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        favorites = Favorite.objects.filter(user=request.user).select_related('pattern')
        serializer = FavoriteSerializer(favorites, many=True)
        return Response(serializer.data)
class CheckFavoriteView(APIView):
    """Vérifier si l'utilisateur a mis en favori un pattern"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pattern_id):
        is_favorited = Favorite.objects.filter(
            user=request.user, 
            pattern_id=pattern_id
        ).exists()
        
        return Response({
            'is_favorited': is_favorited
        }, status=status.HTTP_200_OK)
# ─── QUEUE TOGGLE ───────────────────────────────────────────────────────────

class QueueToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pattern_id):
        pattern = get_object_or_404(Pattern, id=pattern_id)
        queue, created = Queue.objects.get_or_create(
            user=request.user, pattern=pattern,
            defaults={'priority': Queue.objects.filter(user=request.user).count() + 1}
        )
        if created:
            return Response({'status': 'added'}, status=status.HTTP_201_CREATED)
        return Response({'status': 'already in queue'}, status=status.HTTP_200_OK)

    def delete(self, request, pattern_id):
        pattern = get_object_or_404(Pattern, id=pattern_id)
        queue = Queue.objects.filter(user=request.user, pattern=pattern).first()
        if queue:
            queue.delete()
            return Response({'status': 'removed'}, status=status.HTTP_200_OK)
        return Response({'error': 'Patron non trouvé dans la queue.'}, status=status.HTTP_404_NOT_FOUND)
    def get(self, request):
        queue = Queue.objects.filter(user=request.user).select_related('pattern').order_by('priority')
        serializer = QueueSerializer(queue, many=True)
        return Response(serializer.data)
class QueueListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queue = Queue.objects.filter(user=request.user).select_related('pattern').order_by('priority')
        serializer = QueueSerializer(queue, many=True)
        return Response(serializer.data)
# ====================== YARN BRAND ======================
class YarnBrandViewSet(viewsets.ModelViewSet):
    queryset = YarnBrand.objects.all()
    serializer_class = YarnBrandSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
# ====================== YARN LINE ======================
class YarnLineViewSet(viewsets.ModelViewSet):
    queryset = YarnLine.objects.all().select_related('brand')
    serializer_class = YarnLineSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['brand', 'weight_category']
    search_fields = ['name', 'brand__name']
# ====================== STASH STATS ======================
class StashStatsView(APIView):
    """Statistiques du stash de l'utilisateur"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        yarns = YarnStash.objects.filter(user=request.user)
        
        total_yarns = yarns.count()
        available_yarns = yarns.filter(status='disponible').count()
        total_grams = sum(y.total_grams for y in yarns if y.total_grams)
        total_meters = sum(y.total_meterage for y in yarns if y.total_meterage)
        total_value = sum(y.purchase_price * y.quantity for y in yarns if y.purchase_price)
        
        # Par poids
        weight_stats = {}
        for y in yarns.filter(weight__isnull=False):
            weight = y.get_weight_display()
            if weight not in weight_stats:
                weight_stats[weight] = {'count': 0, 'grams': 0}
            weight_stats[weight]['count'] += 1
            if y.total_grams:
                weight_stats[weight]['grams'] += y.total_grams
        
        return Response({
            'total_yarns': total_yarns,
            'available_yarns': available_yarns,
            'total_grams': total_grams,
            'total_meters': total_meters,
            'total_value': round(total_value, 2) if total_value else 0,
            'weight_stats': weight_stats,
        })

# ====================== MARKETPLACE - YARN LISTINGS ======================
class YarnListingViewSet(viewsets.ModelViewSet):
    """Annonces de laine à vendre"""
    queryset = YarnListing.objects.filter(is_active=True).select_related('seller', 'seller__profile')
    serializer_class = YarnListingSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['weight', 'condition', 'brand', 'is_active']
    search_fields = ['name', 'brand', 'colorway', 'description']
    ordering_fields = ['price', 'created_at', 'views_count']
    ordering = ['-created_at']
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Surcharger create pour débuguer"""
        print(f"\n{'='*60}")
        print(f"🧶 CRÉATION LAINE - Données reçues:")
        print(f"   Content-Type: {request.content_type}")
        print(f"   POST data: {dict(request.POST)}")
        print(f"   FILES: {dict(request.FILES)}")
        print(f"   Raw data keys: {list(request.data.keys())}")
        print(f"{'='*60}")
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            print(f"❌ ERREURS DE VALIDATION LAINE:")
            for field, errors in serializer.errors.items():
                print(f"   Champ '{field}': {errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"✅ VALIDATION LAINE RÉUSSIE - {serializer.validated_data}")
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)
        print(f"✅ LAINE CRÉÉE avec succès")
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        return super().retrieve(request, *args, **kwargs)


# ====================== MARKETPLACE - NEEDLE LISTINGS ======================
class NeedleListingViewSet(viewsets.ModelViewSet):
    """Annonces d'aiguilles/crochets à vendre"""
    queryset = NeedleListing.objects.filter(is_active=True).select_related('seller', 'seller__profile')
    serializer_class = NeedleListingSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'material', 'condition', 'is_active']
    search_fields = ['brand', 'description']
    ordering_fields = ['price', 'size_mm', 'created_at', 'views_count']
    ordering = ['-created_at']
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Surcharger create pour débuguer"""
        print(f"\n{'='*60}")
        print(f"🪡 CRÉATION AIGUILLE - Données reçues:")
        print(f"   Content-Type: {request.content_type}")
        print(f"   POST data: {dict(request.POST)}")
        print(f"   FILES: {dict(request.FILES)}")
        print(f"   Raw data keys: {list(request.data.keys())}")
        print(f"{'='*60}")
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            print(f"❌ ERREURS DE VALIDATION AIGUILLE:")
            for field, errors in serializer.errors.items():
                print(f"   Champ '{field}': {errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"✅ VALIDATION AIGUILLE RÉUSSIE - {serializer.validated_data}")
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)
        print(f"✅ AIGUILLE CRÉÉE avec succès")
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        return super().retrieve(request, *args, **kwargs)


# ====================== MARKETPLACE - ACCESSORY LISTINGS ======================
class AccessoryListingViewSet(viewsets.ModelViewSet):
    """Annonces d'accessoires à vendre"""
    queryset = AccessoryListing.objects.filter(is_active=True).select_related('seller', 'seller__profile')
    serializer_class = AccessoryListingSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'condition', 'is_active']
    search_fields = ['title', 'brand', 'description']
    ordering_fields = ['price', 'created_at', 'views_count']
    ordering = ['-created_at']
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Surcharger create pour débuguer"""
        print(f"\n{'='*60}")
        print(f"✂️ CRÉATION ACCESSOIRE - Données reçues:")
        print(f"   Content-Type: {request.content_type}")
        print(f"   POST data: {dict(request.POST)}")
        print(f"   FILES: {dict(request.FILES)}")
        print(f"   Raw data keys: {list(request.data.keys())}")
        print(f"   Raw data values:")
        for key, value in request.data.items():
            if hasattr(value, 'read'):
                print(f"      {key}: <File: {value.name}>")
            else:
                print(f"      {key}: {value}")
        print(f"{'='*60}")
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            print(f"❌ ERREURS DE VALIDATION ACCESSOIRE:")
            for field, errors in serializer.errors.items():
                print(f"   Champ '{field}': {errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"✅ VALIDATION ACCESSOIRE RÉUSSIE - {serializer.validated_data}")
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)
        print(f"✅ ACCESSOIRE CRÉÉ avec succès")
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        return super().retrieve(request, *args, **kwargs)
# ====================== LISTING FAVORITES ======================
class ListingFavoriteToggleView(APIView):
    """Ajouter/Retirer une annonce des favoris"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        yarn_id = request.data.get('yarn_listing')
        needle_id = request.data.get('needle_listing')
        accessory_id = request.data.get('accessory_listing')
        
        # Vérifier qu'au moins un type est fourni
        if not yarn_id and not needle_id and not accessory_id:
            return Response(
                {'error': 'Aucune annonce spécifiée'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        favorite, created = ListingFavorite.objects.get_or_create(
            user=request.user,
            yarn_listing_id=yarn_id,
            needle_listing_id=needle_id,
            accessory_listing_id=accessory_id,
        )
        
        if created:
            return Response({'status': 'added'}, status=status.HTTP_201_CREATED)
        return Response({'status': 'already_exists'}, status=status.HTTP_200_OK)
    
    def delete(self, request):
        yarn_id = request.query_params.get('yarn_listing')
        needle_id = request.query_params.get('needle_listing')
        accessory_id = request.query_params.get('accessory_listing')
        
        try:
            favorite = ListingFavorite.objects.get(
                user=request.user,
                yarn_listing_id=yarn_id if yarn_id else None,
                needle_listing_id=needle_id if needle_id else None,
                accessory_listing_id=accessory_id if accessory_id else None,
            )
            favorite.delete()
            return Response({'status': 'removed'}, status=status.HTTP_200_OK)
        except ListingFavorite.DoesNotExist:
            return Response({'error': 'Favori non trouvé'}, status=status.HTTP_404_NOT_FOUND)


class UserListingFavoritesView(APIView):
    """Liste des favoris de l'utilisateur"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        favorites = ListingFavorite.objects.filter(
            user=request.user
        ).select_related('yarn_listing', 'needle_listing', 'accessory_listing')
        
        data = {
            'yarn': [],
            'needles': [],
            'accessories': []
        }
        
        for fav in favorites:
            if fav.yarn_listing:
                data['yarn'].append(YarnListingSerializer(
                    fav.yarn_listing, context={'request': request}
                ).data)
            elif fav.needle_listing:
                data['needles'].append(NeedleListingSerializer(
                    fav.needle_listing, context={'request': request}
                ).data)
            elif fav.accessory_listing:
                data['accessories'].append(AccessoryListingSerializer(
                    fav.accessory_listing, context={'request': request}
                ).data)
        
        return Response(data, status=status.HTTP_200_OK)
# ─── YARN STASH ─────────────────────────────────────────────────────────────

class YarnStashViewSet(viewsets.ModelViewSet):
    serializer_class = YarnStashSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return YarnStash.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ─── NEEDLE / HOOK ──────────────────────────────────────────────────────────

class NeedleHookViewSet(viewsets.ModelViewSet):
    serializer_class = NeedleHookSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return NeedleHook.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ─── FOLLOW / UNFOLLOW ──────────────────────────────────────────────────────
# api/views.py

class FollowToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, username):
        user_to_follow = get_object_or_404(User, username=username)

        if user_to_follow == request.user:
            return Response({'error': 'Vous ne pouvez pas vous suivre vous-même.'}, status=400)

        follow, created = Follow.objects.get_or_create(
            follower=request.user,
            following=user_to_follow
        )

        if created:
            return Response({'status': 'following'}, status=201)
        return Response({'status': 'already following'}, status=200)

    def delete(self, request, username):  
        user_to_unfollow = get_object_or_404(User, username=username)

        follow = Follow.objects.filter(
            follower=request.user,
            following=user_to_unfollow
        ).first()

        if follow:
            follow.delete()
            return Response({'status': 'unfollowed'}, status=200)
        return Response({'error': 'Not following'}, status=404)


class FollowingListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        follows = Follow.objects.filter(
            follower=request.user
        ).select_related('following__profile')
        data = []
        for f in follows:
            u = f.following
            profile_image = None
            try:
                profile_image = u.profile.image.url if u.profile.image else None
            except Exception:
                pass
            data.append({
                'id': f.id,
                'username': u.username,
                'full_name': getattr(getattr(u, 'profile', None), 'full_name', '') or '',
                'profile_image': profile_image,
            })
        return Response(data)


class FollowersListView(APIView):
    """Liste des followers d'un utilisateur"""
    permission_classes = [AllowAny]

    def get(self, request, username):
        user = get_object_or_404(User, username=username)
        follows = Follow.objects.filter(
            following=user
        ).select_related('follower__profile')
        data = []
        for f in follows:
            u = f.follower
            profile_image = None
            try:
                profile_image = u.profile.image.url if u.profile.image else None
            except Exception:
                pass
            data.append({
                'id': f.id,
                'username': u.username,
                'full_name': getattr(getattr(u, 'profile', None), 'full_name', '') or '',
                'profile_image': profile_image,
                'is_following_you': Follow.objects.filter(follower=user, following=u).exists(),
            })
        return Response(data)
# ─── BUNDLE ─────────────────────────────────────────────────────────────────

class BundleViewSet(viewsets.ModelViewSet):
    serializer_class = BundleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Bundle.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ─── ACTIVITY FEED ──────────────────────────────────────────────────────────

class ActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        following_users = Follow.objects.filter(
            follower=request.user
        ).values_list('following', flat=True)

        recent_projects = Project.objects.filter(
            user__in=following_users
        ).order_by('-created_at')[:10]

        recent_patterns = Pattern.objects.filter(
            author__in=following_users
        ).order_by('-created_at')[:10]

        recent_favorites = Favorite.objects.filter(
            user__in=following_users
        ).order_by('-created_at')[:10]

        activity = []

        for project in recent_projects:
            activity.append({
                'type': 'project',
                'user': project.user.username,
                'content': f"a créé un projet : {project.pattern}",
                'date': project.created_at,
            })

        for pattern in recent_patterns:
            activity.append({
                'type': 'pattern',
                'user': pattern.author.username,
                'content': f"a publié un patron : {pattern.title}",
                'date': pattern.created_at,
            })

        for favorite in recent_favorites:
            activity.append({
                'type': 'favorite',
                'user': favorite.user.username,
                'content': f"a mis en favori : {favorite.pattern.title}",
                'date': favorite.created_at,
            })

        activity.sort(key=lambda x: x['date'], reverse=True)
        return Response(activity[:20], status=status.HTTP_200_OK)


# ─── GLOBAL SEARCH ──────────────────────────────────────────────────────────

class SearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response(
                {'error': 'Paramètre q requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        patterns = Pattern.objects.filter(
            Q(title__icontains=query) | Q(description__icontains=query)
        )[:10]

        users = User.objects.filter(
            Q(username__icontains=query) | Q(email__icontains=query)
        )[:10]

        yarns = YarnStash.objects.filter(
            Q(name__icontains=query) | Q(brand__icontains=query)
        )[:10]

        return Response({
            'patterns': PatternSerializer(patterns, many=True).data,
            'users': UserSerializer(users, many=True).data,
            'yarns': YarnStashSerializer(yarns, many=True).data,
        }, status=status.HTTP_200_OK)

# ─── GROUPES ─────────────────────────────────────────────────────────────────

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().order_by('-created_at')
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        group = serializer.save(admin=self.request.user)
        # L'admin rejoint automatiquement le groupe
        GroupMembership.objects.create(user=self.request.user, group=group, role='admin')


class GroupJoinView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        group = get_object_or_404(Group, id=group_id)
        membership, created = GroupMembership.objects.get_or_create(
            user=request.user, group=group,
            defaults={'role': 'member'}
        )
        if created:
            return Response({'status': 'joined'}, status=status.HTTP_201_CREATED)
        return Response({'status': 'already member'}, status=status.HTTP_200_OK)

    def delete(self, request, group_id):
        group = get_object_or_404(Group, id=group_id)
        if group.admin == request.user:
            return Response({'error': "L'admin ne peut pas quitter son groupe."}, status=status.HTTP_400_BAD_REQUEST)
        membership = GroupMembership.objects.filter(user=request.user, group=group).first()
        if membership:
            membership.delete()
            return Response({'status': 'left'}, status=status.HTTP_200_OK)
        return Response({'error': 'Vous n\'êtes pas membre de ce groupe.'}, status=status.HTTP_404_NOT_FOUND)


# ─── FORUM ───────────────────────────────────────────────────────────────────

class ForumThreadViewSet(viewsets.ModelViewSet):
    queryset = ForumThread.objects.all()
    serializer_class = ForumThreadSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'views_count']

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Incrémenter le compteur de vues
        instance.views_count += 1
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ForumReplyViewSet(viewsets.ModelViewSet):
    serializer_class = ForumReplySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        thread_id = self.kwargs.get('thread_id') or self.request.query_params.get('thread_id')
        if thread_id:
            return ForumReply.objects.filter(thread_id=thread_id)
        return ForumReply.objects.all()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


# ─── MESSAGERIE ──────────────────────────────────────────────────────────────

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)

    def get_serializer_context(self):
        return {'request': self.request}

    def create(self, request):
        other_user_id = request.data.get('user_id')
        other_user = get_object_or_404(User, id=other_user_id)

        if other_user == request.user:
            return Response({'error': 'Vous ne pouvez pas vous envoyer un message.'}, status=status.HTTP_400_BAD_REQUEST)

        # Chercher une conversation existante entre les 2 users
        existing = Conversation.objects.filter(
            participants=request.user
        ).filter(
            participants=other_user
        ).first()

        if existing:
            serializer = self.get_serializer(existing)
            return Response(serializer.data, status=status.HTTP_200_OK)

        conversation = Conversation.objects.create()
        conversation.participants.set([request.user, other_user])
        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs.get('conversation_id') or self.request.query_params.get('conversation_id')
        if conversation_id:
            # Marquer comme lus
            Message.objects.filter(
                conversation_id=conversation_id,
                is_read=False
            ).exclude(sender=self.request.user).update(is_read=True)
            return Message.objects.filter(conversation_id=conversation_id)
        return Message.objects.filter(conversation__participants=self.request.user)

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    def create(self, request, *args, **kwargs):
        conversation_id = request.data.get('conversation')
        conversation = get_object_or_404(Conversation, id=conversation_id, participants=request.user)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(sender=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UnreadMessagesCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Message.objects.filter(
            conversation__participants=request.user,
            is_read=False
        ).exclude(sender=request.user).count()
        return Response({'unread_count': count})

# api/views.py - Ajouter cette classe après GroupJoinView

class GroupMembersView(APIView):
    """
    Vue pour récupérer les membres d'un groupe
    GET /api/groups/{group_id}/members/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        group = get_object_or_404(Group, id=group_id)
        
        # Vérifier si l'utilisateur est membre du groupe ou admin
        is_member = GroupMembership.objects.filter(
            user=request.user, group=group
        ).exists()
        
        is_admin = group.admin == request.user
        
        # Si l'utilisateur n'est ni membre ni admin, retourner une liste limitée ou 403
        if not is_member and not is_admin:
            # Option 1 : Retourner uniquement le nombre de membres
            # return Response({
            #     'count': group.members.count(),
            #     'message': 'Rejoignez le groupe pour voir les membres'
            # })
            
            # Option 2 : Retourner 403 Forbidden
            return Response(
                {'error': 'Vous devez être membre du groupe pour voir les membres.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Récupérer tous les membres du groupe
        memberships = GroupMembership.objects.filter(
            group=group
        ).select_related('user', 'user__profile').order_by('-role', 'joined_at')
        
        data = []
        for membership in memberships:
            user = membership.user
            profile_image = None
            full_name = ''
            
            try:
                if hasattr(user, 'profile'):
                    if user.profile.image:
                        profile_image = request.build_absolute_uri(user.profile.image.url) if user.profile.image else None
                    full_name = user.profile.full_name or ''
            except Exception as e:
                print(f"Erreur récupération profil: {e}")
            
            data.append({
                'id': membership.id,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'profile_image': profile_image,
                    'full_name': full_name,
                },
                'role': membership.role,
                'joined_at': membership.joined_at.isoformat() if membership.joined_at else None,
            })
        
        return Response({
            'group_id': group.id,
            'group_name': group.name,
            'count': len(data),
            'members': data,
        }, status=status.HTTP_200_OK)


class GroupMembersDetailView(APIView):
    """
    Vue pour gérer un membre spécifique (changer rôle, supprimer)
    PATCH /api/groups/{group_id}/members/{user_id}/
    DELETE /api/groups/{group_id}/members/{user_id}/
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, group_id, user_id):
        """Changer le rôle d'un membre (admin seulement)"""
        group = get_object_or_404(Group, id=group_id)
        
        # Vérifier que l'utilisateur est admin du groupe
        if group.admin != request.user:
            return Response(
                {'error': 'Seul l\'administrateur peut modifier les rôles.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        membership = get_object_or_404(
            GroupMembership, 
            group=group, 
            user_id=user_id
        )
        
        new_role = request.data.get('role')
        if new_role not in ['member', 'moderator', 'admin']:
            return Response(
                {'error': 'Rôle invalide. Choisir parmi: member, moderator, admin'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Si on passe admin à un autre membre, l'ancien admin devient moderator
        if new_role == 'admin':
            # Rétrograder l'ancien admin
            old_admin_membership = GroupMembership.objects.filter(
                group=group, user=group.admin
            ).first()
            if old_admin_membership:
                old_admin_membership.role = 'moderator'
                old_admin_membership.save()
            
            # Mettre à jour l'admin du groupe
            group.admin = membership.user
            group.save()
        
        membership.role = new_role
        membership.save()
        
        return Response({
            'message': 'Rôle mis à jour avec succès',
            'role': membership.role
        }, status=status.HTTP_200_OK)

    def delete(self, request, group_id, user_id):
        """Supprimer un membre du groupe (admin ou soi-même)"""
        group = get_object_or_404(Group, id=group_id)
        user_to_remove = get_object_or_404(User, id=user_id)
        
        # Vérifier les permissions
        is_admin = group.admin == request.user
        is_self = request.user.id == int(user_id)
        
        if not is_admin and not is_self:
            return Response(
                {'error': 'Vous n\'avez pas la permission de supprimer ce membre.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # L'admin ne peut pas être supprimé
        if group.admin == user_to_remove:
            return Response(
                {'error': 'L\'administrateur ne peut pas être supprimé du groupe.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        membership = get_object_or_404(
            GroupMembership,
            group=group,
            user=user_to_remove
        )
        
        membership.delete()
        
        return Response({
            'message': 'Membre supprimé avec succès'
        }, status=status.HTTP_200_OK)
# ─── CRAFT-ALONG ─────────────────────────────────────────────────────────────

class CraftAlongViewSet(viewsets.ModelViewSet):
    queryset = CraftAlong.objects.all().select_related('creator', 'creator__profile')  # ← AJOUTER select_related
    serializer_class = CraftAlongSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status']
    search_fields = ['title', 'description']

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

class CraftAlongJoinView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, craft_along_id):
        craft_along = get_object_or_404(CraftAlong, id=craft_along_id)
        project_id = request.data.get('project_id')
        project = None
        if project_id:
            project = get_object_or_404(Project, id=project_id, user=request.user)

        participant, created = CraftAlongParticipant.objects.get_or_create(
            user=request.user,
            craft_along=craft_along,
            defaults={'project': project}
        )
        if created:
            return Response({'status': 'joined'}, status=status.HTTP_201_CREATED)
        return Response({'status': 'already participant'}, status=status.HTTP_200_OK)

    def delete(self, request, craft_along_id):
        craft_along = get_object_or_404(CraftAlong, id=craft_along_id)
        participant = CraftAlongParticipant.objects.filter(
            user=request.user, craft_along=craft_along
        ).first()
        if participant:
            participant.delete()
            return Response({'status': 'left'}, status=status.HTTP_200_OK)
        return Response({'error': 'Vous ne participez pas à ce Craft-Along.'}, status=status.HTTP_404_NOT_FOUND)
    
# api/views.py
# api/views.py

@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

    print(f"\n{'='*60}")
    print(f"📨 Webhook reçu !")
    print(f"{'='*60}")

    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            settings.STRIPE_WEBHOOK_SECRET
        )
        print(f"✅ Signature vérifiée ! Type: {event['type']}")
    except stripe.error.SignatureVerificationError as e:
        print(f"❌ Signature verification failed: {e}")
        return HttpResponse(status=400)
    except Exception as e:
        print(f"❌ Webhook error: {e}")
        return HttpResponse(status=400)

    # ====================== CHECKOUT SESSION COMPLETED ======================
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        session_id = session['id']
        print(f"📋 Session ID: {session_id}")

        # ✅ IDEMPOTENCE — Vérifier si cette session a déjà été traitée
        if Purchase.objects.filter(stripe_reference=session_id).exists():
            print(f"⚠️ Session {session_id} déjà traitée — ignorée (idempotence)")
            return HttpResponse(status=200)

        # Récupérer la session complète via API Stripe
        try:
            full_session = stripe.checkout.Session.retrieve(session_id)
            if hasattr(full_session, 'to_dict'):
                session_dict = full_session.to_dict()
            else:
                session_dict = dict(full_session)
            metadata = session_dict.get("metadata", {})
        except Exception as e:
            print(f"⚠️ Impossible de récupérer la session via API: {e}")
            if hasattr(session, 'to_dict'):
                session_dict = session.to_dict()
            else:
                session_dict = dict(session) if hasattr(session, 'items') else {}
            metadata = session_dict.get("metadata", {})

        print(f"📦 Métadonnées brutes: {metadata}")

        user_id = metadata.get("user_id")
        pattern_ids = metadata.get("pattern_ids", "")

        print(f"📦 Métadonnées extraites - User: {user_id}, Patterns: {pattern_ids}")

        if not user_id or not pattern_ids:
            print("❌ Métadonnées manquantes ou vides")
            return HttpResponse(status=200)

        try:
            user = User.objects.get(id=int(user_id))
            print(f"👤 Utilisateur trouvé : {user.email}")

            for pid in pattern_ids.split(","):
                pid = pid.strip()
                if not pid:
                    continue

                try:
                    pattern = Pattern.objects.get(id=int(pid))
                    print(f"\n📋 Pattern acheté : {pattern.title} - {pattern.price} DT")

                    # ✅ Créer l'achat (PDF = pas de gestion de stock)
                    purchase = Purchase.objects.create(
                        user=user,
                        pattern_id=int(pid),
                        amount=pattern.price,
                        stripe_reference=session_id
                    )
                    print(f"   ✅ Achat créé (ref: {session_id})")

                    # Générer la facture
                    file_path = f"media/invoices/invoice_{user.id}_{pid}_{session_id[-8:]}.pdf"
                    os.makedirs(os.path.dirname(file_path), exist_ok=True)

                    try:
                        generate_invoice(user, pattern, file_path)
                        print(f"   📄 Facture générée : {file_path}")
                    except Exception as e:
                        print(f"   ⚠️ Erreur génération facture : {e}")
                        file_path = None

                    # Envoyer l'email
                    try:
                        email = EmailMessage(
                            subject="Bobble - Achat confirmé 🎉",
                            body=f"""Bonjour {user.username},

Merci pour votre achat !

📋 Patron : {pattern.title}
💶 Prix : {pattern.price} DT
🔖 Référence : {session_id}

Vous pouvez télécharger votre patron depuis votre compte :
http://localhost:3000/mon-profil

À bientôt sur Bobble !
""",
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            to=[user.email],
                        )

                        if file_path and os.path.exists(file_path):
                            email.attach_file(file_path)

                        email.send()
                        print(f"   📧 Email envoyé à {user.email}")

                        # Nettoyer le fichier après envoi
                        if file_path and os.path.exists(file_path):
                            os.remove(file_path)

                    except Exception as e:
                        print(f"   ⚠️ Erreur envoi email : {e}")

                except Pattern.DoesNotExist:
                    print(f"   ❌ Pattern {pid} non trouvé")
                except Exception as e:
                    print(f"   ❌ Erreur traitement pattern {pid}: {e}")
                    import traceback
                    traceback.print_exc()

        except User.DoesNotExist:
            print(f"❌ Utilisateur {user_id} non trouvé")
        except Exception as e:
            print(f"❌ Webhook error: {e}")
            import traceback
            traceback.print_exc()

    # ====================== PAYMENT INTENT SUCCEEDED ======================
    elif event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        print(f"💰 Paiement réussi : {payment_intent['amount']} {payment_intent['currency']}")

    # ====================== CHARGE REFUNDED ======================
    elif event["type"] == "charge.refunded":
        charge = event["data"]["object"]
        payment_intent_id = charge['payment_intent'] if 'payment_intent' in charge else None

        print(f"💸 Remboursement détecté pour payment_intent: {payment_intent_id}")

        if payment_intent_id:
            # Trouver l'achat via la session Stripe
            purchase = Purchase.objects.filter(
                stripe_reference__icontains=payment_intent_id
            ).first()
            if purchase:
                # ✅ PDF = pas de stock à augmenter
                purchase.delete()
                print(f"🗑️ Achat supprimé après remboursement")

    print(f"{'='*60}\n")
    return HttpResponse(status=200)

# api/views.py
# api/views.py

class CheckStockView(APIView):
    def post(self, request):
        pattern_ids = request.data.get("pattern_ids", [])
        # ✅ Toujours retourner can_checkout=True
        return Response({
            'available': [{'id': pid, 'title': f'Pattern {pid}', 'price': '0.00', 'available_quantity': 'PDF'} for pid in pattern_ids],
            'out_of_stock': [],
            'can_checkout': True
        })
class StripeCheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):       
        pattern_ids = request.data.get("pattern_ids", [])
        
        # ✅ Plus de filtre is_active
       
        print(f"\n{'='*60}")
        print(f"🛒 Création session checkout")
        print(f"{'='*60}")
        print(f"👤 Utilisateur: {request.user.id} - {request.user.email}")
        print(f"📦 Patterns demandés: {pattern_ids}")

        patterns = Pattern.objects.filter(
            id__in=pattern_ids,
            is_free=False
        )
        if not patterns:
            print(f"❌ Aucun pattern valide trouvé")
            return Response(
                {"error": "Patterns invalides ou non disponibles"},
                status=400
            )

        # ✅ Les patrons PDF sont toujours disponibles - pas de vérification de stock
        print(f"✅ {patterns.count()} patron(s) trouvé(s) :")
        for p in patterns:
            print(f"   ✅ {p.title} - {p.price} DT - PDF")

        line_items = []
        for p in patterns:
            line_items.append({
                "price_data": {
                    "currency": "eur",
                    "product_data": {"name": p.title},
                    "unit_amount": int(float(p.price) * 100),
                },
                "quantity": 1,
            })

        metadata = {
            "user_id": str(request.user.id),
            "pattern_ids": ",".join(str(p.id) for p in patterns)
        }

        print(f"📦 Métadonnées à envoyer: {metadata}")

        idempotency_key = f"checkout_{request.user.id}_{'_'.join(str(p.id) for p in patterns)}_{uuid.uuid4()}"

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=line_items,
                mode="payment",
                success_url="http://localhost:3000/payment-success",
                cancel_url="http://localhost:3000/payment-cancel",
                metadata=metadata,
                idempotency_key=idempotency_key
            )

            print(f"✅ Session Stripe créée : {session.id}")
            print(f"📦 Métadonnées dans la session : {session.metadata}")
            print(f"{'='*60}\n")

            return Response({"url": session.url})

        except Exception as e:
            print(f"❌ Erreur création session Stripe: {e}")
            return Response(
                {"error": "Erreur lors de la création de la session de paiement"},
                status=500
            )


class VerifyPurchaseView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        session_id = request.query_params.get('session_id')
        pattern_id = request.query_params.get('pattern_id')

        if pattern_id:
            purchased = Purchase.objects.filter(
                user=request.user,
                pattern_id=pattern_id
            ).exists()
            return Response({'purchased': purchased})

        recent_purchases = Purchase.objects.filter(
            user=request.user,
            created_at__gte=timezone.now() - timezone.timedelta(minutes=5)
        )

        return Response({
            'purchased': recent_purchases.exists(),
            'purchases': PurchaseSerializer(recent_purchases, many=True).data
        })


# api/views.py - PatternPDFView (déjà existant)

class PatternPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pattern_id):
        pattern = get_object_or_404(Pattern, id=pattern_id)

        # Gratuit → accès direct
        if pattern.is_free:
            return Response({
                "pdf_url": request.build_absolute_uri(pattern.pdf.url)
            })

        # Vérifier achat
        purchased = Purchase.objects.filter(
            user=request.user,
            pattern=pattern
        ).exists()

        if purchased:
            return Response({
                "pdf_url": request.build_absolute_uri(pattern.pdf.url)
            })

        return Response(
            {"error": "Vous devez acheter ce patron."},
            status=status.HTTP_403_FORBIDDEN
        )

class VerifyPurchaseView(APIView):
    """Vérifie si un achat a été complété (pour le frontend)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        session_id = request.query_params.get('session_id')
        pattern_id = request.query_params.get('pattern_id')
        
        if pattern_id:
            # Vérifier si le pattern a été acheté
            purchased = Purchase.objects.filter(
                user=request.user,
                pattern_id=pattern_id
            ).exists()
            return Response({'purchased': purchased})
        
        # Vérifier les achats récents (dernières 5 minutes)
        recent_purchases = Purchase.objects.filter(
            user=request.user,
            created_at__gte=timezone.now() - timezone.timedelta(minutes=5)
        )
        
        return Response({
            'purchased': recent_purchases.exists(),
            'purchases': PurchaseSerializer(recent_purchases, many=True).data
        })
# api/views.py - Remplacer TOUTE la classe CreatorDashboardView

class CreatorDashboardView(APIView):
    """Dashboard complet : patrons + marketplace avec ventes réelles"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # ====================== PATRONS ======================
        patterns = Pattern.objects.filter(author=user)
        pattern_purchases = Purchase.objects.filter(pattern__in=patterns)
        pattern_revenue = sum(float(p.amount) for p in pattern_purchases)
        patterns_sold = pattern_purchases.count()
        
        # ====================== MARKETPLACE - VENTES RÉELLES (via MarketplaceSale) ======================
        marketplace_sales = MarketplaceSale.objects.filter(seller=user)
        
        # Par type
        yarn_sales = marketplace_sales.filter(listing_type='yarn')
        needle_sales = marketplace_sales.filter(listing_type='needle')
        accessory_sales = marketplace_sales.filter(listing_type='accessory')
        
        yarn_revenue = sum(float(s.total_amount) for s in yarn_sales)
        needle_revenue = sum(float(s.total_amount) for s in needle_sales)
        accessory_revenue = sum(float(s.total_amount) for s in accessory_sales)
        
        yarn_sold_qty = sum(s.quantity_sold for s in yarn_sales)
        needle_sold_qty = sum(s.quantity_sold for s in needle_sales)
        accessory_sold_qty = sum(s.quantity_sold for s in accessory_sales)
        
        # ====================== STOCK ACTUEL ======================
        yarn_active = YarnListing.objects.filter(seller=user)
        needle_active = NeedleListing.objects.filter(seller=user)
        accessory_active = AccessoryListing.objects.filter(seller=user)
        
        # Annonces avec stock > 0
        yarn_in_stock = yarn_active.filter(quantity__gt=0).count()
        needle_in_stock = needle_active.filter(quantity__gt=0).count()
        accessory_in_stock = accessory_active.filter(quantity__gt=0).count()
        
        # ====================== TOTAUX ======================
        total_revenue = pattern_revenue + yarn_revenue + needle_revenue + accessory_revenue
        total_sales_qty = patterns_sold + yarn_sold_qty + needle_sold_qty + accessory_sold_qty
        total_active = yarn_in_stock + needle_in_stock + accessory_in_stock + patterns.count()
        total_publications = patterns.count() + yarn_active.count() + needle_active.count() + accessory_active.count()
        
        return Response({
            # Totaux
            "total_revenue": round(total_revenue, 2),
            "total_sales": total_sales_qty,
            "total_active_listings": total_active,
            "total_publications": total_publications,
            
            # Patrons
            "patterns_count": patterns.count(),
            "patterns_sold": patterns_sold,
            "patterns_revenue": round(pattern_revenue, 2),
            
            # Laines
            "yarn_count": yarn_active.count(),
            "yarn_active": yarn_in_stock,
            "yarn_sold": yarn_sold_qty,
            "yarn_revenue": round(yarn_revenue, 2),
            
            # Aiguilles
            "needle_count": needle_active.count(),
            "needle_active": needle_in_stock,
            "needle_sold": needle_sold_qty,
            "needle_revenue": round(needle_revenue, 2),
            
            # Accessoires
            "accessory_count": accessory_active.count(),
            "accessory_active": accessory_in_stock,
            "accessory_sold": accessory_sold_qty,
            "accessory_revenue": round(accessory_revenue, 2),
            
            # Détails
            "patterns": [{
                "title": p.title,
                "type": p.get_type_display(),
                "price": str(p.price),
                "sales": pattern_purchases.filter(pattern=p).count(),
                "revenue": float(sum(x.amount for x in pattern_purchases.filter(pattern=p))),
                "stock": "PDF",
            } for p in patterns],
            
            # Ventes marketplace détaillées
            "yarn_listings": [{
                "title": s.title,
                "type": "Laine",
                "quantity_sold": s.quantity_sold,
                "unit_price": str(s.unit_price),
                "revenue": float(s.total_amount),
                "date": s.created_at,
            } for s in yarn_sales.order_by('-created_at')[:20]],
            
            "needle_listings": [{
                "title": s.title,
                "type": "Aiguille/Crochet",
                "quantity_sold": s.quantity_sold,
                "unit_price": str(s.unit_price),
                "revenue": float(s.total_amount),
                "date": s.created_at,
            } for s in needle_sales.order_by('-created_at')[:20]],
            
            "accessory_listings": [{
                "title": s.title,
                "type": "Accessoire",
                "quantity_sold": s.quantity_sold,
                "unit_price": str(s.unit_price),
                "revenue": float(s.total_amount),
                "date": s.created_at,
            } for s in accessory_sales.order_by('-created_at')[:20]],
        })
#───────────────────── Dashbord───────────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def creator_stats(request):
    user = request.user
    
    # ====================== VENTES PATRONS PAR JOUR ======================
    patterns = Pattern.objects.filter(author=user)
    pattern_sales = Purchase.objects.filter(pattern__in=patterns)
    
    daily_pattern_sales = (
        pattern_sales.annotate(date=TruncDate("created_at"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )
    
    daily_pattern_revenue = (
        pattern_sales.annotate(date=TruncDate("created_at"))
        .values("date")
        .annotate(total=Sum("amount"))
        .order_by("date")
    )
    
    # ====================== VENTES MARKETPLACE ======================
    # Combiner toutes les ventes marketplace (laines + aiguilles + accessoires)
    marketplace_sales = []
    
    # Laines vendues
    yarn_sold = YarnListing.objects.filter(seller=user, is_active=False)
    for y in yarn_sold:
        marketplace_sales.append({
            "date": y.updated_at.date(),
            "amount": float(y.price) * (y.quantity or 0),
            "type": "Laine",
            "title": y.name,
        })
    
    # Aiguilles vendues
    needle_sold = NeedleListing.objects.filter(seller=user, is_active=False)
    for n in needle_sold:
        marketplace_sales.append({
            "date": n.updated_at.date(),
            "amount": float(n.price) * (n.quantity or 0),
            "type": "Aiguille",
            "title": f"{n.get_type_display()} {n.size_mm}mm",
        })
    
    # Accessoires vendus
    accessory_sold = AccessoryListing.objects.filter(seller=user, is_active=False)
    for a in accessory_sold:
        marketplace_sales.append({
            "date": a.updated_at.date(),
            "amount": float(a.price) * (a.quantity or 0),
            "type": "Accessoire",
            "title": a.title,
        })
    
    # Agréger par jour
    from collections import defaultdict
    daily_marketplace = defaultdict(lambda: {"count": 0, "total": 0})
    for sale in marketplace_sales:
        daily_marketplace[sale["date"]]["count"] += 1
        daily_marketplace[sale["date"]]["total"] += sale["amount"]
    
    marketplace_by_date = [
        {"date": date, "count": data["count"], "total": round(data["total"], 2)}
        for date, data in sorted(daily_marketplace.items())
    ]
    
    # ====================== TOTAUX COMBINÉS ======================
    # Fusionner les ventes patrons et marketplace par jour
    all_dates = set()
    for s in daily_pattern_sales:
        all_dates.add(s["date"])
    for s in marketplace_by_date:
        all_dates.add(s["date"])
    
    combined_sales = []
    for date in sorted(all_dates):
        pattern_count = next((s["count"] for s in daily_pattern_sales if s["date"] == date), 0)
        marketplace_count = next((s["count"] for s in marketplace_by_date if s["date"] == date), 0)
        pattern_revenue = next((float(s["total"]) for s in daily_pattern_revenue if s["date"] == date), 0)
        marketplace_revenue = next((s["total"] for s in marketplace_by_date if s["date"] == date), 0)
        
        combined_sales.append({
            "date": date,
            "patterns_count": pattern_count,
            "marketplace_count": marketplace_count,
            "total_count": pattern_count + marketplace_count,
            "patterns_revenue": round(pattern_revenue, 2),
            "marketplace_revenue": round(marketplace_revenue, 2),
            "total_revenue": round(pattern_revenue + marketplace_revenue, 2),
        })
    
    return Response({
        "sales": combined_sales,
        "daily_pattern_sales": list(daily_pattern_sales),
        "daily_pattern_revenue": list(daily_pattern_revenue),
        "marketplace_sales": marketplace_by_date,
    })

# ─── RECHERCHE VISUELLE AI ───────────────────────────────────────────────────

class VisualSearchView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image = request.FILES.get('image')

        if not image:
            return Response(
                {'error': 'Aucune image fournie.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier le format
        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        if image.content_type not in allowed_types:
            return Response(
                {'error': 'Format non supporté. Utilisez jpg, png ou webp.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier la taille max 10Mo
        if image.size > 10 * 1024 * 1024:
            return Response(
                {'error': 'Image trop lourde. Maximum 10Mo.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Générer le vecteur de la requête
        query_vector = get_image_vector(image)

        if query_vector is None:
            return Response(
                {'error': "Impossible d'analyser l'image."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Trouver les patrons similaires
        top_k = int(request.data.get('top_k', 10))
        similar = find_similar_patterns(query_vector, top_k=top_k)

        # Filtres optionnels
        type_filter = request.query_params.get('type')
        level_filter = request.query_params.get('level')
        is_free_filter = request.query_params.get('is_free')

        results = []
        for item in similar:
            pattern = item['pattern']
            score = item['score']

            # Appliquer les filtres
            if type_filter and pattern.type != type_filter:
                continue
            if level_filter and pattern.level != level_filter:
                continue
            if is_free_filter is not None:
                is_free = is_free_filter.lower() == 'true'
                if pattern.is_free != is_free:
                    continue

            # Seuil minimum de similarité 30%
            if score < 0.30:
                continue

            serializer = PatternSerializer(pattern, context={'request': request})
            results.append({
                **serializer.data,
                'similarity_score': round(score * 100, 1)
            })

        return Response({
            'count': len(results),
            'results': results
        }, status=status.HTTP_200_OK)


# api/views.py - Ajouter cette classe

class MarketplaceOrderView(APIView):
    """Créer une commande marketplace et notifier le vendeur"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        items = request.data.get('items', [])
        shipping_address = request.data.get('shipping_address', '')
        message = request.data.get('message', '')
        
        if not items:
            return Response({'error': 'Aucun article'}, status=400)
        
        orders_created = []
        
        for item in items:
            listing_type = item.get('listing_type')
            listing_id = item.get('listing_id')
            quantity = item.get('quantity', 1)
            
            # Trouver l'annonce selon le type
            listing = None
            if listing_type == 'yarn':
                listing = get_object_or_404(YarnListing, id=listing_id, is_active=True)
            elif listing_type == 'needle':
                listing = get_object_or_404(NeedleListing, id=listing_id, is_active=True)
            elif listing_type == 'accessory':
                listing = get_object_or_404(AccessoryListing, id=listing_id, is_active=True)
            
            if not listing:
                continue
            
            # Vérifier le stock
            if listing.quantity < quantity:
                return Response(
                    {'error': f'Stock insuffisant pour {listing.name or listing.title}'},
                    status=400
                )
            
            # Diminuer le stock
            listing.quantity -= quantity
            if listing.quantity == 0:
                listing.is_active = False
            listing.save()
            
            # Créer la commande (à adapter selon ton modèle)
            orders_created.append({
                'listing_type': listing_type,
                'listing_id': listing.id,
                'title': getattr(listing, 'name', None) or getattr(listing, 'title', ''),
                'price': str(listing.price),
                'quantity': quantity,
                'seller_id': listing.seller.id,
            })
            
            # ✅ Notifier le vendeur
            try:
                email = EmailMessage(
                    subject="Bobble Marketplace - Nouvelle commande ! 🛍️",
                    body=f"""Bonjour {listing.seller.username},

Félicitations ! Vous avez reçu une nouvelle commande sur Bobble Marketplace !

 Article : {getattr(listing, 'name', None) or getattr(listing, 'title', '')}
 Montant : {listing.price} €
 Quantité : {quantity}
 Adresse de livraison : {shipping_address}
 Message de l'acheteur : {message or 'Aucun message'}

Connectez-vous pour gérer vos ventes : http://localhost:3000/mon-profil

À bientôt sur Bobble !
""",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[listing.seller.email],
                )
                email.send()
                print(f"📧 Notification envoyée au vendeur {listing.seller.email}")
            except Exception as e:
                print(f"⚠️ Erreur notification vendeur: {e}")
        
        return Response({
            'success': True,
            'message': f'{len(orders_created)} commande(s) créée(s)',
            'orders': orders_created
        }, status=201)

# api/views.py - Ajouter cette classe

class SellerDashboardView(APIView):
    """Dashboard pour les vendeurs marketplace"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Ventes de laine
        yarn_sales = YarnListing.objects.filter(seller=user, is_active=False)
        yarn_active = YarnListing.objects.filter(seller=user, is_active=True)
        
        # Ventes d'aiguilles
        needle_sales = NeedleListing.objects.filter(seller=user, is_active=False)
        needle_active = NeedleListing.objects.filter(seller=user, is_active=True)
        
        # Ventes d'accessoires
        accessory_sales = AccessoryListing.objects.filter(seller=user, is_active=False)
        accessory_active = AccessoryListing.objects.filter(seller=user, is_active=True)
        
        total_listings = yarn_active.count() + needle_active.count() + accessory_active.count()
        total_sold = yarn_sales.count() + needle_sales.count() + accessory_sales.count()
        
        # Revenus estimés
        yarn_revenue = sum(float(y.price) * y.quantity for y in yarn_sales)
        needle_revenue = sum(float(n.price) * n.quantity for n in needle_sales)
        accessory_revenue = sum(float(a.price) * a.quantity for a in accessory_sales)
        total_revenue = yarn_revenue + needle_revenue + accessory_revenue
        
        return Response({
            'total_listings': total_listings,
            'total_sold': total_sold,
            'total_revenue': round(total_revenue, 2),
            'yarn_active': yarn_active.count(),
            'yarn_sold': yarn_sales.count(),
            'needle_active': needle_active.count(),
            'needle_sold': needle_sales.count(),
            'accessory_active': accessory_active.count(),
            'accessory_sold': accessory_sales.count(),
        })
    
# api/views.py - Ajouter ces classes AVANT la fin du fichier

# api/views.py

class MarketplaceOrderCreateView(APIView):
    """Créer une commande après confirmation"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        items = request.data.get('items', [])
        shipping_address = request.data.get('shipping_address', '')
        message = request.data.get('message', '')
        
        if not items:
            return Response({'error': 'Aucun article'}, status=400)
        
        orders_created = []
        
        for item in items:
            listing_type = item.get('listing_type')
            listing_id = item.get('listing_id')
            quantity = int(item.get('quantity', 1))
            
            listing = None
            if listing_type == 'yarn':
                listing = get_object_or_404(YarnListing, id=listing_id, is_active=True)
            elif listing_type == 'needle':
                listing = get_object_or_404(NeedleListing, id=listing_id, is_active=True)
            elif listing_type == 'accessory':
                listing = get_object_or_404(AccessoryListing, id=listing_id, is_active=True)
            
            if not listing:
                continue
            
            if listing.quantity < quantity:
                return Response({'error': f'Stock insuffisant'}, status=400)
            
            if listing.seller == request.user:
                return Response({'error': 'Vous ne pouvez pas acheter votre propre article'}, status=400)
            
            title = getattr(listing, 'name', None) or getattr(listing, 'title', '')
            
            # ✅ ENREGISTRER LA VENTE DANS LE TRACKER
            MarketplaceSale.objects.create(
                seller=listing.seller,
                buyer=request.user,
                listing_type=listing_type,
                listing_id=listing.id,
                title=title,
                quantity_sold=quantity,
                unit_price=listing.price,
                total_amount=listing.price * quantity,
            )
            
            # ✅ Diminuer le stock SANS désactiver l'annonce
            listing.quantity -= quantity
            # Seulement désactiver si le stock est VRAIMENT à 0
            if listing.quantity <= 0:
                listing.is_active = False
            listing.save()
            
            # Créer la commande
            order = MarketplaceOrder.objects.create(
                buyer=request.user,
                seller=listing.seller,
                listing_type=listing_type,
                listing_id=listing.id,
                quantity=quantity,
                total_price=listing.price * quantity,
                status='pending',
                shipping_address=shipping_address,
                buyer_message=message,
            )
            
            # Message automatique
            MarketplaceMessage.objects.create(
                order=order,
                sender=request.user,
                content=f"Bonjour ! Je viens d'acheter votre article \"{title}\". {message or 'Pouvez-vous confirmer la livraison ?'}",
            )
            
            # Email vendeur
            try:
                email = EmailMessage(
                    subject="Bobble Marketplace - Nouvelle commande ! 🛍️",
                    body=f"""Bonjour {listing.seller.username},

Félicitations ! Vous avez reçu une nouvelle commande !

📦 Article : {title}
💰 Montant : {listing.price} DT x{quantity} = {listing.price * quantity} DT
📍 Adresse : {shipping_address or 'Non renseignée'}
💬 Message : {message or 'Aucun'}

👤 Acheteur : {request.user.username}

📊 Stock restant : {listing.quantity}
À bientôt sur Bobble !
""",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[listing.seller.email],
                )
                email.send()
            except Exception as e:
                print(f"⚠️ Erreur email vendeur: {e}")
            
            orders_created.append({'id': order.id, 'status': order.status})
        
        return Response({'success': True, 'orders': orders_created}, status=201)
class MarketplaceOrderListView(APIView):
    """Liste des commandes (achats + ventes)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        buys = MarketplaceOrder.objects.filter(buyer=request.user).order_by('-created_at')
        sales = MarketplaceOrder.objects.filter(seller=request.user).order_by('-created_at')
        
        return Response({
            'buys': self.format_orders(buys, request),
            'sales': self.format_orders(sales, request),
        })
    
    def format_orders(self, orders, request):
        data = []
        for order in orders:
            title = self.get_listing_title(order)
            unread = order.messages.filter(is_read=False).exclude(sender=request.user).count()
            data.append({
                'id': order.id,
                'title': title,
                'buyer': order.buyer.username,
                'seller': order.seller.username,
                'total_price': str(order.total_price),
                'quantity': order.quantity,
                'status': order.status,
                'status_display': order.get_status_display(),
                'unread_messages': unread,
                'created_at': order.created_at,
            })
        return data
    
    def get_listing_title(self, order):
        try:
            if order.listing_type == 'yarn':
                return YarnListing.objects.get(id=order.listing_id).name
            elif order.listing_type == 'needle':
                n = NeedleListing.objects.get(id=order.listing_id)
                return f"{n.get_type_display()} {n.size_mm}mm"
            elif order.listing_type == 'accessory':
                return AccessoryListing.objects.get(id=order.listing_id).title
        except:
            return "Article supprimé"
        return ""


class MarketplaceOrderDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, order_id):
        order = get_object_or_404(MarketplaceOrder, id=order_id)
        
        if request.user != order.buyer and request.user != order.seller:
            return Response({'error': 'Accès non autorisé'}, status=403)
        
        # Marquer messages comme lus
        order.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
        
        messages = order.messages.all()
        
        return Response({
            'id': order.id,
            'title': MarketplaceOrderListView.get_listing_title(MarketplaceOrderListView(), order),
            'buyer': order.buyer.username,
            'seller': order.seller.username,
            'total_price': str(order.total_price),
            'quantity': order.quantity,
            'status': order.status,
            'status_display': order.get_status_display(),
            'shipping_address': order.shipping_address,
            'messages': [{
                'id': m.id,
                'sender_id': m.sender.id,
                'sender_username': m.sender.username,
                'content': m.content,
                'is_read': m.is_read,
                'created_at': m.created_at,
            } for m in messages],
            'created_at': order.created_at,
        })
    
    def patch(self, request, order_id):
        """Changer le statut (vendeur seulement)"""
        order = get_object_or_404(MarketplaceOrder, id=order_id)
        
        if request.user != order.seller:
            return Response({'error': 'Seul le vendeur peut modifier le statut'}, status=403)
        
        new_status = request.data.get('status')
        if new_status not in ['confirmed', 'shipped', 'delivered', 'cancelled']:
            return Response({'error': 'Statut invalide'}, status=400)
        
        order.status = new_status
        order.save()
        
        # Message automatique
        MarketplaceMessage.objects.create(
            order=order,
            sender=request.user,
            content=f"📦 Statut mis à jour : {order.get_status_display()}",
        )
        
        return Response({'status': order.status, 'status_display': order.get_status_display()})


class MarketplaceSendMessageView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, order_id):
        order = get_object_or_404(MarketplaceOrder, id=order_id)
        
        if request.user != order.buyer and request.user != order.seller:
            return Response({'error': 'Accès non autorisé'}, status=403)
        
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Message vide'}, status=400)
        
        message = MarketplaceMessage.objects.create(
            order=order,
            sender=request.user,
            content=content,
        )
        
        return Response({
            'id': message.id,
            'sender_username': message.sender.username,
            'content': message.content,
            'created_at': message.created_at,
        }, status=201)

class UserPublicationsView(APIView):
    """Récupère toutes les publications d'un utilisateur (patrons + marketplace)"""
    permission_classes = [AllowAny]
    
    def get(self, request, username):
        user = get_object_or_404(User, username=username)
        
        publications = {
            'patterns': [],
            'yarn_listings': [],
            'needle_listings': [],
            'accessory_listings': [],
        }
        
        # Patrons
        patterns = Pattern.objects.filter(author=user).order_by('-created_at')
        publications['patterns'] = PatternSerializer(patterns, many=True, context={'request': request}).data
        
        # Annonces laine
        yarn_listings = YarnListing.objects.filter(seller=user, is_active=True).order_by('-created_at')
        publications['yarn_listings'] = YarnListingSerializer(yarn_listings, many=True, context={'request': request}).data
        
        # Annonces aiguilles
        needle_listings = NeedleListing.objects.filter(seller=user, is_active=True).order_by('-created_at')
        publications['needle_listings'] = NeedleListingSerializer(needle_listings, many=True, context={'request': request}).data
        
        # Annonces accessoires
        accessory_listings = AccessoryListing.objects.filter(seller=user, is_active=True).order_by('-created_at')
        publications['accessory_listings'] = AccessoryListingSerializer(accessory_listings, many=True, context={'request': request}).data
        
        # Totaux
        total_patterns = len(publications['patterns'])
        total_yarn = len(publications['yarn_listings'])
        total_needle = len(publications['needle_listings'])
        total_accessory = len(publications['accessory_listings'])
        
        return Response({
            'publications': publications,
            'stats': {
                'total_patterns': total_patterns,
                'total_marketplace': total_yarn + total_needle + total_accessory,
                'total_all': total_patterns + total_yarn + total_needle + total_accessory,
            }
        })