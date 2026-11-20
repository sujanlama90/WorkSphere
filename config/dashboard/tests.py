
from datetime import timedelta

from django.urls import reverse
from django.utils import timezone

from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import User
from clients.models import Client
from projects.models import Project
from tasks.models import Task


class DashboardAPITestCase(APITestCase):

    def setUp(self):

        self.client_obj = Client.objects.create(
            name="ABC Company",
            contact_person="John",
            email="abc@example.com",
            phone="9800000000",
            address="Kathmandu",
            is_active=True
        )

        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="testpass123",
            role="ADMIN"
        )

        self.manager = User.objects.create_user(
            username="manager",
            email="manager@example.com",
            password="testpass123",
            role="PROJECT_MANAGER"
        )

        self.employee = User.objects.create_user(
            username="employee",
            email="employee@example.com",
            password="testpass123",
            role="EMPLOYEE"
        )

        self.client_user = User.objects.create_user(
            username="clientuser",
            email="client@example.com",
            password="testpass123",
            role="CLIENT",
            client=self.client_obj
        )

        today = timezone.localdate()

        self.project = Project.objects.create(
            name="Website Development",
            description="Develop company website",
            client=self.client_obj,
            project_manager=self.manager,
            start_date=today,
            deadline=today + timedelta(days=30),
            status="IN_PROGRESS"
        )

        self.completed_project = Project.objects.create(
            name="Mobile Application",
            description="Develop mobile application",
            client=self.client_obj,
            project_manager=self.manager,
            start_date=today - timedelta(days=30),
            deadline=today - timedelta(days=1),
            status="COMPLETED"
        )

        self.project.employees.add(self.employee)
        self.completed_project.employees.add(self.employee)

        self.task = Task.objects.create(
            project=self.project,
            title="Create Login API",
            description="Develop login endpoint",
            assigned_to=self.employee,
            created_by=self.manager,
            status="TODO",
            due_date=today + timedelta(days=5)
        )

        self.in_progress_task = Task.objects.create(
            project=self.project,
            title="Create Registration API",
            description="Develop registration endpoint",
            assigned_to=self.employee,
            created_by=self.manager,
            status="IN_PROGRESS",
            due_date=today + timedelta(days=10)
        )

        self.overdue_task = Task.objects.create(
            project=self.project,
            title="Fix Old Bug",
            description="Fix overdue bug",
            assigned_to=self.employee,
            created_by=self.manager,
            status="IN_PROGRESS",
            due_date=today - timedelta(days=2)
        )

        self.completed_task = Task.objects.create(
            project=self.completed_project,
            title="Complete Mobile API",
            description="Completed task",
            assigned_to=self.employee,
            created_by=self.manager,
            status="COMPLETED",
            due_date=today - timedelta(days=5)
        )

        self.url = reverse('dashboard')

    def test_admin_can_view_dashboard(self):

        self.client.force_authenticate(self.admin)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(response.data['total_clients'], 1)
        self.assertEqual(response.data['total_projects'], 2)
        self.assertEqual(response.data['active_projects'], 1)
        self.assertEqual(response.data['completed_projects'], 1)
        self.assertEqual(response.data['total_tasks'], 4)
        self.assertEqual(response.data['pending_tasks'], 1)
        self.assertEqual(response.data['in_progress_tasks'], 2)
        self.assertEqual(response.data['overdue_tasks'], 1)
        self.assertEqual(response.data['total_employees'], 1)
        self.assertEqual(response.data['total_project_managers'], 1)

    def test_project_manager_can_view_own_dashboard(self):

        self.client.force_authenticate(self.manager)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(response.data['total_projects'], 2)
        self.assertEqual(response.data['total_tasks'], 4)
        self.assertEqual(response.data['total_clients'], 1)
        self.assertEqual(response.data['total_employees'], 1)
        self.assertEqual(response.data['total_project_managers'], 1)

    def test_employee_can_view_own_dashboard(self):

        self.client.force_authenticate(self.employee)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(response.data['total_projects'], 2)
        self.assertEqual(response.data['total_tasks'], 4)
        self.assertEqual(response.data['total_clients'], 1)
        self.assertEqual(response.data['total_employees'], 1)
        self.assertEqual(response.data['total_project_managers'], 1)

    def test_client_can_view_own_dashboard(self):

        self.client.force_authenticate(self.client_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(response.data['total_projects'], 2)
        self.assertEqual(response.data['total_tasks'], 4)
        self.assertEqual(response.data['total_clients'], 1)
        self.assertEqual(response.data['total_employees'], 1)
        self.assertEqual(response.data['total_project_managers'], 1)

    def test_unauthenticated_user_cannot_view_dashboard(self):

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_dashboard_returns_all_required_fields(self):

        self.client.force_authenticate(self.admin)

        response = self.client.get(self.url)

        expected_fields = [
            'total_clients',
            'total_projects',
            'active_projects',
            'completed_projects',
            'total_tasks',
            'pending_tasks',
            'in_progress_tasks',
            'overdue_tasks',
            'total_employees',
            'total_project_managers',
        ]

        self.assertEqual(
            set(response.data.keys()),
            set(expected_fields)
        )

    def test_dashboard_only_allows_get_request(self):

        self.client.force_authenticate(self.admin)

        response = self.client.post(self.url, {})

        self.assertEqual(
            response.status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED
        )
