"""
student_management/views/admin/academic.py
API Quản lý Nghiệp vụ Đào tạo dành cho Quản trị viên (Admin Portal):
- Quản lý Sinh viên & Học phí (Xem, sửa thông tin, bật/tắt nợ học phí)
- Quản lý Bảng điểm (Xem, sửa điểm CC/GK/CK, tính GPA tự động)
- Quản lý Giảng viên & Lịch học / Lịch off / Chuyển thời gian học phần
- Quản lý Học kỳ & Khóa mốc đào tạo
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count, Q
from ...decorators import require_session, require_role, audit_log
from ...models import (
    Student, Teacher, CourseClass, Registration, Grade,
    Semester, CustomUser
)


def recalculate_student_gpa(student):
    """Tính lại GPA và GPA10 tích lũy có trọng số tín chỉ cho sinh viên."""
    grades = Grade.objects.filter(student=student, average10__isnull=False)
    if not grades.exists():
        student.gpa = 0.0
        student.gpa10 = 0.0
        student.save(update_fields=['gpa', 'gpa10'])
        return

    total_credits = 0
    total_points4 = 0.0
    total_points10 = 0.0

    for g in grades:
        credits = g.course_class.credits if g.course_class else 3
        total_credits += credits
        total_points4 += (g.average4 or 0.0) * credits
        total_points10 += (g.average10 or 0.0) * credits

    if total_credits > 0:
        student.gpa = round(total_points4 / total_credits, 2)
        student.gpa10 = round(total_points10 / total_credits, 2)
        student.save(update_fields=['gpa', 'gpa10'])


# ============================================================
#  1. QUẢN LÝ SINH VIÊN & HỌC PHÍ (STUDENTS & TUITION)
# ============================================================
@csrf_exempt
@require_session
@require_role(['admin'])
@audit_log
def api_admin_students(request):
    """
    GET: Lấy danh sách sinh viên (hỗ trợ tìm kiếm, lọc khoa, nợ học phí, phân trang).
    POST: Cập nhật thông tin sinh viên hoặc trạng thái học tập/học phí.
    """
    if request.method == 'GET':
        q = request.GET.get('q', '').strip()
        dept = request.GET.get('department', '').strip()
        status = request.GET.get('status', '').strip()
        tuition = request.GET.get('tuition_debt', '').strip()

        page = max(1, int(request.GET.get('page', 1)))
        per_page = max(1, min(100, int(request.GET.get('per_page', 20))))
        offset = (page - 1) * per_page

        qs = Student.objects.all().select_related('user', 'university').annotate(
            total_classes=Count('registration', filter=Q(registration__status='registered'))
        ).order_by('student_id')

        if q:
            qs = qs.filter(Q(student_id__icontains=q) | Q(full_name__icontains=q) | Q(email__icontains=q))
        if dept:
            qs = qs.filter(department=dept)
        if status:
            qs = qs.filter(status=status)
        if tuition != '':
            qs = qs.filter(tuition_debt=(tuition.lower() in ('true', '1', 'yes')))

        total = qs.count()
        students_page = qs[offset:offset + per_page]

        student_list = []
        for s in students_page:
            student_list.append({
                'id': s.id,
                'student_id': s.student_id,
                'full_name': s.full_name,
                'email': s.email or '',
                'phone': s.phone or '',
                'gender': s.gender or 'male',
                'department': s.department or '',
                'academic_year': s.academic_year or '',
                'status': s.status,
                'gpa': s.gpa,
                'gpa10': s.gpa10,
                'tuition_debt': s.tuition_debt,
                'total_classes': s.total_classes,
                'username': s.user.username if s.user else '',
                'created_at': s.created_at.isoformat() if s.created_at else '',
            })

        return JsonResponse({
            'success': True,
            'students': student_list,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page,
        })

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            student_id_val = data.get('id')
            student = Student.objects.get(id=student_id_val)

            if 'full_name' in data:
                student.full_name = data['full_name'].strip()
            if 'email' in data:
                student.email = data['email'].strip()
            if 'phone' in data:
                student.phone = data['phone'].strip()
            if 'department' in data:
                student.department = data['department'].strip()
            if 'status' in data:
                student.status = data['status']
            if 'tuition_debt' in data:
                student.tuition_debt = bool(data['tuition_debt'])
            if 'academic_year' in data:
                student.academic_year = data['academic_year'].strip()

            student.save()
            return JsonResponse({
                'success': True,
                'message': f'Đã cập nhật sinh viên {student.student_id} ({student.full_name}) thành công.',
                'student': {
                    'id': student.id,
                    'student_id': student.student_id,
                    'full_name': student.full_name,
                    'status': student.status,
                    'tuition_debt': student.tuition_debt,
                }
            })
        except Student.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Không tìm thấy sinh viên.'}, status=404)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)

    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


@csrf_exempt
@require_session
@require_role(['admin'])
@audit_log
def api_admin_toggle_tuition(request):
    """
    POST: Cập nhật nhanh trạng thái nợ học phí cho sinh viên.
    Payload: { student_id, tuition_debt: true/false (hoặc bỏ trống để toggle) }
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        sid = data.get('student_id') or data.get('id')
        if not sid:
            return JsonResponse({'success': False, 'error': 'Thiếu mã sinh viên'}, status=400)

        student = Student.objects.filter(Q(id=sid if str(sid).isdigit() else -1) | Q(student_id=str(sid))).first()
        if not student:
            return JsonResponse({'success': False, 'error': 'Không tìm thấy sinh viên.'}, status=404)

        if 'tuition_debt' in data:
            student.tuition_debt = bool(data['tuition_debt'])
        else:
            student.tuition_debt = not student.tuition_debt

        student.save(update_fields=['tuition_debt'])
        status_msg = "Còn nợ học phí (Đã khoá ĐKHP & xem điểm)" if student.tuition_debt else "Đã hoàn thành học phí (Đã mở khoá hệ thống)"

        return JsonResponse({
            'success': True,
            'student_id': student.student_id,
            'tuition_debt': student.tuition_debt,
            'message': f'Sinh viên {student.full_name} ({student.student_id}): {status_msg}',
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


# ============================================================
#  2. QUẢN LÝ BẢNG ĐIỂM (GRADES MANAGEMENT)
# ============================================================
@csrf_exempt
@require_session
@require_role(['admin'])
@audit_log
def api_admin_grades(request):
    """
    GET: Lấy danh sách điểm thi (lọc theo lớp học phần, mã SV, học kỳ).
    POST: Admin chỉnh sửa điểm trực tiếp (tự động tính avg10, avg4, letterGrade, GPA sinh viên).
    """
    if request.method == 'GET':
        class_id = request.GET.get('class_id', '').strip()
        student_id = request.GET.get('student_id', '').strip()
        semester_id = request.GET.get('semester_id', '').strip()
        q = request.GET.get('q', '').strip()

        page = max(1, int(request.GET.get('page', 1)))
        per_page = max(1, min(100, int(request.GET.get('per_page', 25))))
        offset = (page - 1) * per_page

        qs = Grade.objects.all().select_related('student', 'course_class', 'semester').order_by('course_class__class_code', 'student__student_id')

        if class_id:
            qs = qs.filter(course_class_id=class_id)
        if student_id:
            qs = qs.filter(Q(student__student_id=student_id) | Q(student_id=student_id))
        if semester_id:
            qs = qs.filter(semester_id=semester_id)
        if q:
            qs = qs.filter(Q(student__student_id__icontains=q) | Q(student__full_name__icontains=q) | Q(course_class__name__icontains=q) | Q(course_class__class_code__icontains=q))

        total = qs.count()
        grades_page = qs[offset:offset + per_page]

        grade_list = []
        for g in grades_page:
            grade_list.append({
                'id': g.id,
                'student_id': g.student.student_id,
                'student_name': g.student.full_name,
                'class_id': g.course_class.id if g.course_class else None,
                'class_code': g.course_class.class_code if g.course_class else '',
                'class_name': g.course_class.name if g.course_class else '',
                'semester_name': g.semester.name if g.semester else '',
                'assignment': g.assignment,
                'midterm': g.midterm,
                'final': g.final,
                'average10': g.average10,
                'average4': g.average4,
                'letter_grade': g.letter_grade or '',
                'classification': g.classification or '',
                'is_component_locked': g.is_component_locked,
                'is_fully_locked': g.is_fully_locked,
            })

        return JsonResponse({
            'success': True,
            'grades': grade_list,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page,
        })

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            grade_id = data.get('grade_id') or data.get('id')

            grade = None
            if grade_id:
                grade = Grade.objects.get(id=grade_id)
            else:
                sid = data.get('student_id')
                cid = data.get('class_id')
                student = Student.objects.filter(Q(id=sid if str(sid).isdigit() else -1) | Q(student_id=str(sid))).first()
                course_class = CourseClass.objects.get(id=cid)
                grade, _ = Grade.objects.get_or_create(
                    student=student, course_class=course_class,
                    defaults={'semester': course_class.semester}
                )

            # Cập nhật điểm thành phần (chấp nhận giá trị float từ 0 đến 10)
            if 'assignment' in data and data['assignment'] is not None:
                grade.assignment = max(0.0, min(10.0, float(data['assignment'])))
            if 'midterm' in data and data['midterm'] is not None:
                grade.midterm = max(0.0, min(10.0, float(data['midterm'])))
            if 'final' in data and data['final'] is not None:
                grade.final = max(0.0, min(10.0, float(data['final'])))

            if 'is_component_locked' in data:
                grade.is_component_locked = bool(data['is_component_locked'])
            if 'is_fully_locked' in data:
                grade.is_fully_locked = bool(data['is_fully_locked'])

            # Tính lại điểm tổng kết và lưu
            grade.calculate_and_save()

            # Tự động tính lại GPA tích lũy cho sinh viên trong SQL Server
            recalculate_student_gpa(grade.student)

            return JsonResponse({
                'success': True,
                'message': f'Đã cập nhật điểm sinh viên {grade.student.full_name} ({grade.student.student_id}) thành công.',
                'grade': {
                    'id': grade.id,
                    'assignment': grade.assignment,
                    'midterm': grade.midterm,
                    'final': grade.final,
                    'average10': grade.average10,
                    'average4': grade.average4,
                    'letter_grade': grade.letter_grade,
                    'classification': grade.classification,
                    'student_gpa': grade.student.gpa,
                }
            })
        except Grade.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Không tìm thấy bản ghi điểm.'}, status=404)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)

    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


# ============================================================
#  3. QUẢN LÝ GIẢNG VIÊN (TEACHERS)
# ============================================================
@csrf_exempt
@require_session
@require_role(['admin'])
@audit_log
def api_admin_teachers(request):
    """
    GET: Danh sách giảng viên, chức vụ, bộ môn, số lớp phụ trách.
    POST: Cập nhật thông tin giảng viên.
    """
    if request.method == 'GET':
        q = request.GET.get('q', '').strip()
        dept = request.GET.get('department', '').strip()
        status = request.GET.get('status', '').strip()

        qs = Teacher.objects.all().select_related('user', 'university').annotate(
            total_classes=Count('courseclass')
        ).order_by('teacher_id')

        if q:
            qs = qs.filter(Q(teacher_id__icontains=q) | Q(full_name__icontains=q) | Q(email__icontains=q))
        if dept:
            qs = qs.filter(department=dept)
        if status:
            qs = qs.filter(status=status)

        teacher_list = []
        for t in qs:
            teacher_list.append({
                'id': t.id,
                'teacher_id': t.teacher_id,
                'full_name': t.full_name,
                'email': t.email or '',
                'phone': t.phone or '',
                'department': t.department or '',
                'specialization': t.specialization or '',
                'degree': t.degree or 'ThS',
                'position': t.position or 'Giảng viên',
                'status': t.status,
                'total_classes': t.total_classes,
                'username': t.user.username if t.user else '',
            })

        return JsonResponse({'success': True, 'teachers': teacher_list})

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            teacher = Teacher.objects.get(id=data.get('id'))

            if 'full_name' in data:
                teacher.full_name = data['full_name'].strip()
            if 'email' in data:
                teacher.email = data['email'].strip()
            if 'phone' in data:
                teacher.phone = data['phone'].strip()
            if 'department' in data:
                teacher.department = data['department'].strip()
            if 'degree' in data:
                teacher.degree = data['degree'].strip()
            if 'position' in data:
                teacher.position = data['position'].strip()
            if 'status' in data:
                teacher.status = data['status']

            teacher.save()
            return JsonResponse({
                'success': True,
                'message': f'Đã cập nhật thông tin giảng viên {teacher.full_name} ({teacher.teacher_id})',
            })
        except Teacher.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Không tìm thấy giảng viên.'}, status=404)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)

    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


# ============================================================
#  4. QUẢN LÝ LỚP HỌC PHẦN & LỊCH HỌC / LỊCH OFF / ĐỔI PHÒNG
# ============================================================
@csrf_exempt
@require_session
@require_role(['admin'])
@audit_log
def api_admin_classes(request):
    """
    GET: Lấy danh sách lớp học phần, lịch học, phòng học, giảng viên phụ trách.
    POST: Cập nhật thông tin lớp (sĩ số, phòng, tín chỉ).
    """
    if request.method == 'GET':
        semester_id = request.GET.get('semester_id', '').strip()
        teacher_id = request.GET.get('teacher_id', '').strip()
        q = request.GET.get('q', '').strip()

        qs = CourseClass.objects.all().select_related('teacher', 'semester').annotate(
            registered_count=Count('registration', filter=Q(registration__status='registered'))
        ).order_by('class_code')

        if semester_id:
            qs = qs.filter(semester_id=semester_id)
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        if q:
            qs = qs.filter(Q(class_code__icontains=q) | Q(name__icontains=q) | Q(room__icontains=q) | Q(schedule__icontains=q))

        class_list = []
        for c in qs:
            class_list.append({
                'id': c.id,
                'class_code': c.class_code,
                'name': c.name,
                'credits': c.credits,
                'teacher_id': c.teacher.id if c.teacher else None,
                'teacher_name': c.teacher.full_name if c.teacher else 'Chưa phân công',
                'department': c.department or '',
                'schedule': c.schedule or '',
                'room': c.room or '',
                'max_students': c.max_students,
                'registered_count': c.registered_count,
                'semester_id': c.semester.id if c.semester else None,
                'semester_name': c.semester.name if c.semester else '',
            })

        return JsonResponse({'success': True, 'classes': class_list})

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            course_class = CourseClass.objects.get(id=data.get('id'))

            if 'name' in data:
                course_class.name = data['name'].strip()
            if 'credits' in data:
                course_class.credits = int(data['credits'])
            if 'max_students' in data:
                course_class.max_students = int(data['max_students'])
            if 'room' in data:
                course_class.room = data['room'].strip()
            if 'schedule' in data:
                course_class.schedule = data['schedule'].strip()
            if 'department' in data:
                course_class.department = data['department'].strip()
            if 'teacher_id' in data:
                tid = data['teacher_id']
                course_class.teacher = Teacher.objects.filter(id=tid).first() if tid else None

            course_class.save()
            return JsonResponse({
                'success': True,
                'message': f'Đã cập nhật lớp học phần {course_class.class_code} ({course_class.name})',
            })
        except CourseClass.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Không tìm thấy lớp học phần.'}, status=404)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)

    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


@csrf_exempt
@require_session
@require_role(['admin'])
@audit_log
def api_admin_update_schedule(request):
    """
    POST: Nghiệp vụ điều chỉnh lịch học / lịch off / chuyển thời gian ca học / đổi phòng / đổi giảng viên.
    Payload: {
        class_id,
        schedule: "Thứ 2 (7:00 - 9:30)",
        room: "A102",
        teacher_id: 5 (optional),
        note: "Báo nghỉ bù / Đổi phòng theo yêu cầu giảng viên"
    }
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        class_id = data.get('class_id')
        if not class_id:
            return JsonResponse({'success': False, 'error': 'Thiếu mã lớp học phần.'}, status=400)

        course_class = CourseClass.objects.get(id=class_id)
        old_schedule = course_class.schedule
        old_room = course_class.room

        if 'schedule' in data:
            course_class.schedule = data['schedule'].strip()
        if 'room' in data:
            course_class.room = data['room'].strip()
        if 'teacher_id' in data:
            tid = data['teacher_id']
            course_class.teacher = Teacher.objects.filter(id=tid).first() if tid else None

        course_class.save()
        note = data.get('note', '').strip()

        return JsonResponse({
            'success': True,
            'message': f'Đã điều chỉnh lịch lớp {course_class.class_code}: Lịch mới: "{course_class.schedule}", Phòng: "{course_class.room}".' + (f' Ghi chú: {note}' if note else ''),
            'course_class': {
                'id': course_class.id,
                'class_code': course_class.class_code,
                'name': course_class.name,
                'schedule': course_class.schedule,
                'room': course_class.room,
                'teacher_name': course_class.teacher.full_name if course_class.teacher else 'Chưa phân công',
            }
        })
    except CourseClass.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Không tìm thấy lớp học phần.'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


# ============================================================
#  5. QUẢN LÝ HỌC KỲ & KHOÁ MỐC (SEMESTERS & LOCK FLAGS)
# ============================================================
@csrf_exempt
@require_session
@require_role(['admin'])
@audit_log
def api_admin_semesters(request):
    """
    GET: Danh sách các học kỳ và cờ khoá đào tạo.
    POST: Cập nhật cờ khoá trước thi, khoá trước ĐKHP hoặc khoá tạm thời chấm thi.
    """
    if request.method == 'GET':
        semesters = list(Semester.objects.all().values(
            'id', 'code', 'name', 'academic_year', 'start_date', 'end_date',
            'status', 'pre_exam_lock', 'pre_registration_lock', 'temporary_lock',
            'temporary_lock_reason'
        ))
        for s in semesters:
            s['start_date'] = s['start_date'].isoformat() if s.get('start_date') else ''
            s['end_date'] = s['end_date'].isoformat() if s.get('end_date') else ''
        return JsonResponse({'success': True, 'semesters': semesters})

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            sem = Semester.objects.get(id=data.get('id'))

            if 'pre_exam_lock' in data:
                sem.pre_exam_lock = bool(data['pre_exam_lock'])
            if 'pre_registration_lock' in data:
                sem.pre_registration_lock = bool(data['pre_registration_lock'])
            if 'temporary_lock' in data:
                sem.temporary_lock = bool(data['temporary_lock'])
            if 'temporary_lock_reason' in data:
                sem.temporary_lock_reason = data['temporary_lock_reason'].strip()
            if 'status' in data:
                sem.status = data['status']

            sem.save()
            return JsonResponse({
                'success': True,
                'message': f'Đã cập nhật trạng thái khoá đào tạo cho học kỳ: {sem.name}',
            })
        except Semester.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Không tìm thấy học kỳ.'}, status=404)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)

    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)
