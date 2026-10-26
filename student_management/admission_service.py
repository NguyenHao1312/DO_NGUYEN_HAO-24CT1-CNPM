"""
student_management/admission_service.py
Dịch vụ Xét Nguyện Vọng Tuyển Sinh & Cấp Mã Sinh Viên Tự Động:
- Tra cứu và đối soát điểm chuẩn các trường/ngành (thang điểm 30).
- Tự động sinh mã Sinh Viên theo quy ước: {university_code}{sequence}
  + Bách Khoa: 100110, 100111...
  + Duy Tân: 100120, 100121...
  + FPT: 100130, 100131...
- Sinh mật khẩu ngẫu nhiên (chữ và số).
- Tạo tài khoản CustomUser (cờ must_change_password=True) & Student trong SSMS.
- Gửi email thông báo tự động.
"""
import random
import string
import re
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from student_management.models import (
    University, Student, CustomUser, AdmissionApplication
)
from student_management.email_service import (
    send_otp_email, send_admission_success_email
)

# ────────────────────────────────────────────────────────────
# BẢNG ĐIỂM CHUẨN THAM CHIẾU CÁC TRƯỜNG & NGÀNH (THANG 30 ĐIỂM)
# ────────────────────────────────────────────────────────────
UNIVERSITY_MAJORS_BENCHMARKS = {
    '10011': { # DUT - ĐH Bách Khoa (27 - 29.25đ)
        'Khoa học Máy tính': 29.10,
        'Công nghệ Thông tin': 28.75,
        'Kỹ thuật Phần mềm': 28.25,
        'Kỹ thuật Điều khiển & Tự động hóa': 27.80,
        'Công nghệ Kỹ thuật Điện - Điện tử': 27.50,
        'Kỹ thuật Cơ khí': 27.00,
        'Chung': 27.00,
    },
    '10012': { # DTU - ĐH Duy Tân (18 - 22.50đ)
        'Công nghệ Phần mềm': 22.50,
        'Dược học': 21.00,
        'Quản trị Khách sạn': 20.00,
        'Thiết kế Đồ họa': 19.50,
        'Quản trị Kinh doanh': 18.50,
        'Chung': 18.00,
    },
    '10013': { # FPT - ĐH FPT Đà Nẵng (21 - 24.50đ)
        'Trí tuệ Nhân tạo': 24.50,
        'Kỹ thuật Phần mềm': 24.00,
        'An toàn Thông tin': 23.50,
        'Thiết kế Mỹ thuật số': 21.50,
        'Quản trị Kinh doanh': 21.00,
        'Chung': 21.00,
    },
    '10014': { # UDA - ĐH Đông Á (18 - 20.50đ)
        'Điều dưỡng': 20.50,
        'Công nghệ Thông tin': 19.00,
        'Ngôn ngữ Nhật': 18.50,
        'Chung': 18.00,
    },
    '10015': { # UED - ĐH Sư phạm (22 - 26.50đ)
        'Sư phạm Toán học': 26.50,
        'Sư phạm Ngữ văn': 26.00,
        'Giáo dục Tiểu học': 25.50,
        'Công nghệ Thông tin': 22.00,
        'Chung': 22.00,
    },
    '10016': { # VKU - ĐH CNTT & TT Việt - Hàn (22.50 - 25.25đ)
        'Trí tuệ Nhân tạo': 25.25,
        'Công nghệ Thông tin': 25.00,
        'Kỹ thuật Phần mềm': 24.75,
        'Quản trị Kinh doanh Số': 22.50,
        'Chung': 22.50,
    },
    '10017': { # UMP - ĐH Y Dược Đà Nẵng (21 - 26.50đ)
        'Y khoa': 26.50,
        'Dược học': 25.00,
        'Kỹ thuật Xét nghiệm Y học': 23.50,
        'Điều dưỡng': 21.00,
        'Chung': 21.00,
    },
    '10018': { # DUE - ĐH Kinh tế (24.50 - 26.25đ)
        'Kinh doanh Quốc tế': 26.25,
        'Marketing': 25.75,
        'Thương mại Điện tử': 25.50,
        'Tài chính - Ngân hàng': 24.80,
        'Kế toán': 24.50,
        'Chung': 24.50,
    },
    '10019': { # DAU - ĐH Kiến trúc Đà Nẵng (19 - 23.50đ)
        'Kiến trúc': 23.50,
        'Thiết kế Nội thất': 22.00,
        'Kỹ thuật Xây dựng': 19.00,
        'Chung': 19.00,
    },
    '10020': { # UFLS - ĐH Ngoại ngữ (24 - 26.50đ)
        'Sư phạm Tiếng Anh': 26.50,
        'Ngôn ngữ Hàn Quốc': 25.25,
        'Ngôn ngữ Anh': 25.00,
        'Ngôn ngữ Trung Quốc': 24.50,
        'Ngôn ngữ Nhật': 24.00,
        'Chung': 24.00,
    },
    '10021': { # UTE - ĐH Sư phạm Kỹ thuật (22.50 - 24.50đ)
        'Công nghệ Kỹ thuật Ô tô': 24.50,
        'Công nghệ Thông tin': 24.00,
        'Công nghệ Kỹ thuật Cơ điện tử': 23.50,
        'Kỹ thuật Điện tử': 22.50,
        'Chung': 22.50,
    },
}

DEFAULT_BENCHMARK = 20.00


