"""
student_management/views/admin/__init__.py
Package chứa các views dành riêng cho Quản trị viên (Admin Portal).
"""
from student_management.views.admin.auth import (
    admin_login_page,
    admin_logout_page,
)
from student_management.views.admin.dashboard import (
    admin_dashboard_page,
    api_admin_stats,
    api_admin_audit_logs,
    api_admin_purge_audit_logs,
    api_admin_security_analytics,
    api_admin_users,
    api_admin_force_logout,
    api_admin_toggle_user,
    api_admin_ghost_accounts,
    api_admin_ping,
)
from student_management.views.admin.export import (
    api_export_excel,
)
from student_management.views.admin.management import (
    api_copy_classes_semester,
)
from student_management.views.admin.academic import (
    api_admin_students,
    api_admin_toggle_tuition,
    api_admin_grades,
    api_admin_teachers,
    api_admin_classes,
    api_admin_update_schedule,
    api_admin_semesters,
)
from student_management.views.admin.admissions import (
    api_admin_admissions,
    api_admin_admission_approve,
    api_admin_admission_reject,
)

__all__ = [
    'admin_login_page',
    'admin_logout_page',
    'admin_dashboard_page',
    'api_admin_stats',
    'api_admin_audit_logs',
    'api_admin_purge_audit_logs',
    'api_admin_security_analytics',
    'api_admin_users',
    'api_admin_force_logout',
    'api_admin_toggle_user',
    'api_admin_ghost_accounts',
    'api_admin_ping',
    'api_export_excel',
    'api_copy_classes_semester',
    'api_admin_students',
    'api_admin_toggle_tuition',
    'api_admin_grades',
    'api_admin_teachers',
    'api_admin_classes',
    'api_admin_update_schedule',
    'api_admin_semesters',
    'api_admin_admissions',
    'api_admin_admission_approve',
    'api_admin_admission_reject',
]
