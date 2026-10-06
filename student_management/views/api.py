"""
student_management/views/api.py
API endpoints DÙNG CHUNG (mọi role đã đăng nhập):
- Grade Lock Status
- Semesters

Các endpoint riêng theo role đã được tách sang:
- views/admin/   → copy_classes_semester, export, dashboard
- views/teacher/ → attendance, attendance_summarize
"""
from django.http import JsonResponse
from ..models import (
    Student, CourseClass, Semester,
    GradeEditConfig,
)
from ..decorators import require_session, audit_log


# ============================================================
#  API: GRADE LOCK STATUS — Kiểm tra khoá bảng điểm (Mọi role)
# ============================================================
@require_session
@audit_log
def api_grade_lock_status(request):
    """
    GET: Kiểm tra trạng thái khoá bảng điểm.
      ?semester_id=<id>  hoặc  ?class_id=<id>  hoặc  ?student_id=<code>
    Trả về: { locked, lock_type, message }
    """
    semester_id = request.GET.get('semester_id')
    class_id = request.GET.get('class_id')
    student_code = request.GET.get('student_id')

    result = {'locked': False, 'lock_type': None, 'message': ''}

    # Check by semester
    semester = None
    if semester_id:
        try:
            semester = Semester.objects.get(id=semester_id)
        except Semester.DoesNotExist:
            pass
    elif class_id:
        try:
            cc = CourseClass.objects.get(id=class_id)
            semester = cc.semester
        except CourseClass.DoesNotExist:
            pass

    if semester:
        if semester.temporary_lock:
            result = {
                'locked': True,
                'lock_type': 'temporary',
                'message': f'Bảng điểm đang bị khoá tạm thời: {semester.temporary_lock_reason or "Đang chấm thi"}',
            }
        elif semester.pre_registration_lock:
            result = {
                'locked': True,
                'lock_type': 'pre_registration',
                'message': 'Bảng điểm đã bị khoá toàn bộ để chuẩn bị đăng ký học phần mới.',
            }
        elif semester.pre_exam_lock:
            result = {
                'locked': True,
                'lock_type': 'pre_exam',
                'message': 'Điểm thành phần (CC, GK) đã bị khoá. Chỉ có thể nhập điểm cuối kì.',
            }

    # Check tuition debt for student
    if student_code:
        try:
            student = Student.objects.get(student_id=student_code)
            if student.tuition_debt:
                result = {
                    'locked': True,
                    'lock_type': 'tuition_debt',
                    'message': 'Sinh viên đang nợ học phí. Không thể xem điểm và đăng ký học phần.',
                }
        except Student.DoesNotExist:
            pass

    # Check GradeEditConfig time window
    if not result['locked'] and not GradeEditConfig.is_edit_allowed_now():
        result = {
            'locked': True,
            'lock_type': 'time_window',
            'message': 'Ngoài khung giờ cho phép sửa điểm. Vui lòng thử lại trong giờ hành chính.',
        }

    return JsonResponse(result)


# ============================================================
#  API: SEMESTERS — Danh sách học kì (Mọi role)
# ============================================================
@require_session
@audit_log
def api_semesters(request):
    """GET: Lấy tất cả học kì."""
    semesters = list(Semester.objects.all().values(
        'id', 'code', 'name', 'academic_year', 'start_date', 'end_date',
        'exam_start_date', 'status',
        'pre_exam_lock', 'pre_registration_lock', 'temporary_lock'
    ))
    for s in semesters:
        s['startDate'] = s.pop('start_date').isoformat() if s.get('start_date') else ''
        s['endDate'] = s.pop('end_date').isoformat() if s.get('end_date') else ''
        s['examStartDate'] = s.pop('exam_start_date').isoformat() if s.get('exam_start_date') else ''
        s['academicYear'] = s.pop('academic_year')
    return JsonResponse({'success': True, 'semesters': semesters})
