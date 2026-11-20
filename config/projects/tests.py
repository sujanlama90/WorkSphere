from datetime import date, timedelta

from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import User
from clients.models import Client
from .models import Project
from notifications.models import Notification
from audit_logs.models import AuditLog


class ProjectAPITestCase(APITestCase):

    def setUp(self):
        self.password = "WorkSphere@2026Strong"

        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password=self.password,
            role=User.Role.ADMIN,
            is_staff=True,
        )

        self.manager = User.objects.create_user(
            username="manager",
            email="manager@example.com",
            password=self.password,
            role=User.Role.PROJECT_MANAGER,
        )

        self.manager2 = User.objects.create_user(
            username="manager2",
            email="manager2@example.com",
            password=self.password,
            role=User.Role.PROJECT_MANAGER,
        )

        self.employee = User.objects.create_user(
            username="employee",
            email="employee@example.com",
            password=self.password,
            role=User.Role.EMPLOYEE,
        )

        self.employee2 = User.objects.create_user(
            username="employee2",
            email="employee2@example.com",
            password=self.password,
            role=User.Role.EMPLOYEE,
        )

        self.client_company = Client.objects.create(
            name="ABC Technologies",
            contact_person="Ram Sharma",
            email="ram@abc.com",
            phone="9800000000",
            address="Kathmandu, Nepal",
        )

        self.client_user = User.objects.create_user(
            username="clientuser",
            email="clientuser@example.com",
            password=self.password,
            role=User.Role.CLIENT,
            client=self.client_company,
        )

        self.other_company = Client.objects.create(
            name="XYZ Technologies",
            contact_person="Hari Sharma",
            email="hari@xyz.com",
            phone="9811111111",
            address="Pokhara, Nepal",
        )

        self.other_client_user = User.objects.create_user(
            username="otherclient",
            email="otherclient@example.com",
            password=self.password,
            role=User.Role.CLIENT,
            client=self.other_company,
        )

        self.project = Project.objects.create(
            name="WorkSphere Development",
            description="Develop WorkSphere backend",
            client=self.client_company,
            project_manager=self.manager,
            start_date=date.today(),
            deadline=date.today() + timedelta(days=30),
        )

        self.project.employees.add(self.employee)

        self.url = reverse('projects-list')

    def project_data(self, **overrides):
        data = {
            "name": "New Project",
            "description": "New project description",
            "client": self.client_company.id,
            "project_manager": self.manager.id,
            "employees": [self.employee.id],
            "start_date": str(date.today()),
            "deadline": str(date.today() + timedelta(days=30)),
            "priority": Project.Priority.HIGH,
        }

        data.update(overrides)
        return data

    # Create Tests

    def test_admin_can_create_project(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            self.url,
            self.project_data(),
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Project.objects.filter(name="New Project").exists()
        )

    def test_manager_can_create_own_project(self):
        self.client.force_authenticate(user=self.manager)

        response = self.client.post(
            self.url,
            self.project_data(),
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_manager_cannot_assign_project_to_another_manager(self):
        self.client.force_authenticate(user=self.manager)

        response = self.client.post(
            self.url,
            self.project_data(project_manager=self.manager2.id),
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_employee_cannot_create_project(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.post(
            self.url,
            self.project_data(),
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Read and Role-based Queryset Tests

    def test_admin_can_view_all_projects(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_manager_can_view_own_projects(self):
        self.client.force_authenticate(user=self.manager)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_employee_can_view_assigned_projects(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_client_can_view_own_company_projects(self):
        self.client.force_authenticate(user=self.client_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_client_cannot_view_other_company_projects(self):
        self.client.force_authenticate(user=self.other_client_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)

    # Update and Delete Tests

    def test_admin_can_update_project(self):
        self.client.force_authenticate(user=self.admin)

        url = reverse(
            'projects-detail',
            kwargs={'pk': self.project.id}
        )

        response = self.client.patch(
            url,
            {"name": "Updated Project"},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.project.refresh_from_db()
        self.assertEqual(self.project.name, "Updated Project")

    def test_employee_cannot_update_project(self):
        self.client.force_authenticate(user=self.employee)

        url = reverse(
            'projects-detail',
            kwargs={'pk': self.project.id}
        )

        response = self.client.patch(
            url,
            {"name": "Updated Project"},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_employee_cannot_delete_project(self):
        self.client.force_authenticate(user=self.employee)

        url = reverse(
            'projects-detail',
            kwargs={'pk': self.project.id}
        )

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Validation Tests

    def test_deadline_cannot_be_before_start_date(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            self.url,
            self.project_data(
                deadline=str(date.today() - timedelta(days=1))
            ),
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inactive_client_cannot_be_assigned(self):
        inactive_company = Client.objects.create(
            name="Inactive Company",
            contact_person="Test Person",
            email="inactive@example.com",
            phone="9822222222",
            address="Kathmandu",
            is_active=False,
        )

        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            self.url,
            self.project_data(client=inactive_company.id),
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_employee_cannot_be_assigned_as_employee(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            self.url,
            self.project_data(employees=[self.manager.id]),
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # Notification Test

    def test_project_creation_sends_notifications(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            self.url,
            self.project_data(),
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertTrue(
            Notification.objects.filter(
                recipient=self.manager,
                title="New Project Assigned",
            ).exists()
        )

        self.assertTrue(
            Notification.objects.filter(
                recipient=self.employee,
                title="New Project Assigned",
            ).exists()
        )

            # Audit Log Tests

    def test_project_creation_creates_audit_log(self):

        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            self.url,
            self.project_data(),
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        project = Project.objects.get(name="New Project")

        self.assertTrue(
            AuditLog.objects.filter(
                user=self.admin,
                action='CREATE',
                model_name='Project',
                object_id=str(project.id)
            ).exists()
        )

    def test_project_update_creates_audit_log(self):

        self.client.force_authenticate(user=self.admin)

        url = reverse(
            'projects-detail',
            kwargs={'pk': self.project.id}
        )

        response = self.client.patch(
            url,
            {"name": "Updated Project"},
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertTrue(
            AuditLog.objects.filter(
                user=self.admin,
                action='UPDATE',
                model_name='Project',
                object_id=str(self.project.id)
            ).exists()
        )

    def test_project_delete_creates_audit_log(self):

        self.client.force_authenticate(user=self.admin)

        project_id = self.project.id

        url = reverse(
            'projects-detail',
            kwargs={'pk': project_id}
        )

        response = self.client.delete(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT
        )

        self.assertFalse(
            Project.objects.filter(id=project_id).exists()
        )

        self.assertTrue(
            AuditLog.objects.filter(
                user=self.admin,
                action='DELETE',
                model_name='Project',
                object_id=str(project_id)
            ).exists()
        )