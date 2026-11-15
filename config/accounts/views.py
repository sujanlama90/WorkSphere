from rest_framework.generics import CreateAPIView
from rest_framework.generics import GenericAPIView
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework import status
from rest_framework.permissions import IsAuthenticated,IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView
from .serailizer import RegisterSerializer,LoginSerializer,UserProfileSerializer,ChangePasswordSerializer,UserManagementSerializer
from .models import User


# Create your views here.

class RegisterView(CreateAPIView):
    serializer_class = RegisterSerializer

class LoginView(TokenObtainPairView):
    serializer_class=LoginSerializer

class UserProfileView(RetrieveUpdateAPIView):
    serializer_class=UserProfileSerializer
    permission_classes=[IsAuthenticated]

    def get_object(self):
        return self.request.user

class ChangePasswordView(GenericAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes=[IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"message": "Password changed successfully."},
            status=status.HTTP_200_OK
        )
class UserViewSet(ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserManagementSerializer
    permission_classes = [IsAdminUser]

    def perform_update(self, serializer):
        user = self.get_object()
        new_data = serializer.validated_data

        # Admin cannot deactivate own account
        if user == self.request.user:
            if new_data.get('is_active') is False:
                raise ValidationError(
                    "You cannot deactivate your own account."
                )

            if new_data.get('role') and new_data['role'] != User.Role.ADMIN:
                raise ValidationError(
                    "You cannot change your own Admin role."
                )

        # Protect the last active Admin
        if (
            user.role == User.Role.ADMIN
            and user.is_active
            and (
                new_data.get('is_active') is False
                or (
                    'role' in new_data
                    and new_data['role'] != User.Role.ADMIN
                )
            )
        ):
            active_admins = User.objects.filter(
                role=User.Role.ADMIN,
                is_active=True
            ).count()

            if active_admins <= 1:
                raise ValidationError(
                    "You cannot deactivate or change the role "
                    "of the last active Admin."
                )

        serializer.save()

    def perform_destroy(self, instance):
        # Prevent deleting superuser
        if instance.is_superuser:
            raise ValidationError(
                "Superuser account cannot be deleted."
            )

        # Protect the last active Admin
        if instance.role == User.Role.ADMIN and instance.is_active:
            active_admins = User.objects.filter(
                role=User.Role.ADMIN,
                is_active=True
            ).count()

            if active_admins <= 1:
                raise ValidationError(
                    "You cannot delete the last active Admin."
                )

        self.perform_delete(instance)

    def perform_delete(self, instance):
        instance.delete()