from rest_framework import serializers
from django.utils import timezone
from .models import Task
from accounts.models import User
from .models import Task, Comment, TaskAttachment,TaskActivity

class TaskSerializer(serializers.ModelSerializer):

    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(
            role=User.Role.EMPLOYEE,
            is_active=True
        ),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Task
        fields = [
            'id',
            'project',
            'title',
            'description',
            'assigned_to',
            'created_by',
            'status',
            'priority',
            'due_date',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'created_by',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):

        request = self.context.get('request')
        user = request.user if request else None

        project = attrs.get(
            'project',
            self.instance.project if self.instance else None
        )

        assigned_to = attrs.get(
            'assigned_to',
            self.instance.assigned_to if self.instance else None
        )

        # Project cannot be changed after task creation
        if self.instance and 'project' in attrs:
            if attrs['project'] != self.instance.project:
                raise serializers.ValidationError({
                    'project': 'You cannot change the project of an existing task.'
                })

        # Inactive client project validation
        if project and not project.client.is_active:
            raise serializers.ValidationError({
                'project': 'Cannot create tasks for an inactive client project.'
            })

        # Project Manager can only create tasks in own projects
        if (
            user
            and user.role == User.Role.PROJECT_MANAGER
            and project
            and project.project_manager != user
        ):
            raise serializers.ValidationError({
                'project': 'You can only create tasks in your own projects.'
            })

        # Assigned employee must belong to the project
        if assigned_to and project:
            if not project.employees.filter(
                id=assigned_to.id
            ).exists():
                raise serializers.ValidationError({
                    'assigned_to': 'This employee is not assigned to this project.'
                })

        # Due date validation only when creating a new task
        if not self.instance:
            due_date = attrs.get('due_date')

            if due_date and due_date < timezone.localdate():
                raise serializers.ValidationError({
                    'due_date': 'Due date cannot be in the past.'
                })

        # Task status workflow
        if self.instance and 'status' in attrs:

            old_status = self.instance.status
            new_status = attrs['status']

            # Employee workflow
            if user and user.role == User.Role.EMPLOYEE:

                allowed_transitions = {
                    Task.Status.TODO: [
                        Task.Status.IN_PROGRESS
                    ],
                    Task.Status.IN_PROGRESS: [
                        Task.Status.IN_REVIEW
                    ],
                }

                allowed_statuses = allowed_transitions.get(
                    old_status, []
                )

                if new_status not in allowed_statuses:
                    raise serializers.ValidationError({
                        'status': 'You can only move TODO to IN_PROGRESS and IN_PROGRESS to IN_REVIEW.'
                    })

            # Project Manager review workflow
            elif user and user.role == User.Role.PROJECT_MANAGER:

                if old_status == Task.Status.IN_REVIEW:

                    if new_status not in [
                        Task.Status.COMPLETED,
                        Task.Status.IN_PROGRESS
                    ]:
                        raise serializers.ValidationError({
                            'status': 'You can only approve or reject a task under review.'
                        })

                elif new_status == Task.Status.COMPLETED:
                    raise serializers.ValidationError({
                        'status': 'You can only complete a task after reviewing it.'
                    })

        return attrs

class CommentSerializer(serializers.ModelSerializer):

    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Comment
        fields = [
            'id',
            'task',
            'user',
            'message',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'user',
            'created_at',
            'updated_at',
        ]

    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Comment cannot be empty."
            )
        return value

    def validate(self, attrs):

        request = self.context.get('request')
        task = attrs.get(
            'task',
            self.instance.task if self.instance else None
        )

        if self.instance and 'task' in attrs:
            if attrs['task'] != self.instance.task:
                raise serializers.ValidationError({
                    'task': 'You cannot change the task of an existing comment.'
                })

        user = request.user

        if user.role == 'ADMIN':
            return attrs

        if user.role == 'PROJECT_MANAGER':
            if task.project.project_manager != user:
                raise serializers.ValidationError({
                    'task': 'You can only comment on your own projects.'
                })

        elif user.role == 'EMPLOYEE':
            if task.assigned_to != user:
                raise serializers.ValidationError({
                    'task': 'You can only comment on your assigned tasks.'
                })

        elif user.role == 'CLIENT':
            if (
                user.client is None
                or task.project.client != user.client
            ):
                raise serializers.ValidationError({
                    'task': 'You can only comment on your company projects.'
                })

        else:
            raise serializers.ValidationError(
                'You do not have permission to comment.'
            )

        return attrs


class TaskAttachmentSerializer(serializers.ModelSerializer):

    uploaded_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = TaskAttachment
        fields = [
            'id',
            'task',
            'uploaded_by',
            'file',
            'uploaded_at',
        ]

        read_only_fields = [
            'id',
            'uploaded_by',
            'uploaded_at',
        ]

    def validate(self, attrs):

        request = self.context.get('request')
        user = request.user

        task = attrs.get(
            'task',
            self.instance.task if self.instance else None
        )

        # Existing attachment को Task change गर्न नदिने
        if self.instance and 'task' in attrs:
            if attrs['task'] != self.instance.task:
                raise serializers.ValidationError({
                    'task': 'You cannot change the task of an existing attachment.'
                })

        # Admin can upload to any task
        if user.role == 'ADMIN':
            return attrs

        # Project Manager: own project only
        if user.role == 'PROJECT_MANAGER':
            allowed = task.project.project_manager == user

        # Employee: assigned task only
        elif user.role == 'EMPLOYEE':
            allowed = task.assigned_to == user

        # Client: own company project only
        elif user.role == 'CLIENT':
            allowed = (
                user.client is not None
                and task.project.client == user.client
            )

        else:
            allowed = False

        if not allowed:
            raise serializers.ValidationError({
                'task': 'You do not have permission to upload an attachment to this task.'
            })

        return attrs


class TaskActivitySerializer(serializers.ModelSerializer):

    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = TaskActivity
        fields = [
            'id',
            'task',
            'user',
            'action',
            'description',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'task',
            'user',
            'action',
            'description',
            'created_at',
        ]
