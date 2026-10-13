"""
student_management/views/admin/dashboard.py
Admin Management API — Dashboard, Audit Log viewer, User Manager.
Chỉ admin có session_token hợp lệ mới được truy cập.

[Tách riêng từ views/admin_dashboard.py → views/admin/dashboard.py]
"""
import json
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt
from student_management.decorators import require_session, require_role, audit_log
from student_management.models import CustomUser, AuditLog, Student, Teacher, University


# ============================================================
#  ADMIN DASHBOARD PAGE
# ============================================================
def admin_dashboard_page(request):
    """
    Trang dashboard admin — render HTML.
    Nếu chưa đăng nhập hoặc không phải admin, chuyển hướng sang /admin/login/.
    """
    token = request.COOKIES.get('session_token', '').strip() or request.META.get('HTTP_X_SESSION_TOKEN', '').strip()
    if not token:
        return redirect('/admin/login/?next=/admin/dashboard/')
    try:
        user = CustomUser.objects.get(session_token=token)
        if user.role != 'admin':
            return redirect('/admin/login/?error=role')
    except CustomUser.DoesNotExist:
        return redirect('/admin/login/?next=/admin/dashboard/')

    request.session_user = user
    return render(request, 'admin/dashboard.html', {'admin_user': user})


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
#  API: AUDIT LOG VIEWER (FORENSICS & TIMELINE FILTER)
# ============================================================
@require_session
@require_role(['admin'])
def api_admin_audit_logs(request):
    """
    Xem lịch sử audit log phục vụ điều tra số (Forensics):
    - Hỗ trợ lọc mốc thời gian chính xác: from_time, to_time (ISO format)
    - Lọc cờ is_suspicious (True/False)
    - Lọc IP address, endpoint, role, status_code
    - Trả về execution_time_ms và user_agent
    """
    page = int(request.GET.get('page', 1))
    per_page = int(request.GET.get('per_page', 50))
    offset = (page - 1) * per_page

    # Filters
    endpoint_filter = request.GET.get('endpoint', '').strip()
    role_filter = request.GET.get('role', '').strip()
    status_filter = request.GET.get('status', '').strip()
    ip_filter = request.GET.get('ip', '').strip()
    suspicious_filter = request.GET.get('suspicious', '').strip().lower()
    from_time = request.GET.get('from_time', '').strip()
    to_time = request.GET.get('to_time', '').strip()

    logs = AuditLog.objects.all().order_by('-timestamp')

    if endpoint_filter:
        logs = logs.filter(endpoint__icontains=endpoint_filter)
    if role_filter:
        logs = logs.filter(role=role_filter)
    if status_filter and status_filter.isdigit():
        logs = logs.filter(status_code=int(status_filter))
    if ip_filter:
        logs = logs.filter(ip_address__icontains=ip_filter)
    if suspicious_filter in ('1', 'true', 'yes'):
        logs = logs.filter(is_suspicious=True)
    elif suspicious_filter in ('0', 'false', 'no'):
        logs = logs.filter(is_suspicious=False)

    # Lọc theo mốc thời gian tấn công (Timestamp Range)
    if from_time:
        logs = logs.filter(timestamp__gte=from_time)
    if to_time:
        logs = logs.filter(timestamp__lte=to_time)

    total = logs.count()
    log_list = list(logs[offset:offset + per_page].values(
        'id', 'role', 'endpoint', 'method', 'status_code',
        'ip_address', 'timestamp', 'user_agent', 'execution_time_ms',
        'is_suspicious', 'request_data'
    ))

    # Định dạng ISO timestamp
    for log in log_list:
        if log['timestamp']:
            log['timestamp'] = log['timestamp'].isoformat()

    return JsonResponse({
        'success': True,
        'logs': log_list,
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total + per_page - 1) // per_page if per_page > 0 else 1,
    })


