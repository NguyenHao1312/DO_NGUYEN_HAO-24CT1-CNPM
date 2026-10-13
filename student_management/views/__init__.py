"""
student_management/views/__init__.py
Explicit imports — phân vùng theo vai trò: User, Student, Teacher, Admin.

Cấu trúc phân vùng:
├── views/
│   ├── user/                → Shared cho Student & Teacher (Auth, Pages, Sync, AI, Academic Status)
│   │   ├── auth.py          → Register, Login, Logout, Session check (chặn Admin ở public)
│   │   ├── sync.py          → Sync down / sync up data theo role
│   │   ├── ai.py            → Trợ lý AI Assistant (Gemini / Offline KB)
│   │   ├── pages.py         → Render public HTML pages (index, review)
│   │   └── api.py           → Shared status (grade_lock_status, semesters)
│   │
│   ├── student/             → Sinh viên (Student Portal)
│   │   └── portal.py        → Profile, học phí cá nhân, tiến độ học tập
│   │
│   ├── teacher/             → Giảng viên (Teacher Portal & APIs)
│   │   └── attendance.py    → Attendance APIs & điểm danh
│   │
│   └── admin/               → Quản trị viên (Admin Portal & Local Control Panel)
│       ├── academic.py      → Quản lý điểm, học phí, lớp học, thời khóa biểu
│       ├── auth.py          → Đăng nhập, đăng xuất Admin Local
│       ├── dashboard.py     → Dashboard KPIs, quản lý người dùng, audit logs
│       ├── export.py        → Xuất báo cáo Excel
│       └── management.py    → Nhân bản môn học & lớp học kì
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

# ── Admin Views (Quản trị viên) ──
from student_management.views.admin import (
    admin_login_page,
    admin_logout_page,
    admin_dashboard_page,
    api_admin_stats,
    api_admin_audit_logs,
    api_admin_security_analytics,
    api_admin_users,
    api_admin_force_logout,
    api_admin_toggle_user,
    api_admin_ghost_accounts,
    api_export_excel,
    api_copy_classes_semester,
    api_admin_students,
    api_admin_toggle_tuition,
    api_admin_grades,
    api_admin_teachers,
    api_admin_classes,
    api_admin_update_schedule,
    api_admin_semesters,
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
    # Admin
    'admin_login_page',
    'admin_logout_page',
    'admin_dashboard_page',
    'api_admin_stats',
    'api_admin_audit_logs',
    'api_admin_security_analytics',
    'api_admin_users',
    'api_admin_force_logout',
    'api_admin_toggle_user',
    'api_admin_ghost_accounts',
    'api_export_excel',
    'api_copy_classes_semester',
    'api_admin_students',
    'api_admin_toggle_tuition',
    'api_admin_grades',
    'api_admin_teachers',
    'api_admin_classes',
    'api_admin_update_schedule',
    'api_admin_semesters',
]
