from rest_framework.viewsets import ModelViewSet

from .models import Ticket,TicketComment,TicketAttachment
from .serializers import TicketSerializer,TicketCommentSerializer,TicketAttachmentSerializer
from .permissions import TicketPermission,TicketCommentPermission,TicketAttachmentPermission


class TicketViewSet(ModelViewSet):

    serializer_class = TicketSerializer
    permission_classes = [TicketPermission]

    def get_queryset(self):

        user = self.request.user

        # Admin can see all tickets
        if user.role == 'ADMIN':
            return Ticket.objects.all().order_by('-created_at')

        # Project Manager can see own project tickets
        if user.role == 'PROJECT_MANAGER':
            return Ticket.objects.filter(
                project__project_manager=user
            ).order_by('-created_at')

        # Employee can see assigned tickets
        if user.role == 'EMPLOYEE':
            return Ticket.objects.filter(
                assigned_to=user
            ).order_by('-created_at')

        # Client can see own company tickets
        if user.role == 'CLIENT':
            if user.client is None:
                return Ticket.objects.none()

            return Ticket.objects.filter(
                project__client=user.client
            ).order_by('-created_at')

        return Ticket.objects.none()

    def perform_create(self, serializer):

        serializer.save(
            created_by=self.request.user
        )


class TicketCommentViewSet(ModelViewSet):

    serializer_class = TicketCommentSerializer
    permission_classes = [TicketCommentPermission]

    def get_queryset(self):

        user = self.request.user

        # Admin can see all comments
        if user.role == 'ADMIN':
            return TicketComment.objects.all().order_by('-created_at')

        # Project Manager can see own project comments
        if user.role == 'PROJECT_MANAGER':
            return TicketComment.objects.filter(
                ticket__project__project_manager=user
            ).order_by('-created_at')

        # Employee can see assigned ticket comments
        if user.role == 'EMPLOYEE':
            return TicketComment.objects.filter(
                ticket__assigned_to=user
            ).order_by('-created_at')

        # Client can see own company ticket comments
        if user.role == 'CLIENT':
            return TicketComment.objects.filter(
                ticket__project__client=user.client
            ).order_by('-created_at')

        return TicketComment.objects.none()

    def perform_create(self, serializer):

        serializer.save(
            user=self.request.user
        )


class TicketAttachmentViewSet(ModelViewSet):

    serializer_class = TicketAttachmentSerializer
    permission_classes = [TicketAttachmentPermission]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'ADMIN':
            return TicketAttachment.objects.all().order_by('-uploaded_at')

        if user.role == 'PROJECT_MANAGER':
            return TicketAttachment.objects.filter(
                ticket__project__project_manager=user
            ).order_by('-uploaded_at')

        if user.role == 'EMPLOYEE':
            return TicketAttachment.objects.filter(
                ticket__assigned_to=user
            ).order_by('-uploaded_at')

        if user.role == 'CLIENT':
            if user.client is None:
                return TicketAttachment.objects.none()

            return TicketAttachment.objects.filter(
                ticket__project__client=user.client
            ).order_by('-uploaded_at')

        return TicketAttachment.objects.none()

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
