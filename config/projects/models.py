from django.db import models
from clients.models import Client
from accounts.models import User


class Project(models.Model):

    class Status(models.TextChoices):
        PLANNING = 'PLANNING', 'Planning'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        ON_HOLD = 'ON_HOLD', 'On Hold'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class Priority(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'
        URGENT = 'URGENT', 'Urgent'

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    client = models.ForeignKey(
        Client,
        on_delete=models.PROTECT,
        related_name='projects'
    )

    project_manager = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='managed_projects',
        limit_choices_to={'role': 'PROJECT_MANAGER'}
    )

    employees = models.ManyToManyField(
        User,
        blank=True,
        related_name='assigned_projects',
        limit_choices_to={'role': 'EMPLOYEE'}
    )

    start_date = models.DateField()
    deadline = models.DateField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PLANNING
    )

    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ProjectRequest(models.Model):

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        NEEDS_INFORMATION = 'NEEDS_INFORMATION', 'Needs Information'

    client = models.ForeignKey(
        Client,
        on_delete=models.PROTECT,
        related_name='project_requests'
    )

    name = models.CharField(max_length=255)
    description = models.TextField()
    requirements = models.TextField(blank=True)

    expected_start_date = models.DateField()
    expected_deadline = models.DateField()

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.PENDING
    )

    admin_feedback = models.TextField(blank=True)

    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_project_requests'
    )

    project = models.OneToOneField(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='source_request'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.client.name}"
