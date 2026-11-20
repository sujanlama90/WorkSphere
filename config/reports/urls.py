from django.urls import path
from .views import (ProjectReportExportView,TaskReportExportView,)

urlpatterns = [
    path('projects/',ProjectReportExportView.as_view(),name='export-projects-report'),
    path('tasks/',TaskReportExportView.as_view(),name='export-tasks-report'),
]
