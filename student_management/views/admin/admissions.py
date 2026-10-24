"""
student_management/views/admin/admissions.py
Admin API: Quản lý Hồ sơ Xét Nguyện Vọng Tuyển Sinh
- Xem danh sách thí sinh nộp hồ sơ, điểm xét tuyển, điểm chuẩn, trạng thái OTP
- Duyệt thủ công (cấp mã SV và gửi mail) cho trường hợp cần xét vớt hoặc điều chỉnh
- Từ chối hồ sơ hoặc xóa hồ sơ
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from student_management.decorators import require_session, require_role, audit_log
from student_management.models import AdmissionApplication, University
from student_management.admission_service import create_candidate_account_and_notify


@csrf_exempt
@require_session
@require_role(['admin'])
def api_admin_admissions(request):
    """
    GET: Lấy danh sách hồ sơ xét tuyển (hỗ trợ phân trang, tìm kiếm, lọc theo trường/trạng thái).
    """
    if request.method != 'GET':
        return JsonResponse({'success': False, 'message': 'Only GET allowed'}, status=405)

    q = request.GET.get('q', '').strip()
    status_filter = request.GET.get('status', '').strip()
    uni_filter = request.GET.get('university_id', '').strip()
    page = max(1, int(request.GET.get('page', 1)))
    per_page = max(1, min(100, int(request.GET.get('per_page', 20))))
    offset = (page - 1) * per_page

    qs = AdmissionApplication.objects.all().select_related('university', 'generated_user').order_by('-created_at')

    if q:
        qs = qs.filter(
            Q(full_name__icontains=q) |
            Q(cccd__icontains=q) |
            Q(email__icontains=q) |
            Q(generated_student_id__icontains=q)
        )
    if status_filter:
        qs = qs.filter(status=status_filter)
    if uni_filter and uni_filter.isdigit():
        qs = qs.filter(university_id=int(uni_filter))

    total = qs.count()
    items = qs[offset:offset + per_page]

    data = []
    for a in items:
        data.append({
            'id': a.id,
            'full_name': a.full_name,
            'cccd': a.cccd,
            'email': a.email,
            'phone': a.phone,
            'university_id': a.university_id,
            'university_name': a.university.short_name or a.university.name,
            'university_code': a.university.university_code,
            'department': a.department,
            'score': a.score,
            'benchmark_score': a.benchmark_score,
            'status': a.status,
            'status_display': a.get_status_display(),
            'email_verified': a.email_verified,
            'generated_student_id': a.generated_student_id or '',
            'created_at': a.created_at.strftime('%d/%m/%Y %H:%M') if a.created_at else '',
            'review_note': a.review_note or '',
        })

    # Thống kê nhanh
    stats = {
        'total': AdmissionApplication.objects.count(),
        'credentials_sent': AdmissionApplication.objects.filter(status='credentials_sent').count(),
        'approved': AdmissionApplication.objects.filter(status='approved').count(),
        'pending': AdmissionApplication.objects.filter(status='pending').count(),
        'rejected': AdmissionApplication.objects.filter(status='rejected').count(),
    }

    return JsonResponse({
        'success': True,
        'admissions': data,
        'stats': stats,
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total + per_page - 1) // per_page if per_page > 0 else 1,
    })


@csrf_exempt
@require_session
@require_role(['admin'])
@audit_log
def api_admin_admission_approve(request):
    """
    POST: Quản trị viên duyệt thủ công hồ sơ xét tuyển.
    Tự động sinh mã sinh viên theo trường, tạo user trong SSMS và gửi email mật khẩu.
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body)
        app_id = data.get('id')
        note = data.get('note', '').strip()

        app = AdmissionApplication.objects.get(id=app_id)
        
        # Nếu đã cấp mã rồi thì không sinh lại
        if app.status == 'credentials_sent' and app.generated_student_id:
            return JsonResponse({
                'success': True,
                'message': f'Thí sinh {app.full_name} đã được cấp mã SV {app.generated_student_id} trước đó.',
                'student_id': app.generated_student_id
            })

        app.reviewed_by = request.session_user
        if note:
            app.review_note = note
        app.save()

        # Tạo tài khoản và gửi mail
        host = request.get_host()
        proto = 'https' if request.is_secure() else 'http'
        login_url = f"{proto}://{host}/review/"

        res = create_candidate_account_and_notify(app, login_url=login_url)

        return JsonResponse({
            'success': True,
            'message': f'Đã duyệt thủ công và cấp mã sinh viên {res.get("student_id")} cho thí sinh {app.full_name}. Mật khẩu đã được gửi về {app.email}.',
            'student_id': res.get('student_id')
        })

    except AdmissionApplication.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Không tìm thấy hồ sơ'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@csrf_exempt
@require_session
@require_role(['admin'])
@audit_log
def api_admin_admission_reject(request):
    """POST: Quản trị viên từ chối hồ sơ xét tuyển."""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body)
        app_id = data.get('id')
        note = data.get('note', '').strip()

        app = AdmissionApplication.objects.get(id=app_id)
        app.status = 'rejected'
        app.reviewed_by = request.session_user
        if note:
            app.review_note = note
        app.save()

        return JsonResponse({
            'success': True,
            'message': f'Đã từ chối hồ sơ của thí sinh {app.full_name}.'
        })
    except AdmissionApplication.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Không tìm thấy hồ sơ'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)
