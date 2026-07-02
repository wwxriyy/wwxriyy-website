from django.urls import path

from pages.views import healthz, home, links, projects


urlpatterns = [
    path("", home, name="home"),
    path("projects/", projects, name="projects"),
    path("links/", links, name="links"),
    path("healthz/", healthz, name="healthz"),
]
