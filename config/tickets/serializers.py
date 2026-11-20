from rest_framework import serializers
from .models import Ticket,TicketComment,TicketAttachment,TicketPrioritySetting
from datetime import timedelta
from django.utils import timezone
from accounts.models import User


class TicketSerializer(serializers.ModelSerializer):

    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(
            role__in=[
                User.Role.EMPLOYEE,
                User.Role.PROJECT_MANAGER
            ],
            is_active=True
        ),
        required=False,
        allow_null=True
    )

    created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id',
            'project',
            'title',
            'description',
            'created_by',
            'assigned_to',
            'status',
            'priority',
            'deadline_at',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'created_by',
            'deadline_at',
            'created_at',
            'updated_at',
        ]

    def create(self, validated_data):

        priority = validated_data.get(
            'priority',
            Ticket.Priority.MEDIUM
        )

        priority_setting = TicketPrioritySetting.objects.get(
            priority=priority
        )

        deadline = timezone.now() + timedelta(
            hours=priority_setting.deadline_hours
        )

        validated_data['deadline_at'] = deadline

        return super().create(validated_data)

    def validate(self, attrs):

        request = self.context.get('request')

        project = attrs.get(
            'project',
            self.instance.project if self.instance else None
        )

        assigned_to = attrs.get(
            'assigned_to',
            self.instance.assigned_to if self.instance else None
        )

        user = request.user

        if user.role == User.Role.CLIENT and 'assigned_to' in attrs:
            if assigned_to is not None:
                raise serializers.ValidationError({
                    'assigned_to': 'Only Admin or Project Manager can assign tickets.'
                })

        # Client can create tickets only for own company projects
        if user.role == User.Role.CLIENT:
            if user.client is None or project.client != user.client:
                raise serializers.ValidationError({
                    'project': 'You can only create tickets for your company projects.'
                })

        # Project Manager can access own projects only
        if user.role == User.Role.PROJECT_MANAGER:
            if project.project_manager != user:
                raise serializers.ValidationError({
                    'project': 'You can only manage tickets for your own projects.'
                })

        # Assigned user must belong to the selected project
        if assigned_to:
            if assigned_to.role == User.Role.EMPLOYEE:
                if not project.employees.filter(id=assigned_to.id).exists():
                    raise serializers.ValidationError({
                        'assigned_to': 'This employee is not assigned to this project.'
                    })

            elif assigned_to.role == User.Role.PROJECT_MANAGER:
                if project.project_manager != assigned_to:
                    raise serializers.ValidationError({
                        'assigned_to': 'This Project Manager does not manage this project.'
                    })

        return attrs

class TicketCommentSerializer(serializers.ModelSerializer):

    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = TicketComment
        fields = [
            'id',
            'ticket',
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
        user = request.user

        ticket = attrs.get(
            'ticket',
            self.instance.ticket if self.instance else None
        )

        # Existing comment ticket cannot be changed
        if self.instance and 'ticket' in attrs:
            if attrs['ticket'] != self.instance.ticket:
                raise serializers.ValidationError({
                    'ticket': 'You cannot change the ticket of an existing comment.'
                })

        # Admin can comment on all tickets
        if user.role == User.Role.ADMIN:
            return attrs

        # Project Manager can comment on own project tickets
        if user.role == User.Role.PROJECT_MANAGER:
            allowed = ticket.project.project_manager == user

        # Employee can comment on assigned tickets
        elif user.role == User.Role.EMPLOYEE:
            allowed = ticket.assigned_to == user

        # Client can comment on own company tickets
        elif user.role == User.Role.CLIENT:
            allowed = (
                user.client is not None
                and ticket.project.client == user.client
            )

        else:
            allowed = False

        if not allowed:
            raise serializers.ValidationError({
                'ticket': 'You do not have permission to comment on this ticket.'
            })

        return attrs


class TicketAttachmentSerializer(serializers.ModelSerializer):

    uploaded_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = TicketAttachment
        fields = [
            'id',
            'ticket',
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

        ticket = attrs.get(
            'ticket',
            self.instance.ticket if self.instance else None
        )

        # Existing attachment को Ticket परिवर्तन गर्न नपाउने
        if self.instance and ticket != self.instance.ticket:
            raise serializers.ValidationError({
                'ticket': 'You cannot change the ticket of an existing attachment.'
            })

        if user.role == 'ADMIN':
            return attrs

        if user.role == 'PROJECT_MANAGER':
            allowed = ticket.project.project_manager == user

        elif user.role == 'EMPLOYEE':
            allowed = ticket.assigned_to == user

        elif user.role == 'CLIENT':
            allowed = (
                user.client is not None
                and ticket.project.client == user.client
            )

        else:
            allowed = False

        if not allowed:
            raise serializers.ValidationError({
                'ticket': 'You do not have permission to upload files to this ticket.'
            })

        return attrs

class TicketPrioritySettingSerializer(serializers.ModelSerializer):

    class Meta:
        model = TicketPrioritySetting

        fields = [
            'id',
            'priority',
            'deadline_hours',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'priority',
            'created_at',
            'updated_at',
        ]