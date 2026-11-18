from rest_framework.viewsets import ModelViewSet

from .models import Ticket,TicketComment,TicketAttachment,User
from .serializers import TicketSerializer,TicketCommentSerializer,TicketAttachmentSerializer
from .permissions import TicketPermission,TicketCommentPermission,TicketAttachmentPermission
from notifications.models import Notification


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

        ticket = serializer.save(
            created_by=self.request.user
        )

        if self.request.user.role == 'CLIENT':

            # Notify all active Admins
            admins = User.objects.filter(
                role=User.Role.ADMIN,
                is_active=True
            )

            for admin in admins:
                Notification.objects.create(
                    recipient=admin,
                    actor=self.request.user,
                    title="New Support Ticket",
                    message=f"A new ticket '{ticket.title}' has been created.",
                    notification_type=Notification.NotificationType.TICKET
                )

            # Notify Project Manager
            project_manager = ticket.project.project_manager

            if project_manager.is_active:
                Notification.objects.create(
                    recipient=project_manager,
                    actor=self.request.user,
                    title="New Support Ticket",
                    message=f"A new ticket '{ticket.title}' has been created.",
                    notification_type=Notification.NotificationType.TICKET
                )

    def perform_update(self, serializer):

        old_ticket = self.get_object()

        old_assigned_to = old_ticket.assigned_to
        old_status = old_ticket.status

        ticket = serializer.save()

        new_assigned_to = ticket.assigned_to
        new_status = ticket.status

        # 1. Notify Employee when a new ticket is assigned
        if (
            new_assigned_to
            and new_assigned_to != old_assigned_to
        ):
            Notification.objects.create(
                recipient=new_assigned_to,
                actor=self.request.user,
                title="New Ticket Assigned",
                message=f"A ticket '{ticket.title}' has been assigned to you.",
                notification_type=Notification.NotificationType.TICKET
            )

        # 2. Notify Client and Project Manager when status changes
        if new_status != old_status:

            client_user = ticket.created_by

            if client_user.is_active:
                Notification.objects.create(
                    recipient=client_user,
                    actor=self.request.user,
                    title="Ticket Status Updated",
                    message=f"Your ticket '{ticket.title}' status changed to {new_status}.",
                    notification_type=Notification.NotificationType.TICKET
                )

            project_manager = ticket.project.project_manager

            if (
                project_manager.is_active
                and project_manager != self.request.user
            ):
                Notification.objects.create(
                    recipient=project_manager,
                    actor=self.request.user,
                    title="Ticket Status Updated",
                    message=f"Ticket '{ticket.title}' status changed to {new_status}.",
                    notification_type=Notification.NotificationType.TICKET
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

        comment = serializer.save(
            user=self.request.user
        )

        ticket = comment.ticket

        # Collect all active Admins
        admins = User.objects.filter(
            role=User.Role.ADMIN,
            is_active=True
        )

        recipients = list(admins)

        # Add Project Manager
        project_manager = ticket.project.project_manager

        if project_manager.is_active:
            recipients.append(project_manager)

        # Add Ticket Creator
        client_user = ticket.created_by

        if client_user.is_active:
            recipients.append(client_user)

        # Add assigned Employee
        if (
            ticket.assigned_to
            and ticket.assigned_to.is_active
        ):
            recipients.append(ticket.assigned_to)

        # Remove duplicate users and exclude comment author
        unique_recipients = {
            user.id: user for user in recipients
            if user != self.request.user
        }

        # Create notifications
        for recipient in unique_recipients.values():

            Notification.objects.create(
                recipient=recipient,
                actor=self.request.user,
                title="New Ticket Comment",
                message=f"A new comment was added to ticket '{ticket.title}'.",
                notification_type=Notification.NotificationType.COMMENT
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
