from rest_framework.views import APIView
from rest_framework.response import Response

from .permissions import DashboardPermission
from django.utils import timezone
from clients.models import Client
from projects.models import Project
from tasks.models import Task
from accounts.models import User


class DashboardView(APIView):

    permission_classes = [DashboardPermission]

    def get(self, request):

        user = request.user

        # Admin Dashboard
        if user.role == 'ADMIN':

            projects = Project.objects.all()

            tasks = Task.objects.all()

            total_clients = Client.objects.count()

            total_employees = User.objects.filter(
                role='EMPLOYEE',
                is_active=True
            ).count()

            total_project_managers = User.objects.filter(
                role='PROJECT_MANAGER',
                is_active=True
            ).count()

        # Project Manager Dashboard
        elif user.role == 'PROJECT_MANAGER':

            projects = Project.objects.filter(
                project_manager=user
            )

            tasks = Task.objects.filter(
                project__project_manager=user
            )

            total_clients = projects.values(
                'client'
            ).distinct().count()

            total_employees = User.objects.filter(
                role='EMPLOYEE',
                is_active=True,
                assigned_projects__project_manager=user
            ).distinct().count()

            total_project_managers = 1

        # Employee Dashboard
        elif user.role == 'EMPLOYEE':

            projects = Project.objects.filter(
                employees=user
            )

            tasks = Task.objects.filter(
                assigned_to=user
            )

            total_clients = projects.values(
                'client'
            ).distinct().count()

            total_employees = 1

            total_project_managers = projects.values(
                'project_manager'
            ).distinct().count()

        # Client Dashboard
        elif user.role == 'CLIENT':

            projects = Project.objects.filter(
                client=user.client
            )

            tasks = Task.objects.filter(
                project__client=user.client
            )

            total_clients = 1

            total_employees = projects.filter(
                employees__is_active=True
            ).values(
                'employees'
            ).distinct().count()

            total_project_managers = projects.values(
                'project_manager'
            ).distinct().count()

        else:

            projects = Project.objects.none()
            tasks = Task.objects.none()

            total_clients = 0
            total_employees = 0
            total_project_managers = 0

        data = {
            "total_clients": total_clients,

            "total_projects": projects.count(),

            "active_projects": projects.filter(
                status="IN_PROGRESS"
            ).count(),

            "completed_projects": projects.filter(
                status="COMPLETED"
            ).count(),

            "total_tasks": tasks.count(),

            "pending_tasks": tasks.filter(
                status="TODO"
            ).count(),

            "in_progress_tasks": tasks.filter(
                status="IN_PROGRESS"
            ).count(),

            "overdue_tasks": tasks.filter(
                due_date__lt=timezone.localdate()
            ).exclude(
                status="COMPLETED"
            ).count(),

            "total_employees": total_employees,

            "total_project_managers": total_project_managers,
        }

        return Response(data)
