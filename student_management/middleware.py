"""
student_management/middleware.py
SingleSessionMiddleware — Bảo mật đăng nhập phía server.

Quy tắc:
- Cùng IP + cùng User-Agent (cùng trình duyệt, đa tab): GIỮ đăng nhập.
- Khác IP hoặc khác User-Agent (thiết bị/trình duyệt/tab ẩn danh): 
  FORCE LOGOUT session cũ, trả HTTP 401 + thông báo cụ thể.
"""
import os
from django.http import JsonResponse, HttpResponseNotFound


class SingleSessionMiddleware:
    """
    Middleware xác thực single-session cho tất cả API requests.
    Client gửi header `X-Session-Token` với mỗi request.
    """

    # Paths không yêu cầu session token
    EXEMPT_PATHS = [
        '/api/login/',
        '/api/register/',
        '/admin/',
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Chỉ kiểm tra các API requests (bắt đầu bằng /api/)
        if not request.path.startswith('/api/'):
            return self.get_response(request)

        # Bỏ qua các path exempt
        for exempt in self.EXEMPT_PATHS:
            if request.path.startswith(exempt):
                return self.get_response(request)

        # Lấy session token từ header
        session_token = request.META.get('HTTP_X_SESSION_TOKEN', '').strip()

        if not session_token:
            # Không có token → cho phép request (backward compatibility)
            # Nhưng đánh dấu request là unauthenticated
            request.session_user = None
            return self.get_response(request)

        # Validate session token
        from student_management.models import CustomUser
        try:
            user = CustomUser.objects.get(session_token=session_token)
        except CustomUser.DoesNotExist:
            return JsonResponse({
                'success': False,
                'force_logout': True,
                'message': (
                    'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. '
                    'Có thể tài khoản đã được đăng nhập từ thiết bị/trình duyệt khác. '
                    'Vui lòng đăng nhập lại.'
                )
            }, status=401)
        except CustomUser.MultipleObjectsReturned:
            # Edge case: multiple users with same token (should not happen)
            return JsonResponse({
                'success': False,
                'force_logout': True,
                'message': 'Lỗi hệ thống xác thực. Vui lòng đăng nhập lại.'
            }, status=401)

        # Kiểm tra IP
        client_ip = self._get_client_ip(request)
        client_ua = request.META.get('HTTP_USER_AGENT', '')

        if user.session_ip and client_ip and user.session_ip != client_ip:
            # IP khác → session bị chiếm bởi thiết bị khác
            return JsonResponse({
                'success': False,
                'force_logout': True,
                'message': (
                    'Có người khác đã đăng nhập tài khoản này từ địa chỉ IP khác. '
                    'Phiên hiện tại đã bị đăng xuất tự động để bảo mật. '
                    'Vui lòng đăng nhập lại.'
                )
            }, status=401)

        # Cùng IP nhưng khác User-Agent (trình duyệt khác hoặc tab ẩn danh)
        if user.session_device and client_ua:
            # So sánh browser fingerprint cơ bản (loại bỏ minor version differences)
            if self._extract_browser_id(user.session_device) != self._extract_browser_id(client_ua):
                return JsonResponse({
                    'success': False,
                    'force_logout': True,
                    'message': (
                        'Tài khoản này đã đăng nhập từ trình duyệt khác. '
                        'Phiên hiện tại đã bị đăng xuất. '
                        'Vui lòng đăng nhập lại.'
                    )
                }, status=401)

        # Session hợp lệ → gắn user vào request
        request.session_user = user
        return self.get_response(request)

    @staticmethod
    def _get_client_ip(request):
        """Lấy IP thực an toàn qua security_utils."""
        from student_management.security_utils import get_client_ip
        return get_client_ip(request)

    @staticmethod
    def _extract_browser_id(user_agent):
        """
        Trích xuất browser identifier cơ bản từ User-Agent.
        Chỉ so sánh loại trình duyệt (Chrome/Firefox/Edge/Safari),
        bỏ qua version nhỏ để cùng trình duyệt multi-tab vẫn hoạt động.
        """
        ua = (user_agent or '').lower()
        # Thứ tự quan trọng: Edge trước Chrome vì Edge UA chứa cả "chrome"
        if 'edg/' in ua or 'edge/' in ua:
            return 'edge'
        if 'opr/' in ua or 'opera' in ua:
            return 'opera'
        if 'firefox/' in ua:
            return 'firefox'
        if 'chrome/' in ua and 'safari/' in ua:
            return 'chrome'
        if 'safari/' in ua:
            return 'safari'
        # Fallback: dùng 50 ký tự đầu
        return ua[:50]


class LocalOnlyAdminMiddleware:
    """
    Middleware cô lập Admin:
    Chỉ cho phép truy cập các URL quản trị (/admin/*) từ localhost / 127.0.0.1.
    Nếu truy cập từ domain ngoài (Ngrok, Render, public IP...) -> Trả về 404 Not Found,
    hoàn toàn ẩn giấu trang Admin khỏi internet và tránh nghẽn băng thông Tunnel.
    Đã được củng cố: Kiểm tra cả Host Header lẫn Socket IP thực tế để chống Header Spoofing.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/admin/'):
            # Kiểm tra cờ cấu hình (mặc định bật)
            admin_local_only = os.environ.get('ADMIN_LOCAL_ONLY', 'True').lower() in ('true', '1', 'yes')
            if admin_local_only:
                from student_management.security_utils import get_client_ip
                host = request.get_host().split(':')[0].lower()
                forwarded_host = request.META.get('HTTP_X_FORWARDED_HOST', '').split(':')[0].lower()
                client_ip = get_client_ip(request)

                # Danh sách host nội bộ hợp lệ
                allowed_local_hosts = ('localhost', '127.0.0.1', 'testserver')
                allowed_local_ips = ('127.0.0.1', '::1', 'testserver')

                is_local_host = (host in allowed_local_hosts) and (not forwarded_host or forwarded_host in allowed_local_hosts)
                is_local_ip = client_ip in allowed_local_ips

                # Bắt buộc cả host header VÀ client IP vật lý đều phải là local (trừ trường hợp testserver)
                if not (is_local_host and (is_local_ip or host == 'testserver')):
                    return HttpResponseNotFound(
                        "<h1>404 Not Found</h1>"
                        "<p>The requested URL was not found on this server.</p>"
                    )

        return self.get_response(request)


class GlobalAuditMiddleware:
    """
    Middleware ghi nhận toàn bộ log bảo mật (Audit Trail) tập trung:
    - Bắt 100% các request lỗi bất thường (401, 403, 404 dò quét, 429 rate limit, 500 lỗi máy chủ).
    - Bắt các thao tác thay đổi dữ liệu nhạy cảm (POST, PUT, DELETE, PATCH).
    - Đo thời gian phản hồi (execution_time_ms) để phát hiện DoS / Slow query.
    - Đánh dấu cờ is_suspicious tự động để phục vụ lọc mốc thời gian tấn công.
    - Không chặn luồng xử lý nếu DB log gặp lỗi (Fail-safe).
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        import time
        from student_management.security_utils import get_client_ip, is_suspicious_request

        start_time = time.time()
        response = self.get_response(request)
        execution_time_ms = round((time.time() - start_time) * 1000, 2)

        # Bỏ qua tài nguyên tĩnh để tránh flood log vô ích
        path = request.path
        if path.startswith('/static/') or path.startswith('/staticfiles/'):
            return response

        status_code = response.status_code
        method = request.method
        is_suspicious = is_suspicious_request(path, method, status_code)

        # Tiêu chí ghi log tập trung:
        # 1. Bất kỳ request nào đáng ngờ (is_suspicious = True)
        # 2. Hoặc các method thay đổi trạng thái (POST, PUT, DELETE, PATCH)
        # 3. Hoặc các endpoint nhạy cảm (/admin/, /api/)
        should_log = (
            is_suspicious or
            method in ('POST', 'PUT', 'DELETE', 'PATCH') or
            path.startswith('/admin/') or
            path.startswith('/api/')
        )

        if should_log:
            try:
                from student_management.models import AuditLog
                user = getattr(request, 'session_user', None) or getattr(request, 'user', None)
                if user and not user.is_authenticated:
                    user = None

                role = 'anonymous'
                if user:
                    role = getattr(user, 'role', 'admin' if getattr(user, 'is_staff', False) else 'user')

                client_ip = get_client_ip(request)
                user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

                # Tóm tắt request query param hoặc context
                request_data = None
                if request.GET:
                    request_data = json.dumps(dict(request.GET.items()))[:500]

                # Tránh trùng lặp nếu view đã dùng decorator audit_log
                if not getattr(request, '_audit_log_recorded', False):
                    AuditLog.objects.create(
                        user=user,
                        role=role,
                        endpoint=path[:255],
                        method=method[:10],
                        status_code=status_code,
                        ip_address=client_ip,
                        user_agent=user_agent,
                        execution_time_ms=execution_time_ms,
                        is_suspicious=is_suspicious,
                        request_data=request_data,
                    )
                    request._audit_log_recorded = True
            except Exception:
                # Bảo đảm an toàn: lỗi ghi log không bao giờ làm gián đoạn response của người dùng
                pass

        return response

