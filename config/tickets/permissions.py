from rest_framework.permissions import BasePermission, SAFE_METHODS


class TicketPermission(BasePermission):

    def has_permission(self, request, view):

        user = request.user

        if not user.is_authenticated:
            return False

        # Admin can access all ticket actions
        if user.role == 'ADMIN':
            return True

        # Project Manager can access ticket actions
        if user.role == 'PROJECT_MANAGER':
            return True

        # Client can only view and create tickets
        if user.role == 'CLIENT':
            return view.action in ['list', 'retrieve', 'create']

        # Employee can view and update tickets
        if user.role == 'EMPLOYEE':
            return view.action in [
                'list',
                'retrieve',
                'partial_update'
            ]

        return False

    def has_object_permission(self, request, view, obj):

        user = request.user

        # Admin can access all tickets
        if user.role == 'ADMIN':
            return True

        # Project Manager can access own project tickets
        if user.role == 'PROJECT_MANAGER':
            return obj.project.project_manager == user

        # Employee can access assigned tickets
        if user.role == 'EMPLOYEE':

            if obj.assigned_to != user:
                return False

            if request.method in SAFE_METHODS:
                return True

            # Employee can only update ticket status
            if request.method == 'PATCH':
                return set(request.data.keys()) == {'status'}

            return False

        # Client can only view own company tickets
        if user.role == 'CLIENT':
            return (
                user.client is not None
                and obj.project.client == user.client
                and request.method in SAFE_METHODS
            )

        return False


class TicketCommentPermission(BasePermission):

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):

        user = request.user

        # Admin can access all comments
        if user.role == 'ADMIN':
            return True

        # Project Manager can access own project comments
        if user.role == 'PROJECT_MANAGER':
            allowed = obj.ticket.project.project_manager == user

        # Employee can access assigned ticket comments
        elif user.role == 'EMPLOYEE':
            allowed = obj.ticket.assigned_to == user

        # Client can access own company ticket comments
        elif user.role == 'CLIENT':
            allowed = (
                user.client is not None
                and obj.ticket.project.client == user.client
            )

        else:
            return False

        if not allowed:
            return False

        # Everyone with access can view comments
        if request.method in SAFE_METHODS:
            return True

        # Only comment author can edit or delete
        return obj.user == user


class TicketAttachmentPermission(BasePermission):

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.role == 'ADMIN':
            return True

        if user.role == 'PROJECT_MANAGER':
            allowed = obj.ticket.project.project_manager == user

        elif user.role == 'EMPLOYEE':
            allowed = obj.ticket.assigned_to == user

        elif user.role == 'CLIENT':
            allowed = (
                user.client is not None
                and obj.ticket.project.client == user.client
            )

        else:
            return False

        if not allowed:
            return False

        if request.method in SAFE_METHODS:
            return True

        if request.method in ['PUT', 'PATCH', 'DELETE']:
            return obj.uploaded_by == user

        return False