# ============================================================
#  API: SECURITY & INCIDENT ANALYTICS (REALTIME ATTACK MONITOR)
# ============================================================
@require_session
@require_role(['admin'])
def api_admin_security_analytics(request):
    """
    Phân tích an ninh hệ thống trong 24 giờ qua:
    - Phát hiện bất thường & dấu hiệu tấn công / DDoS
    - Top IP vi phạm và tỷ lệ lỗi (Error Rate)
    - Gom nhóm mốc thời gian (Attack Timeline)
    """
    from datetime import timedelta
    from django.utils import timezone
    from django.db.models import Count, Avg, Q

    now = timezone.now()
    since_24h = now - timedelta(hours=24)

    recent_logs = AuditLog.objects.filter(timestamp__gte=since_24h)
    total_24h = recent_logs.count()

    suspicious_count = recent_logs.filter(
        Q(is_suspicious=True) | Q(status_code__in=[401, 403, 404, 429, 500])
    ).count()

    rate_limited_count = recent_logs.filter(status_code=429).count()
    unauthorized_count = recent_logs.filter(status_code=401).count()
    server_error_count = recent_logs.filter(status_code__gte=500).count()

    error_rate = round((suspicious_count / total_24h * 100), 1) if total_24h > 0 else 0.0

    # Top 5 IP có số request lỗi cao nhất
    top_offending_ips = list(
        recent_logs.filter(Q(is_suspicious=True) | Q(status_code__gte=400))
        .values('ip_address')
        .annotate(
            error_count=Count('id'),
            avg_latency=Avg('execution_time_ms')
        )
        .order_by('-error_count')[:5]
    )

    # Đánh giá trạng thái an ninh (Security Threat Level)
    threat_level = 'HEALTHY'
    threat_message = 'Hệ thống an toàn, không có dấu hiệu bất thường.'

    if error_rate > 35 or rate_limited_count > 50 or total_24h > 10000:
        threat_level = 'CRITICAL'
        threat_message = 'CẢNH BÁO: Phát hiện dấu hiệu DDoS hoặc Brute-Force mật độ cao! Tỷ lệ lỗi vượt ngưỡng an toàn.'
    elif error_rate > 15 or suspicious_count > 30:
        threat_level = 'WARNING'
        threat_message = 'CHÚ Ý: Phát hiện nhiều yêu cầu bất thường (401/403/404 dò quét). Cần theo dõi IP vi phạm.'

    return JsonResponse({
        'success': True,
        'analytics': {
            'threat_level': threat_level,
            'threat_message': threat_message,
            'total_requests_24h': total_24h,
            'suspicious_count': suspicious_count,
            'error_rate_pct': error_rate,
            'rate_limited_429': rate_limited_count,
            'unauthorized_401': unauthorized_count,
            'server_error_500': server_error_count,
            'top_offending_ips': top_offending_ips,
        }
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


# ============================================================
#  API: GHOST ACCOUNTS DETECTION & PURGE (DỌN DẸP TÀI KHOẢN MA)
# ============================================================
@csrf_exempt
@require_session
@require_role(['admin'])
@audit_log
def api_admin_ghost_accounts(request):
    """
    Quản lý dọn dẹp tài khoản ma làm nhiễu database:
    - GET: Quét và trả về danh sách các tài khoản ma (không hoạt động, mồ côi).
    - POST: Thực hiện dọn dẹp an toàn các tài khoản ma.
    """
    from student_management.account_lifecycle import detect_ghost_accounts, purge_ghost_accounts

    if request.method == 'GET':
        days = int(request.GET.get('days', 30))
        ghosts = detect_ghost_accounts(days_inactive=days)
        return JsonResponse({
            'success': True,
            'count': len(ghosts),
            'ghosts': ghosts,
            'days_threshold': days,
        })

    elif request.method == 'POST':
        try:
            data = json.loads(request.body) if request.body else {}
        except Exception:
            data = {}

        days = int(data.get('days', 30))
        user_ids = data.get('user_ids', None)
        dry_run = bool(data.get('dry_run', False))
        admin_user = getattr(request, 'session_user', None)

        result = purge_ghost_accounts(
            days_inactive=days,
            user_ids=user_ids,
            dry_run=dry_run,
            admin_user=admin_user
        )
        return JsonResponse({'success': True, **result})

    return JsonResponse({'error': 'Method not allowed'}, status=405)
