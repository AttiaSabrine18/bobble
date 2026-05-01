from api.models import AccessoryListing, ListingFavorite, NeedleListing, User, Profile, Tag, Pattern, Project, ProjectImage, Comment, Favorite, Queue, YarnBrand, YarnLine, YarnListing, YarnStash, NeedleHook, Follow, Bundle, Purchase ,Group, GroupMembership, ForumThread, ForumReply, Conversation, Message, CraftAlong, CraftAlongParticipant
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from rest_framework.validators import UniqueValidator


# ─── User ──────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')





class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email']
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


# ─── PROFILE ─────────────────────────────────────────────────────────────────

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['id', 'full_name', 'bio', 'image', 'verified']


class UserExtendedSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    projects_count = serializers.SerializerMethodField()
    patterns_count = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    date_joined = serializers.DateTimeField(format="%Y-%m-%d")
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'profile',
            'projects_count', 'patterns_count', 'followers_count', 'following_count', 'date_joined', 'is_following'
        ]

    def get_projects_count(self, obj):
        return obj.projects.count()

    def get_patterns_count(self, obj):
        return obj.patterns.count()

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_date_joined(self, obj):
        return obj.date_joined.strftime("%Y-%m-%d")
    
    def get_is_following(self, obj):
      request = self.context.get("request")
      if not request or not request.user.is_authenticated:
        return False
      return obj.followers.filter(follower=request.user).exists()       
# ─── TAG ────────────────────────────────────────────────────────────────────

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']


# ─── PATTERN ────────────────────────────────────────────────────────────────

class PatternAuthorSerializer(serializers.ModelSerializer):
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'profile_image']

    def get_profile_image(self, obj):
        try:
            return obj.profile.image.url if obj.profile.image else None
        except:
            return None


class PatternSerializer(serializers.ModelSerializer):
    author = PatternAuthorSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), many=True,
        write_only=True, source='tags', required=False
    )

    class Meta:
        model = Pattern
        fields = [
            'id', 'author', 'title', 'description', 'level', 'type',
            'is_free', 'price', 'pdf', 'cover_image', 'favorites_count',
              'tags', 'tag_ids', 'created_at', 'updated_at',
        ]
        read_only_fields = ['author', 'favorites_count', 'created_at', 'updated_at','sold_count']
        extra_kwargs = {
            'pdf': {'required': True},  
        }
    def get_available_quantity(self, obj):
        return obj.available_quantity
    
    def validate_stock_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError("Le stock ne peut pas être négatif")
        return value

# ─── PROJECT ────────────────────────────────────────────────────────────────

class ProjectImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectImage
        fields = ['id', 'image', 'caption', 'is_main']


class ProjectSerializer(serializers.ModelSerializer):
    images = ProjectImageSerializer(many=True, read_only=True)
    pattern_title = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'user', 'pattern', 'pattern_title', 'status',
            'start_date', 'end_date', 'notes', 'images', 'created_at'
        ]
        read_only_fields = ['user', 'created_at']

    def get_pattern_title(self, obj):
        return obj.pattern.title if obj.pattern else None


# ─── COMMENT ────────────────────────────────────────────────────────────────

class CommentSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'user', 'username', 'pattern', 'text', 'rating', 'created_at']
        read_only_fields = ['user', 'created_at']

    def get_username(self, obj):
        return obj.user.username

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("La note doit être entre 1 et 5.")
        return value


# ─── FAVORITE ───────────────────────────────────────────────────────────────

class FavoriteSerializer(serializers.ModelSerializer):
    pattern = PatternSerializer(read_only=True) 
    class Meta:
        model = Favorite
        fields = ['id', 'user', 'pattern', 'created_at']
        read_only_fields = ['user', 'created_at']


# ─── QUEUE ──────────────────────────────────────────────────────────────────

