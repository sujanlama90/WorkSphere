from rest_framework import serializers
from .models import TimeEntry


class TimeEntrySerializer(serializers.ModelSerializer):

    class Meta:
        model = TimeEntry
        fields = [
            'id',
            'task',
            'user',
            'description',
            'start_time',
            'end_time',
            'duration',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'user',
            'end_time',
            'duration',
            'created_at',
            'updated_at',
        ]
