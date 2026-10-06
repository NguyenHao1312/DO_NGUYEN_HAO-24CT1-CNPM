"""
student_management/views/sync.py
API endpoints: Sync Down (Server → Client), Sync Up (Client → Server).
Tất cả đều yêu cầu session token hợp lệ.

BẢO MẬT:
- api_sync_down: Filter dữ liệu theo role (student chỉ xem data của mình)
- api_sync_up: Kiểm tra quyền theo từng action
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
#  API: SYNC DOWN — Lấy data từ DB → Client (FILTER THEO ROLE)
# ============================================================
@require_session
@audit_log
def api_sync_down(request):
    """
    GET: Trả về classes, registrations, grades, semesters từ DB.
    Dữ liệu được lọc theo role:
    - Admin:   toàn bộ dữ liệu
    - Teacher: lớp mình dạy + grades/registrations của các lớp đó
    - Student: lớp đã đăng ký + grades/registrations của chính mình
    """
    try:
        user = request.session_user

        # ── Semesters: tất cả role đều xem được ──
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

        # ── Filter dữ liệu theo role ──
        if user.role == 'admin':
            classes_qs = CourseClass.objects.all()
            registrations_qs = Registration.objects.all()
            grades_qs = Grade.objects.all()

        elif user.role == 'teacher':
            # Teacher: chỉ lớp mình dạy
            teacher_profile = getattr(user, 'teacher_profile', None)
            if teacher_profile:
                classes_qs = CourseClass.objects.filter(teacher=teacher_profile)
                class_ids = classes_qs.values_list('id', flat=True)
                registrations_qs = Registration.objects.filter(course_class_id__in=class_ids)
                grades_qs = Grade.objects.filter(course_class_id__in=class_ids)
            else:
                classes_qs = CourseClass.objects.none()
                registrations_qs = Registration.objects.none()
                grades_qs = Grade.objects.none()

        elif user.role == 'student':
            # Student: chỉ data của chính mình
            student_profile = getattr(user, 'student_profile', None)
            if student_profile:
                # Lớp: tất cả (để xem khi ĐKHP), nhưng grades/registrations chỉ của mình
                classes_qs = CourseClass.objects.all()
                registrations_qs = Registration.objects.filter(student=student_profile)
                grades_qs = Grade.objects.filter(student=student_profile)
            else:
                classes_qs = CourseClass.objects.all()
                registrations_qs = Registration.objects.none()
                grades_qs = Grade.objects.none()
        else:
            classes_qs = CourseClass.objects.none()
            registrations_qs = Registration.objects.none()
            grades_qs = Grade.objects.none()

        # ── Serialize Classes ──
        classes = list(classes_qs.values(
            'id', 'class_code', 'name', 'teacher_id', 'department',
            'schedule', 'room', 'max_students', 'semester_id', 'credits'
        ))
        for c in classes:
            c['classCode'] = c.pop('class_code')
            c['teacherId'] = c.pop('teacher_id')
            c['maxStudents'] = c.pop('max_students')
            c['semesterId'] = c.pop('semester_id')
            c['id'] = 'c_' + str(c['id'])

        # ── Serialize Registrations ──
        registrations = list(registrations_qs.values(
            'id', 'student__student_id', 'course_class_id', 'semester_id', 'registered_at'
        ))
        for r in registrations:
            r['studentId'] = r.pop('student__student_id')
            r['classId'] = 'c_' + str(r.pop('course_class_id'))
            r['semesterId'] = r.pop('semester_id')
            r['registeredAt'] = r.pop('registered_at').isoformat() if r.get('registered_at') else ''
            r['id'] = 'r_' + str(r['id'])

        # ── Serialize Grades ──
        grades = list(grades_qs.values(
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
#  API: SYNC UP — Nhận data từ Client → DB
#  Bọc trong transaction.atomic() + try/except
#  BẢO MẬT: Kiểm tra quyền theo từng action
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
        user = request.session_user

        # ── Kiểm tra quyền theo action ──
        ADMIN_ONLY_ACTIONS = ['delete_class']
        ADMIN_TEACHER_ACTIONS = ['add_grade', 'update_grade', 'add_class', 'update_class']
        ADMIN_STUDENT_ACTIONS = ['add_registration', 'remove_registration']

        if action in ADMIN_ONLY_ACTIONS and user.role != 'admin':
            return JsonResponse({
                'success': False,
                'error': f'Vai trò "{user.role}" không có quyền thực hiện: {action}'
            }, status=403)

        if action in ADMIN_TEACHER_ACTIONS and user.role not in ('admin', 'teacher'):
            return JsonResponse({
                'success': False,
                'error': f'Vai trò "{user.role}" không có quyền thực hiện: {action}'
            }, status=403)

        if action in ADMIN_STUDENT_ACTIONS and user.role not in ('admin', 'student'):
            return JsonResponse({
                'success': False,
                'error': f'Vai trò "{user.role}" không có quyền thực hiện: {action}'
            }, status=403)

        with transaction.atomic():
            # --- Grade (admin, teacher only) ---
            if action in ('add_grade', 'update_grade'):
                student = Student.objects.get(student_id=data['studentId'])
                class_id = int(str(data['classId']).replace('c_', ''))
                course_class = CourseClass.objects.get(id=class_id)

                # Teacher chỉ sửa điểm lớp mình dạy
                if user.role == 'teacher':
                    teacher_profile = getattr(user, 'teacher_profile', None)
                    if not teacher_profile or course_class.teacher_id != teacher_profile.id:
                        return JsonResponse({
                            'success': False,
                            'error': 'Giáo viên chỉ được phép sửa điểm lớp mình phụ trách'
                        }, status=403)

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

            # --- Registration (admin, student only) ---
            elif action == 'add_registration':
                student = Student.objects.get(student_id=data['studentId'])
                class_id = int(str(data['classId']).replace('c_', ''))
                course_class = CourseClass.objects.get(id=class_id)

                # Student chỉ đăng ký cho chính mình
                if user.role == 'student':
                    student_profile = getattr(user, 'student_profile', None)
                    if not student_profile or student.id != student_profile.id:
                        return JsonResponse({
                            'success': False,
                            'error': 'Sinh viên chỉ được đăng ký học phần cho chính mình'
                        }, status=403)

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

                # Student chỉ huỷ đăng ký của chính mình
                if user.role == 'student':
                    student_profile = getattr(user, 'student_profile', None)
                    if not student_profile or student.id != student_profile.id:
                        return JsonResponse({
                            'success': False,
                            'error': 'Sinh viên chỉ được huỷ đăng ký học phần của chính mình'
                        }, status=403)

                Registration.objects.filter(student=student, course_class_id=class_id).delete()

            # --- Class (admin, teacher only; delete = admin only) ---
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
                # Admin only (đã check ở trên)
                class_code = data.get('classCode') if isinstance(data, dict) else data
                if str(class_code).startswith('c_'):
                    class_id = int(str(class_code).replace('c_', ''))
                    CourseClass.objects.filter(id=class_id).delete()
                else:
                    CourseClass.objects.filter(class_code=class_code).delete()

        return JsonResponse({'success': True})

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
