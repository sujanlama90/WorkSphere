from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):

    actor = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'actor',
            'title',
            'message',
            'notification_type',
            'is_read',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'actor',
            'title',
            'message',
            'notification_type',
            'created_at',
        ]
