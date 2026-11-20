
from django.urls import reverse

from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import User
from notifications.models import Notification


class NotificationAPITestCase(APITestCase):

    def setUp(self):

        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="testpass123",
            role="ADMIN"
        )

        self.employee = User.objects.create_user(
            username="employee",
            email="employee@example.com",
            password="testpass123",
            role="EMPLOYEE"
        )

        self.manager = User.objects.create_user(
            username="manager",
            email="manager@example.com",
            password="testpass123",
            role="PROJECT_MANAGER"
        )

        self.notification = Notification.objects.create(
            recipient=self.employee,
            actor=self.admin,
            title="New Task Assigned",
            message="A new task has been assigned to you.",
            notification_type=Notification.NotificationType.TASK
        )

        self.other_notification = Notification.objects.create(
            recipient=self.manager,
            actor=self.admin,
            title="New Project Created",
            message="A new project has been created.",
            notification_type=Notification.NotificationType.PROJECT
        )

        self.notification_url = reverse('notifications-list')

        self.notification_detail_url = reverse(
            'notifications-detail',
            args=[self.notification.id]
        )

    def test_user_can_view_own_notifications(self):

        self.client.force_authenticate(self.employee)

        response = self.client.get(self.notification_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_user_cannot_view_other_users_notification(self):

        self.client.force_authenticate(self.employee)

        url = reverse(
            'notifications-detail',
            args=[self.other_notification.id]
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_user_cannot_see_other_users_notifications_in_list(self):

        self.client.force_authenticate(self.employee)

        response = self.client.get(self.notification_url)

        self.assertEqual(response.data['count'], 1)

        notification_ids = [
            item['id'] for item in response.data['results']
        ]

        self.assertNotIn(
            self.other_notification.id,
            notification_ids
        )

    def test_user_can_mark_notification_as_read(self):

        self.client.force_authenticate(self.employee)

        response = self.client.patch(
            self.notification_detail_url,
            {"is_read": True}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.notification.refresh_from_db()

        self.assertTrue(self.notification.is_read)

    def test_user_can_mark_notification_as_unread(self):

        self.notification.is_read = True
        self.notification.save()

        self.client.force_authenticate(self.employee)

        response = self.client.patch(
            self.notification_detail_url,
            {"is_read": False}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.notification.refresh_from_db()

        self.assertFalse(self.notification.is_read)

    def test_user_cannot_update_other_users_notification(self):

        self.client.force_authenticate(self.employee)

        url = reverse(
            'notifications-detail',
            args=[self.other_notification.id]
        )

        response = self.client.patch(
            url,
            {"is_read": True}
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_user_cannot_create_notification(self):

        self.client.force_authenticate(self.employee)

        data = {
            "title": "Test Notification",
            "message": "This should not be created.",
            "notification_type": "TASK",
            "is_read": False
        }

        response = self.client.post(self.notification_url, data)

        self.assertEqual(
            response.status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def test_user_cannot_delete_notification(self):

        self.client.force_authenticate(self.employee)

        response = self.client.delete(
            self.notification_detail_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def test_unauthenticated_user_cannot_view_notifications(self):

        response = self.client.get(self.notification_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_notification_search(self):

        self.client.force_authenticate(self.employee)

        response = self.client.get(
            self.notification_url,
            {"search": "Task"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_notification_filter_by_type(self):

        self.client.force_authenticate(self.employee)

        response = self.client.get(
            self.notification_url,
            {"notification_type": "TASK"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_notification_filter_by_read_status(self):

        self.notification.is_read = True
        self.notification.save()

        self.client.force_authenticate(self.employee)

        response = self.client.get(
            self.notification_url,
            {"is_read": "true"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_notification_ordering(self):

        Notification.objects.create(
            recipient=self.employee,
            actor=self.admin,
            title="Another Notification",
            message="Another test notification.",
            notification_type=Notification.NotificationType.COMMENT
        )

        self.client.force_authenticate(self.employee)

        response = self.client.get(
            self.notification_url,
            {"ordering": "title"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        titles = [
            item['title'] for item in response.data['results']
        ]

        self.assertEqual(titles, sorted(titles))
