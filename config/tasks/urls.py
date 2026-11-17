from rest_framework.routers import DefaultRouter
from .views import TaskViewSet,CommentViewSet,TaskAttachmentViewSet,TaskActivityViewSet

router = DefaultRouter()
router.register('comments', CommentViewSet, basename='comments')
router.register('attachments',TaskAttachmentViewSet,basename='attachments')
router.register('activities', TaskActivityViewSet, basename='activities')
router.register('', TaskViewSet, basename='tasks')

urlpatterns = router.urls