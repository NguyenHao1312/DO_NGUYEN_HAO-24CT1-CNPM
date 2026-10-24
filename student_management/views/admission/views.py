"""
student_management/views/admission/views.py
Các endpoint và giao diện dành cho Cổng Xét Nguyện Vọng Tuyển Sinh:
- Render trang web xét tuyển (admission.html)
- API lấy danh mục trường, ngành và điểm chuẩn tham chiếu
- API nộp hồ sơ xét tuyển & gửi OTP qua Gmail
- API xác thực mã OTP, tự động kiểm tra điểm đỗ và cấp mã sinh viên vào SSMS
- API gửi lại mã OTP
- API tra cứu kết quả xét tuyển bằng số CCCD
"""
import json
from datetime import timedelta
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from student_management.models import University, AdmissionApplication
from student_management.admission_service import (
    get_departments_for_university,
    get_benchmark_score,
    is_valid_gmail,
    generate_otp,
    create_candidate_account_and_notify
)
from student_management.email_service import send_otp_email


def admission_page(request):
    """Render giao diện Cổng Xét Nguyện Vọng Đại học."""
    universities = University.objects.exclude(university_code__isnull=True).exclude(university_code='').order_by('university_code')
    return render(request, 'admission.html', {
        'universities': universities,
    })


@csrf_exempt
def api_admission_universities(request):
    """Lấy danh sách các trường cùng các ngành và điểm chuẩn tham chiếu."""
    unis = University.objects.exclude(university_code__isnull=True).exclude(university_code='').order_by('university_code')
    data = []
    for u in unis:
        majors = get_departments_for_university(u.university_code)
        data.append({
            'id': u.id,
            'code': u.code,
            'university_code': u.university_code,
            'name': u.name,
            'short_name': u.short_name or u.name,
            'majors': majors,
        })
    return JsonResponse({'success': True, 'universities': data})


