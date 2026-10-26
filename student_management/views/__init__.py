"""
student_management/views/__init__.py
Explicit imports — phân vùng theo vai trò: User, Student, Teacher, Admin, Admission.
"""

# ── User Views (Dùng chung cho Sinh viên & Giáo viên) ──
from student_management.views.user import (
    index,
    review,
    api_register,
    api_login,
    api_logout,
    api_session_check,
    api_check_code,
    api_change_password,
    api_sync_down,
    api_sync_up,
    api_ai_chat,
    api_grade_lock_status,
    api_semesters,
)

# ── Student Views (Sinh viên) ──
from student_management.views.student import (
    api_student_profile,
)

# ── Teacher Views (Giáo viên) ──
from student_management.views.teacher import (
    api_attendance,
    api_attendance_summarize,
)

# ── Admission Views (Xét Nguyện Vọng Tuyển Sinh) ──
from student_management.views.admission import (
    admission_page,
    api_admission_universities,
    api_admission_apply,
    api_admission_check_duplicate,
    api_admission_verify_otp,
    api_admission_resend_otp,
    api_admission_check_status,
)

# ── Admin Views (Quản trị viên) ──
from student_management.views.admin import (
    admin_login_page,
    admin_logout_page,
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
    api_export_excel,
    api_copy_classes_semester,
    api_admin_students,
    api_admin_toggle_tuition,
    api_admin_grades,
    api_admin_teachers,
    api_admin_classes,
    api_admin_update_schedule,
    api_admin_semesters,
    api_admin_admissions,
    api_admin_admission_approve,
    api_admin_admission_reject,
)

__all__ = [
    # User
    'index',
    'review',
    'api_register',
    'api_login',
    'api_logout',
    'api_session_check',
    'api_check_code',
    'api_change_password',
    'api_sync_down',
    'api_sync_up',
    'api_ai_chat',
    'api_grade_lock_status',
    'api_semesters',
    # Student
    'api_student_profile',
    # Teacher
    'api_attendance',
    'api_attendance_summarize',
    # Admission
    'admission_page',
    'api_admission_universities',
    'api_admission_apply',
    'api_admission_check_duplicate',
    'api_admission_verify_otp',
    'api_admission_resend_otp',
    'api_admission_check_status',
    # Admin
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
