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
from student_management.models import University, AdmissionApplication, CustomUser, Student, Teacher
from student_management.admission_service import (
    get_departments_for_university,
    get_benchmark_score,
    is_valid_gmail,
    generate_otp,
    create_candidate_account_and_notify
)
from student_management.email_service import send_otp_email


def check_applicant_duplicates(full_name, clean_cccd, email, phone):
    """
    Kiểm tra toàn diện chống trùng lặp dữ liệu thí sinh:
    - 1 người không được dùng nhiều CCCD.
    - 1 CCCD không được dùng nhiều Gmail.
    - 1 Gmail không được dùng nhiều CCCD.
    - 1 SĐT không được dùng nhiều CCCD.
    - Không trùng lặp với CustomUser / Student hiện có trong hệ thống.
    Trả về (is_valid, error_message, error_field).
    """
    # 1. Kiểm tra CCCD
    # Đã có tài khoản User với username là CCCD hoặc đã trúng tuyển
    if CustomUser.objects.filter(username=clean_cccd).exists():
        return False, f"Số CCCD {clean_cccd} đã được cấp tài khoản người dùng trên hệ thống UniMS.", "cccd"

    # Kiểm tra trong AdmissionApplication
    existing_by_cccd = AdmissionApplication.objects.filter(cccd=clean_cccd).first()
    if existing_by_cccd:
        if existing_by_cccd.status == 'approved' and existing_by_cccd.generated_student_id:
            return False, f"Số CCCD {clean_cccd} đã trúng tuyển và được cấp Mã Sinh Viên ({existing_by_cccd.generated_student_id}) trong hệ thống. Vui lòng tra cứu tại mục 'Tra Cứu Kết Quả' hoặc đăng nhập vào Cổng Sinh Viên.", "cccd"
        
        # Nếu đã có hồ sơ với CCCD này nhưng thông tin khác
        if existing_by_cccd.email.lower() != email.lower():
            return False, f"Số CCCD {clean_cccd} đã được đăng ký với địa chỉ Gmail khác ({existing_by_cccd.email}). Mỗi số CCCD chỉ được liên kết với 01 địa chỉ Gmail duy nhất để bảo mật tài khoản.", "email"
        
        if existing_by_cccd.phone != phone:
            return False, f"Số CCCD {clean_cccd} đã được đăng ký với số điện thoại khác ({existing_by_cccd.phone}). Vui lòng sử dụng đúng số điện thoại đã khai báo.", "phone"

        if existing_by_cccd.full_name.strip().upper() != full_name.strip().upper():
            return False, f"Số CCCD {clean_cccd} đã được đăng ký dưới họ tên '{existing_by_cccd.full_name}'. Hệ thống không cho phép đổi tên trên cùng một số CCCD.", "full_name"

    # 2. Kiểm tra Email (Gmail)
    # Không trùng với CustomUser
    if CustomUser.objects.filter(email__iexact=email).exists():
        return False, f"Địa chỉ Gmail '{email}' đã được đăng ký bởi một tài khoản đang hoạt động trên hệ thống UniMS.", "email"

    # Không trùng với Student
    if Student.objects.filter(email__iexact=email).exists():
        return False, f"Địa chỉ Gmail '{email}' đã tồn tại trong hồ sơ sinh viên của nhà trường.", "email"

    # Không được dùng cho CCCD khác trong AdmissionApplication
    existing_by_email = AdmissionApplication.objects.filter(email__iexact=email).exclude(cccd=clean_cccd).first()
    if existing_by_email:
        masked_cccd = f"{existing_by_email.cccd[:3]}******{existing_by_email.cccd[-3:]}"
        return False, f"Địa chỉ Gmail '{email}' đã được sử dụng để đăng ký cho số CCCD khác ({masked_cccd}). Một địa chỉ Gmail chỉ được đăng ký cho 01 thí sinh duy nhất.", "email"

    # 3. Kiểm tra Số điện thoại (SĐT)
    # Không trùng với CustomUser
    if CustomUser.objects.filter(phone=phone).exists():
        return False, f"Số điện thoại '{phone}' đã được đăng ký bởi một tài khoản trên hệ thống UniMS.", "phone"

    # Không trùng với Student
    if Student.objects.filter(phone=phone).exists():
        return False, f"Số điện thoại '{phone}' đã tồn tại trong danh sách sinh viên của nhà trường.", "phone"

    # Không được dùng cho CCCD khác trong AdmissionApplication
    existing_by_phone = AdmissionApplication.objects.filter(phone=phone).exclude(cccd=clean_cccd).first()
    if existing_by_phone:
        masked_cccd = f"{existing_by_phone.cccd[:3]}******{existing_by_phone.cccd[-3:]}"
        return False, f"Số điện thoại '{phone}' đã được sử dụng cho số CCCD khác ({masked_cccd}). Một số điện thoại chỉ được dùng cho 01 thí sinh duy nhất.", "phone"

    # 4. Kiểm tra Họ tên + SĐT nhưng khác CCCD (chống 1 người dùng nhiều CCCD)
    same_name_phone = AdmissionApplication.objects.filter(
        full_name__iexact=full_name,
        phone=phone
    ).exclude(cccd=clean_cccd).first()
    if same_name_phone:
        return False, f"Thí sinh '{full_name}' với số điện thoại '{phone}' đã được đăng ký dưới một số CCCD khác trong hệ thống. Quy chế tuyển sinh không cho phép 1 cá nhân sử dụng nhiều số CCCD.", "cccd"

    return True, "", ""


