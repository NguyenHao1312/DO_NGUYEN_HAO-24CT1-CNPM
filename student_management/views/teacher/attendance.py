"""
student_management/views/teacher/attendance.py
API endpoints: Attendance (Điểm danh) — Chỉ Admin + Teacher.

[Tách riêng từ views/api.py → views/teacher/attendance.py]
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from ...models import Student, CourseClass, Attendance
from ...decorators import require_session, require_role, audit_log


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
