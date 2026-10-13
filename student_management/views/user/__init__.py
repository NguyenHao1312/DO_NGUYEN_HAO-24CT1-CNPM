"""
student_management/views/user/__init__.py
Package chứa các views dùng chung cho Người dùng (Student & Teacher):
- Auth: Đăng ký, Đăng nhập, Đăng xuất, Session Check (chặn Admin ở cổng public).
- Sync: Đồng bộ dữ liệu xuống/lên DB (lọc theo role).
- AI: Trợ lý AI Assistant tích hợp Gemini / Offline KB.
- Pages: Render các trang giao diện công khai (index, review).
- API: Kiểm tra khoá bảng điểm, danh sách học kì.
"""
from student_management.views.user.auth import (
    api_register,
    api_login,
    api_logout,
    api_session_check,
    api_check_code,
)
from student_management.views.user.sync import (
    api_sync_down,
    api_sync_up,
)
from student_management.views.user.ai import (
    api_ai_chat,
)
from student_management.views.user.pages import (
    index,
    review,
)
from student_management.views.user.api import (
    api_grade_lock_status,
    api_semesters,
)

__all__ = [
    'api_register',
    'api_login',
    'api_logout',
    'api_session_check',
    'api_check_code',
    'api_sync_down',
    'api_sync_up',
    'api_ai_chat',
    'index',
    'review',
    'api_grade_lock_status',
    'api_semesters',
]
