from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager
from clients.models import Client

class CustomUserManager(UserManager):

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("role", "ADMIN")

        return super().create_superuser(
            username,
            email,
            password,
            **extra_fields
        )


class User(AbstractUser):

    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        PROJECT_MANAGER = 'PROJECT_MANAGER', 'Project Manager'
        EMPLOYEE = 'EMPLOYEE', 'Employee'
        CLIENT = 'CLIENT', 'Client'

    email = models.EmailField(unique=True)

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.EMPLOYEE
    )

    phone = models.CharField(
        max_length=15,
        blank=True,
        null=True
    )
    client = models.ForeignKey(
    Client,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='users'
)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    def __str__(self):
        return f"{self.username} ({self.role})"
