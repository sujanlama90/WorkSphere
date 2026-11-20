
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import User
from .models import Client


class ClientAPITestCase(APITestCase):

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

        self.company = Client.objects.create(
            name="ABC Technologies",
            contact_person="Ram Sharma",
            email="ram@abc.com",
            phone="9800000000",
            address="Kathmandu, Nepal",
            description="Software company",
        )

        self.url = reverse('clients-list')

    # Create Tests

    def test_admin_can_create_client(self):
        self.client.force_authenticate(user=self.admin)

        data = {
            "name": "XYZ Technologies",
            "contact_person": "Hari Sharma",
            "email": "hari@xyz.com",
            "phone": "9811111111",
            "address": "Pokhara, Nepal",
            "description": "IT company",
        }

        response = self.client.post(self.url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Client.objects.filter(name="XYZ Technologies").exists()
        )

    def test_manager_can_create_client(self):
        self.client.force_authenticate(user=self.manager)

        data = {
            "name": "New Company",
            "contact_person": "Sita",
            "email": "sita@company.com",
            "phone": "9822222222",
            "address": "Lalitpur, Nepal",
        }

        response = self.client.post(self.url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_employee_cannot_create_client(self):
        self.client.force_authenticate(user=self.employee)

        data = {
            "name": "Test Company",
            "contact_person": "Test Person",
            "email": "test@company.com",
            "phone": "9800000000",
            "address": "Kathmandu",
        }

        response = self.client.post(self.url, data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Read Tests

    def test_admin_can_view_clients(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_manager_can_view_clients(self):
        self.client.force_authenticate(user=self.manager)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_employee_cannot_view_clients(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_user_cannot_view_clients(self):
        self.client.force_authenticate(user=self.client_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Update Tests

    def test_manager_can_update_client(self):
        self.client.force_authenticate(user=self.manager)

        url = reverse(
            'clients-detail',
            kwargs={'pk': self.company.id}
        )

        response = self.client.patch(url, {
            "name": "Updated ABC Technologies"
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.company.refresh_from_db()
        self.assertEqual(self.company.name, "Updated ABC Technologies")

    def test_employee_cannot_update_client(self):
        self.client.force_authenticate(user=self.employee)

        url = reverse(
            'clients-detail',
            kwargs={'pk': self.company.id}
        )

        response = self.client.patch(url, {
            "name": "Updated Company"
        })

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Delete Tests

    def test_manager_cannot_delete_client(self):
        self.client.force_authenticate(user=self.manager)

        url = reverse(
            'clients-detail',
            kwargs={'pk': self.company.id}
        )

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.assertTrue(
            Client.objects.filter(id=self.company.id).exists()
        )

    def test_admin_can_delete_client(self):
        self.client.force_authenticate(user=self.admin)

        url = reverse(
            'clients-detail',
            kwargs={'pk': self.company.id}
        )

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.assertFalse(
            Client.objects.filter(id=self.company.id).exists()
        )

    # Search, Filter and Ordering Tests

    def test_search_clients(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(self.url, {'search': 'ABC'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_filter_inactive_clients(self):
        Client.objects.create(
            name="Inactive Company",
            contact_person="Test Person",
            email="inactive@company.com",
            phone="9800000000",
            address="Kathmandu",
            is_active=False,
        )

        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            self.url,
            {'is_active': 'false'}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_ordering_clients_by_name(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            self.url,
            {'ordering': 'name'}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        names = [
            item['name']
            for item in response.data['results']
        ]

        self.assertEqual(names, sorted(names))
