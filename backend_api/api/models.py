from django.db import models
from django.db.models.signals import post_save
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.text import slugify
from django.db.models.signals import post_save

# ─── USER & PROFILE ─────────────────────────────────────────────────────────

class User(AbstractUser):
    username = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def profile(self):
        profile = Profile.objects.get(user=self)


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=1000)
    bio = models.CharField(max_length=100)
    image = models.ImageField(upload_to="user_images", default="default.jpg")
    verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - Profile"


# ─── TAG ────────────────────────────────────────────────────────────────────

class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


# ─── PATTERN ────────────────────────────────────────────────────────────────

class Pattern(models.Model):
    TYPE_CHOICES = [
        ('tricot', 'Tricot'),
        ('crochet', 'Crochet'),
        ('tissage', 'Tissage'),
    ]
    LEVEL_CHOICES = [
        ('debutant', 'Débutant'),
        ('intermediaire', 'Intermédiaire'),
        ('avance', 'Avancé'),
        ('expert', 'Expert'),
    ]

    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="patterns")
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True, null=True)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='debutant')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='tricot')
    is_free = models.BooleanField(default=True)
    price = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    pdf = models.FileField(upload_to="patterns/pdf/")
    cover_image = models.ImageField(upload_to="patterns/covers/", blank=True, null=True)
    favorites_count = models.IntegerField(default=0)
    tags = models.ManyToManyField(Tag, blank=True, related_name="patterns")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_in_stock(self):
        """Vérifie si le patron est en stock"""
        return self.unlimited_stock or self.stock_quantity > 0
    
    @property
    def available_quantity(self):
        """Retourne la quantité disponible"""
        if self.unlimited_stock:
            return "Illimité"
        return self.stock_quantity
    
    def decrease_stock(self, quantity=1):
        """Diminue le stock après un achat"""
        if not self.unlimited_stock and self.stock_quantity >= quantity:
            self.stock_quantity -= quantity
            self.sold_count += quantity
            self.save()
            return True
        elif self.unlimited_stock:
            self.sold_count += quantity
            self.save()
            return True
        return False
    
    def increase_stock(self, quantity=1):
        """Augmente le stock (pour annulation/remboursement)"""
        if not self.unlimited_stock:
            self.stock_quantity += quantity
            self.sold_count = max(0, self.sold_count - quantity)
            self.save()
            return True
        return False
    def __str__(self):
        return self.title


# ─── PROJECT ────────────────────────────────────────────────────────────────

class Project(models.Model):
    STATUS_CHOICES = [
        ('en_cours', 'En cours'),
        ('termine', 'Terminé'),
        ('defait', 'Défait'),
        ('hibernation', 'En hibernation'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="projects")
    pattern = models.ForeignKey(Pattern, on_delete=models.SET_NULL, null=True, blank=True, related_name="projects")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='en_cours')
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.pattern}"


class ProjectImage(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="projects/images/")
    caption = models.CharField(max_length=200, blank=True, null=True)
    is_main = models.BooleanField(default=False)

    def __str__(self):
        return f"Image for {self.project}"


# ─── COMMENT ────────────────────────────────────────────────────────────────

class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    pattern = models.ForeignKey(Pattern, on_delete=models.CASCADE, related_name="comments")
    text = models.TextField()
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'pattern')

    def __str__(self):
        return f"{self.user.username} - {self.pattern.title} ({self.rating}/5)"


# ─── FAVORITE ───────────────────────────────────────────────────────────────

class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites")
    pattern = models.ForeignKey(Pattern, on_delete=models.CASCADE, related_name="favorited_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'pattern')

    def __str__(self):
        return f"{self.user.username} ❤ {self.pattern.title}"


# ─── QUEUE ──────────────────────────────────────────────────────────────────

class Queue(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="queue")
    pattern = models.ForeignKey(Pattern, on_delete=models.CASCADE, related_name="queued_by")
    priority = models.IntegerField(default=0)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'pattern')
        ordering = ['priority']

    def __str__(self):
        return f"{self.user.username} - Queue {self.priority}"


