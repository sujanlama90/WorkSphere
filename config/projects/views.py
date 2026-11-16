from rest_framework.viewsets import ModelViewSet
from .models import Project
from .serializers import ProjectSerializer
from .permissions import ProjectPermission

class ProjectViewSet(ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [ProjectPermission]
    def get_queryset(self):
        user = self.request.user
        if user.role == "ADMIN":
            return Project.objects.all().order_by('-created_at')

        if user.role == "PROJECT_MANAGER":
            return Project.objects.filter(
                project_manager=user
            ).order_by('-created_at')

        if user.role == "EMPLOYEE":
            return Project.objects.filter(
                employees=user
            ).order_by('-created_at')

        if user.role == "CLIENT":
            return Project.objects.filter(
                client=user.client
            ).order_by('-created_at')

        return Project.objects.none()
