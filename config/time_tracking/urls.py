from django.urls import path

from .views import (
    StartTimerView,
    StopTimerView,
    TimeHistoryView,
)

urlpatterns = [
    path('start/', StartTimerView.as_view(), name='start-timer'),
    path('stop/', StopTimerView.as_view(), name='stop-timer'),
    path('history/', TimeHistoryView.as_view(), name='time-history'),
]
