from django.urls import path

from pages.views import healthz, home, projects


urlpatterns = [
    path("", home, name="home"),
    path("projects/", projects, name="projects"),
    path("healthz/", healthz, name="healthz"),
]