# ─── YARN ───────────────────────────────────────────────────────────────────

class YarnBrand(models.Model):
    name = models.CharField(max_length=200, unique=True)
    website = models.URLField(blank=True, null=True)
    logo = models.ImageField(upload_to="brands/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return self.name
    class Meta:
        ordering = ['name']



class YarnLine(models.Model):
    brand = models.ForeignKey(YarnBrand, on_delete=models.CASCADE, related_name="lines")
    name = models.CharField(max_length=200)
    fiber_content = models.CharField(max_length=300, blank=True, null=True)
    weight_category = models.CharField(max_length=50, blank=True, null=True)
    recommended_needle_size = models.CharField(max_length=50, blank=True, null=True)
    gauge = models.CharField(max_length=50, blank=True, null=True)
    care_instructions = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    def __str__(self):
        return f"{self.brand.name} - {self.name}"
    class Meta:
        ordering = ['brand__name', 'name']
        unique_together = ['brand', 'name']

class YarnStash(models.Model):
    STATUS_CHOICES = [
        ('disponible', 'Disponible'),
        ('utilise', 'Utilisé'),
        ('reserve', 'Réservé'),
    ]
    WEIGHT_CHOICES = [
        ('lace', 'Lace'),
        ('sport', 'Sport'),
        ('dk', 'DK'),
        ('worsted', 'Worsted'),
        ('aran', 'Aran'),
        ('bulky', 'Bulky'),
        ('super_bulky', 'Super Bulky'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="yarn_stash")
    yarn_line = models.ForeignKey(YarnLine, on_delete=models.SET_NULL, null=True, blank=True, related_name="stash_items")
    brand = models.CharField(max_length=200, blank=True, null=True)
    name = models.CharField(max_length=200)
    colorway = models.CharField(max_length=200, blank=True, null=True)
    color_code = models.CharField(max_length=50, blank=True, null=True)
    weight = models.CharField(max_length=100, blank=True, null=True)
    grams = models.IntegerField(blank=True, null=True)
    meterage = models.IntegerField(blank=True, null=True)
    quantity = models.IntegerField(default=1)
    dye_lot = models.CharField(max_length=100, blank=True, null=True)
    purchase_date = models.DateField(blank=True, null=True)
    purchase_price = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    store = models.CharField(max_length=200, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='disponible')    
    image = models.ImageField(upload_to="yarn_stash/", blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    def __str__(self):
        return f"{self.user.username} - {self.name}"
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Yarn Stash"
    
    @property
    def total_grams(self):
        return self.grams * self.quantity if self.grams else None
    
    @property
    def total_meterage(self):
        return self.meterage * self.quantity if self.meterage else None

# ─── NEEDLE / HOOK ──────────────────────────────────────────────────────────

class NeedleHook(models.Model):
    TYPE_CHOICES = [
        ('aiguille_droite', 'Aiguille droite'),
        ('aiguille_circulaire', 'Aiguille circulaire'),
        ('dpn', 'DPN (Double Pointed Needles)'),
        ('crochet', 'Crochet'),
        ('tunisien', 'Crochet Tunisien'),
    ]
    MATERIAL_CHOICES = [
        ('bambou', 'Bambou'),
        ('metal', 'Métal'),
        ('plastique', 'Plastique'),
        ('bois', 'Bois'),
        ('acrylique', 'Acrylique'),
        ('aluminium', 'Aluminium'),
        ('acier', 'Acier'),
    ]
    SIZE_SYSTEM_CHOICES = [
        ('metric', 'Métrique (mm)'),
        ('us', 'US'),
        ('uk', 'UK'),
        ('japanese', 'Japonais'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="needles_hooks")
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    size_mm = models.DecimalField(max_digits=4, decimal_places=2)  # Taille en mm
    size_us = models.CharField(max_length=10, blank=True, null=True)
    size_uk = models.CharField(max_length=10, blank=True, null=True)
    material = models.CharField(max_length=20, choices=MATERIAL_CHOICES, blank=True, null=True)
    brand = models.CharField(max_length=200, blank=True, null=True)
    length_cm = models.IntegerField(blank=True, null=True)  # Longueur en cm
    cable_length_cm = models.IntegerField(blank=True, null=True)  # Pour aiguilles circulaires
    quantity = models.IntegerField(default=1)
    purchase_date = models.DateField(blank=True, null=True)
    purchase_price = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    def __str__(self):
        cable = f" ({self.cable_length_cm}cm)" if self.cable_length_cm else ""
        return f"{self.user.username} - {self.get_type_display()} {self.size_mm}mm{cable}"
    
    class Meta:
        ordering = ['type', 'size_mm']

class YarnListing(models.Model):
    """Annonce de laine à vendre"""
    CONDITION_CHOICES = [
        ('new', 'Neuf'),
        ('like_new', 'Comme neuf'),
        ('used', 'Utilisé'),
    ]
    
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="yarn_listings")
    yarn_stash = models.ForeignKey(YarnStash, on_delete=models.SET_NULL, null=True, blank=True, related_name="listings")
    
    # Infos de la laine (copiées ou liées au stash)
    brand = models.CharField(max_length=200, blank=True, null=True)
    name = models.CharField(max_length=200)
    colorway = models.CharField(max_length=200, blank=True, null=True)
    weight = models.CharField(max_length=20, choices=YarnStash.WEIGHT_CHOICES, blank=True, null=True)
    grams = models.IntegerField(blank=True, null=True)
    meterage = models.IntegerField(blank=True, null=True)
    quantity = models.IntegerField(default=1)
    dye_lot = models.CharField(max_length=100, blank=True, null=True)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='new')
    
    # Prix et disponibilité
    price = models.DecimalField(max_digits=6, decimal_places=2)
    is_active = models.BooleanField(default=True)
    
    # Photos
    image1 = models.ImageField(upload_to="listings/yarn/", blank=True, null=True)
    image2 = models.ImageField(upload_to="listings/yarn/", blank=True, null=True)
    image3 = models.ImageField(upload_to="listings/yarn/", blank=True, null=True)
    
    description = models.TextField(blank=True, null=True)
    shipping_available = models.BooleanField(default=True)
    shipping_cost = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    pickup_location = models.CharField(max_length=300, blank=True, null=True)
    
    views_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.seller.username} - {self.name} - {self.price}€"
    
    class Meta:
        ordering = ['-created_at']


class NeedleListing(models.Model):
    """Annonce d'aiguille/crochet à vendre"""
    CONDITION_CHOICES = [
        ('new', 'Neuf'),
        ('like_new', 'Comme neuf'),
        ('used', 'Utilisé'),
    ]
    
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="needle_listings")
    needle_hook = models.ForeignKey(NeedleHook, on_delete=models.SET_NULL, null=True, blank=True, related_name="listings")
    
    type = models.CharField(max_length=30, choices=NeedleHook.TYPE_CHOICES)
    size_mm = models.DecimalField(max_digits=4, decimal_places=2)
    material = models.CharField(max_length=20, choices=NeedleHook.MATERIAL_CHOICES, blank=True, null=True)
    brand = models.CharField(max_length=200, blank=True, null=True)
    length_cm = models.IntegerField(blank=True, null=True)
    cable_length_cm = models.IntegerField(blank=True, null=True)
    quantity = models.IntegerField(default=1)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='used')
    
    price = models.DecimalField(max_digits=6, decimal_places=2)
    is_active = models.BooleanField(default=True)
    
    image1 = models.ImageField(upload_to="listings/needles/", blank=True, null=True)
    image2 = models.ImageField(upload_to="listings/needles/", blank=True, null=True)
    
    description = models.TextField(blank=True, null=True)
    shipping_available = models.BooleanField(default=True)
    shipping_cost = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    views_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.seller.username} - {self.get_type_display()} {self.size_mm}mm - {self.price}€"
    
    class Meta:
        ordering = ['-created_at']


