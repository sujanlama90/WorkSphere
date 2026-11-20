
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):

    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        # Only Admin can view all audit logs
        if user.role == 'ADMIN':
            return AuditLog.objects.all()

        # Other users can view only their own activities
        return AuditLog.objects.filter(
            user=user
        )
