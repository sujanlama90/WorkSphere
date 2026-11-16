
from rest_framework import serializers
from .models import Project
from accounts.models import User


class ProjectSerializer(serializers.ModelSerializer):

    employees = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.filter(
            role=User.Role.EMPLOYEE,
            is_active=True
        ),
        required=False
    )

    class Meta:
        model = Project
        fields = [
            'id',
            'name',
            'description',
            'client',
            'project_manager',
            'employees',
            'start_date',
            'deadline',
            'status',
            'priority',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
        ]

    def validate_client(self, value):
        if not value.is_active:
            raise serializers.ValidationError(
                "Cannot create a project for an inactive client."
            )
        return value

    def validate_project_manager(self, value):
        if value.role != User.Role.PROJECT_MANAGER:
            raise serializers.ValidationError(
                "Selected user must be a Project Manager."
            )

        if not value.is_active:
            raise serializers.ValidationError(
                "Inactive Project Manager cannot be assigned."
            )

        request = self.context.get('request')

        if (
            request 
            and request.user.is_authenticated 
            and request.user.role == User.Role.PROJECT_MANAGER
            and value != request.user
        ):
            raise serializers.ValidationError(
                "You can only assign projects to yourself."
            )

        return value

    def validate(self, attrs):
        start_date = attrs.get(
            'start_date',
            getattr(self.instance, 'start_date', None)
        )

        deadline = attrs.get(
            'deadline',
            getattr(self.instance, 'deadline', None)
        )

        if start_date and deadline and deadline < start_date:
            raise serializers.ValidationError({
                'deadline': 'Deadline cannot be earlier than start date.'
            })

        return attrs
