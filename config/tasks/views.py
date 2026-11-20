from rest_framework.viewsets import ModelViewSet
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from .models import Task, Comment, TaskAttachment, TaskActivity
from notifications.models import Notification
from .serializers import (
    TaskSerializer,
    CommentSerializer,
    TaskAttachmentSerializer,
    TaskActivitySerializer
)
from .permissions import (
    TaskPermission,
    CommentPermission,
    TaskAttachmentPermission,
    TaskActivityPermission
)
from accounts.models import User
from audit_logs.utils import create_audit_log


class TaskViewSet(ModelViewSet):

    serializer_class = TaskSerializer
    permission_classes = [TaskPermission]
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_fields = [
        'project',
        'assigned_to',
        'status',
        'priority',
        'due_date',
    ]

    search_fields = [
        'title',
        'description',
    ]

    ordering_fields = [
        'title',
        'status',
        'priority',
        'due_date',
        'created_at',
        'updated_at',
    ]

    ordering = ['-created_at']

    def get_queryset(self):

        user = self.request.user

        if user.role == 'ADMIN':
            return Task.objects.all().order_by('-created_at')

        if user.role == 'PROJECT_MANAGER':
            return Task.objects.filter(
                project__project_manager=user
            ).order_by('-created_at')

        if user.role == 'EMPLOYEE':
            return Task.objects.filter(
                assigned_to=user
            ).order_by('-created_at')

        if user.role == 'CLIENT':
            return Task.objects.filter(
                project__client=user.client
            ).order_by('-created_at')

        return Task.objects.none()

    def perform_create(self, serializer):

        task = serializer.save(created_by=self.request.user)

        TaskActivity.objects.create(
            task=task,
            user=self.request.user,
            action='TASK_CREATED',
            description=f'Task "{task.title}" was created.'
        )

        # Notify assigned Employee
        if task.assigned_to and task.assigned_to.is_active:

            Notification.objects.create(
                recipient=task.assigned_to,
                actor=self.request.user,
                title="New Task Assigned",
                message=f"A new task '{task.title}' has been assigned to you.",
                notification_type=Notification.NotificationType.TASK
            )

        # Create Audit Log
        create_audit_log(
            request=self.request,
            action='CREATE',
            instance=task,
            description=f"Created task '{task.title}'."
        )

    def perform_update(self, serializer):

        task = self.get_object()

        old_values = {
            'status': task.status,
            'priority': task.priority,
            'assigned_to': task.assigned_to,
            'due_date': task.due_date,
        }

        task = serializer.save()

        new_values = {
            'status': task.status,
            'priority': task.priority,
            'assigned_to': task.assigned_to,
            'due_date': task.due_date,
        }

        # Create Task Activity History
        for field in old_values:

            if old_values[field] != new_values[field]:

                TaskActivity.objects.create(
                    task=task,
                    user=self.request.user,
                    action=f'{field.upper()}_CHANGED',
                    description=(
                        f'{field.replace("_", " ").title()} '
                        f'changed from {old_values[field]} '
                        f'to {new_values[field]}.'
                    )
                )

        # Notify newly assigned Employee
        old_assigned_to = old_values['assigned_to']
        new_assigned_to = new_values['assigned_to']

        if (
            new_assigned_to
            and new_assigned_to != old_assigned_to
            and new_assigned_to.is_active
        ):

            Notification.objects.create(
                recipient=new_assigned_to,
                actor=self.request.user,
                title="New Task Assigned",
                message=f"A task '{task.title}' has been assigned to you.",
                notification_type=Notification.NotificationType.TASK
            )

        # Notify when Task Status changes
        if old_values['status'] != new_values['status']:

            # Get all active Admins
            admins = User.objects.filter(
                role=User.Role.ADMIN,
                is_active=True
            )

            recipients = list(admins)

            # Add Task Creator and Project Manager
            recipients.extend([
                task.created_by,
                task.project.project_manager
            ])

            # Remove duplicates and exclude actor
            unique_recipients = {
                user.id: user
                for user in recipients
                if user.is_active and user != self.request.user
            }

            # Create Notifications
            for recipient in unique_recipients.values():

                Notification.objects.create(
                    recipient=recipient,
                    actor=self.request.user,
                    title="Task Status Updated",
                    message=(
                        f"Task '{task.title}' status changed "
                        f"to {task.status}."
                    ),
                    notification_type=Notification.NotificationType.TASK
                )

        # Create Audit Log
        create_audit_log(
            request=self.request,
            action='UPDATE',
            instance=task,
            description=f"Updated task '{task.title}'."
        )

    def perform_destroy(self, instance):

        # Create Audit Log before deleting Task
        create_audit_log(
            request=self.request,
            action='DELETE',
            instance=instance,
            description=f"Deleted task '{instance.title}'."
        )

        super().perform_destroy(instance)


