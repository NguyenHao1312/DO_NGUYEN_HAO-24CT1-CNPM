"""
student_management/views/auth.py
Forwarder sang student_management/views/user/auth.py (Backward compatibility).
"""
from student_management.views.user.auth import (
    _get_client_ip,
    api_register,
    api_login,
    api_logout,
    api_session_check,
)

__all__ = [
    '_get_client_ip',
    'api_register',
    'api_login',
    'api_logout',
    'api_session_check',
]
