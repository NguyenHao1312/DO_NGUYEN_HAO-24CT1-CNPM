"""
student_management/views/admin_dashboard.py
Admin Management API — Dashboard, Audit Log viewer, User Manager.
Chỉ admin có session_token hợp lệ mới được truy cập.
"""
import json
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from ..decorators import require_session, require_role, audit_log
from ..models import CustomUser, AuditLog, Student, Teacher, University


# ============================================================
#  ADMIN DASHBOARD PAGE
# ============================================================
@require_session
@require_role(['admin'])
def admin_dashboard_page(request):
    """Trang dashboard admin — render HTML."""
    return render(request, 'admin_dashboard.html')


# ============================================================
#  API: THỐNG KÊ HỆ THỐNG
# ============================================================
@require_session
@require_role(['admin'])
def api_admin_stats(request):
    """Trả về thống kê tổng quan."""
    stats = {
        'total_users': CustomUser.objects.count(),
        'total_students': Student.objects.count(),
        'total_teachers': Teacher.objects.count(),
        'total_universities': University.objects.count(),
        'active_sessions': CustomUser.objects.filter(
            session_token__isnull=False
        ).exclude(session_token='').count(),
        'total_audit_logs': AuditLog.objects.count(),
        'admins': list(
            CustomUser.objects.filter(role='admin').values(
                'id', 'username', 'first_name', 'last_login_at', 'session_ip'
            )
        ),
    }
    return JsonResponse({'success': True, 'stats': stats})


# ============================================================
#  API: AUDIT LOG VIEWER
# ============================================================
@require_session
@require_role(['admin'])
def api_admin_audit_logs(request):
    """Xem lịch sử audit log (phân trang)."""
    page = int(request.GET.get('page', 1))
    per_page = int(request.GET.get('per_page', 50))
    offset = (page - 1) * per_page

    # Filters
    endpoint_filter = request.GET.get('endpoint', '')
    role_filter = request.GET.get('role', '')
    status_filter = request.GET.get('status', '')

    logs = AuditLog.objects.all().order_by('-timestamp')

    if endpoint_filter:
        logs = logs.filter(endpoint__icontains=endpoint_filter)
    if role_filter:
        logs = logs.filter(role=role_filter)
    if status_filter:
        logs = logs.filter(status_code=int(status_filter))

    total = logs.count()
    log_list = list(logs[offset:offset + per_page].values(
        'id', 'role', 'endpoint', 'method', 'status_code',
        'ip_address', 'timestamp'
    ))

    # Thêm username cho mỗi log entry
    for log in log_list:
        log['timestamp'] = log['timestamp'].isoformat()

    return JsonResponse({
        'success': True,
        'logs': log_list,
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total + per_page - 1) // per_page,
    })


# ============================================================
#  API: USER MANAGEMENT
# ============================================================
@require_session
@require_role(['admin'])
def api_admin_users(request):
    """CRUD quản lý users."""
    if request.method == 'GET':
        users = CustomUser.objects.all().values(
            'id', 'username', 'first_name', 'role', 'email',
            'session_ip', 'session_device', 'last_login_at',
            'is_active', 'date_joined'
        )
        user_list = []
        for u in users:
            u['last_login_at'] = u['last_login_at'].isoformat() if u['last_login_at'] else None
            u['date_joined'] = u['date_joined'].isoformat() if u['date_joined'] else None
            user_list.append(u)
        return JsonResponse({'success': True, 'users': user_list})

    return JsonResponse({'error': 'Method not allowed'}, status=405)


# ============================================================
#  API: FORCE LOGOUT USER
# ============================================================
@csrf_exempt
@require_session
@require_role(['admin'])
@audit_log
def api_admin_force_logout(request):
    """Admin ép đăng xuất 1 user khác."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body)
        user_id = data.get('user_id')

        user = CustomUser.objects.get(id=user_id)
        user.session_token = None
        user.session_ip = None
        user.session_device = None
        user.save(update_fields=['session_token', 'session_ip', 'session_device'])

        return JsonResponse({
            'success': True,
            'message': f'Đã ép đăng xuất user: {user.username}'
        })
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ============================================================
#  API: TOGGLE USER ACTIVE STATUS
# ============================================================
@csrf_exempt
@require_session
@require_role(['admin'])
@audit_log
def api_admin_toggle_user(request):
    """Admin khoá/mở khoá tài khoản user."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body)
        user_id = data.get('user_id')

        user = CustomUser.objects.get(id=user_id)
        user.is_active = not user.is_active
        if not user.is_active:
            # Nếu khoá → xoá session luôn
            user.session_token = None
        user.save(update_fields=['is_active', 'session_token'])

        status_text = 'kích hoạt' if user.is_active else 'khoá'
        return JsonResponse({
            'success': True,
            'message': f'Đã {status_text} tài khoản: {user.username}',
            'is_active': user.is_active,
        })
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
