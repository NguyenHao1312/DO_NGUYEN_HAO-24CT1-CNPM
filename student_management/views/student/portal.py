"""
student_management/views/student/portal.py
Endpoints và helpers dành riêng cho Sinh viên (Student Portal):
- Tra cứu hồ sơ sinh viên, tiến độ học tập và tình trạng học phí cá nhân.
"""
from django.http import JsonResponse
from student_management.models import Student, Registration, Grade
from student_management.decorators import require_session, audit_log


@require_session
@audit_log
def api_student_profile(request):
    """GET: Lấy thông tin chi tiết sinh viên hiện tại."""
    user = request.session_user
    if user.role != 'student' and user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Chỉ sinh viên mới có quyền truy cập'}, status=403)

    student = getattr(user, 'student_profile', None)
    if not student:
        return JsonResponse({'success': False, 'message': 'Không tìm thấy hồ sơ sinh viên'}, status=404)

    return JsonResponse({
        'success': True,
        'student': {
            'student_id': student.student_id,
            'full_name': student.full_name,
            'department': student.department,
            'gpa': student.gpa,
            'gpa10': student.gpa10,
            'tuition_debt': student.tuition_debt,
            'university': student.university.name if student.university else 'N/A',
        }
    })
