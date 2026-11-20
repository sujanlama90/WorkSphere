import csv

from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from projects.models import Project
from tasks.models import Task


class ProjectReportExportView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user

        if user.role == 'ADMIN':
            projects = Project.objects.all()

        elif user.role == 'PROJECT_MANAGER':
            projects = Project.objects.filter(
                project_manager=user
            )

        else:
            raise PermissionDenied(
                "You do not have permission to export projects."
            )

        response = HttpResponse(
            content_type='text/csv'
        )

        response['Content-Disposition'] = (
            'attachment; filename="projects_report.csv"'
        )

        writer = csv.writer(response)

        writer.writerow([
            'ID',
            'Project Name',
            'Client',
            'Project Manager',
            'Status',
            'Priority',
            'Start Date',
            'Deadline',
        ])

        for project in projects:

            writer.writerow([
                project.id,
                project.name,
                project.client.name,
                project.project_manager.username,
                project.status,
                project.priority,
                project.start_date,
                project.deadline,
            ])

        return response


class TaskReportExportView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user

        if user.role == 'ADMIN':
            tasks = Task.objects.all()

        elif user.role == 'PROJECT_MANAGER':
            tasks = Task.objects.filter(
                project__project_manager=user
            )

        else:
            raise PermissionDenied(
                "You do not have permission to export tasks."
            )

        response = HttpResponse(
            content_type='text/csv'
        )

        response['Content-Disposition'] = (
            'attachment; filename="tasks_report.csv"'
        )

        writer = csv.writer(response)

        writer.writerow([
            'ID',
            'Task Title',
            'Project',
            'Assigned To',
            'Created By',
            'Status',
            'Priority',
            'Due Date',
        ])

        for task in tasks:

            writer.writerow([
                task.id,
                task.title,
                task.project.name,
                task.assigned_to.username if task.assigned_to else '',
                task.created_by.username,
                task.status,
                task.priority,
                task.due_date,
            ])

        return response
