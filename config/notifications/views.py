from rest_framework.viewsets import ModelViewSet

from .models import Notification
from .serializers import NotificationSerializer
from .permissions import NotificationPermission


class NotificationViewSet(ModelViewSet):

    serializer_class = NotificationSerializer
    permission_classes = [NotificationPermission]

    http_method_names = ['get', 'patch', 'head', 'options']

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user
        ).order_by('-created_at')
