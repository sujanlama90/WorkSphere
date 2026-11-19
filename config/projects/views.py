from rest_framework.viewsets import ModelViewSet
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from .models import Project
from .serializers import ProjectSerializer
from .permissions import ProjectPermission
from notifications.models import Notification


class ProjectViewSet(ModelViewSet):

    serializer_class = ProjectSerializer
    permission_classes = [ProjectPermission]

    # Search, Filtering and Sorting
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    # Filtering
    filterset_fields = [
        'client',
        'project_manager',
        'employees',
        'status',
        'priority',
    ]

    # Search
    search_fields = [
        'name',
        'description',
    ]

    # Sorting
    ordering_fields = [
        'name',
        'status',
        'priority',
        'start_date',
        'deadline',
        'created_at',
        'updated_at',
    ]

    ordering = ['-created_at']

    def get_queryset(self):

        user = self.request.user

        if user.role == "ADMIN":

            return Project.objects.all().order_by('-created_at')

        if user.role == "PROJECT_MANAGER":

            return Project.objects.filter(
                project_manager=user
            ).order_by('-created_at')

        if user.role == "EMPLOYEE":

            return Project.objects.filter(
                employees=user
            ).order_by('-created_at')

        if user.role == "CLIENT":

            return Project.objects.filter(
                client=user.client
            ).order_by('-created_at')

        return Project.objects.none()

    def perform_create(self, serializer):

        project = serializer.save()

        recipients = [project.project_manager]

        employees = project.employees.filter(
            is_active=True
        )

        recipients.extend(employees)

        unique_recipients = {
            user.id: user
            for user in recipients
            if user.is_active and user != self.request.user
        }

        for recipient in unique_recipients.values():

            Notification.objects.create(
                recipient=recipient,
                actor=self.request.user,
                title="New Project Assigned",
                message=(
                    f"You have been assigned to project "
                    f"'{project.name}'."
                ),
                notification_type=Notification.NotificationType.PROJECT
            )
