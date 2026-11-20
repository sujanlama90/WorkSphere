from django.db.models.signals import post_migrate
from django.dispatch import receiver

from .models import TicketPrioritySetting

@receiver(post_migrate)
def create_default_ticket_priority_settings(sender, **kwargs):

    if sender.name != 'tickets':
        return

    default_settings = [
        ('LOW', 72),
        ('MEDIUM', 48),
        ('HIGH', 24),
        ('URGENT', 4),
    ]

    for priority, hours in default_settings:

        TicketPrioritySetting.objects.get_or_create(
            priority=priority,
            defaults={
                'deadline_hours': hours
            }
        )
