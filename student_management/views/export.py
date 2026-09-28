"""
student_management/views/export.py
API endpoint: Export dữ liệu ra Excel (.xlsx).
Chỉ Admin mới được phép. Có Rate Limit và Audit Log.
"""
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from ..models import (
    Student, Teacher, CourseClass,
    Grade, Registration, Attendance,
)
from ..decorators import require_session, require_role, audit_log, rate_limit


# ============================================================
#  API: EXPORT EXCEL — Xuất dữ liệu ra file .xlsx
#  Admin only + Rate limit 5 req/60s + Audit log
# ============================================================
@require_session
@require_role(['admin'])
@rate_limit(max_requests=5, window_seconds=60)
@audit_log
def api_export_excel(request):
    """
    GET: Export data ra .xlsx (Admin only).
      ?type=students|teachers|classes|grades|registrations|attendance
    Mỗi type trả về 1 file .xlsx riêng.
    """
    from openpyxl import Workbook

    export_type = request.GET.get('type', 'students')

    wb = Workbook()
    ws = wb.active

    if export_type == 'students':
        ws.title = 'Sinh viên'
        ws.append(['Mã SV', 'Họ tên', 'Email', 'SĐT', 'Ngày sinh', 'Giới tính',
                    'Khoa', 'Niên khoá', 'Trạng thái', 'GPA (Hệ 4)', 'GPA (Hệ 10)', 'Nợ học phí'])
        for s in Student.objects.all():
            ws.append([
                s.student_id, s.full_name, s.email or '', s.phone or '',
                str(s.dob) if s.dob else '', s.get_gender_display() if s.gender else '',
                s.department, s.academic_year or '', s.get_status_display(),
                s.gpa, s.gpa10, 'Có' if s.tuition_debt else 'Không',
            ])

    elif export_type == 'teachers':
        ws.title = 'Giáo viên'
        ws.append(['Mã GV', 'Họ tên', 'Email', 'SĐT', 'Khoa', 'Chuyên ngành',
                    'Học vị', 'Chức vụ', 'Trạng thái'])
        for t in Teacher.objects.all():
            ws.append([
                t.teacher_id, t.full_name, t.email or '', t.phone or '',
                t.department, t.specialization or '', t.degree or '',
                t.position or '', t.get_status_display(),
            ])

    elif export_type == 'classes':
        ws.title = 'Lớp học phần'
        ws.append(['Mã lớp', 'Tên môn', 'Giáo viên', 'Khoa', 'Lịch học',
                    'Phòng', 'Sĩ số tối đa', 'Số tín chỉ', 'Học kì'])
        for c in CourseClass.objects.select_related('teacher', 'semester').all():
            ws.append([
                c.class_code, c.name,
                c.teacher.full_name if c.teacher else '',
                c.department, c.schedule, c.room, c.max_students, c.credits,
                c.semester.name if c.semester else '',
            ])

    elif export_type == 'grades':
        ws.title = 'Bảng điểm'
        ws.append(['Mã SV', 'Họ tên SV', 'Mã lớp', 'Tên môn',
                    'CC (20%)', 'GK (30%)', 'CK (50%)', 'TB Hệ 10', 'TB Hệ 4',
                    'Điểm chữ', 'Xếp loại', 'Khoá TP', 'Khoá toàn bộ', 'Học kì'])
        for g in Grade.objects.select_related('student', 'course_class', 'semester').all():
            ws.append([
                g.student.student_id, g.student.full_name,
                g.course_class.class_code, g.course_class.name,
                g.assignment, g.midterm, g.final,
                g.average10, g.average4, g.letter_grade, g.classification,
                'Có' if g.is_component_locked else '', 'Có' if g.is_fully_locked else '',
                g.semester.name if g.semester else '',
            ])

    elif export_type == 'attendance':
        ws.title = 'Điểm danh'
        ws.append(['Mã SV', 'Họ tên SV', 'Mã lớp', 'Tên môn',
                    'Ngày', 'Buổi', 'Trạng thái', 'Ghi chú'])
        for a in Attendance.objects.select_related('student', 'course_class').all():
            ws.append([
                a.student.student_id, a.student.full_name,
                a.course_class.class_code, a.course_class.name,
                str(a.date), a.session_number, a.get_status_display(), a.note,
            ])

    elif export_type == 'registrations':
        ws.title = 'Đăng ký HP'
        ws.append(['Mã SV', 'Họ tên SV', 'Mã lớp', 'Tên môn',
                    'Trạng thái', 'Ngày ĐK', 'Học kì'])
        for r in Registration.objects.select_related('student', 'course_class', 'semester').all():
            ws.append([
                r.student.student_id, r.student.full_name,
                r.course_class.class_code, r.course_class.name,
                r.get_status_display(), str(r.registered_at),
                r.semester.name if r.semester else '',
            ])

    else:
        return JsonResponse({'success': False, 'message': f'Loại export không hợp lệ: {export_type}'}, status=400)

    # Return as downloadable file
    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    filename = f'unims_{export_type}_{timezone.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    wb.save(response)
    return response