class AccessoryListing(models.Model):
    """Annonce d'accessoire à vendre (marqueurs, ciseaux, etc.)"""
    CATEGORY_CHOICES = [
        ('markers', 'Marqueurs de mailles'),
        ('scissors', 'Ciseaux'),
        ('tape', 'Mètre ruban'),
        ('bag', 'Sac à projet'),
        ('blocking', 'Matériel de blocage'),
        ('buttons', 'Boutons'),
        ('other', 'Autre'),
    ]
    CONDITION_CHOICES = [
        ('new', 'Neuf'),
        ('like_new', 'Comme neuf'),
        ('used', 'Utilisé'),
    ]
    
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="accessory_listings")
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    brand = models.CharField(max_length=200, blank=True, null=True)
    quantity = models.IntegerField(default=1)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='new')
    
    price = models.DecimalField(max_digits=6, decimal_places=2)
    is_active = models.BooleanField(default=True)
    
    image1 = models.ImageField(upload_to="listings/accessories/", blank=True, null=True)
    image2 = models.ImageField(upload_to="listings/accessories/", blank=True, null=True)
    
    description = models.TextField(blank=True, null=True)
    shipping_available = models.BooleanField(default=True)
    shipping_cost = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    views_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.seller.username} - {self.title} - {self.price}€"
    
    class Meta:
        ordering = ['-created_at']