class QueueSerializer(serializers.ModelSerializer):
    pattern_title = serializers.SerializerMethodField()

    class Meta:
        model = Queue
        fields = ['id', 'user', 'pattern', 'pattern_title', 'priority', 'notes', 'created_at']
        read_only_fields = ['user', 'created_at']

    def get_pattern_title(self, obj):
        return obj.pattern.title


# ─── YARN ───────────────────────────────────────────────────────────────────

class YarnBrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = YarnBrand
        fields = ['id', 'name', 'website', 'logo']


class YarnLineSerializer(serializers.ModelSerializer):
    brand = YarnBrandSerializer(read_only=True)
    brand_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = YarnLine
        fields = ['id', 'brand', 'brand_name', 'name', 'fiber_content']

    def create(self, validated_data):
        brand_id = validated_data.pop('brand_id', None)
        if brand_id:
            brand = YarnBrand.objects.get(id=brand_id)
            validated_data['brand'] = brand
        return super().create(validated_data)


class YarnStashSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    yarn_line_details = YarnLineSerializer(source='yarn_line', read_only=True)
    total_grams = serializers.IntegerField(read_only=True)
    total_meterage = serializers.IntegerField(read_only=True)
    weight_display = serializers.CharField(source='get_weight_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = YarnStash
        fields = [
            'id', 'user', 'user_username', 'yarn_line', 'yarn_line_details',
            'brand', 'name', 'colorway', 'color_code', 'weight', 'weight_display',
            'grams', 'meterage', 'quantity', 'dye_lot',
            'purchase_date', 'purchase_price', 'store',
            'status', 'status_display', 'image', 'notes',
            'total_grams', 'total_meterage',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']

# api/serializer.py

class YarnListingSerializer(serializers.ModelSerializer):
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    seller_profile_image = serializers.SerializerMethodField()
    weight_display = serializers.CharField(source='get_weight_display', read_only=True)
    condition_display = serializers.CharField(source='get_condition_display', read_only=True)
    is_favorited = serializers.SerializerMethodField()
    
    class Meta:
        model = YarnListing
        fields = '__all__'
        read_only_fields = ['seller', 'views_count', 'created_at', 'updated_at']
    
    # ✅ Méthode create
    def create(self, validated_data):
        validated_data['is_active'] = True
        return super().create(validated_data)
    
    def get_seller_profile_image(self, obj):
        try:
            if hasattr(obj.seller, 'profile') and obj.seller.profile.image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.seller.profile.image.url)
                return obj.seller.profile.image.url
        except:
            pass
        return None
    
    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return ListingFavorite.objects.filter(
                user=request.user, yarn_listing=obj
            ).exists()
        return False


class NeedleListingSerializer(serializers.ModelSerializer):
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    seller_profile_image = serializers.SerializerMethodField()
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    material_display = serializers.CharField(source='get_material_display', read_only=True)
    condition_display = serializers.CharField(source='get_condition_display', read_only=True)
    is_favorited = serializers.SerializerMethodField()
    
    class Meta:
        model = NeedleListing
        fields = '__all__'
        read_only_fields = ['seller', 'views_count', 'created_at', 'updated_at']
    
    # ✅ Méthode create AJOUTÉE
    def create(self, validated_data):
        validated_data['is_active'] = True
        return super().create(validated_data)
    
    def get_seller_profile_image(self, obj):
        try:
            if hasattr(obj.seller, 'profile') and obj.seller.profile.image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.seller.profile.image.url)
                return obj.seller.profile.image.url
        except:
            pass
        return None
    
    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return ListingFavorite.objects.filter(
                user=request.user, needle_listing=obj
            ).exists()
        return False


