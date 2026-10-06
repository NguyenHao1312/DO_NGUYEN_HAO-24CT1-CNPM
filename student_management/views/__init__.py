"""
student_management/views/__init__.py
Explicit imports — phân vùng theo role.

Cấu trúc mới:
├── views/
│   ├── auth.py              → Shared (login, register, logout, session)
│   ├── pages.py             → Shared (render HTML pages)
│   ├── sync.py              → Shared (sync data với filter theo role)
│   ├── api.py               → Shared (grade_lock_status, semesters)
│   ├── admin/               → Admin-only views
│   │   ├── dashboard.py     → Admin dashboard + user management
│   │   ├── export.py        → Export Excel
│   │   └── management.py    → Copy classes semester
│   └── teacher/             → Teacher + Admin views
│       └── attendance.py    → Attendance APIs
"""

# ── Pages (Shared) ──
from .pages import index, review

# ── Auth (Shared — public endpoints) ──
from .auth import api_register, api_login, api_logout, api_session_check

# ── Sync (Shared — filtered by role) ──
from .sync import api_sync_down, api_sync_up

# ── Shared API (mọi role đã login) ──
from .api import api_grade_lock_status, api_semesters

# ── Teacher APIs (admin + teacher) ──
from .teacher import api_attendance, api_attendance_summarize

# ── Admin APIs (admin only) ──
from .admin import (
    admin_dashboard_page, api_admin_stats, api_admin_audit_logs,
    api_admin_users, api_admin_force_logout, api_admin_toggle_user,
    api_export_excel, api_copy_classes_semester,
)
