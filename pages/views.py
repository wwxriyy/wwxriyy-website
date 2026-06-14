from django.shortcuts import render
from django.http import HttpResponse


def home(request):
    return render(request, "index.html")


def healthz(request):
    return HttpResponse("ok", content_type="text/plain")