class AccessoryListingSerializer(serializers.ModelSerializer):
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    seller_profile_image = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    condition_display = serializers.CharField(source='get_condition_display', read_only=True)
    is_favorited = serializers.SerializerMethodField()
    
    class Meta:
        model = AccessoryListing
        fields = '__all__'
        read_only_fields = ['seller', 'views_count', 'created_at', 'updated_at']
    
    # ✅ Méthode create AJOUTÉE
    def create(self, validated_data):
        validated_data['is_active'] = True
        return super().create(validated_data)
    
    def get_seller_profile_image(self, obj):
        try:
            if hasattr(obj.seller, 'profile') and obj.seller.profile.image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.seller.profile.image.url)
                return obj.seller.profile.image.url
        except:
            pass
        return None
    
    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return ListingFavorite.objects.filter(
                user=request.user, accessory_listing=obj
            ).exists()
        return False
# ─── NEEDLE / HOOK ──────────────────────────────────────────────────────────

class NeedleHookSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    material_display = serializers.CharField(source='get_material_display', read_only=True)
    
    class Meta:
        model = NeedleHook
        fields = [
            'id', 'user', 'user_username', 'type', 'type_display',
            'size_mm', 'size_us', 'size_uk',
            'material', 'material_display', 'brand',
            'length_cm', 'cable_length_cm', 'quantity',
            'purchase_date', 'purchase_price', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']


# ─── FOLLOW ─────────────────────────────────────────────────────────────────

class FollowSerializer(serializers.ModelSerializer):
    follower_username = serializers.SerializerMethodField()
    following_username = serializers.SerializerMethodField()

    class Meta:
        model = Follow
        fields = ['id', 'follower', 'follower_username', 'following', 'following_username', 'created_at']
        read_only_fields = ['follower', 'created_at']

    def get_follower_username(self, obj):
        return obj.follower.username

    def get_following_username(self, obj):
        return obj.following.username


# ─── BUNDLE ─────────────────────────────────────────────────────────────────

class BundleSerializer(serializers.ModelSerializer):
    patterns = PatternSerializer(many=True, read_only=True)
    pattern_ids = serializers.PrimaryKeyRelatedField(
        queryset=Pattern.objects.all(), many=True,
        write_only=True, source='patterns', required=False
    )

    class Meta:
        model = Bundle
        fields = ['id', 'user', 'name', 'is_public', 'patterns', 'pattern_ids', 'created_at']
        read_only_fields = ['user', 'created_at']


# ─── PURCHASE ───────────────────────────────────────────────────────────────

class PurchaseSerializer(serializers.ModelSerializer):
    pattern_title = serializers.SerializerMethodField()

    class Meta:
        model = Purchase
        fields = ['id', 'user', 'pattern', 'pattern_title', 'stripe_reference', 'amount', 'created_at']
        read_only_fields = ['user', 'created_at']

    def get_pattern_title(self, obj):
        return obj.pattern.title
    
# ─── GROUPE ──────────────────────────────────────────────────────────────────

class GroupMembershipSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()

    class Meta:
        model = GroupMembership
        fields = ['id', 'user', 'username', 'group', 'role', 'joined_at']
        read_only_fields = ['user', 'joined_at']

    def get_username(self, obj):
        return obj.user.username


class GroupSerializer(serializers.ModelSerializer):
    admin_username = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'image', 'admin', 'admin_username', 'members_count', 'is_member', 'created_at']
        read_only_fields = ['admin', 'created_at']

    def get_admin_username(self, obj):
        return obj.admin.username

    def get_members_count(self, obj):
        return obj.members.count()

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return GroupMembership.objects.filter(user=request.user, group=obj).exists()
        return False

class GroupMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = GroupMembership
        fields = ['id', 'user', 'role', 'joined_at']


