from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from .passkey_views import (
    passkey_register_begin,
    passkey_register_complete,
    passkey_login_begin,
    passkey_login_complete,
)

from .views import (
    AccessoryListingViewSet,
    ListingFavoriteToggleView,
    NeedleListingViewSet,
    StripeCheckoutView,
    PatternPDFView,
    CreatorDashboardView,
    UserListingFavoritesView,
    VisualSearchView,
    GroupMembersView,
    GroupMembersDetailView,
    CheckStockView,
    YarnBrandViewSet,
    YarnLineViewSet,
    YarnListingViewSet,
    stripe_webhook,
    VerifyPurchaseView,
    CheckFavoriteView,          
    PatternCommentsView, 
    MarketplaceOrderView,
    YarnListing, NeedleListing, AccessoryListing, ListingFavorite,
    

)

# ─── ROUTER DRF ─────────────────────────────────────────────────────────────

router = DefaultRouter()
router.register(r'patterns', views.PatternViewSet, basename='pattern')
router.register(r'projects', views.ProjectViewSet, basename='project')
router.register(r'comments', views.CommentViewSet, basename='comment')
router.register(r'bundles', views.BundleViewSet, basename='bundle')
router.register(r'groups', views.GroupViewSet, basename='group')
router.register(r'forum-threads', views.ForumThreadViewSet, basename='forum-thread')
router.register(r'forum-replies', views.ForumReplyViewSet, basename='forum-reply')
router.register(r'conversations', views.ConversationViewSet, basename='conversation')
router.register(r'messages', views.MessageViewSet, basename='message')
router.register(r'craft-alongs', views.CraftAlongViewSet, basename='craft-along')
router.register(r'yarn-stash', views.YarnStashViewSet, basename='yarn-stash')
router.register(r'yarn-brands', YarnBrandViewSet, basename='yarn-brand')
router.register(r'yarn-lines', YarnLineViewSet, basename='yarn-line')
router.register(r'needles', views.NeedleHookViewSet, basename='needle')
router.register(r'marketplace/yarn', YarnListingViewSet, basename='marketplace-yarn')
router.register(r'marketplace/needles', NeedleListingViewSet, basename='marketplace-needles')
router.register(r'marketplace/accessories', AccessoryListingViewSet, basename='marketplace-accessories')
# ─── URLS ────────────────────────────────────────────────────────────────────

urlpatterns = [

    path('token/', views.MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', views.RegisterView.as_view(), name='auth_register'),
    path('test/', views.testEndPoint, name='test'),
    path('', views.getRoutes),

    # ── Passkey ────────────────────────────────────────
    path('passkey/register/begin/', passkey_register_begin),
    path('passkey/register/complete/', passkey_register_complete),
    path('passkey/login/begin/', passkey_login_begin),
    path('passkey/login/complete/', passkey_login_complete),

    # ── Profile ───────────────────────────────────────────────────
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/<str:username>/', views.PublicProfileView.as_view(), name='public-profile'),
    path('profile/<str:username>/publications/', views.UserPublicationsView.as_view(), name='user-publications'),
    # ── Favoris ───────────────────────────────────────────────────
    path('favorites/', views.UserFavoritesView.as_view(), name='user-favorites'),
    path('favorites/<int:pattern_id>/', views.FavoriteToggleView.as_view(), name='favorite-toggle'),
    path('favorites/check/<int:pattern_id>/', CheckFavoriteView.as_view(), name='check-favorite'), 
    
    # ====================== COMMENTAIRES PAR PATTERN ======================
    path('patterns/<int:pattern_id>/comments/', PatternCommentsView.as_view(), name='pattern-comments'),
    # ── Queue ─────────────────────────────────────────────────────
    path('queue/<int:pattern_id>/', views.QueueToggleView.as_view(), name='queue-toggle'),
    path('queue/', views.QueueListView.as_view(), name='queue-list'),
    
    # ── Upload image projet ───────────────────────────────────────
    path('projects/<int:project_id>/upload/', views.ProjectImageUploadView.as_view(), name='project-image-upload'),
    
    # ── Follow ────────────────────────────────────────────────────
    path('follow/<str:username>/', views.FollowToggleView.as_view(), name='follow-toggle'),
    path('following/', views.FollowingListView.as_view(), name='following-list'),
    path('followers/<str:username>/', views.FollowersListView.as_view(), name='followers-list'),
    # ── Activité ──────────────────────────────────────────────────
    path('activity/', views.ActivityView.as_view(), name='activity'),

    # ── Groupes ───────────────────────────────────────────────────
    path('groups/<int:group_id>/join/', views.GroupJoinView.as_view(), name='group-join'),
    path('groups/<int:group_id>/members/', GroupMembersView.as_view(), name='group-members'),
    path('groups/<int:group_id>/members/<int:user_id>/', GroupMembersDetailView.as_view(), name='group-member-detail'),
    
    # ── Craft-Alongs ──────────────────────────────────────────────
    path('craft-alongs/<int:craft_along_id>/join/', views.CraftAlongJoinView.as_view(), name='craft-along-join'),
    
    # ── Messages ──────────────────────────────────────────────────
    path('messages/unread/', views.UnreadMessagesCountView.as_view(), name='unread-messages'),

    # ── Stash──────────────────────────────────────────
    path('stash/stats/', views.StashStatsView.as_view(), name='stash-stats'),
    # ── Paiement / Stock ──────────────────────────────────────────
    path("patterns/check-stock/", CheckStockView.as_view(), name="check-stock"),  # ← AVANT le router
    path("purchase/create/", StripeCheckoutView.as_view(), name="stripe-checkout"),
    path("purchase/webhook/", stripe_webhook, name="stripe-webhook"),
    path("purchase/verify/", VerifyPurchaseView.as_view(), name="verify-purchase"),
    path("patterns/<int:pattern_id>/pdf/", PatternPDFView.as_view(), name="pattern-pdf"),
    path('marketplace/favorites/', ListingFavoriteToggleView.as_view(), name='marketplace-favorites-toggle'),
    path('marketplace/favorites/list/',UserListingFavoritesView.as_view(), name='marketplace-favorites-list'), 
     # Marketplace Orders
    path('marketplace/orders/create/', views.MarketplaceOrderCreateView.as_view(), name='marketplace-order-create'),
    path('marketplace/orders/list/', views.MarketplaceOrderListView.as_view(), name='marketplace-order-list'),
    path('marketplace/orders/<int:order_id>/', views.MarketplaceOrderDetailView.as_view(), name='marketplace-order-detail'),
    path('marketplace/orders/<int:order_id>/message/', views.MarketplaceSendMessageView.as_view(), name='marketplace-order-message'),
      # ── Creator Dashboard ─────────────────────────────────────────
    path("creator/dashboard/", CreatorDashboardView.as_view(), name="creator-dashboard"),

    # ── Recherche visuelle ────────────────────────────────────────
    path('search/visual/', VisualSearchView.as_view(), name='visual-search'),

    # ── Achat MarketPlace ────────────────────────────────────────
    path('marketplace/orders/', views.MarketplaceOrderView.as_view(), name='marketplace-orders'),
    path('marketplace/seller/dashboard/', views.SellerDashboardView.as_view(), name='seller-dashboard'),
    # ── Router auto (DOIT ÊTRE EN DERNIER) ────────────────────────
    path('', include(router.urls)),
]