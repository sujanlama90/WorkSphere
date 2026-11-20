
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from django.urls import reverse

from audit_logs.models import AuditLog
from accounts.models import User


class AuditLogAPITestCase(APITestCase):

    def setUp(self):

        # Create users
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='Admin123!',
            role='ADMIN',
            is_active=True
        )

        self.manager = User.objects.create_user(
            username='manager',
            email='manager@example.com',
            password='Manager123!',
            role='PROJECT_MANAGER',
            is_active=True
        )

        self.employee = User.objects.create_user(
            username='employee',
            email='employee@example.com',
            password='Employee123!',
            role='EMPLOYEE',
            is_active=True
        )

        # Create sample audit logs
        self.admin_log = AuditLog.objects.create(
            user=self.admin,
            action='CREATE',
            model_name='Project',
            object_id='1',
            description='Created project.'
        )

        self.manager_log = AuditLog.objects.create(
            user=self.manager,
            action='UPDATE',
            model_name='Project',
            object_id='2',
            description='Updated project.'
        )

        self.employee_log = AuditLog.objects.create(
            user=self.employee,
            action='UPDATE',
            model_name='Task',
            object_id='3',
            description='Updated task.'
        )

        self.url = reverse('audit-log-list')

    def authenticate(self, user):

        refresh = RefreshToken.for_user(user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

    def test_admin_can_view_all_audit_logs(self):

        self.authenticate(self.admin)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)

    def test_manager_can_view_only_own_audit_logs(self):

        self.authenticate(self.manager)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(
            response.data['results'][0]['user'],
            self.manager.id
        )

    def test_employee_can_view_only_own_audit_logs(self):

        self.authenticate(self.employee)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(
            response.data['results'][0]['user'],
            self.employee.id
        )

    def test_unauthenticated_user_cannot_view_audit_logs(self):

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_audit_logs_are_read_only(self):

        self.authenticate(self.admin)

        response = self.client.post(
            self.url,
            {
                'action': 'CREATE',
                'model_name': 'Project',
                'description': 'Test log'
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED
        )
