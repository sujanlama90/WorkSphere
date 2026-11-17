from rest_framework.viewsets import ModelViewSet
from .models import Task, Comment,TaskAttachment,TaskActivity
from .serializers import TaskSerializer,CommentSerializer,TaskAttachmentSerializer,TaskActivitySerializer
from .permissions import TaskPermission,CommentPermission,TaskAttachmentPermission,TaskActivityPermission

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
        serializer.save(user=self.request.user)


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
