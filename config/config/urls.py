"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path,include

from django.urls import re_path
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="WorkSphere API",
        default_version='v1',
        description="""
        WorkSphere is a business workflow and team collaboration platform.

        Features:
        - User Authentication and Role-Based Access Control
        - Client and Project Management
        - Task Management
        - Comments, Attachments and Activity History
        - Support Ticket Management
        - Notifications
        - Dashboard and Reports
        """,
        contact=openapi.Contact(email="admin@worksphere.com"),
        securityDefinitions={
        'Bearer': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header',
            'description': 'Enter: Bearer <your_access_token>'
        }
    },
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/',include('accounts.urls')),
    path('api/clients/',include('clients.urls')),
    path('api/tickets/',include('tickets.urls')),
    path('api/core/',include('core.urls')),
    path('api/dashboard/',include('dashboard.urls')),
    path('api/notifications/',include('notifications.urls')),
    path('api/projects/',include('projects.urls')),
    path('api/tasks/',include('tasks.urls')),
    path('api/time-tracking/', include('time_tracking.urls')),
    path('api/audit-logs/', include('audit_logs.urls')),
    path('api/reports/', include('reports.urls')),
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
