"""
student_management/views/admin/management.py
API endpoint: Copy lớp học phần sang học kì mới.
Chỉ Admin mới được phép.

[Tách riêng từ views/api.py → views/admin/management.py]
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from ...models import CourseClass, Semester
from ...decorators import require_session, require_role, audit_log


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
