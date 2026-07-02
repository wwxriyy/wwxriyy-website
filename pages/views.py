from django.shortcuts import render
from django.http import HttpResponse


def home(request):
    return render(
        request,
        "index.html",
        {
            "active_page": "home",
            "page_title": "Home",
            "terminal_command": "cd /home/wwxriyy",
        },
    )


def projects(request):
    return render(
        request,
        "projects.html",
        {
            "active_page": "projects",
            "page_title": "Projects",
            "terminal_command": "ls ~/projects",
        },
    )


def links(request):
    return render(
        request,
        "links.html",
        {
            "active_page": "links",
            "page_title": "Links",
            "terminal_command": "cat ~/links",
        },
    )


def healthz(request):
    return HttpResponse("ok", content_type="text/plain")
