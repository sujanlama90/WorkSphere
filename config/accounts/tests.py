
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from .models import User


class AccountsAPITestCase(APITestCase):

    def setUp(self):

        self.password = "WorkSphere@2026Strong"

        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password=self.password,
            role=User.Role.EMPLOYEE,
        )

        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password=self.password,
            role=User.Role.ADMIN,
            is_staff=True,
        )

    # -------------------------
    # Registration Tests
    # -------------------------

    def test_user_registration_success(self):

        url = reverse('register')

        data = {
            "username": "newuser",
            "email": "new@example.com",
            "first_name": "New",
            "last_name": "User",
            "password": self.password,
            "confirm_password": self.password,
            "phone": "9800000000",
        }

        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(username="newuser")

        self.assertEqual(user.role, User.Role.CLIENT)
        self.assertTrue(user.check_password(self.password))

    def test_duplicate_email_registration(self):

        url = reverse('register')

        data = {
            "username": "anotheruser",
            "email": "test@example.com",
            "password": self.password,
            "confirm_password": self.password,
        }

        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_mismatch_registration(self):

        url = reverse('register')

        data = {
            "username": "newuser2",
            "email": "new2@example.com",
            "password": self.password,
            "confirm_password": "DifferentPassword@123",
        }

        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------
    # Login Tests
    # -------------------------

    def test_login_success(self):

        url = reverse('login')

        data = {
            "username": "testuser",
            "password": self.password,
        }

        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_invalid_password(self):

        url = reverse('login')

        data = {
            "username": "testuser",
            "password": "WrongPassword123!",
        }

        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_inactive_user_cannot_login(self):

        self.user.is_active = False
        self.user.save()

        url = reverse('login')

        data = {
            "username": "testuser",
            "password": self.password,
        }

        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # -------------------------
    # Profile Tests
    # -------------------------

    def test_user_can_view_own_profile(self):

        self.client.force_authenticate(user=self.user)

        url = reverse('profile')

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')

    def test_user_can_update_own_profile(self):

        self.client.force_authenticate(user=self.user)

        url = reverse('profile')

        data = {
            "first_name": "Updated",
            "last_name": "Name",
        }

        response = self.client.patch(url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()

        self.assertEqual(self.user.first_name, "Updated")

    def test_unauthenticated_user_cannot_view_profile(self):

        url = reverse('profile')

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # -------------------------
    # Change Password Tests
    # -------------------------

    def test_change_password_success(self):

        self.client.force_authenticate(user=self.user)

        url = reverse('change-password')

        new_password = "NewWorkSphere@2026Strong"

        data = {
            "old_password": self.password,
            "new_password": new_password,
            "confirm_new_password": new_password,
        }

        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()

        self.assertTrue(self.user.check_password(new_password))

    def test_change_password_wrong_old_password(self):

        self.client.force_authenticate(user=self.user)

        url = reverse('change-password')

        data = {
            "old_password": "WrongPassword123!",
            "new_password": "NewWorkSphere@2026Strong",
            "confirm_new_password": "NewWorkSphere@2026Strong",
        }

        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_mismatch(self):

        self.client.force_authenticate(user=self.user)

        url = reverse('change-password')

        data = {
            "old_password": self.password,
            "new_password": "NewWorkSphere@2026Strong",
            "confirm_new_password": "DifferentPassword@2026",
        }

        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserManagementAPITestCase(APITestCase):

    def setUp(self):
        self.password = "WorkSphere@2026Strong"

        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password=self.password,
            role=User.Role.ADMIN,
            is_staff=True,
        )

        self.employee = User.objects.create_user(
            username="employee",
            email="employee@example.com",
            password=self.password,
            role=User.Role.EMPLOYEE,
        )

        self.client_user = User.objects.create_user(
            username="clientuser",
            email="client@example.com",
            password=self.password,
            role=User.Role.CLIENT,
        )

    def test_admin_can_view_users(self):
        self.client.force_authenticate(user=self.admin)

        url = reverse('users-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_employee_cannot_view_users(self):
        self.client.force_authenticate(user=self.employee)

        url = reverse('users-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_update_user_role(self):
        self.client.force_authenticate(user=self.admin)

        url = reverse('users-detail', kwargs={'pk': self.employee.id})
        data = {"role": User.Role.PROJECT_MANAGER}

        response = self.client.patch(url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.employee.refresh_from_db()
        self.assertEqual(self.employee.role, User.Role.PROJECT_MANAGER)

    def test_admin_cannot_deactivate_own_account(self):
        self.client.force_authenticate(user=self.admin)

        url = reverse('users-detail', kwargs={'pk': self.admin.id})
        response = self.client.patch(url, {"is_active": False})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_cannot_change_own_role(self):
        self.client.force_authenticate(user=self.admin)

        url = reverse('users-detail', kwargs={'pk': self.admin.id})
        response = self.client.patch(
            url,
            {"role": User.Role.EMPLOYEE}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_cannot_delete_last_active_admin(self):
        self.client.force_authenticate(user=self.admin)

        url = reverse('users-detail', kwargs={'pk': self.admin.id})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_cannot_delete_superuser(self):
        superuser = User.objects.create_superuser(
            username="superadmin",
            email="superadmin@example.com",
            password=self.password,
        )

        self.client.force_authenticate(user=self.admin)

        url = reverse('users-detail', kwargs={'pk': superuser.id})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