def get_departments_for_university(uni_code: str):
    """Lấy danh sách các ngành và điểm chuẩn theo mã trường."""
    majors_dict = UNIVERSITY_MAJORS_BENCHMARKS.get(uni_code, {'Chung': DEFAULT_BENCHMARK})
    return [
        {'name': major, 'benchmark': score}
        for major, score in majors_dict.items()
        if major != 'Chung'
    ] or [{'name': 'Chung', 'benchmark': DEFAULT_BENCHMARK}]


def get_benchmark_score(uni_code: str, department: str) -> float:
    """Tra cứu điểm chuẩn của một ngành thuộc trường."""
    uni_majors = UNIVERSITY_MAJORS_BENCHMARKS.get(uni_code, {})
    if department in uni_majors:
        return uni_majors[department]
    return uni_majors.get('Chung', DEFAULT_BENCHMARK)


def is_valid_gmail(email: str) -> bool:
    """Kiểm tra định dạng email phải là @gmail.com hợp lệ."""
    if not email:
        return False
    email = email.strip().lower()
    pattern = r'^[a-z0-9](\.?[a-z0-9_-]){4,}@gmail\.com$'
    return bool(re.match(pattern, email))


def generate_otp() -> str:
    """Sinh mã OTP ngẫu nhiên 6 chữ số."""
    return ''.join(random.choices(string.digits, k=6))


def generate_temp_password(length: int = 8) -> str:
    """
    Sinh mật khẩu tạm thời ngẫu nhiên gồm cả chữ và số (Alphanumeric).
    Đảm bảo có ít nhất 1 chữ hoa, 1 chữ thường và 1 số.
    """
    chars = string.ascii_letters + string.digits
    while True:
        pwd = ''.join(random.choices(chars, k=length))
        has_upper = any(c.isupper() for c in pwd)
        has_lower = any(c.islower() for c in pwd)
        has_digit = any(c.isdigit() for c in pwd)
        if has_upper and has_lower and has_digit:
            return pwd


def generate_next_student_id(university: University) -> str:
    """
    Sinh mã sinh viên tự động theo trường:
    Mã bắt đầu bằng mã trường (VD Bách Khoa: 10011) nối với số thứ tự:
    100110, 100111, 100112... 10011n.
    Sử dụng transaction atomic để tránh va chạm / trùng lặp mã.
    """
    prefix = university.university_code or '10011'
    
    with transaction.atomic():
        # Lấy tất cả mã SV hiện có bắt đầu bằng prefix
        existing_ids = list(
            Student.objects.filter(student_id__startswith=prefix)
            .values_list('student_id', flat=True)
        )
        
        # Tìm số sequence lớn nhất
        max_seq = -1
        prefix_len = len(prefix)
        for sid in existing_ids:
            suffix = sid[prefix_len:]
            if suffix.isdigit():
                val = int(suffix)
                if val > max_seq:
                    max_seq = val
        
        next_seq = max_seq + 1
        return f"{prefix}{next_seq}"


def create_candidate_account_and_notify(app: AdmissionApplication, login_url: str = "http://127.0.0.1:8000/review/") -> dict:
    """
    Kích hoạt tạo tài khoản cho thí sinh trúng tuyển:
    1. Sinh mã sinh viên tự động
    2. Sinh mật khẩu tạm (chữ + số)
    3. Tạo CustomUser (must_change_password=True) và hồ sơ Student trong SSMS
    4. Gửi email thông báo trúng tuyển
    5. Cập nhật trạng thái AdmissionApplication -> credentials_sent
    """
    if app.status == 'credentials_sent' and app.generated_student_id:
        return {
            'success': True,
            'message': 'Thí sinh đã được cấp tài khoản trước đó.',
            'student_id': app.generated_student_id
        }

    with transaction.atomic():
        student_id = generate_next_student_id(app.university)
        temp_pwd = generate_temp_password(8)

        # 1. Tạo CustomUser
        user = CustomUser(
            username=student_id,
            first_name=app.full_name,
            email=app.email,
            phone=app.phone,
            role='student',
            must_change_password=True,
        )
        user.set_password(temp_pwd)
        user.save()

        # 2. Tạo hồ sơ Student trong SSMS (mặc định nợ học phí kỳ 1 để chờ kế toán duyệt)
        student = Student.objects.create(
            user=user,
            student_id=student_id,
            full_name=app.full_name,
            email=app.email,
            phone=app.phone,
            department=app.department,
            academic_year=f"{timezone.now().year}-{timezone.now().year + 4}",
            university=app.university,
            status='active',
            tuition_debt=True,
        )

        # 3. Cập nhật Application
        app.status = 'credentials_sent'
        app.generated_student_id = student_id
        app.generated_user = user
        app.save(update_fields=['status', 'generated_student_id', 'generated_user', 'updated_at'])

    # 4. Gửi email thông báo trúng tuyển (ngoài atomic block để không rollback nếu mail lỗi)
    uni_name = app.university.short_name or app.university.name
    mail_sent = send_admission_success_email(
        to_email=app.email,
        candidate_name=app.full_name,
        university_name=uni_name,
        department_name=app.department,
        student_id=student_id,
        temp_password=temp_pwd,
        login_url=login_url
    )

    return {
        'success': True,
        'student_id': student_id,
        'temp_password': temp_pwd,
        'email_sent': mail_sent,
        'message': f'Đã cấp mã sinh viên {student_id} thành công!' + (' Mật khẩu đã được gửi về Gmail.' if mail_sent else ' (Gợi ý: Cần Google App Password trong .env để chuyển phát mail thực tế).')
    }
