from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet,ProjectRequestViewSet

router = DefaultRouter()
router.register('requests',ProjectRequestViewSet,basename='project-requests')
router.register('', ProjectViewSet, basename='projects')

urlpatterns = router.urls