from django.urls import path
from student_management import views

urlpatterns = [
    # Auth & Account
    path('api/login/', views.api_login, name='api_login'),
    path('api/logout/', views.api_logout, name='api_logout'),
    path('api/register/', views.api_register, name='api_register'),
    path('api/check-code/', views.api_check_code, name='api_check_code'),
    path('api/session/check/', views.api_session_check, name='api_session_check'),
    path('api/change-password/', views.api_change_password, name='api_change_password'),

    # Sync
    path('api/sync/down/', views.api_sync_down, name='api_sync_down'),
    path('api/sync/up/', views.api_sync_up, name='api_sync_up'),

    # AI Assistant
    path('api/ai/chat/', views.api_ai_chat, name='api_ai_chat'),

    # Attendance
    path('api/attendance/', views.api_attendance, name='api_attendance'),
    path('api/attendance/summarize/', views.api_attendance_summarize, name='api_attendance_summarize'),

    # Grade Lock & Semesters
    path('api/grades/lock-status/', views.api_grade_lock_status, name='api_grade_lock_status'),
    path('api/semesters/', views.api_semesters, name='api_semesters'),
    path('api/classes/copy-semester/', views.api_copy_classes_semester, name='api_copy_classes_semester'),
    path('api/export/excel/', views.api_export_excel, name='api_export_excel'),

    # Public Admission Portal (Cổng Xét Tuyển & Nguyện Vọng)
    path('admission/', views.admission_page, name='admission_page'),
    path('api/admission/universities/', views.api_admission_universities, name='api_admission_universities'),
    path('api/admission/apply/', views.api_admission_apply, name='api_admission_apply'),
    path('api/admission/check-duplicate/', views.api_admission_check_duplicate, name='api_admission_check_duplicate'),
    path('api/admission/verify-otp/', views.api_admission_verify_otp, name='api_admission_verify_otp'),
    path('api/admission/resend-otp/', views.api_admission_resend_otp, name='api_admission_resend_otp'),
    path('api/admission/check-status/', views.api_admission_check_status, name='api_admission_check_status'),

    # Admin Portal & Dashboard
    path('admin/', views.admin_dashboard_page, name='admin_root'),
    path('admin/login/', views.admin_login_page, name='admin_login'),
    path('admin/logout/', views.admin_logout_page, name='admin_logout'),
    path('admin/dashboard/', views.admin_dashboard_page, name='admin_dashboard'),
    path('admin/api/stats/', views.api_admin_stats, name='api_admin_stats'),
    path('admin/api/audit-logs/', views.api_admin_audit_logs, name='api_admin_audit_logs'),
    path('admin/api/audit-logs/purge/', views.api_admin_purge_audit_logs, name='api_admin_purge_audit_logs'),
    path('admin/api/security-analytics/', views.api_admin_security_analytics, name='api_admin_security_analytics'),
    path('admin/api/users/', views.api_admin_users, name='api_admin_users'),
    path('admin/api/force-logout/', views.api_admin_force_logout, name='api_admin_force_logout'),
    path('admin/api/toggle-user/', views.api_admin_toggle_user, name='api_admin_toggle_user'),
    path('admin/api/ghost-accounts/', views.api_admin_ghost_accounts, name='api_admin_ghost_accounts'),
    path('admin/api/ping/', views.api_admin_ping, name='api_admin_ping'),

    # Admin Academic Management APIs
    path('admin/api/students/', views.api_admin_students, name='api_admin_students'),
    path('admin/api/students/toggle-tuition/', views.api_admin_toggle_tuition, name='api_admin_toggle_tuition'),
    path('admin/api/grades/', views.api_admin_grades, name='api_admin_grades'),
    path('admin/api/teachers/', views.api_admin_teachers, name='api_admin_teachers'),
    path('admin/api/classes/', views.api_admin_classes, name='api_admin_classes'),
    path('admin/api/classes/update-schedule/', views.api_admin_update_schedule, name='api_admin_update_schedule'),
    path('admin/api/semesters/', views.api_admin_semesters, name='api_admin_semesters'),

    # Admin Admission Applications Management
    path('admin/api/admissions/', views.api_admin_admissions, name='api_admin_admissions'),
    path('admin/api/admissions/approve/', views.api_admin_admission_approve, name='api_admin_admission_approve'),
    path('admin/api/admissions/reject/', views.api_admin_admission_reject, name='api_admin_admission_reject'),
]
