from django.contrib import admin
from api.models import (
    User, Profile, Tag, Pattern, Project, ProjectImage,
    Comment, Favorite, Queue, YarnStash, YarnBrand, YarnLine,
    NeedleHook, Follow, Bundle, Purchase, UserPasskey, 
    Group, GroupMembership, ForumThread, ForumReply, Conversation, Message, CraftAlong, CraftAlongParticipant

)

# ───User & Profile ──────────────────────────────────────────────────

class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email']


class ProfileAdmin(admin.ModelAdmin):
    list_editable = ['verified']
    list_display = ['user', 'full_name', 'verified']


admin.site.register(User, UserAdmin)
admin.site.register(Profile, ProfileAdmin)


# ─── TAG ─────────────────────────────────────────────────────────────────────

admin.site.register(Tag)


# ─── PATTERN ─────────────────────────────────────────────────────────────────

@admin.register(Pattern)
class PatternAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'type', 'level', 'is_free', 'price', 'favorites_count', 'created_at']
    list_filter = ['type', 'level', 'is_free']
    search_fields = ['title', 'description']


# ─── PROJECT ─────────────────────────────────────────────────────────────────

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['user', 'pattern', 'status', 'start_date', 'end_date', 'created_at']
    list_filter = ['status']
    search_fields = ['user__username', 'pattern__title']


admin.site.register(ProjectImage)


# ─── COMMENT ─────────────────────────────────────────────────────────────────

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['user', 'pattern', 'rating', 'created_at']
    list_filter = ['rating']
    search_fields = ['user__username', 'pattern__title']


# ─── FAVORITE ────────────────────────────────────────────────────────────────

@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['user', 'pattern', 'created_at']
    search_fields = ['user__username', 'pattern__title']


# ─── QUEUE ───────────────────────────────────────────────────────────────────

@admin.register(Queue)
class QueueAdmin(admin.ModelAdmin):
    list_display = ['user', 'pattern', 'priority', 'created_at']
    search_fields = ['user__username', 'pattern__title']


# ─── YARN ────────────────────────────────────────────────────────────────────

@admin.register(YarnStash)
class YarnStashAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'brand', 'colorway', 'weight', 'status']
    list_filter = ['status']
    search_fields = ['user__username', 'name', 'brand']


admin.site.register(YarnBrand)
admin.site.register(YarnLine)


# ─── NEEDLE / HOOK ───────────────────────────────────────────────────────────

@admin.register(NeedleHook)
class NeedleHookAdmin(admin.ModelAdmin):
    list_display = ['user', 'type', 'size_mm', 'material', 'brand', 'quantity']
    list_filter = ['type', 'material']
    search_fields = ['user__username', 'brand']


# ─── FOLLOW ──────────────────────────────────────────────────────────────────

@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ['follower', 'following', 'created_at']
    search_fields = ['follower__username', 'following__username']


# ─── BUNDLE ──────────────────────────────────────────────────────────────────

@admin.register(Bundle)
class BundleAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'is_public', 'created_at']
    list_filter = ['is_public']
    search_fields = ['user__username', 'name']


# ─── PURCHASE ────────────────────────────────────────────────────────────────

@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = ['user', 'pattern', 'amount', 'stripe_reference', 'created_at']
    search_fields = ['user__username', 'pattern__title']


# ─── PASSKEY ─────────────────────────────────────────────────────────────────

admin.site.register(UserPasskey)

#── GROUP ───────────────────────────────────────────────────────────────────

admin.site.register(Group)
admin.site.register(GroupMembership)
admin.site.register(ForumThread)
admin.site.register(ForumReply)
admin.site.register(Conversation)
admin.site.register(Message)
admin.site.register(CraftAlong)
admin.site.register(CraftAlongParticipant)