class GroupDetailSerializer(serializers.ModelSerializer):
    admin = UserSerializer(read_only=True)
    members = GroupMemberSerializer(source='memberships', many=True, read_only=True)
    members_count = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = [
            'id', 'name', 'description', 'image', 'admin',
            'members', 'members_count', 'is_member', 'is_admin',
            'created_at'
        ]
    
    def get_members_count(self, obj):
        return obj.members.count()
    
    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.memberships.filter(user=request.user).exists()
        return False
    
    def get_is_admin(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.admin == request.user
        return False
# ─── FORUM ───────────────────────────────────────────────────────────────────

class ForumReplySerializer(serializers.ModelSerializer):
    author_username = serializers.SerializerMethodField()

    class Meta:
        model = ForumReply
        fields = ['id', 'thread', 'author', 'author_username', 'content', 'created_at', 'updated_at']
        read_only_fields = ['author', 'created_at', 'updated_at']

    def get_author_username(self, obj):
        return obj.author.username


class ForumThreadSerializer(serializers.ModelSerializer):
    author_username = serializers.SerializerMethodField()
    replies_count = serializers.SerializerMethodField()
    last_activity = serializers.SerializerMethodField()

    class Meta:
        model = ForumThread
        fields = ['id', 'title', 'content', 'author', 'author_username', 'category', 'views_count', 'replies_count', 'last_activity', 'created_at']
        read_only_fields = ['author', 'views_count', 'created_at']

    def get_author_username(self, obj):
        return obj.author.username

    def get_replies_count(self, obj):
        return obj.replies.count()

    def get_last_activity(self, obj):
        last_reply = obj.replies.order_by('-created_at').first()
        return last_reply.created_at if last_reply else obj.created_at


# ─── MESSAGERIE ──────────────────────────────────────────────────────────────

class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_username', 'content', 'is_read', 'created_at']
        read_only_fields = ['sender', 'created_at']

    def get_sender_username(self, obj):
        return obj.sender.username


class ConversationSerializer(serializers.ModelSerializer):
    participants_info = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'participants_info', 'last_message', 'unread_count', 'last_activity']

    def get_participants_info(self, obj):
        return [{'id': u.id, 'username': u.username} for u in obj.participants.all()]

    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()
        if last:
            return {'content': last.content[:50], 'sender': last.sender.username, 'date': last.created_at}
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0


# ─── CRAFT-ALONG ─────────────────────────────────────────────────────────────

class CraftAlongParticipantSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()

    class Meta:
        model = CraftAlongParticipant
        fields = ['id', 'user', 'username', 'craft_along', 'project', 'joined_at']
        read_only_fields = ['user', 'joined_at']

    def get_username(self, obj):
        return obj.user.username

# api/serializer.py - CraftAlongSerializer

# api/serializer.py

class CraftAlongSerializer(serializers.ModelSerializer):
    creator_id = serializers.SerializerMethodField()
    creator_username = serializers.SerializerMethodField()
    creator_email = serializers.SerializerMethodField()
    creator_profile_image = serializers.SerializerMethodField()
    participants_count = serializers.SerializerMethodField()
    is_participant = serializers.SerializerMethodField()

    class Meta:
        model = CraftAlong
        fields = [
            'id', 'title', 'description', 'rules',
            'start_date', 'end_date',
            'official_pattern',
            'creator',  # ← Garde l'ID original
            'creator_id', 'creator_username', 'creator_email', 'creator_profile_image',
            'banner_image', 'status',
            'participants_count', 'is_participant',
            'created_at'
        ]
        read_only_fields = ['creator', 'created_at']

    def get_creator_id(self, obj):
        return obj.creator.id if obj.creator else None

    def get_creator_username(self, obj):
        if not obj.creator:
            return None
        return obj.creator.username or (obj.creator.email.split('@')[0] if obj.creator.email else f'User_{obj.creator.id}')

    def get_creator_email(self, obj):
        return obj.creator.email if obj.creator else None

    def get_creator_profile_image(self, obj):
        if not obj.creator:
            return None
        try:
            if hasattr(obj.creator, 'profile') and obj.creator.profile.image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.creator.profile.image.url)
                return obj.creator.profile.image.url
        except:
            pass
        return None

    def get_participants_count(self, obj):
        return obj.participants.count()

    def get_is_participant(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return CraftAlongParticipant.objects.filter(
                user=request.user, craft_along=obj
            ).exists()
        return False