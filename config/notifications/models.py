from django.db import models
from accounts.models import User


class Notification(models.Model):

    class NotificationType(models.TextChoices):
        TASK = 'TASK', 'Task'
        TICKET = 'TICKET', 'Ticket'
        COMMENT = 'COMMENT', 'Comment'
        PROJECT = 'PROJECT', 'Project'

    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )

    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_notifications'
    )

    title = models.CharField(max_length=255)

    message = models.TextField()

    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices
    )

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.recipient.username}"
