from rest_framework.permissions import BasePermission, SAFE_METHODS


class TaskPermission(BasePermission):

    def has_permission(self, request, view):

        if not request.user.is_authenticated:
            return False

        if request.user.role == 'ADMIN':
            return True

        if request.user.role == 'PROJECT_MANAGER':
            return True

        if request.user.role == 'EMPLOYEE':
            return view.action in [
                'list',
                'retrieve',
                'partial_update'
            ]

        # Client can only view tasks
        if request.user.role == 'CLIENT':
            return view.action in [
                'list',
                'retrieve'
            ]

        return False

    def has_object_permission(self, request, view, obj):

        user = request.user

        # Admin can do everything
        if user.role == 'ADMIN':
            return True

        # Project Manager can manage tasks in own projects
        if user.role == 'PROJECT_MANAGER':
            return obj.project.project_manager == user

        # Employee can view and update only assigned tasks
        if user.role == 'EMPLOYEE':

            if obj.assigned_to != user:
                return False

            if request.method in SAFE_METHODS:
                return True

            # Employee can only update task status
            if request.method in ['PUT', 'PATCH']:
                return set(request.data.keys()) == {'status'}

            return False

        # Client can only view tasks of own company
        if user.role == 'CLIENT':

            if request.method not in SAFE_METHODS:
                return False

            return (
                user.client is not None
                and obj.project.client == user.client
            )

        return False


class CommentPermission(BasePermission):

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):

        user = request.user

        # Admin can manage all comments
        if user.role == 'ADMIN':
            return True

        # Check whether user can access this task
        if user.role == 'PROJECT_MANAGER':
            allowed = obj.task.project.project_manager == user

        elif user.role == 'EMPLOYEE':
            allowed = obj.task.assigned_to == user

        elif user.role == 'CLIENT':
            allowed = (
                user.client is not None
                and obj.task.project.client == user.client
            )

        else:
            return False

        if not allowed:
            return False

        # Everyone with task access can view comments
        if request.method in SAFE_METHODS:
            return True

        # Only comment owner can edit or delete
        return obj.user == user

class TaskAttachmentPermission(BasePermission):

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):

        user = request.user

        if user.role == 'ADMIN':
            return True

        if user.role == 'PROJECT_MANAGER':
            allowed = obj.task.project.project_manager == user

        elif user.role == 'EMPLOYEE':
            allowed = obj.task.assigned_to == user

        elif user.role == 'CLIENT':
            allowed = (
                user.client is not None
                and obj.task.project.client == user.client
            )

        else:
            return False

        if not allowed:
            return False

        if request.method in SAFE_METHODS:
            return True

        return obj.uploaded_by == user



class TaskActivityPermission(BasePermission):

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):

        user = request.user

        # Admin can view all activities
        if user.role == 'ADMIN':
            return True

        # Project Manager: own projects only
        if user.role == 'PROJECT_MANAGER':
            return obj.task.project.project_manager == user

        # Employee: assigned tasks only
        if user.role == 'EMPLOYEE':
            return obj.task.assigned_to == user

        # Client: own company projects only
        if user.role == 'CLIENT':
            return (
                user.client is not None
                and obj.task.project.client == user.client
            )

        return False
