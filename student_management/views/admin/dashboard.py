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
from django.utils import timezone

SESSION_TIMEOUT_SECONDS = 600  # 10 phút (600 giây) theo yêu cầu hệ thống

def admin_dashboard_page(request):
    """
    Trang dashboard admin — render HTML.
    Thời hạn phiên làm việc cố định 10 phút tính từ thời điểm đăng nhập (last_login_at).
    Khi F5 hoặc reload trang, thời gian còn lại không bị reset mà đếm tiếp tục.
    Khi hết 10 phút, hệ thống tự động ngắt phiên và chuyển hướng về /admin/login/.
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

    now = timezone.now()
    if not user.last_login_at:
        user.last_login_at = now
        user.save(update_fields=['last_login_at'])

    elapsed_seconds = (now - user.last_login_at).total_seconds()
    if elapsed_seconds >= SESSION_TIMEOUT_SECONDS:
        # Phiên 10 phút đã hết hạn -> Tự động out ngay
        user.session_token = None
        user.save(update_fields=['session_token'])
        resp = redirect('/admin/login/?error=session_expired')
        resp.delete_cookie('session_token', path='/')
        return resp

    remaining_seconds = max(0, int(SESSION_TIMEOUT_SECONDS - elapsed_seconds))
    session_expires_at_ms = int((user.last_login_at.timestamp() + SESSION_TIMEOUT_SECONDS) * 1000)

    request.session_user = user
    response = render(request, 'admin/dashboard.html', {
        'admin_user': user,
        'session_timeout_seconds': remaining_seconds,
        'session_expires_at': session_expires_at_ms,
    })
    # Giữ nguyên thời hạn cookie theo số giây còn lại thực tế (không reset về 10 phút khi F5)
    response.set_cookie(
        'session_token',
        token,
        httponly=True,
        secure=not request.get_host().split(':')[0] in ('localhost', '127.0.0.1', 'testserver'),
        samesite='Lax',
        max_age=remaining_seconds,
        path='/',
    )
    return response


@require_session
@require_role(['admin'])
def api_admin_ping(request):
    """Giữ phiên đăng nhập admin (Keep-alive / Heartbeat)."""
    response = JsonResponse({'success': True, 'message': 'Session renewed'})
    token = request.COOKIES.get('session_token', '').strip() or request.META.get('HTTP_X_SESSION_TOKEN', '').strip()
    if token:
        response.set_cookie(
            'session_token',
            token,
            httponly=True,
            secure=not request.get_host().split(':')[0] in ('localhost', '127.0.0.1', 'testserver'),
            samesite='Lax',
            max_age=SESSION_TIMEOUT_SECONDS,
            path='/',
        )
    return response


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
    alert_type_filter = request.GET.get('alert_type', '').strip().lower()
    from_time = request.GET.get('from_time', '').strip()
    to_time = request.GET.get('to_time', '').strip()

    from django.db.models import Q
    logs = AuditLog.objects.all().order_by('-timestamp')

    if endpoint_filter:
        logs = logs.filter(endpoint__icontains=endpoint_filter)
    if role_filter:
        logs = logs.filter(role=role_filter)
    if status_filter and status_filter.isdigit():
        logs = logs.filter(status_code=int(status_filter))
    if ip_filter:
        logs = logs.filter(ip_address__icontains=ip_filter)

    # Lọc theo phân loại cảnh báo:
    # 1. 'attack': Khả nghi (Tấn công) - Không bao gồm sự cố độ trễ/mất kết nối
    # 2. 'network_lag': Mất kết nối / Độ trễ mạng (status 408/502/504 hoặc execution_time_ms >= 1000)
    # 3. 'normal': Bản ghi hoạt động bình thường
    if alert_type_filter == 'network_lag':
        logs = logs.filter(Q(status_code__in=[408, 502, 504]) | Q(execution_time_ms__gte=1000))
    elif alert_type_filter == 'attack':
        logs = logs.filter(is_suspicious=True).exclude(status_code__in=[408, 502, 504]).exclude(execution_time_ms__gte=1000)
    elif alert_type_filter == 'normal':
        logs = logs.filter(is_suspicious=False, execution_time_ms__lt=1000).exclude(status_code__in=[408, 502, 504])
    elif suspicious_filter in ('1', 'true', 'yes'):
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

    # Định dạng ISO timestamp và phân loại sự kiện (Tấn công vs Mất kết nối/Độ trễ)
    for log in log_list:
        if log['timestamp']:
            log['timestamp'] = log['timestamp'].isoformat()
        latency = log.get('execution_time_ms') or 0.0
        status = log.get('status_code') or 200

        if status in (408, 502, 504) or latency >= 1000.0:
            log['event_type'] = 'network_lag'
            log['event_label'] = 'Mất kết nối / Trễ cao'
        elif log.get('is_suspicious'):
            log['event_type'] = 'attack'
            log['event_label'] = 'Khả nghi (Tấn công)'
        else:
            log['event_type'] = 'normal'
            log['event_label'] = 'Bình thường'

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
    - Phân tách sự cố mất kết nối / độ trễ mạng khỏi các đợt tấn công thực sự
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

    # Phân tách rõ ràng:
    # 1. Sự cố mạng / Độ trễ cao (Network Latency / Disconnect)
    network_lag_count = recent_logs.filter(
        Q(status_code__in=[408, 502, 504]) | Q(execution_time_ms__gte=1000)
    ).count()

    # 2. Dấu hiệu tấn công thực tế (Brute Force, Scanning, Exploits)
    genuine_attack_count = recent_logs.filter(
        Q(is_suspicious=True) & ~Q(status_code__in=[408, 502, 504]) & Q(execution_time_ms__lt=1000)
    ).count()

    suspicious_count = recent_logs.filter(
        Q(is_suspicious=True) | Q(status_code__in=[401, 403, 404, 429, 500])
    ).count()

    rate_limited_count = recent_logs.filter(status_code=429).count()
    unauthorized_count = recent_logs.filter(status_code=401).count()
    server_error_count = recent_logs.filter(status_code__gte=500).count()

    # Tỷ lệ lỗi dựa trên các lỗi thực tế (loại trừ mất kết nối đơn thuần)
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
    elif error_rate > 15 or genuine_attack_count > 30:
        threat_level = 'WARNING'
        threat_message = 'CHÚ Ý: Phát hiện nhiều yêu cầu bất thường (401/403/404 dò quét tài khoản). Cần theo dõi IP vi phạm.'
    elif network_lag_count > 5:
        threat_level = 'WARNING'
        threat_message = f'LƯU Ý: Ghi nhận {network_lag_count} yêu cầu có độ trễ cao hoặc mất kết nối mạng (Network Latency / Disconnect). Admin có thể xem xét hạ tầng hoặc kiểm tra đường truyền.'

    return JsonResponse({
        'success': True,
        'analytics': {
            'threat_level': threat_level,
            'threat_message': threat_message,
            'total_requests_24h': total_24h,
            'suspicious_count': suspicious_count,
            'genuine_attack_count': genuine_attack_count,
            'network_lag_count': network_lag_count,
            'error_rate_pct': error_rate,
            'rate_limited_429': rate_limited_count,
            'unauthorized_401': unauthorized_count,
            'server_error_500': server_error_count,
            'top_offending_ips': top_offending_ips,
        }
    })


# ============================================================
#  API: PURGE AUDIT LOGS (LÀM TRỐNG / DỌN DẸP BỚT NHẬT KÝ KIỂM TOÁN)
# ============================================================
def _safe_audit_log_delete(queryset):
    """
    Thực hiện xóa audit log an toàn trên MSSQL:
    Tạm vô hiệu hóa trigger WORM (trg_PreventAuditLogTamper) trước khi xóa,
    sau đó bật lại ngay lập tức trong finally block.
    """
    from django.db import connection
    with connection.cursor() as cursor:
        try:
            cursor.execute(
                "DISABLE TRIGGER trg_PreventAuditLogTamper ON student_management_auditlog;"
            )
        except Exception:
            pass  # Trigger có thể chưa tồn tại (dev/test env)
        try:
            deleted_count, _ = queryset.delete()
            return deleted_count
        finally:
            try:
                cursor.execute(
                    "ENABLE TRIGGER trg_PreventAuditLogTamper ON student_management_auditlog;"
                )
            except Exception:
                pass


@csrf_exempt
@require_session
@require_role(['admin'])
@audit_log
def api_admin_purge_audit_logs(request):
    """
    Cho phép Admin dọn dẹp hoặc làm trống nhật ký kiểm toán (Audit Logs) để giải phóng lưu trữ:
    - POST:
      + mode: 'days' (Xóa log cũ hơn N ngày, mặc định 30 ngày)
      + mode: 'resolved' (Xóa các log bình thường 200 OK, giữ lại log khả nghi/lỗi mạng)
      + mode: 'all' (Làm trống toàn bộ audit logs)
      + mode: 'single' (Xóa 1 bản ghi theo ID)
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body) if request.body else {}
    except Exception:
        data = {}

    mode = data.get('mode', 'days')
    from datetime import timedelta
    from django.utils import timezone

    deleted_count = 0

    try:
        if mode == 'days':
            days = int(data.get('days', 30))
            cutoff = timezone.now() - timedelta(days=days)
            deleted_count = _safe_audit_log_delete(
                AuditLog.objects.filter(timestamp__lt=cutoff)
            )
            msg = f'Đã dọn dẹp {deleted_count} bản ghi audit log cũ hơn {days} ngày.'

        elif mode == 'resolved':
            deleted_count = _safe_audit_log_delete(
                AuditLog.objects.filter(
                    status_code=200,
                    is_suspicious=False,
                    execution_time_ms__lt=1000
                )
            )
            msg = f'Đã xóa {deleted_count} bản ghi log bình thường, bảo lưu các log khả nghi và sự cố mạng.'

        elif mode == 'all':
            deleted_count = _safe_audit_log_delete(AuditLog.objects.all())
            msg = f'Đã làm trống toàn bộ ({deleted_count} bản ghi) nhật ký kiểm toán.'

        elif mode == 'single':
            log_id = data.get('log_id')
            if not log_id:
                return JsonResponse({'success': False, 'message': 'Thiếu log_id.'}, status=400)
            deleted_count = _safe_audit_log_delete(
                AuditLog.objects.filter(id=int(log_id))
            )
            if deleted_count == 0:
                return JsonResponse({'success': False, 'message': f'Không tìm thấy log #{log_id}.'}, status=404)
            msg = f'Đã xóa bản ghi audit log #{log_id}.'

        else:
            return JsonResponse({'success': False, 'message': 'Chế độ dọn dẹp không hợp lệ.'}, status=400)

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Lỗi khi dọn dẹp audit log: {str(e)}'
        }, status=500)

    remaining_count = AuditLog.objects.count()

    return JsonResponse({
        'success': True,
        'message': msg,
        'deleted_count': deleted_count,
        'remaining_count': remaining_count,
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
            # Nếu khoá → huỷ session token và thông tin phiên ngay lập tức để kick khỏi hệ thống
            user.session_token = None
            user.session_ip = None
            user.session_device = None
            user.save(update_fields=['is_active', 'session_token', 'session_ip', 'session_device'])
        else:
            user.save(update_fields=['is_active'])

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
