from django.db import transaction
from rest_framework.viewsets import ModelViewSet
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django_filters.rest_framework import DjangoFilterBackend

from .models import Project, ProjectRequest
from .serializers import (
    ProjectSerializer,
    ProjectRequestSerializer,
    ProjectRequestReviewSerializer,
)
from .permissions import ProjectPermission, ProjectRequestPermission
from accounts.models import User
from notifications.models import Notification
from audit_logs.utils import create_audit_log


class ProjectViewSet(ModelViewSet):

    serializer_class = ProjectSerializer
    permission_classes = [ProjectPermission]

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_fields = [
        'client',
        'project_manager',
        'employees',
        'status',
        'priority',
    ]

    search_fields = [
        'name',
        'description',
    ]

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

        create_audit_log(
            request=self.request,
            action='CREATE',
            instance=project,
            description=f"Created project '{project.name}'."
        )

        recipients = [project.project_manager]

        employees = project.employees.filter(is_active=True)
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

    def perform_update(self, serializer):

        project = serializer.save()

        create_audit_log(
            request=self.request,
            action='UPDATE',
            instance=project,
            description=f"Updated project '{project.name}'."
        )

    def perform_destroy(self, instance):

        create_audit_log(
            request=self.request,
            action='DELETE',
            instance=instance,
            description=f"Deleted project '{instance.name}'."
        )

        super().perform_destroy(instance)


