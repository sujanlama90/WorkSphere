from .models import AuditLog


def create_audit_log(request, action, instance, description):

    # Get user
    user = request.user if request.user.is_authenticated else None

    # Get IP address
    ip_address = request.META.get('REMOTE_ADDR')

    # Create audit log
    AuditLog.objects.create(
        user=user,
        action=action,
        model_name=instance.__class__.__name__,
        object_id=str(instance.pk),
        description=description,
        ip_address=ip_address
    )
