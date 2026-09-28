"""
student_management/middleware.py
SingleSessionMiddleware — Bảo mật đăng nhập phía server.

Quy tắc:
- Cùng IP + cùng User-Agent (cùng trình duyệt, đa tab): GIỮ đăng nhập.
- Khác IP hoặc khác User-Agent (thiết bị/trình duyệt/tab ẩn danh): 
  FORCE LOGOUT session cũ, trả HTTP 401 + thông báo cụ thể.
"""
from django.http import JsonResponse


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
        """Lấy IP thực của client (hỗ trợ proxy/load balancer)."""
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0].strip()
        x_real = request.META.get('HTTP_X_REAL_IP')
        if x_real:
            return x_real.strip()
        return request.META.get('REMOTE_ADDR', '')

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
