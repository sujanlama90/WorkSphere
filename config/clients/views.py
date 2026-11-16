from rest_framework.viewsets import ModelViewSet

from .models import Client
from .serializers import ClientSerializer
from .permissions import IsAdminOrProjectManager
from accounts.permissions import IsAdminUser


class ClientViewSet(ModelViewSet):
    queryset = Client.objects.all().order_by('-created_at')
    serializer_class = ClientSerializer
    permission_classes = [IsAdminOrProjectManager]

    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAdminUser()]

        return super().get_permissions()