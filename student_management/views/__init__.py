"""
student_management/views/__init__.py
Explicit imports — không dùng wildcard (from .x import *).
"""
# Pages
from .pages import index, review

# Auth
from .auth import api_register, api_login, api_logout, api_session_check

# Sync
from .sync import api_sync_down, api_sync_up

# API
from .api import (
    api_attendance, api_attendance_summarize,
    api_grade_lock_status, api_semesters,
    api_copy_classes_semester,
)

# Export
from .export import api_export_excel

# Admin Dashboard
from .admin_dashboard import (
    admin_dashboard_page, api_admin_stats, api_admin_audit_logs,
    api_admin_users, api_admin_force_logout, api_admin_toggle_user,
)