@csrf_exempt
def api_admission_apply(request):
    """
    POST: Thí sinh nộp hồ sơ xét tuyển.
    - Kiểm tra định dạng CCCD (12 số) -> Luôn chấp nhận hợp lệ
    - Kiểm tra email Gmail chuẩn
    - Đối soát điểm thi với điểm chuẩn
    - Sinh OTP 6 số và gửi về Gmail của thí sinh
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body)
        full_name = data.get('full_name', '').strip()
        cccd = data.get('cccd', '').strip()
        email = data.get('email', '').strip().lower()
        phone = data.get('phone', '').strip()
        university_id = data.get('university_id')
        department = data.get('department', '').strip()
        score_val = data.get('score', 0)

        # 1. Kiểm tra đầu vào
        if not full_name:
            return JsonResponse({'success': False, 'message': 'Vui lòng nhập họ và tên'}, status=400)
        
        # CCCD 12 số
        clean_cccd = ''.join(c for c in cccd if c.isdigit())
        if len(clean_cccd) != 12:
            return JsonResponse({'success': False, 'message': 'Số CCCD phải gồm đúng 12 chữ số'}, status=400)

        # Email Gmail hợp lệ
        if not is_valid_gmail(email):
            return JsonResponse({
                'success': False,
                'message': 'Vui lòng sử dụng địa chỉ Gmail chính thức (@gmail.com) đã hoạt động để nhận mã và mật khẩu.'
            }, status=400)

        if not phone:
            return JsonResponse({'success': False, 'message': 'Vui lòng nhập số điện thoại liên lạc'}, status=400)

        try:
            score = round(float(score_val), 2)
            if score < 0 or score > 30:
                return JsonResponse({'success': False, 'message': 'Điểm xét tuyển phải từ 0.00 đến 30.00'}, status=400)
        except (ValueError, TypeError):
            return JsonResponse({'success': False, 'message': 'Điểm xét tuyển không hợp lệ'}, status=400)

        try:
            university = University.objects.get(id=university_id)
        except University.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Trường đại học không tồn tại'}, status=404)

        if not department:
            return JsonResponse({'success': False, 'message': 'Vui lòng chọn ngành xét tuyển'}, status=400)

        # 2. Tra cứu điểm chuẩn của ngành
        benchmark = get_benchmark_score(university.university_code or '', department)

        # 3. Đánh giá sơ bộ điều kiện trúng tuyển
        is_qualified = (score >= benchmark)
        initial_status = 'approved' if is_qualified else 'rejected'

        # 4. Sinh mã OTP 6 số
        otp = generate_otp()
        now = timezone.now()

        # Tạo hoặc cập nhật hồ sơ đăng ký
        app, created = AdmissionApplication.objects.update_or_create(
            cccd=clean_cccd,
            university=university,
            defaults={
                'full_name': full_name,
                'email': email,
                'phone': phone,
                'department': department,
                'score': score,
                'benchmark_score': benchmark,
                'status': initial_status,
                'otp_code': otp,
                'otp_created_at': now,
                'email_verified': False,
            }
        )

        # 5. Gửi mã OTP xác minh qua Gmail
        send_otp_email(email, otp, full_name)

        return JsonResponse({
            'success': True,
            'application_id': app.id,
            'is_qualified': is_qualified,
            'score': score,
            'benchmark': benchmark,
            'university_name': university.short_name or university.name,
            'department': department,
            'message': f'Đã xác minh số CCCD {clean_cccd} hợp lệ. Mã xác thực OTP (6 chữ số) đã được gửi đến hộp thư {email}.'
        })

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Dữ liệu JSON không hợp lệ'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@csrf_exempt
def api_admission_verify_otp(request):
    """
    POST: Xác thực mã OTP Gmail của thí sinh.
    - Nếu OTP chính xác và còn hạn (10 phút):
      + Đánh dấu email_verified = True
      + Nếu thí sinh đủ điểm trúng tuyển -> Tự động gọi admission_service để:
        * Sinh mã SV tự động theo trường (100110... cho Bách Khoa)
        * Sinh mật khẩu ngẫu nhiên (chữ và số)
        * Lưu vào SSMS Database
        * Gửi email thông báo chính thức có Mã SV và Mật khẩu
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body)
        application_id = data.get('application_id')
        otp_input = data.get('otp', '').strip()

        if not application_id or not otp_input:
            return JsonResponse({'success': False, 'message': 'Thiếu mã hồ sơ hoặc mã OTP'}, status=400)

        try:
            app = AdmissionApplication.objects.get(id=application_id)
        except AdmissionApplication.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Không tìm thấy hồ sơ xét tuyển'}, status=404)

        # Kiểm tra thời hạn OTP (10 phút)
        if not app.otp_created_at or (timezone.now() - app.otp_created_at) > timedelta(minutes=10):
            return JsonResponse({
                'success': False,
                'message': 'Mã OTP đã hết hiệu lực (quá 10 phút). Vui lòng nhấn "Gửi lại mã OTP".'
            }, status=400)

        # Kiểm tra khớp mã OTP
        if app.otp_code != otp_input:
            return JsonResponse({'success': False, 'message': 'Mã OTP không chính xác. Vui lòng kiểm tra lại.'}, status=400)

        # Đánh dấu đã xác thực Gmail thành công
        app.email_verified = True
        app.save(update_fields=['email_verified'])

        # Xây dựng login URL
        try:
            host = request.get_host()
            proto = 'https' if request.is_secure() else 'http'
            login_url = f"{proto}://{host}/review/"
        except Exception:
            login_url = "http://127.0.0.1:8000/review/"

        # Xử lý theo kết quả điểm thi
        if app.status == 'approved' or app.score >= app.benchmark_score:
            # Đạt điều kiện trúng tuyển -> Tự động khởi tạo tài khoản trong SSMS & gửi mail
            enroll_res = create_candidate_account_and_notify(app, login_url=login_url)
            return JsonResponse({
                'success': True,
                'qualified': True,
                'student_id': enroll_res.get('student_id'),
                'university_name': app.university.short_name or app.university.name,
                'department': app.department,
                'score': app.score,
                'benchmark': app.benchmark_score,
                'message': f'🎉 Chúc mừng bạn đã trúng tuyển vào {app.university.short_name or app.university.name}! Mã số sinh viên và mật khẩu đăng nhập đã được gửi tự động tới email {app.email}.'
            })
        else:
            # Không đủ điểm chuẩn
            return JsonResponse({
                'success': True,
                'qualified': False,
                'score': app.score,
                'benchmark': app.benchmark_score,
                'university_name': app.university.short_name or app.university.name,
                'department': app.department,
                'message': f'Xác thực Gmail thành công. Rất tiếc, điểm xét tuyển ({app.score:.2f}đ) chưa đạt điểm chuẩn ({app.benchmark_score:.2f}đ) của ngành {app.department}. Hồ sơ của bạn đã được chuyển vào hàng đợi xét duyệt bổ sung.'
            })

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Dữ liệu JSON không hợp lệ'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@csrf_exempt
def api_admission_resend_otp(request):
    """POST: Gửi lại mã OTP qua email."""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body)
        application_id = data.get('application_id')
        app = AdmissionApplication.objects.get(id=application_id)

        new_otp = generate_otp()
        app.otp_code = new_otp
        app.otp_created_at = timezone.now()
        app.save(update_fields=['otp_code', 'otp_created_at'])

        send_otp_email(app.email, new_otp, app.full_name)

        return JsonResponse({
            'success': True,
            'message': f'Đã gửi lại mã OTP mới đến email {app.email}. Vui lòng kiểm tra hộp thư đến.'
        })
    except AdmissionApplication.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Không tìm thấy hồ sơ xét tuyển'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@csrf_exempt
def api_admission_check_status(request):
    """GET: Tra cứu tiến độ xét tuyển bằng số CCCD."""
    cccd = request.GET.get('cccd', '').strip()
    clean_cccd = ''.join(c for c in cccd if c.isdigit())
    if not clean_cccd:
        return JsonResponse({'success': False, 'message': 'Vui lòng cung cấp số CCCD cần tra cứu'}, status=400)

    apps = AdmissionApplication.objects.filter(cccd=clean_cccd).select_related('university').order_by('-created_at')
    if not apps.exists():
        return JsonResponse({
            'success': True,
            'found': False,
            'message': f'Chưa tìm thấy hồ sơ xét tuyển nào ứng với số CCCD {clean_cccd}.'
        })

    results = []
    for a in apps:
        results.append({
            'id': a.id,
            'full_name': a.full_name,
            'university_name': a.university.short_name or a.university.name,
            'university_code': a.university.university_code,
            'department': a.department,
            'score': a.score,
            'benchmark': a.benchmark_score,
            'status': a.status,
            'status_display': a.get_status_display(),
            'generated_student_id': a.generated_student_id,
            'email_verified': a.email_verified,
            'created_at': a.created_at.strftime('%d/%m/%Y %H:%M'),
        })

    return JsonResponse({
        'success': True,
        'found': True,
        'applications': results
    })
