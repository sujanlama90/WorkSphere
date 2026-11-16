
from rest_framework.permissions import BasePermission, SAFE_METHODS


class ProjectPermission(BasePermission):

    def has_permission(self, request, view):

        if not request.user.is_authenticated:
            return False

        # Everyone can read their permitted projects
        if request.method in SAFE_METHODS:
            return True

        # Only Admin and Project Manager can modify projects
        return request.user.role in [
            "ADMIN",
            "PROJECT_MANAGER"
        ]
