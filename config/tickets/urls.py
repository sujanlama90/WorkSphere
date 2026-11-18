from rest_framework.routers import DefaultRouter
from .views import TicketViewSet,TicketCommentViewSet,TicketAttachmentViewSet

router = DefaultRouter()

router.register('tickets', TicketViewSet, basename='tickets')
router.register('comments',TicketCommentViewSet,basename='ticket-comments')
router.register('attachments', TicketAttachmentViewSet, basename='ticket-attachments')

urlpatterns = router.urls
