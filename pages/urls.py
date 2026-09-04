from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("projects/", views.projects, name="projects"),
    path("wezterm/", views.wezterm, name="wezterm"),
    path("nvim/", views.nvim, name="nvim"),
    path("healthz/", views.healthz, name="healthz"),
]