class ListingFavorite(models.Model):
    """Favoris pour les annonces"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="listing_favorites")
    yarn_listing = models.ForeignKey(YarnListing, on_delete=models.CASCADE, null=True, blank=True, related_name="favorites")
    needle_listing = models.ForeignKey(NeedleListing, on_delete=models.CASCADE, null=True, blank=True, related_name="favorites")
    accessory_listing = models.ForeignKey(AccessoryListing, on_delete=models.CASCADE, null=True, blank=True, related_name="favorites")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = [['user', 'yarn_listing'], ['user', 'needle_listing'], ['user', 'accessory_listing']]
# ─── FOLLOW ─────────────────────────────────────────────────────────────────

class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')

    def __str__(self):
        return f"{self.follower.username} → {self.following.username}"


# ─── BUNDLE ─────────────────────────────────────────────────────────────────

class Bundle(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bundles")
    name = models.CharField(max_length=200)
    is_public = models.BooleanField(default=False)
    patterns = models.ManyToManyField(Pattern, blank=True, related_name="bundles")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.name}"


# ─── PURCHASE ───────────────────────────────────────────────────────────────

class Purchase(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="purchases")
    pattern = models.ForeignKey(Pattern, on_delete=models.CASCADE, related_name="purchases")
    stripe_reference = models.CharField(max_length=300, blank=True, null=True)
    amount = models.DecimalField(max_digits=6, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} bought {self.pattern.title}"


# ─── PASSKEY ────────────────────────────────────────────────────────────────

class UserPasskey(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="passkey")
    credential_id = models.TextField(unique=True)
    public_key = models.TextField()
    sign_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Passkey for {self.user.email}"


# ─── SIGNALS ────────────────────────────────────────────────────────────────

def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

post_save.connect(create_user_profile, sender=User)
post_save.connect(save_user_profile, sender=User)

# ─── GROUPE & MEMBERSHIP ─────────────────────────────────────────────────────

class Group(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to="groups/", blank=True, null=True)
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name="owned_groups")
    members = models.ManyToManyField(User, through='GroupMembership', related_name="joined_groups")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class GroupMembership(models.Model):
    ROLE_CHOICES = [
        ('member', 'Membre'),
        ('moderator', 'Modérateur'),
        ('admin', 'Admin'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="group_memberships")
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="memberships")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'group')

    def __str__(self):
        return f"{self.user.username} → {self.group.name} ({self.role})"


# ─── FORUM ───────────────────────────────────────────────────────────────────

class ForumThread(models.Model):
    CATEGORY_CHOICES = [
        ('aide_technique', 'Aide technique'),
        ('presentation_projets', 'Présentation de projets'),
        ('achats_ventes', 'Achats/Ventes'),
        ('general', 'Général'),
    ]

    title = models.CharField(max_length=300)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="forum_threads")
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='general')
    views_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def replies_count(self):
        return self.replies.count()

    def last_activity(self):
        last_reply = self.replies.order_by('-created_at').first()
        return last_reply.created_at if last_reply else self.created_at


class ForumReply(models.Model):
    thread = models.ForeignKey(ForumThread, on_delete=models.CASCADE, related_name="replies")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="forum_replies")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Reply by {self.author.username} on {self.thread.title}"


# ─── MESSAGERIE PRIVÉE ───────────────────────────────────────────────────────

class Conversation(models.Model):
    participants = models.ManyToManyField(User, related_name="conversations")
    last_activity = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-last_activity']

    def __str__(self):
        return f"Conversation {self.id}"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"


# ─── CRAFT-ALONG ─────────────────────────────────────────────────────────────

class CraftAlong(models.Model):
    STATUS_CHOICES = [
        ('a_venir', 'À venir'),
        ('en_cours', 'En cours'),
        ('termine', 'Terminé'),
    ]

    title = models.CharField(max_length=300)
    description = models.TextField(blank=True, null=True)
    rules = models.TextField(blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField()
    official_pattern = models.ForeignKey(Pattern, on_delete=models.SET_NULL, null=True, blank=True, related_name="craft_alongs")
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_craft_alongs")
    banner_image = models.ImageField(upload_to="craft_alongs/", blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='a_venir')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class CraftAlongParticipant(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="craft_along_participations")
    craft_along = models.ForeignKey(CraftAlong, on_delete=models.CASCADE, related_name="participants")
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name="craft_along_links")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'craft_along')

    def __str__(self):
        return f"{self.user.username} → {self.craft_along.title}"


# ─── AI PATTERN EMBEDDING ────────────────────────────────────────────────────

class PatternEmbedding(models.Model):
    pattern = models.OneToOneField(
        Pattern, on_delete=models.CASCADE, related_name="embedding"
    )
    # Vecteur CLIP stocké en JSON (512 dimensions)
    vector = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Embedding for {self.pattern.title}"
    
    # ─── SIGNAL AUTO-EMBEDDING ───────────────────────────────────────────────────


def auto_generate_embedding(sender, instance, created, **kwargs):
    """Génère automatiquement l'embedding quand un patron est créé/modifié"""
    if instance.cover_image:
        from .ai_service import generate_pattern_embedding
        generate_pattern_embedding(instance)

