from rest_framework.viewsets import ModelViewSet

from .models import Notification
from .serializers import NotificationSerializer
from .permissions import NotificationPermission


class NotificationViewSet(ModelViewSet):

    serializer_class = NotificationSerializer
    permission_classes = [NotificationPermission]

    http_method_names = ['get', 'patch', 'head', 'options']

    filterset_fields = [
        'notification_type',
        'is_read',
        'created_at',
    ]

    search_fields = [
        'title',
        'message',
        'actor__username',
    ]

    ordering_fields = [
        'created_at',
        'notification_type',
        'is_read',
    ]

    ordering = ['-created_at']

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user
        ).order_by('-created_at')
