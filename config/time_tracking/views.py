from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db import IntegrityError, transaction

from .models import TimeEntry
from .serializers import TimeEntrySerializer
from tasks.models import Task


class StartTimerView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        task_id = request.data.get('task')

        if not task_id:
            return Response(
                {'error': 'Task ID is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get task
        try:
            task = Task.objects.get(id=task_id)
        except (Task.DoesNotExist, ValueError, TypeError):
            return Response(
                {'error': 'Task not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        user = request.user

        # Role-based permission check
        if user.role == 'ADMIN':
            pass

        elif user.role == 'PROJECT_MANAGER':
            if task.project.project_manager_id != user.id:
                return Response(
                    {'error': 'You do not have permission for this task.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        elif user.role == 'EMPLOYEE':
            if task.assigned_to_id != user.id:
                return Response(
                    {'error': 'You do not have permission for this task.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        else:
            return Response(
                {'error': 'You do not have permission to track time.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if timer is already running
        running_timer = TimeEntry.objects.filter(
            user=user,
            end_time__isnull=True
        ).first()

        if running_timer:
            return Response(
                {'error': 'You already have a running timer.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Start timer with database protection
        try:
            with transaction.atomic():

                time_entry = TimeEntry.objects.create(
                    task=task,
                    user=user,
                    description=request.data.get('description', ''),
                    start_time=timezone.now()
                )

        except IntegrityError:
            return Response(
                {'error': 'You already have a running timer.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = TimeEntrySerializer(time_entry)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

class StopTimerView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        time_entry_id = request.data.get('time_entry')
        if not time_entry_id:
            return Response(
                {'error': 'Time entry ID is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get running timer belonging to logged-in user
        try:
            time_entry = TimeEntry.objects.get(
                id=time_entry_id,
                user=request.user,
                end_time__isnull=True
            )
        except (TimeEntry.DoesNotExist, ValueError, TypeError):
            return Response(
                {'error': 'Running timer not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Stop timer
        time_entry.end_time = timezone.now()

        # Calculate total duration
        time_entry.duration = (
            time_entry.end_time - time_entry.start_time
        )

        time_entry.save()

        serializer = TimeEntrySerializer(time_entry)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )


class TimeHistoryView(generics.ListAPIView):

    serializer_class = TimeEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        if user.role == 'ADMIN':
            return TimeEntry.objects.all().order_by('-created_at')

        elif user.role == 'PROJECT_MANAGER':
            return TimeEntry.objects.filter(
                task__project__project_manager=user
            ).order_by('-created_at')

        elif user.role == 'EMPLOYEE':
            return TimeEntry.objects.filter(
                user=user
            ).order_by('-created_at')

        return TimeEntry.objects.none()
