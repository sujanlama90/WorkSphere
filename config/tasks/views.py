from rest_framework.viewsets import ModelViewSet
from .models import Task, Comment, TaskAttachment, TaskActivity
from notifications.models import Notification
from .serializers import (TaskSerializer,CommentSerializer,TaskAttachmentSerializer,TaskActivitySerializer)
from .permissions import ( TaskPermission,CommentPermission,TaskAttachmentPermission,TaskActivityPermission)
from accounts.models import User


class TaskViewSet(ModelViewSet):

    serializer_class = TaskSerializer
    permission_classes = [TaskPermission]

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

class CommentViewSet(ModelViewSet):

    serializer_class = CommentSerializer
    permission_classes = [CommentPermission]

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


class TaskAttachmentViewSet(ModelViewSet):

    serializer_class = TaskAttachmentSerializer
    permission_classes = [TaskAttachmentPermission]

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
        serializer.save(uploaded_by=self.request.user)


class TaskActivityViewSet(ModelViewSet):

    serializer_class = TaskActivitySerializer
    permission_classes = [TaskActivityPermission]

    http_method_names = ['get', 'head', 'options']

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
