"""
student_management/views/user/auth.py
API endpoints: Register, Login, Logout, Session Check.
Dùng chung cho người dùng (Student & Teacher), bảo mật chặn Admin ở cổng public.
"""
import json
import uuid
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from student_management.models import CustomUser, University, Student, Teacher


def _get_client_ip(request):
    """Lấy IP client từ header (hỗ trợ proxy)."""
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


# ============================================================
#  API: ĐĂNG KÝ TÀI KHOẢN (Public User Portal)
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

        # ── Chặn đăng ký role admin qua API public ──
        if role == 'admin':
            return JsonResponse({
                'success': False,
                'message': 'Không thể tự đăng ký tài khoản quản trị viên. Vui lòng liên hệ admin hệ thống.'
            }, status=403)

        # Chỉ cho phép role hợp lệ
        if role not in ('student', 'teacher'):
            return JsonResponse({
                'success': False,
                'message': 'Role không hợp lệ. Chỉ chấp nhận: student, teacher.'
            }, status=400)

        university_id = data.get('universityId')

        if not username or not password:
            return JsonResponse({'success': False, 'message': 'Mã số và mật khẩu là bắt buộc'})

        # Kiểm tra xem mã đã có trong hệ thống chưa
        if CustomUser.objects.filter(username=username).exists() or \
           Student.objects.filter(student_id=username).exists() or \
           Teacher.objects.filter(teacher_id=username).exists():
            return JsonResponse({'success': False, 'message': 'Mã đã có trong hệ thống'}, status=400)

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
#  API: KIỂM TRA MÃ TRONG HỆ THỐNG (Check Code)
# ============================================================
@csrf_exempt
def api_check_code(request):
    """
    Kiểm tra mã sinh viên / giảng viên đã có trong hệ thống hay chưa.
    GET /api/check-code/?code=...
    Trả về:
    - Nếu đã có: { success: True, exists: True, message: 'Mã đã có trong hệ thống' }
    - Nếu chưa có: { success: True, exists: False, message: 'Mã không có trong hệ thống' }
    """
    code = request.GET.get('code', '').strip()
    if not code:
        return JsonResponse({'success': False, 'message': 'Vui lòng cung cấp mã cần kiểm tra'}, status=400)

    exists = (
        CustomUser.objects.filter(username=code).exists() or
        Student.objects.filter(student_id=code).exists() or
        Teacher.objects.filter(teacher_id=code).exists()
    )

    if exists:
        return JsonResponse({
            'success': True,
            'exists': True,
            'message': 'Mã đã có trong hệ thống'
        })
    return JsonResponse({
        'success': True,
        'exists': False,
        'message': 'Mã không có trong hệ thống'
    })


# ============================================================
#  API: ĐĂNG NHẬP (Server-side session)
# ============================================================
@csrf_exempt
def api_login(request):
    """
    Server-side login: Xác thực credentials, tạo session_token.
    Bảo mật chống User Enumeration (CWE-204):
    Mọi trường hợp sai mã, sai mật khẩu hoặc sinh viên/giảng viên đăng nhập nhầm tab
    đều trả về thông báo lỗi chung 'Sai thông tin đăng nhập' để ngăn chặn dò tìm tài khoản.
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '')

        if not username or not password:
            return JsonResponse({'success': False, 'message': 'Vui lòng nhập đầy đủ mã số và mật khẩu'}, status=400)

        # Tìm user
        try:
            user = CustomUser.objects.get(username=username)
        except CustomUser.DoesNotExist:
            user = None

        requested_role = data.get('role', '')

        # Kiểm tra tính hợp lệ tổng quát:
        # 1. User không tồn tại
        # 2. Mật khẩu không đúng
        # 3. Đăng nhập nhầm tab vai trò (Sinh viên đăng nhập nhầm tab Giáo viên hoặc ngược lại)
        is_invalid = (
            user is None or
            not user.check_password(password) or
            (requested_role and user.role != requested_role and user.role != 'admin')
        )

        if is_invalid:
            # Thông báo bảo mật chung: Không tiết lộ đúng mã sai pass hay sai role
            return JsonResponse({
                'success': False,
                'message': 'Sai thông tin đăng nhập'
            }, status=401)

        # ── Bảo mật phân quyền: Chặn tuyệt đối tài khoản Admin tại cổng đăng nhập công khai ──
        if user.role == 'admin':
            return JsonResponse({
                'success': False,
                'message': 'Từ chối truy cập: Tài khoản Quản trị viên (Admin) không được phép đăng nhập tại cổng người dùng. Vui lòng sử dụng Cổng Quản trị Local (Admin Control Panel - Port 9000).'
            }, status=403)

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
            'id': getattr(user, 'id', user.pk),
            'username': user.username,
            'name': user.first_name or user.username,
            'role': user.role,
            'avatar': user.avatar,
        }

        # Lấy linkedId (student_id hoặc teacher_id)
        if user.role == 'student':
            student = getattr(user, 'student_profile', None)
            if student is not None:
                try:
                    user_info['linkedId'] = student.student_id
                except (Student.DoesNotExist, AttributeError):
                    pass
        elif user.role == 'teacher':
            teacher = getattr(user, 'teacher_profile', None)
            if teacher is not None:
                try:
                    user_info['linkedId'] = teacher.teacher_id
                except (Teacher.DoesNotExist, AttributeError):
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
                'id': getattr(user, 'id', user.pk),
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
