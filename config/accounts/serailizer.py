from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password]
    )

    confirm_password = serializers.CharField(
        write_only=True
    )

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'password',
            'confirm_password',
            'phone',
        ]

        read_only_fields = ['id']

    def validate_email(self, value):
        value = value.strip().lower()

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "This email is already registered."
            )

        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': "Passwords do not match."
            })

        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')

        user = User.objects.create_user(
            role=User.Role.CLIENT,
            **validated_data
        )

        return user


class LoginSerializer(TokenObtainPairSerializer):
    pass

class UserProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'phone',
            'role',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'username',
            'role',
            'created_at',
        ]

    def validate_email(self, value):
        value = value.strip().lower()

        if User.objects.filter(
            email__iexact=value
        ).exclude(pk=self.instance.pk).exists():

            raise serializers.ValidationError(
                "This email is already registered."
            )

        return value

from django.contrib.auth.password_validation import validate_password


class ChangePasswordSerializer(serializers.Serializer):

    old_password = serializers.CharField(write_only=True)

    new_password = serializers.CharField(
        write_only=True,
        validators=[validate_password]
    )

    confirm_new_password = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        user = self.context['request'].user

        if not user.check_password(value):
            raise serializers.ValidationError(
                "Old password is incorrect."
            )

        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError({
                'confirm_new_password': "New passwords do not match."
            })

        if attrs['old_password'] == attrs['new_password']:
            raise serializers.ValidationError({
                'new_password': "New password must be different from old password."
            })

        return attrs

    def save(self, **kwargs):
        user = self.context['request'].user

        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])

        return user


class UserManagementSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'phone',
            'role',
            'client',
            'is_active',
            'date_joined',
        ]

        read_only_fields = [
            'id',
            'username',
            'date_joined',
        ]

    def validate_client(self, value):
        if value and not value.is_active:
            raise serializers.ValidationError(
                "Cannot assign an inactive company."
            )

        return value

    def validate(self, attrs):
        role = attrs.get(
            'role',
            self.instance.role if self.instance else None
        )

        client = attrs.get(
            'client',
            self.instance.client if self.instance else None
        )

        if role != User.Role.CLIENT and client is not None:
            raise serializers.ValidationError({
                'client': 'Only Client users can be assigned to a company.'
            })

        return attrs
