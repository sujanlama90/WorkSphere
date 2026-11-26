from rest_framework.permissions import BasePermission, SAFE_METHODS


class ProjectPermission(BasePermission):

    def has_permission(self, request, view):

        if not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return True

        return request.user.role in [
            "ADMIN",
            "PROJECT_MANAGER"
        ]


class ProjectRequestPermission(BasePermission):

    def has_permission(self, request, view):

        if not request.user.is_authenticated:
            return False

        user_role = request.user.role

        if user_role == "ADMIN":
            return True

        if user_role == "CLIENT":

            if request.method in SAFE_METHODS:
                return True

            return view.action in ["create", "resubmit"]

        return False
