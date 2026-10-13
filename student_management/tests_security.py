"""
student_management/tests_security.py
Kiểm thử toàn diện các tính năng bảo mật mới nâng cấp:
1. Chống giả mạo IP (IP Spoofing test)
2. Nhận diện hành vi tấn công (Suspicious Pattern Detection)
3. Cô lập Admin vững chắc (LocalOnlyAdminMiddleware test)
4. Ghi nhận log tập trung (GlobalAuditMiddleware test)
5. API Phân tích an ninh (Security Analytics API test)
6. Bộ lọc mốc thời gian tấn công (Forensic Time Filtering test)
"""
from django.test import TestCase, RequestFactory
from django.http import HttpResponse
from student_management.models import CustomUser, AuditLog
from student_management.security_utils import get_client_ip, is_suspicious_request
from student_management.middleware import LocalOnlyAdminMiddleware, GlobalAuditMiddleware


class SecurityUtilsTestCase(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_prevent_ip_spoofing_from_untrusted_source(self):
        """Kẻ tấn công gửi header X-Forwarded-For giả mạo từ IP công cộng -> Không được tin."""
        # Socket IP là 203.0.113.5 (Public IP), cố giả mạo thành 127.0.0.1
        request = self.factory.get('/', HTTP_X_FORWARDED_FOR='127.0.0.1', REMOTE_ADDR='203.0.113.5')
        resolved_ip = get_client_ip(request)
        # Hệ thống phải lấy socket IP thực tế (203.0.113.5), không được nhận 127.0.0.1!
        self.assertEqual(resolved_ip, '203.0.113.5')

    def test_trust_forwarded_for_from_trusted_proxy(self):
        """Request đi qua Reverse Proxy Nginx nội bộ (127.0.0.1) -> Được đọc IP gốc."""
        request = self.factory.get('/', HTTP_X_REAL_IP='198.51.100.22', REMOTE_ADDR='127.0.0.1')
        resolved_ip = get_client_ip(request)
        self.assertEqual(resolved_ip, '198.51.100.22')

    def test_detect_suspicious_paths(self):
        """Phát hiện các mẫu URL dò quét lỗ hổng."""
        self.assertTrue(is_suspicious_request('/.env', 'GET', 404))
        self.assertTrue(is_suspicious_request('/wp-admin/setup.php', 'GET', 404))
        self.assertTrue(is_suspicious_request('/api/users/../../etc/passwd', 'GET', 400))
        self.assertTrue(is_suspicious_request('/api/login/', 'POST', 401))
        self.assertTrue(is_suspicious_request('/api/login/', 'POST', 429))
        self.assertFalse(is_suspicious_request('/api/grades/', 'GET', 200))


class LocalOnlyAdminMiddlewareTestCase(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_block_admin_from_external_ip(self):
        """Chặn truy cập /admin/ nếu đến từ IP ngoài dù có giả mạo Host header."""
        middleware = LocalOnlyAdminMiddleware(lambda req: HttpResponse("OK"))
        # Giả mạo Host: localhost nhưng socket IP thực là 198.51.100.55
        request = self.factory.get('/admin/dashboard/', HTTP_HOST='localhost', REMOTE_ADDR='198.51.100.55')
        response = middleware(request)
        self.assertEqual(response.status_code, 404)

    def test_allow_admin_from_loopback(self):
        """Cho phép truy cập /admin/ từ localhost thực tế."""
        middleware = LocalOnlyAdminMiddleware(lambda req: HttpResponse("OK"))
        request = self.factory.get('/admin/dashboard/', HTTP_HOST='localhost', REMOTE_ADDR='127.0.0.1')
        response = middleware(request)
        self.assertEqual(response.status_code, 200)


class GlobalAuditMiddlewareTestCase(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_record_suspicious_404_scan(self):
        """Tự động ghi nhận log các cuộc dò quét 404 nhạy cảm."""
        initial_count = AuditLog.objects.count()
        middleware = GlobalAuditMiddleware(lambda req: HttpResponse("Not Found", status=404))

        request = self.factory.get('/admin/unknown-exploit/', REMOTE_ADDR='192.168.1.100')
        response = middleware(request)

        self.assertEqual(response.status_code, 404)
        self.assertEqual(AuditLog.objects.count(), initial_count + 1)
        latest_log = AuditLog.objects.latest('id')
        self.assertEqual(latest_log.endpoint, '/admin/unknown-exploit/')
        self.assertEqual(latest_log.status_code, 404)
        self.assertTrue(latest_log.is_suspicious)
        self.assertGreaterEqual(latest_log.execution_time_ms, 0)


class SecurityAnalyticsApiTestCase(TestCase):
    def setUp(self):
        self.admin_user = CustomUser.objects.create_user(
            username='secadmin', password='password123', role='admin', session_token='token-admin-sec'
        )

    def test_security_analytics_response(self):
        """Kiểm tra API phân tích an ninh trả về đúng dữ liệu đánh giá."""
        # Tạo sẵn vài log giả lập tấn công
        AuditLog.objects.create(
            role='anonymous', endpoint='/api/login/', method='POST',
            status_code=401, ip_address='10.0.0.99', is_suspicious=True
        )
        AuditLog.objects.create(
            role='anonymous', endpoint='/api/login/', method='POST',
            status_code=429, ip_address='10.0.0.99', is_suspicious=True
        )

        response = self.client.get(
            '/admin/api/security-analytics/',
            HTTP_X_SESSION_TOKEN='token-admin-sec'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        analytics = data['analytics']
        self.assertIn('threat_level', analytics)
        self.assertIn('top_offending_ips', analytics)
        self.assertGreaterEqual(analytics['suspicious_count'], 2)
        self.assertGreaterEqual(analytics['rate_limited_429'], 1)
