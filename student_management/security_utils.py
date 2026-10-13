"""
student_management/security_utils.py
Tiện ích bảo mật chuẩn cho hệ thống UniMS.
- get_client_ip: Xác định Client IP an toàn, chống giả mạo header X-Forwarded-For.
- is_suspicious_path: Nhận diện các mẫu URL dò quét lỗ hổng (scanner, crawler xấu).
"""
import ipaddress
import os
from django.conf import settings

# Danh sách IP của Reverse Proxy tin cậy (Nginx, Docker Gateway, Localhost)
DEFAULT_TRUSTED_PROXIES = [
    '127.0.0.1',
    '::1',
    '172.16.0.0/12',  # Docker network range
    '192.168.0.0/16', # Private LAN
    '10.0.0.0/8',     # Private LAN
]

# Các pattern URL thường gặp trong các đợt quét tấn công tự động
KNOWN_ATTACK_PATTERNS = [
    '.env', '.git', 'wp-admin', 'phpmyadmin', 'eval-stdin',
    'shell', 'setup.php', 'actuator', 'solr', 'boaform',
    '..', '../', 'etc/passwd', 'win.ini'
]


def _is_ip_in_network(ip_str, network_or_ip):
    """Kiểm tra một IP string có thuộc về subnet hoặc IP tin cậy không."""
    try:
        ip = ipaddress.ip_address(ip_str)
        if '/' in network_or_ip:
            return ip in ipaddress.ip_network(network_or_ip, strict=False)
        return ip == ipaddress.ip_address(network_or_ip)
    except ValueError:
        return False


def is_trusted_proxy(ip_str):
    """Kiểm tra xem socket IP có phải là reverse proxy tin cậy không."""
    if not ip_str:
        return False

    trusted_configs = getattr(settings, 'TRUSTED_PROXIES', DEFAULT_TRUSTED_PROXIES)
    for trusted in trusted_configs:
        if _is_ip_in_network(ip_str, trusted):
            return True
    return False


def get_client_ip(request):
    """
    Xác định địa chỉ IP thực của Client:
    1. Nếu kết nối trực tiếp (REMOTE_ADDR không phải trusted proxy):
       -> LUÔN LẤY REMOTE_ADDR, KHÔNG TIN X-Forwarded-For (Chống IP Spoofing).
    2. Nếu REMOTE_ADDR là Trusted Proxy (vd: Nginx):
       -> Đọc chuỗi X-Forwarded-For từ phải sang trái hoặc lấy X-Real-IP đã được Nginx làm sạch.
    """
    remote_addr = request.META.get('REMOTE_ADDR', '').strip()
    if not remote_addr:
        return '127.0.0.1'

    # Nếu không đi qua Proxy tin cậy, không tin bất kỳ header nào từ client gửi lên!
    if not is_trusted_proxy(remote_addr):
        return remote_addr

    # Nếu đi qua Trusted Proxy:
    # 1. Ưu tiên HTTP_X_REAL_IP (thường được Nginx gán cứng bằng $remote_addr thực tế)
    x_real_ip = request.META.get('HTTP_X_REAL_IP', '').strip()
    if x_real_ip:
        return x_real_ip

    # 2. Xử lý chuỗi X-Forwarded-For (dạng: client, proxy1, proxy2)
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if x_forwarded:
        ips = [ip.strip() for ip in x_forwarded.split(',') if ip.strip()]
        # Lấy IP đầu tiên ngoài danh sách trusted proxies từ cuối về đầu
        for ip in reversed(ips):
            if not is_trusted_proxy(ip):
                return ip
        if ips:
            return ips[0]

    return remote_addr


def is_suspicious_request(path, method, status_code):
    """
    Phát hiện xem request có hành vi đáng ngờ không:
    - Status code lỗi phân quyền hoặc server error (401, 403, 404, 429, 500)
    - Path chứa mẫu tấn công thăm dò (fuzzing / scanning)
    """
    path_lower = (path or '').lower()
    for pattern in KNOWN_ATTACK_PATTERNS:
        if pattern in path_lower:
            return True

    if status_code in (401, 403, 429, 500):
        return True

    # 404 trên các endpoint không thuộc luồng bình thường
    if status_code == 404 and (path_lower.startswith('/admin') or path_lower.startswith('/api/')):
        return True

    return False
