"""
student_management/views/user/pages.py
Render public HTML pages (Student & Teacher portal).
"""
from django.shortcuts import render


def index(request):
    """Render trang chủ ứng dụng SPA."""
    return render(request, 'index.html')


def review(request):
    """Render trang Cổng thông tin đánh giá / tuyển sinh & đăng nhập người dùng."""
    return render(request, 'review.html')
