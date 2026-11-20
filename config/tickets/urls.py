from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import TicketViewSet,TicketCommentViewSet,TicketAttachmentViewSet,TicketPrioritySettingListView,TicketPrioritySettingUpdateView

router = DefaultRouter()

router.register('tickets', TicketViewSet, basename='tickets')
router.register('comments',TicketCommentViewSet,basename='ticket-comments')
router.register('attachments', TicketAttachmentViewSet, basename='ticket-attachments')

urlpatterns = router.urls + [
    path('priority-settings/',TicketPrioritySettingListView.as_view(),name='ticket-priority-settings'),
    path('priority-settings/<int:pk>/',TicketPrioritySettingUpdateView.as_view(),name='ticket-priority-setting-update'),
]