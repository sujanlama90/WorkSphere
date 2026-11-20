
from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile

from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import User
from clients.models import Client
from projects.models import Project
from tasks.models import Task, Comment, TaskAttachment, TaskActivity
from notifications.models import Notification
from audit_logs.models import AuditLog


class TaskAPITestCase(APITestCase):

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

        # Create another Project Manager
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

        # Create Task
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

        self.task_url = reverse('tasks-list')
        self.task_detail_url = reverse(
            'tasks-detail',
            args=[self.task.id]
        )

        self.comment_url = reverse('comments-list')
        self.attachment_url = reverse('attachments-list')
        self.activity_url = reverse('activities-list')

    def project_data(self, **overrides):
        data = {
            "project": self.project.id,
            "title": "New Task",
            "description": "New task description",
            "assigned_to": self.employee.id,
            "priority": "HIGH",
            "due_date": (
                timezone.localdate() + timedelta(days=7)
            ).isoformat()
        }

        data.update(overrides)
        return data

    # ---------------- TASK TESTS ----------------

    def test_admin_can_create_task(self):

        self.client.force_authenticate(self.admin)

        data = {
            "project": self.project.id,
            "title": "Create Dashboard API",
            "description": "Develop dashboard endpoint",
            "assigned_to": self.employee.id,
            "priority": "HIGH",
            "due_date": (
                timezone.localdate() + timedelta(days=7)
            ).isoformat()
        }

        response = self.client.post(
            self.task_url,
            data
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        task = Task.objects.get(title="Create Dashboard API")

        self.assertEqual(task.created_by, self.admin)

        self.assertTrue(
            TaskActivity.objects.filter(
                task=task,
                action="TASK_CREATED"
            ).exists()
        )

        self.assertTrue(
            Notification.objects.filter(
                recipient=self.employee,
                title="New Task Assigned"
            ).exists()
        )

    def test_project_manager_can_create_task_in_own_project(self):

        self.client.force_authenticate(self.manager)

        data = {
            "project": self.project.id,
            "title": "Create Profile API",
            "assigned_to": self.employee.id,
            "due_date": (
                timezone.localdate() + timedelta(days=5)
            ).isoformat()
        }

        response = self.client.post(self.task_url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_project_manager_cannot_create_task_in_other_project(self):

        self.client.force_authenticate(self.manager)

        data = {
            "project": self.other_project.id,
            "title": "Unauthorized Task",
            "assigned_to": self.other_employee.id,
            "due_date": (
                timezone.localdate() + timedelta(days=5)
            ).isoformat()
        }

        response = self.client.post(self.task_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_employee_cannot_create_task(self):

        self.client.force_authenticate(self.employee)

        data = {
            "project": self.project.id,
            "title": "Employee Task",
            "due_date": (
                timezone.localdate() + timedelta(days=5)
            ).isoformat()
        }

        response = self.client.post(self.task_url, data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_view_all_tasks(self):

        self.client.force_authenticate(self.admin)

        response = self.client.get(self.task_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_project_manager_can_view_own_tasks(self):

        self.client.force_authenticate(self.manager)

        response = self.client.get(self.task_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_employee_can_view_assigned_tasks(self):

        self.client.force_authenticate(self.employee)

        response = self.client.get(self.task_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_employee_cannot_view_unassigned_task(self):

        self.client.force_authenticate(self.employee)

        url = reverse(
            'tasks-detail',
            args=[self.other_task.id]
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_can_update_task(self):

        self.client.force_authenticate(self.admin)

        response = self.client.patch(
            self.task_detail_url,
            {"priority": "HIGH"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.task.refresh_from_db()

        self.assertEqual(self.task.priority, "HIGH")

        self.assertTrue(
            TaskActivity.objects.filter(
                task=self.task,
                action="PRIORITY_CHANGED"
            ).exists()
        )

    def test_employee_can_update_only_task_status(self):

        self.client.force_authenticate(self.employee)

        response = self.client.patch(
            self.task_detail_url,
            {"status": "IN_PROGRESS"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.task.refresh_from_db()

        self.assertEqual(self.task.status, "IN_PROGRESS")

    def test_employee_cannot_update_task_priority(self):

        self.client.force_authenticate(self.employee)

        response = self.client.patch(
            self.task_detail_url,
            {"priority": "HIGH"}
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_employee_cannot_update_task_assigned_to_other_employee(self):

        self.client.force_authenticate(self.employee)

        response = self.client.patch(
            self.task_detail_url,
            {"status": "IN_PROGRESS", "priority": "HIGH"}
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_due_date_cannot_be_in_past(self):

        self.client.force_authenticate(self.admin)

        data = {
            "project": self.project.id,
            "title": "Past Due Task",
            "due_date": (
                timezone.localdate() - timedelta(days=1)
            ).isoformat()
        }

        response = self.client.post(self.task_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_task_project_cannot_be_changed(self):

        self.client.force_authenticate(self.admin)

        response = self.client.patch(
            self.task_detail_url,
            {"project": self.other_project.id}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_task_search(self):

        self.client.force_authenticate(self.admin)

        response = self.client.get(
            self.task_url,
            {"search": "Login"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_task_filter_by_status(self):

        self.client.force_authenticate(self.admin)

        response = self.client.get(
            self.task_url,
            {"status": "TODO"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    # ---------------- TASK AUDIT LOG TESTS ----------------

    def test_task_creation_creates_audit_log(self):

        self.client.force_authenticate(self.admin)

        data = self.project_data(
            title="Audit Test Task"
        )

        response = self.client.post(
            self.task_url,
            data
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        task = Task.objects.get(title="Audit Test Task")

        self.assertTrue(
            AuditLog.objects.filter(
                user=self.admin,
                action='CREATE',
                model_name='Task',
                object_id=str(task.id)
            ).exists()
        )

    def test_task_update_creates_audit_log(self):

        self.client.force_authenticate(self.admin)

        response = self.client.patch(
            self.task_detail_url,
            {"priority": "HIGH"}
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertTrue(
            AuditLog.objects.filter(
                user=self.admin,
                action='UPDATE',
                model_name='Task',
                object_id=str(self.task.id)
            ).exists()
        )

    def test_task_delete_creates_audit_log(self):

        self.client.force_authenticate(self.admin)

        task_id = self.task.id

        response = self.client.delete(
            self.task_detail_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT
        )

        self.assertFalse(
            Task.objects.filter(id=task_id).exists()
        )

        self.assertTrue(
            AuditLog.objects.filter(
                user=self.admin,
                action='DELETE',
                model_name='Task',
                object_id=str(task_id)
            ).exists()
        )


class CommentAPITestCase(TaskAPITestCase):

    def test_employee_can_create_comment_on_assigned_task(self):

        self.client.force_authenticate(self.employee)

        data = {
            "task": self.task.id,
            "message": "Login API development started."
        }

        response = self.client.post(
            self.comment_url,
            data
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertTrue(
            Comment.objects.filter(
                task=self.task,
                user=self.employee
            ).exists()
        )

    def test_employee_cannot_comment_on_unassigned_task(self):

        self.client.force_authenticate(self.employee)

        data = {
            "task": self.other_task.id,
            "message": "Unauthorized comment"
        }

        response = self.client.post(
            self.comment_url,
            data
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_project_manager_can_create_comment_on_own_project(self):

        self.client.force_authenticate(self.manager)

        data = {
            "task": self.task.id,
            "message": "Please complete this task."
        }

        response = self.client.post(
            self.comment_url,
            data
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_client_can_comment_on_own_company_task(self):

        self.client.force_authenticate(self.client_user)

        data = {
            "task": self.task.id,
            "message": "Please provide an update."
        }

        response = self.client.post(
            self.comment_url,
            data
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_empty_comment_is_rejected(self):

        self.client.force_authenticate(self.employee)

        data = {
            "task": self.task.id,
            "message": "   "
        }

        response = self.client.post(
            self.comment_url,
            data
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_comment_owner_can_update_comment(self):

        comment = Comment.objects.create(
            task=self.task,
            user=self.employee,
            message="Original comment"
        )

        self.client.force_authenticate(self.employee)

        url = reverse(
            'comments-detail',
            args=[comment.id]
        )

        response = self.client.patch(
            url,
            {"message": "Updated comment"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        comment.refresh_from_db()

        self.assertEqual(comment.message, "Updated comment")

    def test_comment_owner_can_delete_comment(self):

        comment = Comment.objects.create(
            task=self.task,
            user=self.employee,
            message="Delete this comment"
        )

        self.client.force_authenticate(self.employee)

        url = reverse(
            'comments-detail',
            args=[comment.id]
        )

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.assertFalse(
            Comment.objects.filter(id=comment.id).exists()
        )

    def test_employee_can_view_only_assigned_task_comments(self):

        Comment.objects.create(
            task=self.task,
            user=self.employee,
            message="My task comment"
        )

        Comment.objects.create(
            task=self.other_task,
            user=self.other_employee,
            message="Other task comment"
        )

        self.client.force_authenticate(self.employee)

        response = self.client.get(self.comment_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    # ---------------- COMMENT AUDIT LOG TESTS ----------------

    def test_comment_creation_creates_audit_log(self):

        self.client.force_authenticate(self.employee)

        response = self.client.post(
            self.comment_url,
            {
                "task": self.task.id,
                "message": "Testing comment audit log"
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        comment = Comment.objects.get(
            task=self.task,
            user=self.employee,
            message="Testing comment audit log"
        )

        self.assertTrue(
            AuditLog.objects.filter(
                user=self.employee,
                action='CREATE',
                model_name='Comment',
                object_id=str(comment.id)
            ).exists()
        )

    def test_comment_update_creates_audit_log(self):

        comment = Comment.objects.create(
            task=self.task,
            user=self.employee,
            message="Original comment"
        )

        self.client.force_authenticate(self.employee)

        url = reverse(
            'comments-detail',
            args=[comment.id]
        )

        response = self.client.patch(
            url,
            {"message": "Updated comment"}
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertTrue(
            AuditLog.objects.filter(
                user=self.employee,
                action='UPDATE',
                model_name='Comment',
                object_id=str(comment.id)
            ).exists()
        )

    def test_comment_delete_creates_audit_log(self):

        comment = Comment.objects.create(
            task=self.task,
            user=self.employee,
            message="Comment to delete"
        )

        comment_id = comment.id

        self.client.force_authenticate(self.employee)

        url = reverse(
            'comments-detail',
            args=[comment_id]
        )

        response = self.client.delete(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT
        )

        self.assertTrue(
            AuditLog.objects.filter(
                user=self.employee,
                action='DELETE',
                model_name='Comment',
                object_id=str(comment_id)
            ).exists()
        )


class TaskAttachmentAPITestCase(TaskAPITestCase):

    def test_employee_can_upload_attachment_to_assigned_task(self):

        self.client.force_authenticate(self.employee)

        uploaded_file = SimpleUploadedFile(
            "document.txt",
            b"Task attachment content",
            content_type="text/plain"
        )

        data = {
            "task": self.task.id,
            "file": uploaded_file
        }

        response = self.client.post(
            self.attachment_url,
            data,
            format="multipart"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertTrue(
            TaskAttachment.objects.filter(
                task=self.task,
                uploaded_by=self.employee
            ).exists()
        )

    def test_employee_cannot_upload_to_unassigned_task(self):

        self.client.force_authenticate(self.employee)

        uploaded_file = SimpleUploadedFile(
            "document.txt",
            b"Unauthorized file",
            content_type="text/plain"
        )

        data = {
            "task": self.other_task.id,
            "file": uploaded_file
        }

        response = self.client.post(
            self.attachment_url,
            data,
            format="multipart"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_upload_attachment(self):

        self.client.force_authenticate(self.admin)

        uploaded_file = SimpleUploadedFile(
            "admin_file.txt",
            b"Admin uploaded file",
            content_type="text/plain"
        )

        data = {
            "task": self.task.id,
            "file": uploaded_file
        }

        response = self.client.post(
            self.attachment_url,
            data,
            format="multipart"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_attachment_owner_can_delete_attachment(self):

        attachment = TaskAttachment.objects.create(
            task=self.task,
            uploaded_by=self.employee,
            file=SimpleUploadedFile(
                "test.txt",
                b"Test content"
            )
        )

        self.client.force_authenticate(self.employee)

        url = reverse(
            'attachments-detail',
            args=[attachment.id]
        )

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.assertFalse(
            TaskAttachment.objects.filter(id=attachment.id).exists()
        )

    # ---------------- ATTACHMENT AUDIT LOG TESTS ----------------

    def test_attachment_creation_creates_audit_log(self):

        self.client.force_authenticate(self.employee)

        uploaded_file = SimpleUploadedFile(
            "audit_document.txt",
            b"Testing attachment audit log",
            content_type="text/plain"
        )

        response = self.client.post(
            self.attachment_url,
            {
                "task": self.task.id,
                "file": uploaded_file
            },
            format="multipart"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        attachment = TaskAttachment.objects.get(
            task=self.task,
            uploaded_by=self.employee
        )

        self.assertTrue(
            AuditLog.objects.filter(
                user=self.employee,
                action='CREATE',
                model_name='TaskAttachment',
                object_id=str(attachment.id)
            ).exists()
        )

    def test_attachment_delete_creates_audit_log(self):

        attachment = TaskAttachment.objects.create(
            task=self.task,
            uploaded_by=self.employee,
            file=SimpleUploadedFile(
                "delete_test.txt",
                b"Test content"
            )
        )

        attachment_id = attachment.id

        self.client.force_authenticate(self.employee)

        url = reverse(
            'attachments-detail',
            args=[attachment_id]
        )

        response = self.client.delete(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT
        )

        self.assertTrue(
            AuditLog.objects.filter(
                user=self.employee,
                action='DELETE',
                model_name='TaskAttachment',
                object_id=str(attachment_id)
            ).exists()
        )


class TaskActivityAPITestCase(TaskAPITestCase):

    def test_admin_can_view_all_activities(self):

        TaskActivity.objects.create(
            task=self.task,
            user=self.manager,
            action="TASK_CREATED",
            description="Task created"
        )

        TaskActivity.objects.create(
            task=self.other_task,
            user=self.other_manager,
            action="TASK_CREATED",
            description="Another task created"
        )

        self.client.force_authenticate(self.admin)

        response = self.client.get(self.activity_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_employee_can_view_assigned_task_activities(self):

        TaskActivity.objects.create(
            task=self.task,
            user=self.manager,
            action="TASK_CREATED",
            description="Task created"
        )

        TaskActivity.objects.create(
            task=self.other_task,
            user=self.other_manager,
            action="TASK_CREATED",
            description="Other task created"
        )

        self.client.force_authenticate(self.employee)

        response = self.client.get(self.activity_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_activity_api_is_read_only(self):

        self.client.force_authenticate(self.admin)

        data = {
            "task": self.task.id,
            "action": "TEST",
            "description": "Test activity"
        }

        response = self.client.post(
            self.activity_url,
            data
        )

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_activity_cannot_be_updated(self):

        activity = TaskActivity.objects.create(
            task=self.task,
            user=self.manager,
            action="TASK_CREATED",
            description="Task created"
        )

        self.client.force_authenticate(self.admin)

        url = reverse(
            'activities-detail',
            args=[activity.id]
        )

        response = self.client.patch(
            url,
            {"description": "Updated"}
        )

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
