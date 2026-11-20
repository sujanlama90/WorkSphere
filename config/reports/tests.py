import csv
from datetime import date
from io import StringIO

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from accounts.models import User
from clients.models import Client
from projects.models import Project
from tasks.models import Task


class ReportExportAPITestCase(APITestCase):

    def setUp(self):

        self.api_client = APIClient()

        # Users
        self.admin = User.objects.create_user(
            username='admin_report',
            email='admin_report@test.com',
            password='testpass123',
            role='ADMIN'
        )

        self.manager = User.objects.create_user(
            username='manager_report',
            email='manager_report@test.com',
            password='testpass123',
            role='PROJECT_MANAGER'
        )

        self.other_manager = User.objects.create_user(
            username='other_manager',
            email='other_manager@test.com',
            password='testpass123',
            role='PROJECT_MANAGER'
        )

        self.employee = User.objects.create_user(
            username='employee_report',
            email='employee_report@test.com',
            password='testpass123',
            role='EMPLOYEE'
        )

        self.client_user = User.objects.create_user(
            username='client_report',
            email='client_report@test.com',
            password='testpass123',
            role='CLIENT'
        )

        # Client
        self.company = Client.objects.create(
            name='ABC Technologies',
            contact_person='John',
            email='abc@test.com',
            phone='9800000000',
            address='Kathmandu',
            description='Test company'
        )

        # Projects
        self.project1 = Project.objects.create(
            name='Project One',
            description='First project',
            client=self.company,
            project_manager=self.manager,
            start_date=date(2026, 11, 20),
            deadline=date(2026, 12, 20),
            status='IN_PROGRESS',
            priority='HIGH'
        )

        self.project2 = Project.objects.create(
            name='Project Two',
            description='Second project',
            client=self.company,
            project_manager=self.other_manager,
            start_date=date(2026, 11, 20),
            deadline=date(2026, 12, 30),
            status='PLANNING',
            priority='MEDIUM'
        )

        # Tasks
        self.task1 = Task.objects.create(
            project=self.project1,
            title='Task One',
            description='First task',
            assigned_to=self.employee,
            created_by=self.manager,
            status='TODO',
            priority='HIGH',
            due_date=date(2026, 12, 10)
        )

        self.task2 = Task.objects.create(
            project=self.project2,
            title='Task Two',
            description='Second task',
            assigned_to=self.employee,
            created_by=self.other_manager,
            status='IN_PROGRESS',
            priority='MEDIUM',
            due_date=date(2026, 12, 15)
        )

        self.projects_url = reverse(
            'export-projects-report'
        )

        self.tasks_url = reverse(
            'export-tasks-report'
        )

    def authenticate(self, user):

        self.api_client.force_authenticate(
            user=user
        )

    def get_csv_rows(self, response):

        content = response.content.decode('utf-8')

        return list(
            csv.reader(StringIO(content))
        )

    # PROJECT REPORT TESTS

    def test_admin_can_export_all_projects(self):

        self.authenticate(self.admin)

        response = self.api_client.get(
            self.projects_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        rows = self.get_csv_rows(response)

        self.assertEqual(len(rows), 3)

        project_ids = [
            row[0] for row in rows[1:]
        ]

        self.assertIn(
            str(self.project1.id),
            project_ids
        )

        self.assertIn(
            str(self.project2.id),
            project_ids
        )

    def test_manager_can_export_own_projects(self):

        self.authenticate(self.manager)

        response = self.api_client.get(
            self.projects_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        rows = self.get_csv_rows(response)

        project_ids = [
            row[0] for row in rows[1:]
        ]

        self.assertIn(
            str(self.project1.id),
            project_ids
        )

        self.assertNotIn(
            str(self.project2.id),
            project_ids
        )

    def test_employee_cannot_export_projects(self):

        self.authenticate(self.employee)

        response = self.api_client.get(
            self.projects_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_client_cannot_export_projects(self):

        self.authenticate(self.client_user)

        response = self.api_client.get(
            self.projects_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    # TASK REPORT TESTS

    def test_admin_can_export_all_tasks(self):

        self.authenticate(self.admin)

        response = self.api_client.get(
            self.tasks_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        rows = self.get_csv_rows(response)

        self.assertEqual(len(rows), 3)

        task_ids = [
            row[0] for row in rows[1:]
        ]

        self.assertIn(
            str(self.task1.id),
            task_ids
        )

        self.assertIn(
            str(self.task2.id),
            task_ids
        )

    def test_manager_can_export_own_project_tasks(self):

        self.authenticate(self.manager)

        response = self.api_client.get(
            self.tasks_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        rows = self.get_csv_rows(response)

        task_ids = [
            row[0] for row in rows[1:]
        ]

        self.assertIn(
            str(self.task1.id),
            task_ids
        )

        self.assertNotIn(
            str(self.task2.id),
            task_ids
        )

    def test_employee_cannot_export_tasks(self):

        self.authenticate(self.employee)

        response = self.api_client.get(
            self.tasks_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_client_cannot_export_tasks(self):

        self.authenticate(self.client_user)

        response = self.api_client.get(
            self.tasks_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    # AUTHENTICATION TESTS

    def test_unauthenticated_user_cannot_export_projects(self):

        response = self.api_client.get(
            self.projects_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_unauthenticated_user_cannot_export_tasks(self):

        response = self.api_client.get(
            self.tasks_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )
