from django.urls import path
from student_management import views

urlpatterns = [
    # Auth
    path('api/login/', views.api_login, name='api_login'),
    path('api/logout/', views.api_logout, name='api_logout'),
    path('api/register/', views.api_register, name='api_register'),
    path('api/session/check/', views.api_session_check, name='api_session_check'),

    # Sync
    path('api/sync/down/', views.api_sync_down, name='api_sync_down'),
    path('api/sync/up/', views.api_sync_up, name='api_sync_up'),

    # AI Assistant
    path('api/ai/chat/', views.api_ai_chat, name='api_ai_chat'),

    # Attendance (Phase 2)
    path('api/attendance/', views.api_attendance, name='api_attendance'),
    path('api/attendance/summarize/', views.api_attendance_summarize, name='api_attendance_summarize'),

    # Grade Lock (Phase 2)
    path('api/grades/lock-status/', views.api_grade_lock_status, name='api_grade_lock_status'),

    # Semesters (Phase 2)
    path('api/semesters/', views.api_semesters, name='api_semesters'),

    # Copy Classes (Phase 2)
    path('api/classes/copy-semester/', views.api_copy_classes_semester, name='api_copy_classes_semester'),

    # Export Excel (Phase 2)
    path('api/export/excel/', views.api_export_excel, name='api_export_excel'),

    # Admin Portal & Dashboard
    path('admin/', views.admin_dashboard_page, name='admin_root'),
    path('admin/login/', views.admin_login_page, name='admin_login'),
    path('admin/logout/', views.admin_logout_page, name='admin_logout'),
    path('admin/dashboard/', views.admin_dashboard_page, name='admin_dashboard'),
    path('admin/api/stats/', views.api_admin_stats, name='api_admin_stats'),
    path('admin/api/audit-logs/', views.api_admin_audit_logs, name='api_admin_audit_logs'),
    path('admin/api/security-analytics/', views.api_admin_security_analytics, name='api_admin_security_analytics'),
    path('admin/api/users/', views.api_admin_users, name='api_admin_users'),
    path('admin/api/force-logout/', views.api_admin_force_logout, name='api_admin_force_logout'),
    path('admin/api/toggle-user/', views.api_admin_toggle_user, name='api_admin_toggle_user'),

    # Admin Academic Management APIs
    path('admin/api/students/', views.api_admin_students, name='api_admin_students'),
    path('admin/api/students/toggle-tuition/', views.api_admin_toggle_tuition, name='api_admin_toggle_tuition'),
    path('admin/api/grades/', views.api_admin_grades, name='api_admin_grades'),
    path('admin/api/teachers/', views.api_admin_teachers, name='api_admin_teachers'),
    path('admin/api/classes/', views.api_admin_classes, name='api_admin_classes'),
    path('admin/api/classes/update-schedule/', views.api_admin_update_schedule, name='api_admin_update_schedule'),
    path('admin/api/semesters/', views.api_admin_semesters, name='api_admin_semesters'),
]
