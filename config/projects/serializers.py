from rest_framework import serializers
from .models import Project, ProjectRequest
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

    client_name = serializers.SerializerMethodField()
    project_manager_name = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id',
            'name',
            'description',
            'client',
            'client_name',
            'project_manager',
            'project_manager_name',
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
            'client_name',
            'project_manager_name',
        ]

    def get_client_name(self, obj):
        if obj.client:
            return getattr(obj.client, 'name', str(obj.client))
        return None

    def get_project_manager_name(self, obj):
        manager = obj.project_manager

        if not manager:
            return None

        full_name = f"{manager.first_name} {manager.last_name}".strip()

        return full_name or manager.username

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


# Client Project Request Serializer
class ProjectRequestSerializer(serializers.ModelSerializer):

    client_name = serializers.CharField(
        source='client.name',
        read_only=True
    )

    class Meta:
        model = ProjectRequest
        fields = [
            'id',
            'client',
            'client_name',
            'name',
            'description',
            'requirements',
            'expected_start_date',
            'expected_deadline',
            'status',
            'admin_feedback',
            'reviewed_by',
            'project',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'client',
            'client_name',
            'status',
            'admin_feedback',
            'reviewed_by',
            'project',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        start_date = attrs.get('expected_start_date')
        deadline = attrs.get('expected_deadline')

        if start_date and deadline and deadline < start_date:
            raise serializers.ValidationError({
                'expected_deadline':
                    'Expected deadline cannot be earlier than start date.'
            })

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')

        client = getattr(request.user, 'client', None)

        if not client:
            raise serializers.ValidationError(
                "Your account is not associated with a client."
            )

        if not client.is_active:
            raise serializers.ValidationError(
                "Your client account is inactive."
            )

        return ProjectRequest.objects.create(
            client=client,
            **validated_data
        )


# Admin Review Serializer
class ProjectRequestReviewSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProjectRequest
        fields = [
            'status',
            'admin_feedback',
        ]

    def validate_status(self, value):
        allowed_statuses = [
            ProjectRequest.Status.APPROVED,
            ProjectRequest.Status.REJECTED,
            ProjectRequest.Status.NEEDS_INFORMATION,
        ]

        if value not in allowed_statuses:
            raise serializers.ValidationError(
                "Invalid review status."
            )

        return value

    def validate(self, attrs):
        status = attrs.get('status')
        feedback = attrs.get('admin_feedback', '').strip()

        if status in [
            ProjectRequest.Status.REJECTED,
            ProjectRequest.Status.NEEDS_INFORMATION,
        ] and not feedback:
            raise serializers.ValidationError({
                'admin_feedback':
                    'Feedback is required for rejection or more information.'
            })

        return attrs