@csrf_exempt
def api_admission_check_duplicate(request):
    """
    POST: API kiểm tra trùng lặp thông tin thí sinh theo thời gian thực trước khi nộp.
    Payload: { full_name, cccd, email, phone }
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body)
        full_name = data.get('full_name', '').strip()
        cccd = data.get('cccd', '').strip()
        email = data.get('email', '').strip().lower()
        phone = data.get('phone', '').strip()

        clean_cccd = ''.join(c for c in cccd if c.isdigit())
        if len(clean_cccd) != 12:
            return JsonResponse({'success': False, 'message': 'Số CCCD phải gồm đúng 12 chữ số', 'field': 'cccd'}, status=400)

        is_valid, err_msg, err_field = check_applicant_duplicates(full_name, clean_cccd, email, phone)
        if not is_valid:
            return JsonResponse({
                'success': False,
                'is_duplicate': True,
                'field': err_field,
                'message': err_msg
            }, status=409)

        return JsonResponse({
            'success': True,
            'is_duplicate': False,
            'message': 'Thông tin hợp lệ và chưa từng tồn tại trên hệ thống.'
        })
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'JSON không hợp lệ'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


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

        # 2. KIỂM TRA CHỐNG TRÙNG LẶP THÔNG TIN (Yêu cầu cao)
        # Chống 1 người dùng nhiều CCCD, 1 CCCD dùng nhiều Gmail, 1 Gmail dùng nhiều người...
        is_valid, err_msg, err_field = check_applicant_duplicates(full_name, clean_cccd, email, phone)
        if not is_valid:
            return JsonResponse({
                'success': False,
                'is_duplicate': True,
                'field': err_field,
                'message': err_msg
            }, status=409)

        # 3. Tra cứu điểm chuẩn của ngành
        benchmark = get_benchmark_score(university.university_code or '', department)

        # 4. ĐÁNH GIÁ ĐIỀU KIỆN TRÚNG TUYỂN TRƯỚC KHI GỬI OTP (Yêu cầu cao)
        # Nếu chưa đạt điểm chuẩn: BÁO LỖI NGAY, TUYỆT ĐỐI KHÔNG GỬI OTP VÀ KHÔNG CHUYỂN TRANG
        if score < benchmark:
            shortage = round(benchmark - score, 2)
            return JsonResponse({
                'success': False,
                'code': 'SCORE_NOT_QUALIFIED',
                'is_qualified': False,
                'score': score,
                'benchmark': benchmark,
                'shortage': shortage,
                'department': department,
                'university_name': university.short_name or university.name,
                'message': f"Điểm xét tuyển ({score:.2f}đ) chưa đạt điểm chuẩn ({benchmark:.2f}đ) của ngành {department} — {university.short_name or university.name}. Bạn còn thiếu {shortage:.2f}đ để đạt điều kiện trúng tuyển."
            }, status=400)

        # 5. Thí sinh ĐÃ ĐỦ ĐIỂM TRÚNG TUYỂN -> Tiến hành sinh mã OTP 6 số
        is_qualified = True
        initial_status = 'approved'
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

        # 6. Gửi mã OTP xác minh qua Gmail
        email_sent = send_otp_email(email, otp, full_name)

        msg = f'Chúc mừng bạn đã đủ điều kiện trúng tuyển ngành {department}!'
        if email_sent:
            msg += f' Mã xác thực OTP (6 chữ số) đã được gửi đến hộp thư {email}.'
        else:
            msg += f' Mã OTP xác thực của bạn là: {otp} (Lưu ý: Hệ thống Gmail SMTP cần Google App Password 16 ký tự để gửi mail thực tế).'

        return JsonResponse({
            'success': True,
            'application_id': app.id,
            'is_qualified': True,
            'score': score,
            'benchmark': benchmark,
            'surplus': round(score - benchmark, 2),
            'university_name': university.short_name or university.name,
            'department': department,
            'email_sent': email_sent,
            'dev_otp': otp,
            'message': msg
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
                'temp_password': enroll_res.get('temp_password'),
                'email_sent': enroll_res.get('email_sent', False),
                'university_name': app.university.short_name or app.university.name,
                'department': app.department,
                'score': app.score,
                'benchmark': app.benchmark_score,
                'message': f"🎉 Chúc mừng bạn đã trúng tuyển vào {app.university.short_name or app.university.name}! Mã số sinh viên: {enroll_res.get('student_id')}. " + ("Mật khẩu đã được gửi đến email " + app.email if enroll_res.get('email_sent') else f"Mật khẩu khởi tạo: {enroll_res.get('temp_password')}")
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

        email_sent = send_otp_email(app.email, new_otp, app.full_name)

        msg = f'Đã tạo mã OTP mới.'
        if email_sent:
            msg += f' Đã gửi đến email {app.email}.'
        else:
            msg += f' Mã OTP mới của bạn là: {new_otp}.'

        return JsonResponse({
            'success': True,
            'email_sent': email_sent,
            'dev_otp': new_otp,
            'message': msg
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
