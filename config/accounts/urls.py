from rest_framework.routers import DefaultRouter
from django.urls import path,include
from .views import RegisterView,LoginView,UserProfileView,ChangePasswordView,UserViewSet

router = DefaultRouter()
router.register('users', UserViewSet, basename='users')
urlpatterns = [
    path('register/',RegisterView.as_view(),name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/',UserProfileView.as_view(),name='profile'),
    path('change-password/',ChangePasswordView.as_view(),name='change-password'),
]

urlpatterns += router.urls