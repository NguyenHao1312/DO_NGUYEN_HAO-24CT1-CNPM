"""
student_management/views/pages.py
Render HTML pages — không có logic API.
"""
from django.shortcuts import render


def index(request):
    return render(request, 'index.html')


def review(request):
    return render(request, 'review.html')