class CommentViewSet(ModelViewSet):

    serializer_class = CommentSerializer
    permission_classes = [CommentPermission]
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_fields = [
        'task',
        'user',
        'created_at',
    ]

    search_fields = [
        'message',
        'task__title',
        'user__username',
    ]

    ordering_fields = [
        'created_at',
        'updated_at',
    ]

    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user

        if user.role == 'ADMIN':
            return Comment.objects.all().order_by('-created_at')

        if user.role == 'PROJECT_MANAGER':
            return Comment.objects.filter(
                task__project__project_manager=user
            ).order_by('-created_at')

        if user.role == 'EMPLOYEE':
            return Comment.objects.filter(
                task__assigned_to=user
            ).order_by('-created_at')

        if user.role == 'CLIENT':
            return Comment.objects.filter(
                task__project__client=user.client
            ).order_by('-created_at')

        return Comment.objects.none()

    def perform_create(self, serializer):

        comment = serializer.save(
            user=self.request.user
        )

        task = comment.task

        # Get all active Admins
        admins = User.objects.filter(
            role=User.Role.ADMIN,
            is_active=True
        )

        recipients = list(admins)

        # Add Project Manager
        recipients.append(task.project.project_manager)

        # Add Task Creator
        recipients.append(task.created_by)

        # Add assigned Employee
        if task.assigned_to:
            recipients.append(task.assigned_to)

        # Add active Client Users
        client_users = User.objects.filter(
            client=task.project.client,
            role=User.Role.CLIENT,
            is_active=True
        )

        recipients.extend(client_users)

        # Remove duplicates and exclude comment author
        unique_recipients = {
            user.id: user
            for user in recipients
            if user.is_active and user != self.request.user
        }

        # Create Notifications
        for recipient in unique_recipients.values():

            Notification.objects.create(
                recipient=recipient,
                actor=self.request.user,
                title="New Task Comment",
                message=(
                    f"A new comment was added to task '{task.title}'."
                ),
                notification_type=Notification.NotificationType.COMMENT
            )

        # Create Audit Log
        create_audit_log(
            request=self.request,
            action='CREATE',
            instance=comment,
            description=f"Added comment to task '{task.title}'."
        )

    def perform_update(self, serializer):

        comment = serializer.save()

        create_audit_log(
            request=self.request,
            action='UPDATE',
            instance=comment,
            description=f"Updated comment on task '{comment.task.title}'."
        )

    def perform_destroy(self, instance):

        create_audit_log(
            request=self.request,
            action='DELETE',
            instance=instance,
            description=f"Deleted comment from task '{instance.task.title}'."
        )

        super().perform_destroy(instance)


class TaskAttachmentViewSet(ModelViewSet):

    serializer_class = TaskAttachmentSerializer
    permission_classes = [TaskAttachmentPermission]
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_fields = [
        'task',
        'uploaded_by',
        'uploaded_at',
    ]

    search_fields = [
        'task__title',
        'uploaded_by__username',
        'file',
    ]

    ordering_fields = [
        'uploaded_at',
    ]

    ordering = ['-uploaded_at']

    def get_queryset(self):
        user = self.request.user

        if user.role == 'ADMIN':
            return TaskAttachment.objects.all()

        if user.role == 'PROJECT_MANAGER':
            return TaskAttachment.objects.filter(
                task__project__project_manager=user
            )

        if user.role == 'EMPLOYEE':
            return TaskAttachment.objects.filter(
                task__assigned_to=user
            )

        if user.role == 'CLIENT':
            return TaskAttachment.objects.filter(
                task__project__client=user.client
            )

        return TaskAttachment.objects.none()

    def perform_create(self, serializer):

        attachment = serializer.save(
            uploaded_by=self.request.user
        )

        task = attachment.task

        # Get all active Admins
        admins = User.objects.filter(
            role=User.Role.ADMIN,
            is_active=True
        )

        recipients = list(admins)

        # Add Project Manager
        recipients.append(task.project.project_manager)

        # Add Task Creator
        recipients.append(task.created_by)

        # Add assigned Employee
        if task.assigned_to:
            recipients.append(task.assigned_to)

        # Remove duplicates and exclude uploader
        unique_recipients = {
            user.id: user
            for user in recipients
            if user.is_active and user != self.request.user
        }

        # Create Notifications
        for recipient in unique_recipients.values():

            Notification.objects.create(
                recipient=recipient,
                actor=self.request.user,
                title="New Task Attachment",
                message=(
                    f"A new file was uploaded to task '{task.title}'."
                ),
                notification_type=Notification.NotificationType.TASK
            )

        # Create Audit Log
        create_audit_log(
            request=self.request,
            action='CREATE',
            instance=attachment,
            description=f"Uploaded attachment to task '{task.title}'."
        )

    def perform_destroy(self, instance):

        create_audit_log(
            request=self.request,
            action='DELETE',
            instance=instance,
            description=f"Deleted attachment from task '{instance.task.title}'."
        )

        super().perform_destroy(instance)


class TaskActivityViewSet(ModelViewSet):

    serializer_class = TaskActivitySerializer
    permission_classes = [TaskActivityPermission]

    http_method_names = ['get', 'head', 'options']
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_fields = [
        'task',
        'user',
        'action',
        'created_at',
    ]

    search_fields = [
        'action',
        'description',
        'task__title',
        'user__username',
    ]

    ordering_fields = [
        'created_at',
    ]

    ordering = ['-created_at']

    def get_queryset(self):

        user = self.request.user

        if user.role == 'ADMIN':
            return TaskActivity.objects.all().order_by('-created_at')

        if user.role == 'PROJECT_MANAGER':
            return TaskActivity.objects.filter(
                task__project__project_manager=user
            ).order_by('-created_at')

        if user.role == 'EMPLOYEE':
            return TaskActivity.objects.filter(
                task__assigned_to=user
            ).order_by('-created_at')

        if user.role == 'CLIENT':
            return TaskActivity.objects.filter(
                task__project__client=user.client
            ).order_by('-created_at')

        return TaskActivity.objects.none()
