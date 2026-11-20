
from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile

from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import User
from clients.models import Client
from projects.models import Project
from tickets.models import Ticket, TicketComment, TicketAttachment,TicketPrioritySetting
from notifications.models import Notification


class TicketTestBase(APITestCase):

    def setUp(self):

        self.client_obj = Client.objects.create(
            name="ABC Company",
            contact_person="John",
            email="abc@example.com",
            phone="9800000000",
            address="Kathmandu",
            is_active=True
        )

        self.other_client_obj = Client.objects.create(
            name="XYZ Company",
            contact_person="David",
            email="xyz@example.com",
            phone="9800000001",
            address="Pokhara",
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

        self.other_manager = User.objects.create_user(
            username="manager2",
            email="manager2@example.com",
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

        self.other_client_user = User.objects.create_user(
            username="clientuser2",
            email="client2@example.com",
            password="testpass123",
            role="CLIENT",
            client=self.other_client_obj
        )

        today = timezone.localdate()

        self.project = Project.objects.create(
            name="Website Development",
            description="Develop company website",
            client=self.client_obj,
            project_manager=self.manager,
            start_date=today,
            deadline=today + timedelta(days=30)
        )

        self.project.employees.add(self.employee)

        self.other_project = Project.objects.create(
            name="Mobile Application",
            description="Develop mobile application",
            client=self.other_client_obj,
            project_manager=self.other_manager,
            start_date=today,
            deadline=today + timedelta(days=30)
        )

        self.other_project.employees.add(self.other_employee)

        self.ticket = Ticket.objects.create(
            project=self.project,
            title="Login Issue",
            description="Unable to login into the application.",
            created_by=self.client_user,
            assigned_to=self.employee
        )

        self.other_ticket = Ticket.objects.create(
            project=self.other_project,
            title="Payment Issue",
            description="Payment is not working.",
            created_by=self.other_client_user,
            assigned_to=self.other_employee
        )

        self.ticket_url = reverse('tickets-list')

        self.ticket_detail_url = reverse(
            'tickets-detail',
            args=[self.ticket.id]
        )

        self.comment_url = reverse('ticket-comments-list')

        self.attachment_url = reverse('ticket-attachments-list')


# ---------------- TICKET API TESTS ----------------

class TicketAPITestCase(TicketTestBase):

    def test_client_can_create_ticket_for_own_project(self):

        self.client.force_authenticate(self.client_user)

        data = {
            "project": self.project.id,
            "title": "New Support Request",
            "description": "I need help with my account."
        }

        response = self.client.post(self.ticket_url, data)

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        ticket = Ticket.objects.get(title="New Support Request")

        self.assertEqual(ticket.created_by, self.client_user)

        self.assertTrue(
            Notification.objects.filter(
                recipient=self.admin,
                title="New Support Ticket"
            ).exists()
        )

        self.assertTrue(
            Notification.objects.filter(
                recipient=self.manager,
                title="New Support Ticket"
            ).exists()
        )

    def test_client_cannot_create_ticket_for_other_company(self):

        self.client.force_authenticate(self.client_user)

        data = {
            "project": self.other_project.id,
            "title": "Unauthorized Ticket",
            "description": "This should not be allowed."
        }

        response = self.client.post(self.ticket_url, data)

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_client_cannot_assign_ticket(self):

        self.client.force_authenticate(self.client_user)

        data = {
            "project": self.project.id,
            "title": "Assigned Ticket",
            "description": "Client cannot assign ticket.",
            "assigned_to": self.employee.id
        }

        response = self.client.post(self.ticket_url, data)

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_project_manager_can_create_ticket_in_own_project(self):

        self.client.force_authenticate(self.manager)

        data = {
            "project": self.project.id,
            "title": "Manager Created Ticket",
            "description": "Created by project manager."
        }

        response = self.client.post(self.ticket_url, data)

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

    def test_project_manager_cannot_create_ticket_in_other_project(self):

        self.client.force_authenticate(self.manager)

        data = {
            "project": self.other_project.id,
            "title": "Unauthorized Ticket",
            "description": "Other manager project."
        }

        response = self.client.post(self.ticket_url, data)

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_employee_cannot_create_ticket(self):

        self.client.force_authenticate(self.employee)

        data = {
            "project": self.project.id,
            "title": "Employee Ticket",
            "description": "Employee cannot create ticket."
        }

        response = self.client.post(self.ticket_url, data)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_admin_can_view_all_tickets(self):

        self.client.force_authenticate(self.admin)

        response = self.client.get(self.ticket_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_project_manager_can_view_own_project_tickets(self):

        self.client.force_authenticate(self.manager)

        response = self.client.get(self.ticket_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_employee_can_view_assigned_tickets(self):

        self.client.force_authenticate(self.employee)

        response = self.client.get(self.ticket_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_client_can_view_own_company_tickets(self):

        self.client.force_authenticate(self.client_user)

        response = self.client.get(self.ticket_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_client_cannot_view_other_company_ticket(self):

        self.client.force_authenticate(self.client_user)

        url = reverse(
            'tickets-detail',
            args=[self.other_ticket.id]
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_employee_cannot_view_unassigned_ticket(self):

        self.client.force_authenticate(self.employee)

        url = reverse(
            'tickets-detail',
            args=[self.other_ticket.id]
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_admin_can_assign_ticket_to_employee(self):

        self.client.force_authenticate(self.admin)

        response = self.client.patch(
            self.ticket_detail_url,
            {"assigned_to": self.employee.id}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_can_assign_ticket_to_project_manager(self):

        self.client.force_authenticate(self.admin)

        response = self.client.patch(
            self.ticket_detail_url,
            {"assigned_to": self.manager.id}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_cannot_assign_unrelated_employee(self):

        self.client.force_authenticate(self.admin)

        response = self.client.patch(
            self.ticket_detail_url,
            {"assigned_to": self.other_employee.id}
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_employee_can_update_only_ticket_status(self):

        self.client.force_authenticate(self.employee)

        response = self.client.patch(
            self.ticket_detail_url,
            {"status": "IN_PROGRESS"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.ticket.refresh_from_db()

        self.assertEqual(self.ticket.status, "IN_PROGRESS")

        self.assertTrue(
            Notification.objects.filter(
                recipient=self.client_user,
                title="Ticket Status Updated"
            ).exists()
        )

    def test_employee_cannot_update_ticket_priority(self):

        self.client.force_authenticate(self.employee)

        response = self.client.patch(
            self.ticket_detail_url,
            {"priority": "HIGH"}
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_employee_cannot_update_multiple_fields(self):

        self.client.force_authenticate(self.employee)

        response = self.client.patch(
            self.ticket_detail_url,
            {
                "status": "IN_PROGRESS",
                "priority": "HIGH"
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_client_cannot_update_ticket(self):

        self.client.force_authenticate(self.client_user)

        response = self.client.patch(
            self.ticket_detail_url,
            {"status": "CLOSED"}
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_admin_can_delete_ticket(self):

        self.client.force_authenticate(self.admin)

        response = self.client.delete(self.ticket_detail_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT
        )

        self.assertFalse(
            Ticket.objects.filter(id=self.ticket.id).exists()
        )

    def test_ticket_search(self):

        self.client.force_authenticate(self.admin)

        response = self.client.get(
            self.ticket_url,
            {"search": "Login"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_ticket_filter_by_status(self):

        self.client.force_authenticate(self.admin)

        response = self.client.get(
            self.ticket_url,
            {"status": "OPEN"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)


# ---------------- TICKET COMMENT TESTS ----------------

class TicketCommentAPITestCase(TicketTestBase):

    def test_client_can_create_comment_on_own_ticket(self):

        self.client.force_authenticate(self.client_user)

        data = {
            "ticket": self.ticket.id,
            "message": "Please help me resolve this issue."
        }

        response = self.client.post(self.comment_url, data)

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        self.assertTrue(
            TicketComment.objects.filter(
                ticket=self.ticket,
                user=self.client_user
            ).exists()
        )

        self.assertTrue(
            Notification.objects.filter(
                recipient=self.manager,
                title="New Ticket Comment"
            ).exists()
        )

    def test_employee_can_comment_on_assigned_ticket(self):

        self.client.force_authenticate(self.employee)

        data = {
            "ticket": self.ticket.id,
            "message": "I am checking this issue."
        }

        response = self.client.post(self.comment_url, data)

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

    def test_project_manager_can_comment_on_own_ticket(self):

        self.client.force_authenticate(self.manager)

        data = {
            "ticket": self.ticket.id,
            "message": "We will investigate this issue."
        }

        response = self.client.post(self.comment_url, data)

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

    def test_admin_can_comment_on_any_ticket(self):

        self.client.force_authenticate(self.admin)

        data = {
            "ticket": self.other_ticket.id,
            "message": "Admin comment."
        }

        response = self.client.post(self.comment_url, data)

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

    def test_employee_cannot_comment_on_unassigned_ticket(self):

        self.client.force_authenticate(self.employee)

        data = {
            "ticket": self.other_ticket.id,
            "message": "Unauthorized comment."
        }

        response = self.client.post(self.comment_url, data)

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_empty_comment_is_rejected(self):

        self.client.force_authenticate(self.client_user)

        data = {
            "ticket": self.ticket.id,
            "message": "   "
        }

        response = self.client.post(self.comment_url, data)

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_comment_owner_can_update_comment(self):

        comment = TicketComment.objects.create(
            ticket=self.ticket,
            user=self.client_user,
            message="Original message"
        )

        self.client.force_authenticate(self.client_user)

        url = reverse(
            'ticket-comments-detail',
            args=[comment.id]
        )

        response = self.client.patch(
            url,
            {"message": "Updated message"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        comment.refresh_from_db()

        self.assertEqual(comment.message, "Updated message")

    def test_other_user_cannot_update_comment(self):

        comment = TicketComment.objects.create(
            ticket=self.ticket,
            user=self.client_user,
            message="Original message"
        )

        self.client.force_authenticate(self.employee)

        url = reverse(
            'ticket-comments-detail',
            args=[comment.id]
        )

        response = self.client.patch(
            url,
            {"message": "Unauthorized update"}
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_comment_owner_can_delete_comment(self):

        comment = TicketComment.objects.create(
            ticket=self.ticket,
            user=self.client_user,
            message="Delete this comment"
        )

        self.client.force_authenticate(self.client_user)

        url = reverse(
            'ticket-comments-detail',
            args=[comment.id]
        )

        response = self.client.delete(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT
        )

        self.assertFalse(
            TicketComment.objects.filter(id=comment.id).exists()
        )

    def test_client_cannot_comment_on_other_company_ticket(self):

        self.client.force_authenticate(self.client_user)

        data = {
            "ticket": self.other_ticket.id,
            "message": "Unauthorized comment"
        }

        response = self.client.post(self.comment_url, data)

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_client_can_view_own_ticket_comments(self):

        TicketComment.objects.create(
            ticket=self.ticket,
            user=self.client_user,
            message="My ticket comment"
        )

        TicketComment.objects.create(
            ticket=self.other_ticket,
            user=self.other_client_user,
            message="Other ticket comment"
        )

        self.client.force_authenticate(self.client_user)

        response = self.client.get(self.comment_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)


# ---------------- TICKET ATTACHMENT TESTS ----------------

class TicketAttachmentAPITestCase(TicketTestBase):

    def test_client_can_upload_attachment_to_own_ticket(self):

        self.client.force_authenticate(self.client_user)

        uploaded_file = SimpleUploadedFile(
            "document.txt",
            b"Ticket attachment content",
            content_type="text/plain"
        )

        data = {
            "ticket": self.ticket.id,
            "file": uploaded_file
        }

        response = self.client.post(
            self.attachment_url,
            data,
            format="multipart"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        self.assertTrue(
            TicketAttachment.objects.filter(
                ticket=self.ticket,
                uploaded_by=self.client_user
            ).exists()
        )

    def test_employee_can_upload_attachment_to_assigned_ticket(self):

        self.client.force_authenticate(self.employee)

        uploaded_file = SimpleUploadedFile(
            "employee.txt",
            b"Employee attachment",
            content_type="text/plain"
        )

        data = {
            "ticket": self.ticket.id,
            "file": uploaded_file
        }

        response = self.client.post(
            self.attachment_url,
            data,
            format="multipart"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

    def test_employee_cannot_upload_to_unassigned_ticket(self):

        self.client.force_authenticate(self.employee)

        uploaded_file = SimpleUploadedFile(
            "unauthorized.txt",
            b"Unauthorized content",
            content_type="text/plain"
        )

        data = {
            "ticket": self.other_ticket.id,
            "file": uploaded_file
        }

        response = self.client.post(
            self.attachment_url,
            data,
            format="multipart"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_admin_can_upload_attachment(self):

        self.client.force_authenticate(self.admin)

        uploaded_file = SimpleUploadedFile(
            "admin.txt",
            b"Admin attachment",
            content_type="text/plain"
        )

        data = {
            "ticket": self.ticket.id,
            "file": uploaded_file
        }

        response = self.client.post(
            self.attachment_url,
            data,
            format="multipart"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

    def test_attachment_owner_can_delete_attachment(self):

        attachment = TicketAttachment.objects.create(
            ticket=self.ticket,
            uploaded_by=self.client_user,
            file=SimpleUploadedFile(
                "test.txt",
                b"Test content"
            )
        )

        self.client.force_authenticate(self.client_user)

        url = reverse(
            'ticket-attachments-detail',
            args=[attachment.id]
        )

        response = self.client.delete(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT
        )

        self.assertFalse(
            TicketAttachment.objects.filter(id=attachment.id).exists()
        )

    def test_other_user_cannot_delete_attachment(self):

        attachment = TicketAttachment.objects.create(
            ticket=self.ticket,
            uploaded_by=self.client_user,
            file=SimpleUploadedFile(
                "test.txt",
                b"Test content"
            )
        )

        self.client.force_authenticate(self.employee)

        url = reverse(
            'ticket-attachments-detail',
            args=[attachment.id]
        )

        response = self.client.delete(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_client_cannot_upload_to_other_company_ticket(self):

        self.client.force_authenticate(self.client_user)

        uploaded_file = SimpleUploadedFile(
            "other.txt",
            b"Other company content",
            content_type="text/plain"
        )

        data = {
            "ticket": self.other_ticket.id,
            "file": uploaded_file
        }

        response = self.client.post(
            self.attachment_url,
            data,
            format="multipart"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )


# ---------------- TICKET PRIORITY & DEADLINE TESTS ----------------

class TicketPriorityDeadlineAPITestCase(TicketTestBase):

    def setUp(self):
        super().setUp()

        # Fixed settings for predictable tests
        default_settings = {
            'LOW': 96,
            'MEDIUM': 48,
            'HIGH': 24,
            'URGENT': 4,
        }

        for priority, hours in default_settings.items():
            TicketPrioritySetting.objects.update_or_create(
                priority=priority,
                defaults={
                    'deadline_hours': hours
                }
            )

        self.priority_settings_url = reverse(
            'ticket-priority-settings'
        )

    def test_ticket_deadline_calculated_for_all_priorities(self):

        self.client.force_authenticate(self.admin)

        priority_hours = {
            'LOW': 96,
            'MEDIUM': 48,
            'HIGH': 24,
            'URGENT': 4,
        }

        for priority, hours in priority_hours.items():

            with self.subTest(priority=priority):

                response = self.client.post(
                    self.ticket_url,
                    {
                        'project': self.project.id,
                        'title': f'{priority} Deadline Test',
                        'description': 'Testing automatic deadline.',
                        'priority': priority,
                    }
                )

                self.assertEqual(
                    response.status_code,
                    status.HTTP_201_CREATED
                )

                ticket = Ticket.objects.get(
                    id=response.data['id']
                )

                difference = (
                    ticket.deadline_at - ticket.created_at
                ).total_seconds()

                self.assertAlmostEqual(
                    difference,
                    hours * 3600,
                    delta=2
                )

    def test_default_medium_priority_deadline(self):

        self.client.force_authenticate(self.admin)

        response = self.client.post(
            self.ticket_url,
            {
                'project': self.project.id,
                'title': 'Default Priority Test',
                'description': 'Testing default priority.',
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        ticket = Ticket.objects.get(
            id=response.data['id']
        )

        self.assertEqual(ticket.priority, 'MEDIUM')

        difference = (
            ticket.deadline_at - ticket.created_at
        ).total_seconds()

        self.assertAlmostEqual(
            difference,
            48 * 3600,
            delta=2
        )

    def test_client_cannot_set_custom_deadline(self):

        self.client.force_authenticate(self.manager)

        custom_deadline = timezone.now() + timedelta(days=30)

        response = self.client.post(
            self.ticket_url,
            {
                'project': self.project.id,
                'title': 'Custom Deadline Test',
                'description': 'Testing read only deadline.',
                'priority': 'HIGH',
                'deadline_at': custom_deadline.isoformat(),
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        ticket = Ticket.objects.get(
            id=response.data['id']
        )

        self.assertNotEqual(
            ticket.deadline_at,
            custom_deadline
        )

        difference = (
            ticket.deadline_at - ticket.created_at
        ).total_seconds()

        self.assertAlmostEqual(
            difference,
            24 * 3600,
            delta=2
        )

    def test_priority_change_recalculates_deadline(self):

        self.client.force_authenticate(self.admin)

        old_priority = self.ticket.priority

        response = self.client.patch(
            self.ticket_detail_url,
            {
                'priority': 'HIGH'
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.ticket.refresh_from_db()

        self.assertNotEqual(
            self.ticket.priority,
            old_priority
        )

        self.assertEqual(
            self.ticket.priority,
            'HIGH'
        )

        difference = (
            self.ticket.deadline_at - self.ticket.updated_at
        ).total_seconds()

        self.assertAlmostEqual(
            difference,
            24 * 3600,
            delta=2
        )

    def test_deadline_does_not_change_when_priority_is_unchanged(self):

        self.client.force_authenticate(self.admin)

        old_deadline = self.ticket.deadline_at

        response = self.client.patch(
            self.ticket_detail_url,
            {
                'title': 'Updated Ticket Title'
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.ticket.refresh_from_db()

        self.assertEqual(
            self.ticket.deadline_at,
            old_deadline
        )

    def test_admin_can_view_priority_settings(self):

        self.client.force_authenticate(self.admin)

        response = self.client.get(
            self.priority_settings_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(
            response.data['count'],
            4
        )

    def test_project_manager_cannot_view_priority_settings(self):

        self.client.force_authenticate(self.manager)

        response = self.client.get(
            self.priority_settings_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_project_manager_cannot_update_priority_settings(self):

        setting = TicketPrioritySetting.objects.get(
            priority='LOW'
        )

        self.client.force_authenticate(self.manager)

        url = reverse(
            'ticket-priority-setting-update',
            args=[setting.id]
        )

        response = self.client.patch(
            url,
            {
                'deadline_hours': 120
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_admin_can_update_priority_deadline_setting(self):

        setting = TicketPrioritySetting.objects.get(
            priority='LOW'
        )

        self.client.force_authenticate(self.admin)

        url = reverse(
            'ticket-priority-setting-update',
            args=[setting.id]
        )

        response = self.client.patch(
            url,
            {
                'deadline_hours': 120
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        setting.refresh_from_db()

        self.assertEqual(
            setting.deadline_hours,
            120
        )
