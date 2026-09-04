from django.shortcuts import render
from django.http import HttpResponse


def home(request):
    return render(
        request,
        "index.html",
        {
            "active_page": "home",
            "page_title": "home",
            "terminal_command": "cd /home/wwxriyy",
        },
    )


def projects(request):
    return render(
        request,
        "projects.html",
        {
            "active_page": "projects",
            "page_title": "projects",
            "terminal_command": "ls ~/projects",
        },
    )


def wezterm(request):
    return render(
        request,
        "wezterm.html",
        {
            "active_page": "wezterm",
            "page_title": "WezTerm Config",
            "terminal_command": "cat ~/.config/wezterm/wezterm.lua",
        },
    )


def nvim(request):
    return render(
        request,
        "nvim.html",
        {
            "active_page": "nvim",
            "page_title": "Neovim Config",
            "terminal_command": "nvim ~/.config/nvim/init.lua",
        },
    )


def healthz(request):
    return HttpResponse("ok", content_type="text/plain")