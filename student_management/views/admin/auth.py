"""
student_management/views/admin/auth.py
Trang xác thực dành riêng cho Quản trị viên (Admin Portal).
Chỉ hoạt động nội bộ (localhost / mạng nội bộ quản trị).
"""
import uuid
import json
from django.shortcuts import render, redirect
from django.http import HttpResponseRedirect, JsonResponse
from django.utils import timezone
from student_management.models import CustomUser


from student_management.security_utils import get_client_ip


def _get_client_ip(request):
    """Lấy IP client an toàn từ security_utils."""
    return get_client_ip(request)


def admin_login_page(request):
    """
    Trang đăng nhập dành riêng cho Admin:
    - GET: Hiển thị giao diện login hoặc tự chuyển hướng vào Dashboard nếu đã đăng nhập.
    - POST: Xác thực tài khoản Admin, cấp session token, thiết lập HttpOnly cookie.
    """
    next_url = request.GET.get('next', '/admin/dashboard/')

    # 1. Kiểm tra session hiện có (tự động chuyển hướng nếu đã là admin)
    existing_token = request.COOKIES.get('session_token', '').strip() or request.META.get('HTTP_X_SESSION_TOKEN', '').strip()
    if existing_token:
        try:
            current_user = CustomUser.objects.get(session_token=existing_token)
            if current_user.role == 'admin':
                return redirect(next_url)
        except CustomUser.DoesNotExist:
            pass

    # 2. Xử lý GET request
    if request.method == 'GET':
        error_code = request.GET.get('error', '')
        error_msg = ''
        if error_code == 'role':
            error_msg = 'Tài khoản của bạn không có quyền quản trị viên (Admin).'
        elif error_code == 'session_expired':
            error_msg = 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.'
        return render(request, 'admin/login.html', {'error': error_msg, 'next': next_url})

    # 3. Xử lý POST request (hỗ trợ cả Form submit và AJAX/Fetch)
    if request.method == 'POST':
        is_ajax = (
            request.headers.get('x-requested-with') == 'XMLHttpRequest' or
            request.content_type == 'application/json'
        )

        if request.content_type == 'application/json':
            try:
                payload = json.loads(request.body)
                username = payload.get('username', '').strip()
                password = payload.get('password', '')
            except Exception:
                username = ''
                password = ''
        else:
            username = request.POST.get('username', '').strip()
            password = request.POST.get('password', '')

        if not username or not password:
            err = 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.'
            if is_ajax:
                return JsonResponse({'success': False, 'message': err}, status=400)
            return render(request, 'admin/login.html', {'error': err, 'username': username, 'next': next_url})

        # Tìm user
        try:
            user = CustomUser.objects.get(username=username)
        except CustomUser.DoesNotExist:
            err = 'Tên đăng nhập không tồn tại trong hệ thống.'
            if is_ajax:
                return JsonResponse({'success': False, 'message': err}, status=401)
            return render(request, 'admin/login.html', {'error': err, 'username': username, 'next': next_url})

        # Xác thực mật khẩu
        if not user.check_password(password):
            err = 'Mật khẩu quản trị viên không chính xác.'
            if is_ajax:
                return JsonResponse({'success': False, 'message': err}, status=401)
            return render(request, 'admin/login.html', {'error': err, 'username': username, 'next': next_url})

        # Kiểm tra vai trò
        if user.role != 'admin':
            err = 'Từ chối truy cập: Tài khoản này không phải là Quản trị viên (Admin).'
            if is_ajax:
                return JsonResponse({'success': False, 'message': err}, status=403)
            return render(request, 'admin/login.html', {'error': err, 'username': username, 'next': next_url})

        # Kiểm tra trạng thái hoạt động
        if not user.is_active:
            err = 'Tài khoản quản trị viên này hiện đang bị khoá.'
            if is_ajax:
                return JsonResponse({'success': False, 'message': err}, status=403)
            return render(request, 'admin/login.html', {'error': err, 'username': username, 'next': next_url})

        # Cấp session mới
        client_ip = _get_client_ip(request)
        client_device = request.META.get('HTTP_USER_AGENT', '')
        new_token = str(uuid.uuid4())

        user.session_token = new_token
        user.session_ip = client_ip
        user.session_device = client_device
        user.last_login_at = timezone.now()
        user.save(update_fields=['session_token', 'session_ip', 'session_device', 'last_login_at'])

        # Tạo phản hồi
        if is_ajax:
            response = JsonResponse({'success': True, 'redirect': next_url})
        else:
            response = HttpResponseRedirect(next_url)

        # Thiết lập HttpOnly Cookie
        response.set_cookie(
            'session_token',
            new_token,
            httponly=True,
            secure=not request.get_host().split(':')[0] in ('localhost', '127.0.0.1', 'testserver'),
            samesite='Lax',
            max_age=86400,  # 24 giờ
            path='/',
        )
        return response

    return HttpResponseRedirect('/admin/login/')


def admin_logout_page(request):
    """
    Đăng xuất Admin:
    - Xoá session token trong cơ sở dữ liệu.
    - Xoá HttpOnly cookie `session_token`.
    - Chuyển hướng về `/admin/login/`.
    """
    token = request.COOKIES.get('session_token', '').strip() or request.META.get('HTTP_X_SESSION_TOKEN', '').strip()
    if token:
        try:
            user = CustomUser.objects.get(session_token=token)
            user.session_token = None
            user.save(update_fields=['session_token'])
        except CustomUser.DoesNotExist:
            pass

    response = HttpResponseRedirect('/admin/login/')
    response.delete_cookie('session_token', path='/')
    return response
