"""
student_management/decorators.py
Bộ decorator bảo mật cho API endpoints.
- require_session: Kiểm tra X-Session-Token → 401
- require_role: Kiểm tra vai trò → 403
- audit_log: Ghi log hành động vào DB
- rate_limit: Giới hạn request → 429
"""
from functools import wraps
from django.http import JsonResponse
from django.core.cache import cache
from student_management.models import CustomUser


from student_management.security_utils import get_client_ip, is_suspicious_request


def _get_client_ip(request):
    """Lấy IP client an toàn chống giả mạo header."""
    return get_client_ip(request)


def require_session(view_func):
    """
    Kiểm tra session token từ 2 nguồn (ưu tiên header):
    1. X-Session-Token header (API calls từ frontend)
    2. HttpOnly cookie 'session_token' (browser tự gửi)
    Gắn request.session_user = CustomUser instance nếu hợp lệ.
    Trả 401 Unauthorized nếu không có token hoặc token hết hạn.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Ưu tiên header, fallback sang cookie
        token = request.META.get('HTTP_X_SESSION_TOKEN', '').strip()
        if not token:
            token = request.COOKIES.get('session_token', '').strip()
        if not token:
            return JsonResponse(
                {'error': 'Unauthorized', 'message': 'Thiếu session token', 'force_logout': True},
                status=401
            )
        try:
            user = CustomUser.objects.get(session_token=token)
        except CustomUser.DoesNotExist:
            return JsonResponse(
                {'error': 'Session expired', 'message': 'Phiên đăng nhập đã hết hạn', 'force_logout': True},
                status=401
            )
        if not user.is_active:
            return JsonResponse(
                {'error': 'Account locked', 'message': 'Tài khoản của bạn đã bị khoá', 'force_logout': True},
                status=403
            )
        request.session_user = user
        return view_func(request, *args, **kwargs)
    return wrapper


def require_role(allowed_roles):
    """
    Kiểm tra role của session_user.
    Phải đặt SAU @require_session (để có request.session_user).
    Trả 403 Forbidden nếu role không nằm trong allowed_roles.
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            user = getattr(request, 'session_user', None)
            if not user:
                return JsonResponse(
                    {'error': 'Unauthorized', 'force_logout': True},
                    status=401
                )
            if user.role not in allowed_roles:
                return JsonResponse(
                    {'error': 'Forbidden', 'message': f'Vai trò "{user.role}" không có quyền truy cập'},
                    status=403
                )
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def audit_log(view_func):
    """
    Ghi log hành động vào bảng AuditLog.
    Phải đặt SAU @require_session (để có request.session_user).
    Log: user_id | role | endpoint | method | status_code | ip | timestamp
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        import time
        start_time = time.time()
        response = view_func(request, *args, **kwargs)
        execution_time_ms = round((time.time() - start_time) * 1000, 2)
        try:
            from student_management.models import AuditLog
            user = getattr(request, 'session_user', None)
            AuditLog.objects.create(
                user=user,
                role=user.role if user else 'anonymous',
                endpoint=request.path[:255],
                method=request.method[:10],
                status_code=response.status_code,
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                execution_time_ms=execution_time_ms,
                is_suspicious=is_suspicious_request(request.path, request.method, response.status_code),
            )
            # Đánh dấu để GlobalAuditMiddleware không ghi trùng lặp
            request._audit_log_recorded = True
        except Exception:
            pass  # Không để audit log crash API
        return response
    return wrapper


def rate_limit(max_requests=5, window_seconds=60):
    """
    Giới hạn số request trong khoảng thời gian.
    Key: rate_limit:{user_id hoặc IP}:{endpoint}
    Trả 429 Too Many Requests khi vượt ngưỡng.
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            user = getattr(request, 'session_user', None)
            identifier = str(user.id) if user else _get_client_ip(request)
            cache_key = f'rate_limit:{identifier}:{request.path}'

            current_count = cache.get(cache_key, 0)
            if current_count >= max_requests:
                return JsonResponse(
                    {
                        'error': 'Too Many Requests',
                        'message': f'Vượt quá giới hạn {max_requests} request / {window_seconds} giây. Vui lòng thử lại sau.',
                    },
                    status=429
                )

            cache.set(cache_key, current_count + 1, window_seconds)
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
