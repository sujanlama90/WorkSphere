
from datetime import timedelta

from django.urls import reverse
from django.utils import timezone

from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import User
from clients.models import Client
from projects.models import Project
from tasks.models import Task
from time_tracking.models import TimeEntry


class TimeTrackingAPITestCase(APITestCase):

    def setUp(self):

        # Create Client
        self.client_obj = Client.objects.create(
            name="ABC Company",
            contact_person="John",
            email="abc@example.com",
            phone="9800000000",
            address="Kathmandu",
            is_active=True
        )

        # Create Users
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

        self.other_employee = User.objects.create_user(
            username="employee2",
            email="employee2@example.com",
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

        self.other_manager = User.objects.create_user(
            username="manager2",
            email="manager2@example.com",
            password="testpass123",
            role="PROJECT_MANAGER"
        )

        today = timezone.localdate()

        # Create Project
        self.project = Project.objects.create(
            name="Website Development",
            description="Develop company website",
            client=self.client_obj,
            project_manager=self.manager,
            start_date=today,
            deadline=today + timedelta(days=30)
        )

        self.project.employees.add(self.employee)

        # Create another Project
        self.other_project = Project.objects.create(
            name="Mobile App",
            description="Develop mobile application",
            client=self.client_obj,
            project_manager=self.other_manager,
            start_date=today,
            deadline=today + timedelta(days=30)
        )

        self.other_project.employees.add(self.other_employee)

        # Create Tasks
        self.task = Task.objects.create(
            project=self.project,
            title="Create Login API",
            description="Develop login endpoint",
            assigned_to=self.employee,
            created_by=self.manager,
            due_date=today + timedelta(days=5)
        )

        self.other_task = Task.objects.create(
            project=self.other_project,
            title="Create Registration API",
            description="Develop registration endpoint",
            assigned_to=self.other_employee,
            created_by=self.other_manager,
            due_date=today + timedelta(days=10)
        )

        self.start_url = reverse('start-timer')
        self.stop_url = reverse('stop-timer')
        self.history_url = reverse('time-history')

    # ---------------- START TIMER TESTS ----------------

    def test_admin_can_start_timer(self):

        self.client.force_authenticate(self.admin)

        response = self.client.post(
            self.start_url,
            {
                "task": self.task.id,
                "description": "Working on login API"
            }
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertTrue(
            TimeEntry.objects.filter(
                user=self.admin,
                task=self.task,
                end_time__isnull=True
            ).exists()
        )

    def test_project_manager_can_start_timer_on_own_project(self):

        self.client.force_authenticate(self.manager)

        response = self.client.post(
            self.start_url,
            {"task": self.task.id}
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_project_manager_cannot_start_timer_on_other_project(self):

        self.client.force_authenticate(self.manager)

        response = self.client.post(
            self.start_url,
            {"task": self.other_task.id}
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_employee_can_start_timer_on_assigned_task(self):

        self.client.force_authenticate(self.employee)

        response = self.client.post(
            self.start_url,
            {"task": self.task.id}
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_employee_cannot_start_timer_on_unassigned_task(self):

        self.client.force_authenticate(self.employee)

        response = self.client.post(
            self.start_url,
            {"task": self.other_task.id}
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_cannot_start_timer(self):

        self.client.force_authenticate(self.client_user)

        response = self.client.post(
            self.start_url,
            {"task": self.task.id}
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_task_id_is_required(self):

        self.client.force_authenticate(self.employee)

        response = self.client.post(
            self.start_url,
            {}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_task_id_returns_404(self):

        self.client.force_authenticate(self.employee)

        response = self.client.post(
            self.start_url,
            {"task": 9999}
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_cannot_start_second_running_timer(self):

        self.client.force_authenticate(self.employee)

        first_response = self.client.post(
            self.start_url,
            {"task": self.task.id}
        )

        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)

        second_response = self.client.post(
            self.start_url,
            {"task": self.task.id}
        )

        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)

        self.assertEqual(
            TimeEntry.objects.filter(
                user=self.employee,
                end_time__isnull=True
            ).count(),
            1
        )

    # ---------------- STOP TIMER TESTS ----------------

    def test_user_can_stop_own_running_timer(self):

        time_entry = TimeEntry.objects.create(
            task=self.task,
            user=self.employee,
            start_time=timezone.now() - timedelta(hours=2)
        )

        self.client.force_authenticate(self.employee)

        response = self.client.post(
            self.stop_url,
            {"time_entry": time_entry.id}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        time_entry.refresh_from_db()

        self.assertIsNotNone(time_entry.end_time)
        self.assertIsNotNone(time_entry.duration)

        self.assertGreater(time_entry.duration.total_seconds(), 0)

    def test_user_cannot_stop_other_users_timer(self):

        time_entry = TimeEntry.objects.create(
            task=self.task,
            user=self.employee,
            start_time=timezone.now()
        )

        self.client.force_authenticate(self.other_employee)

        response = self.client.post(
            self.stop_url,
            {"time_entry": time_entry.id}
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_cannot_stop_already_stopped_timer(self):

        time_entry = TimeEntry.objects.create(
            task=self.task,
            user=self.employee,
            start_time=timezone.now() - timedelta(hours=1),
            end_time=timezone.now(),
            duration=timedelta(hours=1)
        )

        self.client.force_authenticate(self.employee)

        response = self.client.post(
            self.stop_url,
            {"time_entry": time_entry.id}
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_time_entry_id_is_required(self):

        self.client.force_authenticate(self.employee)

        response = self.client.post(
            self.stop_url,
            {}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ---------------- TIME HISTORY TESTS ----------------

    def test_admin_can_view_all_time_entries(self):

        TimeEntry.objects.create(
            task=self.task,
            user=self.employee,
            start_time=timezone.now()
        )

        TimeEntry.objects.create(
            task=self.other_task,
            user=self.other_employee,
            start_time=timezone.now()
        )

        self.client.force_authenticate(self.admin)

        response = self.client.get(self.history_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_project_manager_can_view_own_project_time_entries(self):

        TimeEntry.objects.create(
            task=self.task,
            user=self.employee,
            start_time=timezone.now()
        )

        TimeEntry.objects.create(
            task=self.other_task,
            user=self.other_employee,
            start_time=timezone.now()
        )

        self.client.force_authenticate(self.manager)

        response = self.client.get(self.history_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_employee_can_view_own_time_entries(self):

        TimeEntry.objects.create(
            task=self.task,
            user=self.employee,
            start_time=timezone.now()
        )

        TimeEntry.objects.create(
            task=self.other_task,
            user=self.other_employee,
            start_time=timezone.now()
        )

        self.client.force_authenticate(self.employee)

        response = self.client.get(self.history_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_client_cannot_view_time_history(self):

        self.client.force_authenticate(self.client_user)

        response = self.client.get(self.history_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
