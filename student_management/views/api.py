"""
student_management/views/api.py
API endpoints: Attendance, Grade Lock, Semesters, Copy Classes.
Tất cả yêu cầu session token. Một số yêu cầu role admin/teacher.
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from ..models import (
    Student, CourseClass, Semester,
    Attendance, GradeEditConfig,
)
from ..decorators import require_session, require_role, audit_log


# ============================================================
#  API: ATTENDANCE — Điểm danh theo buổi
# ============================================================
@csrf_exempt
@require_session
@require_role(['admin', 'teacher'])
@audit_log
def api_attendance(request):
    """
    GET: Lấy danh sách điểm danh.
      ?class_id=<id>&date=<YYYY-MM-DD>
    POST: Lưu/cập nhật điểm danh hàng loạt.
      { class_id, date, session_number, records: [{student_id, status, note}] }
    """
    if request.method == 'GET':
        class_id = request.GET.get('class_id')
        date = request.GET.get('date')
        qs = Attendance.objects.all()
        if class_id:
            qs = qs.filter(course_class_id=class_id)
        if date:
            qs = qs.filter(date=date)
        records = list(qs.values(
            'id', 'student__student_id', 'student__full_name',
            'course_class_id', 'date', 'session_number', 'status', 'note'
        ))
        for r in records:
            r['studentId'] = r.pop('student__student_id')
            r['studentName'] = r.pop('student__full_name')
            r['classId'] = r.pop('course_class_id')
            r['sessionNumber'] = r.pop('session_number')
            r['date'] = r['date'].isoformat() if r.get('date') else ''
        return JsonResponse({'success': True, 'records': records})

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            class_id = data.get('class_id')
            date_str = data.get('date')
            session_num = data.get('session_number', 1)
            records = data.get('records', [])

            course_class = CourseClass.objects.get(id=class_id)
            created_by = getattr(request, 'session_user', None)

            saved = 0
            for rec in records:
                student = Student.objects.filter(student_id=rec['student_id']).first()
                if not student:
                    continue
                Attendance.objects.update_or_create(
                    student=student,
                    course_class=course_class,
                    date=date_str,
                    session_number=session_num,
                    defaults={
                        'status': rec.get('status', 'present'),
                        'note': rec.get('note', ''),
                        'created_by': created_by,
                    }
                )
                saved += 1

            return JsonResponse({'success': True, 'saved': saved})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)

    return JsonResponse({'success': False}, status=405)


# ============================================================
#  API: ATTENDANCE SUMMARIZE — Tổng hợp điểm chuyên cần
# ============================================================
@csrf_exempt
@require_session
@require_role(['admin', 'teacher'])
@audit_log
def api_attendance_summarize(request):
    """
    GET: Tổng hợp điểm chuyên cần từ điểm danh → trả điểm CC (0-10).
      ?class_id=<id>&student_id=<student_code>
    """
    class_id = request.GET.get('class_id')
    student_code = request.GET.get('student_id')
    if not class_id or not student_code:
        return JsonResponse({'success': False, 'message': 'Thiếu class_id hoặc student_id'})

    try:
        student = Student.objects.get(student_id=student_code)
        course_class = CourseClass.objects.get(id=class_id)
        score = Attendance.summarize_for_grade(student, course_class)
        return JsonResponse({
            'success': True,
            'student_id': student_code,
            'class_id': int(class_id),
            'attendance_score': score,
        })
    except (Student.DoesNotExist, CourseClass.DoesNotExist) as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=404)


# ============================================================
#  API: GRADE LOCK STATUS — Kiểm tra khoá bảng điểm
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
#  API: SEMESTERS — Danh sách học kì
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


# ============================================================
#  API: COPY CLASSES TO NEW SEMESTER (Admin only)
# ============================================================
@csrf_exempt
@require_session
@require_role(['admin'])
@audit_log
def api_copy_classes_semester(request):
    """
    POST: Copy tất cả lớp từ HK nguồn sang HK đích.
    { source_semester_id, target_semester_id }
    """
    if request.method != 'POST':
        return JsonResponse({'success': False}, status=405)

    try:
        data = json.loads(request.body)
        source_id = data.get('source_semester_id')
        target_id = data.get('target_semester_id')

        source_classes = CourseClass.objects.filter(semester_id=source_id)
        target_semester = Semester.objects.get(id=target_id)
        copied = 0

        for cls in source_classes:
            new_code = cls.class_code + '_' + target_semester.code
            if not CourseClass.objects.filter(class_code=new_code).exists():
                CourseClass.objects.create(
                    class_code=new_code,
                    name=cls.name,
                    teacher=cls.teacher,
                    department=cls.department,
                    schedule=cls.schedule,
                    room=cls.room,
                    max_students=cls.max_students,
                    semester=target_semester,
                    credits=cls.credits,
                )
                copied += 1

        return JsonResponse({
            'success': True,
            'copied': copied,
            'message': f'Đã copy {copied} lớp sang {target_semester.name}',
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