# Project Request ViewSet
class ProjectRequestViewSet(ModelViewSet):

    permission_classes = [ProjectRequestPermission]
    serializer_class = ProjectRequestSerializer

    http_method_names = ['get', 'post', 'head', 'options']

    def get_serializer_class(self):

        if self.action == 'review':
            return ProjectRequestReviewSerializer

        return ProjectRequestSerializer

    def get_queryset(self):

        user = self.request.user

        if user.role == "ADMIN":
            return ProjectRequest.objects.all().order_by('-created_at')

        if user.role == "CLIENT" and user.client:
            return ProjectRequest.objects.filter(
                client=user.client
            ).order_by('-created_at')

        return ProjectRequest.objects.none()

    def perform_create(self, serializer):

        project_request = serializer.save()

        create_audit_log(
            request=self.request,
            action='CREATE',
            instance=project_request,
            description=(
                f"Submitted project request "
                f"'{project_request.name}'."
            )
        )

    @action(detail=True, methods=['post'], url_path='review')
    def review(self, request, pk=None):

        project_request = self.get_object()

        # Already reviewed requests cannot be reviewed again
        if project_request.status not in [
            ProjectRequest.Status.PENDING,
            ProjectRequest.Status.NEEDS_INFORMATION,
        ]:
            return Response(
                {"detail": "This request has already been reviewed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        review_data = {
            'status': request.data.get('status'),
            'admin_feedback': request.data.get('admin_feedback', ''),
        }

        review_serializer = ProjectRequestReviewSerializer(
            project_request,
            data=review_data,
            partial=True
        )

        review_serializer.is_valid(raise_exception=True)

        new_status = review_serializer.validated_data['status']
        feedback = review_serializer.validated_data.get(
            'admin_feedback', ''
        )

        with transaction.atomic():

            # Approve request and create project
            if new_status == ProjectRequest.Status.APPROVED:

                manager_id = request.data.get('project_manager')

                if not manager_id:
                    return Response(
                        {
                            "project_manager":
                            "Please select a Project Manager."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                manager = User.objects.filter(
                    id=manager_id,
                    role=User.Role.PROJECT_MANAGER,
                    is_active=True
                ).first()

                if not manager:
                    return Response(
                        {
                            "project_manager":
                            "Invalid or inactive Project Manager."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                project = Project.objects.create(
                    name=project_request.name,
                    description=project_request.description,
                    client=project_request.client,
                    project_manager=manager,
                    start_date=project_request.expected_start_date,
                    deadline=project_request.expected_deadline,
                )

                project_request.project = project

                # Notify assigned Project Manager
                Notification.objects.create(
                    recipient=manager,
                    actor=request.user,
                    title="New Project Assigned",
                    message=(
                        f"You have been assigned to project "
                        f"'{project.name}'."
                    ),
                    notification_type=Notification.NotificationType.PROJECT
                )

                create_audit_log(
                    request=request,
                    action='CREATE',
                    instance=project,
                    description=(
                        f"Created project '{project.name}' "
                        f"from request #{project_request.id}."
                    )
                )

            # Save review decision
            project_request.status = new_status
            project_request.admin_feedback = feedback
            project_request.reviewed_by = request.user

            project_request.save()

            create_audit_log(
                request=request,
                action='UPDATE',
                instance=project_request,
                description=(
                    f"Reviewed project request "
                    f"'{project_request.name}' "
                    f"with status '{new_status}'."
                )
            )

            # Notify Client users belonging to this company
            client_users = User.objects.filter(
                client=project_request.client,
                role=User.Role.CLIENT,
                is_active=True
            )

            if new_status == ProjectRequest.Status.APPROVED:
                title = "Project Request Approved"
                message = (
                    f"Your project request '{project_request.name}' "
                    f"has been approved. Your project has been created."
                )

            elif new_status == ProjectRequest.Status.REJECTED:
                title = "Project Request Rejected"
                message = (
                    f"Your project request '{project_request.name}' "
                    f"was rejected. Admin feedback: {feedback}"
                )

            else:
                title = "More Information Required"
                message = (
                    f"Admin needs more information about your project "
                    f"request '{project_request.name}'. "
                    f"Feedback: {feedback}"
                )

            for client_user in client_users:

                Notification.objects.create(
                    recipient=client_user,
                    actor=request.user,
                    title=title,
                    message=message,
                    notification_type=Notification.NotificationType.PROJECT
                )

        return Response(
            {
                "message": "Project request reviewed successfully.",
                "request": ProjectRequestSerializer(
                    project_request
                ).data,
            },
            status=status.HTTP_200_OK
        )

    # Client Resubmit Additional Information
    @action(detail=True, methods=['post'], url_path='resubmit')
    def resubmit(self, request, pk=None):

        if request.user.role != "CLIENT":
            return Response(
                {"detail": "Only clients can resubmit requests."},
                status=status.HTTP_403_FORBIDDEN
            )

        project_request = self.get_object()

        # Only NEEDS_INFORMATION requests can be resubmitted
        if project_request.status != ProjectRequest.Status.NEEDS_INFORMATION:
            return Response(
                {
                    "detail":
                    "Only requests requiring more information can be resubmitted."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        additional_information = request.data.get(
            'additional_information', ''
        ).strip()

        if not additional_information:
            return Response(
                {
                    "additional_information":
                    "Please provide the requested information."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():

            # Preserve previous requirements
            project_request.requirements = (
                f"{project_request.requirements}\n\n"
                f"Additional Information:\n{additional_information}"
            ).strip()

            # Send request back to Admin review
            project_request.status = ProjectRequest.Status.PENDING
            project_request.admin_feedback = ""
            project_request.reviewed_by = None

            project_request.save()

            # Notify all active Admin users
            admins = User.objects.filter(
                role=User.Role.ADMIN,
                is_active=True
            )

            for admin in admins:

                Notification.objects.create(
                    recipient=admin,
                    actor=request.user,
                    title="Project Request Updated",
                    message=(
                        f"Client has provided additional information "
                        f"for project request '{project_request.name}'."
                    ),
                    notification_type=Notification.NotificationType.PROJECT
                )

            create_audit_log(
                request=request,
                action='UPDATE',
                instance=project_request,
                description=(
                    f"Client resubmitted project request "
                    f"'{project_request.name}' with additional information."
                )
            )

        return Response(
            {
                "message": "Additional information submitted successfully.",
                "request": ProjectRequestSerializer(
                    project_request
                ).data
            },
            status=status.HTTP_200_OK
        )