post_save.connect(auto_generate_embedding, sender=Pattern)

# api/models.py - Ajouter à la fin du fichier

class MarketplaceOrder(models.Model):
    """Commande marketplace avec messagerie"""
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('confirmed', 'Confirmée'),
        ('shipped', 'Expédiée'),
        ('delivered', 'Livrée'),
        ('cancelled', 'Annulée'),
    ]
    
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="marketplace_buys")
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="marketplace_sales")
    listing_type = models.CharField(max_length=20)
    listing_id = models.IntegerField()
    quantity = models.IntegerField(default=1)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    shipping_address = models.TextField(blank=True, null=True)
    buyer_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Commande #{self.id} - {self.buyer.username} → {self.seller.username}"
    
    class Meta:
        ordering = ['-created_at']

class MarketplaceSale(models.Model):
    """Tracker les ventes marketplace"""
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="marketplace_sales_tracker")
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="marketplace_buys_tracker")
    listing_type = models.CharField(max_length=20)  # 'yarn', 'needle', 'accessory'
    listing_id = models.IntegerField()
    title = models.CharField(max_length=200)
    quantity_sold = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.seller.username} - {self.title} - {self.total_amount} DT"
    
    class Meta:
        ordering = ['-created_at']
class MarketplaceMessage(models.Model):
    """Messages entre acheteur et vendeur"""
    order = models.ForeignKey(MarketplaceOrder, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Msg #{self.order.id} - {self.sender.username}"
    
    class Meta:
        ordering = ['created_at']