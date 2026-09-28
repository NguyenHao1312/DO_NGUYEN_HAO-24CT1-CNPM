"""
student_management/views/sync.py
API endpoints: Sync Down (Server → Client), Sync Up (Client → Server).
Tất cả đều yêu cầu session token hợp lệ.
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from ..models import (
    Student, Teacher, CourseClass, Registration,
    Grade, Semester,
)
from ..decorators import require_session, audit_log


# ============================================================
#  API: SYNC DOWN — Lấy data từ MSSQL → Client
# ============================================================
@require_session
@audit_log
def api_sync_down(request):
    """GET: Trả về classes, registrations, grades, semesters từ DB."""
    try:
        classes = list(CourseClass.objects.all().values(
            'id', 'class_code', 'name', 'teacher_id', 'department',
            'schedule', 'room', 'max_students', 'semester_id', 'credits'
        ))
        for c in classes:
            c['classCode'] = c.pop('class_code')
            c['teacherId'] = c.pop('teacher_id')
            c['maxStudents'] = c.pop('max_students')
            c['semesterId'] = c.pop('semester_id')
            c['id'] = 'c_' + str(c['id'])

        registrations = list(Registration.objects.all().values(
            'id', 'student__student_id', 'course_class_id', 'semester_id', 'registered_at'
        ))
        for r in registrations:
            r['studentId'] = r.pop('student__student_id')
            r['classId'] = 'c_' + str(r.pop('course_class_id'))
            r['semesterId'] = r.pop('semester_id')
            r['registeredAt'] = r.pop('registered_at').isoformat() if r.get('registered_at') else ''
            r['id'] = 'r_' + str(r['id'])

        grades = list(Grade.objects.all().values(
            'id', 'student__student_id', 'course_class_id', 'semester_id',
            'assignment', 'midterm', 'final',
            'average10', 'average4', 'letter_grade', 'classification',
            'is_component_locked', 'is_fully_locked', 'updated_at'
        ))
        for g in grades:
            g['studentId'] = g.pop('student__student_id')
            g['classId'] = 'c_' + str(g.pop('course_class_id'))
            g['semesterId'] = g.pop('semester_id')
            g['letterGrade'] = g.pop('letter_grade')
            g['isComponentLocked'] = g.pop('is_component_locked')
            g['isFullyLocked'] = g.pop('is_fully_locked')
            g['updatedAt'] = g.pop('updated_at').isoformat() if g.get('updated_at') else ''
            g['id'] = 'g_' + str(g['id'])

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
            s['preExamLock'] = s.pop('pre_exam_lock')
            s['preRegistrationLock'] = s.pop('pre_registration_lock')
            s['temporaryLock'] = s.pop('temporary_lock')

        return JsonResponse({
            'success': True,
            'classes': classes,
            'registrations': registrations,
            'grades': grades,
            'semesters': semesters,
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


# ============================================================
#  API: SYNC UP — Nhận data từ Client → MSSQL
#  Bọc trong transaction.atomic() + try/except
# ============================================================
@csrf_exempt
@require_session
@audit_log
def api_sync_up(request):
    if request.method != 'POST':
        return JsonResponse({'success': False}, status=405)

    try:
        payload = json.loads(request.body)
        action = payload.get('action')
        data = payload.get('data')

        with transaction.atomic():
            # --- Grade ---
            if action in ('add_grade', 'update_grade'):
                student = Student.objects.get(student_id=data['studentId'])
                class_id = int(str(data['classId']).replace('c_', ''))
                course_class = CourseClass.objects.get(id=class_id)

                Grade.objects.update_or_create(
                    student=student,
                    course_class=course_class,
                    defaults={
                        'assignment': data.get('assignment'),
                        'midterm': data.get('midterm'),
                        'final': data.get('final'),
                        'average10': data.get('average10'),
                        'average4': data.get('average4'),
                        'letter_grade': data.get('letterGrade'),
                        'classification': data.get('classification'),
                        'semester': course_class.semester,
                    }
                )

            # --- Registration ---
            elif action == 'add_registration':
                student = Student.objects.get(student_id=data['studentId'])
                class_id = int(str(data['classId']).replace('c_', ''))
                course_class = CourseClass.objects.get(id=class_id)

                Registration.objects.update_or_create(
                    student=student,
                    course_class=course_class,
                    defaults={
                        'semester': course_class.semester,
                        'status': 'registered',
                    }
                )

            elif action == 'remove_registration':
                student = Student.objects.get(student_id=data['studentId'])
                class_id = int(str(data['classId']).replace('c_', ''))
                Registration.objects.filter(student=student, course_class_id=class_id).delete()

            # --- Class ---
            elif action in ('add_class', 'update_class'):
                teacher = None
                if data.get('teacherId'):
                    teacher = Teacher.objects.filter(teacher_id=data['teacherId']).first()

                # Fix: Lookup semester nếu có semesterId
                semester = None
                semester_id = data.get('semesterId')
                if semester_id:
                    semester = Semester.objects.filter(id=semester_id).first()

                CourseClass.objects.update_or_create(
                    class_code=data.get('classCode'),
                    defaults={
                        'name': data.get('name'),
                        'teacher': teacher,
                        'department': data.get('department', ''),
                        'schedule': data.get('schedule', ''),
                        'room': data.get('room', ''),
                        'max_students': data.get('maxStudents', 40),
                        'credits': data.get('credits', 3),
                        'semester': semester,
                    }
                )

            elif action == 'delete_class':
                class_code = data.get('classCode') if isinstance(data, dict) else data
                if str(class_code).startswith('c_'):
                    class_id = int(str(class_code).replace('c_', ''))
                    CourseClass.objects.filter(id=class_id).delete()
                else:
                    CourseClass.objects.filter(class_code=class_code).delete()

        return JsonResponse({'success': True})

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
