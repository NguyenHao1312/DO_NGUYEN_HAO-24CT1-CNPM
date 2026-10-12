"""
student_management/views/admin/__init__.py
Package chứa các views dành riêng cho Admin.
"""
from .auth import admin_login_page, admin_logout_page
from .dashboard import (
    admin_dashboard_page,
    api_admin_stats,
    api_admin_audit_logs,
    api_admin_users,
    api_admin_force_logout,
    api_admin_toggle_user,
)
from .export import api_export_excel
from .management import api_copy_classes_semester

