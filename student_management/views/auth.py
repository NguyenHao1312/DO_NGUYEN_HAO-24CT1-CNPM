"""
student_management/views/auth.py
API endpoints: Register, Login, Logout, Session Check.
"""
import json
import uuid
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from ..models import CustomUser, University, Student, Teacher


def _get_client_ip(request):
    """Lấy IP client từ header (hỗ trợ proxy)."""
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


# ============================================================
#  API: ĐĂNG KÝ TÀI KHOẢN
# ============================================================
@csrf_exempt
def api_register(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        name = data.get('name', '').strip()
        password = data.get('password', '')
        role = data.get('role', 'student')
        university_id = data.get('universityId')

        if not username or not password:
            return JsonResponse({'success': False, 'message': 'Username và password là bắt buộc'})

        if CustomUser.objects.filter(username=username).exists():
            return JsonResponse({'success': False, 'message': 'Tên đăng nhập đã tồn tại trong hệ thống'})

        # Tạo user
        user = CustomUser(
            username=username,
            first_name=name,
            role=role,
        )
        user.set_password(password)
        user.save()

        # Tạo profile liên kết
        uni = None
        if university_id:
            uni, _ = University.objects.get_or_create(
                id=university_id,
                defaults={'name': 'Unknown', 'code': f'UNI{university_id}'}
            )

        if role == 'student':
            Student.objects.create(
                user=user,
                student_id=username,
                full_name=name,
                department='Chung',
                university=uni,
            )
        elif role == 'teacher':
            Teacher.objects.create(
                user=user,
                teacher_id=username,
                full_name=name,
                department='Chung',
                university=uni,
            )

        return JsonResponse({'success': True, 'message': 'Đăng ký thành công'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


# ============================================================
#  API: ĐĂNG NHẬP (Server-side session)
# ============================================================
@csrf_exempt
def api_login(request):
    """
    Server-side login: Xác thực credentials, tạo session_token.
    Client gửi: { username, password }
    Server trả: { success, session_token, user_info }
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '')

        if not username or not password:
            return JsonResponse({'success': False, 'message': 'Thiếu tên đăng nhập hoặc mật khẩu'})

        # Tìm user
        try:
            user = CustomUser.objects.get(username=username)
        except CustomUser.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Tên đăng nhập không tồn tại'})

        # Xác thực mật khẩu
        if not user.check_password(password):
            return JsonResponse({'success': False, 'message': 'Mật khẩu không đúng'})

        # ── Kiểm tra vai trò (Role Validation) ──
        # Admin chỉ được phép đăng nhập qua tab "Giáo viên" (role=teacher)
        requested_role = data.get('role', '')
        if user.role == 'admin' and requested_role == 'student':
            return JsonResponse({
                'success': False,
                'message': 'Tài khoản quản trị viên không thể đăng nhập qua tab Sinh viên'
            })

        # Sinh viên không được đăng nhập qua tab Giáo viên
        if user.role == 'student' and requested_role == 'teacher':
            return JsonResponse({
                'success': False,
                'message': 'Tài khoản sinh viên không thể đăng nhập qua tab Giáo viên'
            })

        # Lấy thông tin client
        client_ip = _get_client_ip(request)
        client_device = request.META.get('HTTP_USER_AGENT', '')

        # Kiểm tra session cũ
        old_token = user.session_token
        old_ip = user.session_ip

        # Tạo session token mới
        session_token = str(uuid.uuid4())

        # Cập nhật session info
        user.session_token = session_token
        user.session_ip = client_ip
        user.session_device = client_device
        user.last_login_at = timezone.now()
        user.save(update_fields=['session_token', 'session_ip', 'session_device', 'last_login_at'])

        # Xây dựng user info trả về client
        user_info = {
            'id': user.id,
            'username': user.username,
            'name': user.first_name or user.username,
            'role': user.role,
            'avatar': user.avatar,
        }

        # Lấy linkedId (student_id hoặc teacher_id)
        if user.role == 'student' and hasattr(user, 'student_profile'):
            try:
                student = user.student_profile
                user_info['linkedId'] = student.student_id
            except Student.DoesNotExist:
                pass
        elif user.role == 'teacher' and hasattr(user, 'teacher_profile'):
            try:
                teacher = user.teacher_profile
                user_info['linkedId'] = teacher.teacher_id
            except Teacher.DoesNotExist:
                pass

        response_data = {
            'success': True,
            'session_token': session_token,
            'user': user_info,
            'message': 'Đăng nhập thành công',
        }

        # Thông báo nếu đã kick session cũ
        if old_token and old_ip and old_ip != client_ip:
            response_data['kicked_old_session'] = True
            response_data['kicked_message'] = (
                f'Phiên đăng nhập cũ từ IP {old_ip} đã bị đăng xuất.'
            )

        response = JsonResponse(response_data)

        # Set HttpOnly cookie — chống XSS, browser tự gửi kèm mỗi request
        response.set_cookie(
            'session_token',
            session_token,
            httponly=True,
            secure=not request.META.get('SERVER_NAME', '').startswith('localhost'),
            samesite='Lax',
            max_age=86400,  # 24 hours
            path='/',
        )

        return response

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Dữ liệu JSON không hợp lệ'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


# ============================================================
#  API: ĐĂNG XUẤT (Server-side)
# ============================================================
@csrf_exempt
def api_logout(request):
    """Xoá session token phía server."""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Only POST allowed'}, status=405)

    session_token = request.META.get('HTTP_X_SESSION_TOKEN', '').strip()
    if not session_token:
        session_token = request.COOKIES.get('session_token', '').strip()
    if not session_token:
        response = JsonResponse({'success': True, 'message': 'Đã đăng xuất'})
        response.delete_cookie('session_token', path='/')
        return response

    try:
        user = CustomUser.objects.get(session_token=session_token)
        user.session_token = None
        user.session_ip = None
        user.session_device = None
        user.save(update_fields=['session_token', 'session_ip', 'session_device'])
    except CustomUser.DoesNotExist:
        pass  # Token đã hết hạn, không sao

    response = JsonResponse({'success': True, 'message': 'Đã đăng xuất thành công'})
    response.delete_cookie('session_token', path='/')
    return response


# ============================================================
#  API: SESSION CHECK — Kiểm tra session còn hợp lệ không
# ============================================================
@csrf_exempt
def api_session_check(request):
    """Client gọi để verify session token vẫn valid."""
    session_token = request.META.get('HTTP_X_SESSION_TOKEN', '').strip()
    if not session_token:
        return JsonResponse({'valid': False, 'message': 'Không có session token'})

    try:
        user = CustomUser.objects.get(session_token=session_token)
        return JsonResponse({
            'valid': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'name': user.first_name or user.username,
            }
        })
    except CustomUser.DoesNotExist:
        return JsonResponse({
            'valid': False,
            'force_logout': True,
            'message': 'Phiên đăng nhập đã hết hạn hoặc bị thay thế bởi đăng nhập mới.'
        })
