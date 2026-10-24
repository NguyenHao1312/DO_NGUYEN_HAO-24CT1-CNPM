# scripts/test_phase3_flow.py
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

import json
from django.test import RequestFactory
from student_management.models import University, Student, CustomUser, AdmissionApplication
from student_management.admission_service import (
    generate_next_student_id,
    create_candidate_account_and_notify,
    get_benchmark_score
)
from student_management.views.admission import (
    api_admission_apply,
    api_admission_verify_otp,
    api_admission_check_status,
)
from student_management.views.user.auth import (
    api_login,
    api_change_password,
)
from student_management.views.admin.admissions import (
    api_admin_admissions,
    api_admin_admission_approve,
)

rf = RequestFactory()

def test_all():
    print("==================================================")
    print("KIỂM THỬ TÍNH NĂNG GIAI ĐOẠN 3 (PHASE 3 END-TO-END)")
    print("==================================================")

    # 1. Kiểm tra sinh mã sinh viên theo trường
    bk = University.objects.get(university_code='10011')
    dtu = University.objects.get(university_code='10012')
    
    code_bk = generate_next_student_id(bk)
    code_dtu = generate_next_student_id(dtu)
    print(f"1. Sinh mã SV kế tiếp - Bách Khoa: {code_bk} (bắt đầu bằng 10011)")
    print(f"   Sinh mã SV kế tiếp - Duy Tân:    {code_dtu} (bắt đầu bằng 10012)")
    assert code_bk.startswith('10011'), "Mã Bách Khoa phải bắt đầu bằng 10011"
    assert code_dtu.startswith('10012'), "Mã Duy Tân phải bắt đầu bằng 10012"

    # 2. Thí sinh nộp hồ sơ xét tuyển đạt điểm chuẩn
    test_cccd = "048099887766"
    test_email = "candidate_test_dut@gmail.com"
    # Dọn dẹp dữ liệu test cũ nếu có
    AdmissionApplication.objects.filter(cccd=test_cccd).delete()
    CustomUser.objects.filter(username__startswith='10011').delete()
    Student.objects.filter(student_id__startswith='10011').delete()

    apply_payload = {
        'full_name': 'Nguyễn Hoàng Long',
        'cccd': test_cccd,
        'email': test_email,
        'phone': '0905111222',
        'university_id': bk.id,
        'department': 'Khoa học Máy tính',
        'score': 29.50 # Benchmark là 29.10 -> ĐẬU
    }
    req = rf.post('/api/admission/apply/', data=json.dumps(apply_payload), content_type='application/json')
    res = api_admission_apply(req)
    data = json.loads(res.content)
    print(f"\n2. Nộp hồ sơ xét tuyển: status_code={res.status_code}, success={data.get('success')}")
    assert data['success'] == True
    assert data['is_qualified'] == True
    app_id = data['application_id']

    # 3. Xác thực OTP
    app = AdmissionApplication.objects.get(id=app_id)
    otp = app.otp_code
    print(f"   Mã OTP được sinh trong hệ thống: {otp}")

    verify_payload = {
        'application_id': app_id,
        'otp': otp
    }
    req2 = rf.post('/api/admission/verify-otp/', data=json.dumps(verify_payload), content_type='application/json')
    res2 = api_admission_verify_otp(req2)
    data2 = json.loads(res2.content)
    print(f"3. Xác thực OTP & Tự động cấp mã SV: success={data2.get('success')}, qualified={data2.get('qualified')}")
    print(f"   Mã Sinh Viên được cấp: {data2.get('student_id')}")
    assert data2['success'] == True
    assert data2['qualified'] == True
    gen_student_id = data2['student_id']
    assert gen_student_id == '100110', f"Mã sinh viên đầu tiên của Bách Khoa phải là 100110, nhận được: {gen_student_id}"

    # Kiểm tra trong DB
    user = CustomUser.objects.get(username=gen_student_id)
    student = Student.objects.get(student_id=gen_student_id)
    print(f"   ✓ Đã tạo CustomUser trong SSMS: {user.username} (must_change_password={user.must_change_password})")
    print(f"   ✓ Đã tạo Student profile trong SSMS: {student.full_name} ({student.department} - {student.university.short_name})")
    assert user.must_change_password == True, "must_change_password phải bằng True cho SV mới"

    # 4. Kiểm tra thí sinh đăng nhập lần đầu vào hệ thống chính
    # Vì mật khẩu tạm được hash trong DB, lấy user để kiểm tra logic login
    login_payload = {
        'username': gen_student_id,
        'password': 'WrongPassword123'
    }
    req_login_fail = rf.post('/api/login/', data=json.dumps(login_payload), content_type='application/json')
    res_login_fail = api_login(req_login_fail)
    assert res_login_fail.status_code == 401, "Sai pass phải trả về 401"
    print("4. Chống dò mật khẩu (CWE-204): Sai pass bị chặn 401 chuẩn xác.")

    # Đặt mật khẩu tạm dễ test
    temp_pass = "TempPass123"
    user.set_password(temp_pass)
    user.save()

    req_login = rf.post('/api/login/', data=json.dumps({'username': gen_student_id, 'password': temp_pass}), content_type='application/json')
    res_login = api_login(req_login)
    data_login = json.loads(res_login.content)
    print(f"   Đăng nhập lần đầu: success={data_login.get('success')}")
    print(f"   Cờ must_change_password trả về client: {data_login['user']['must_change_password']}")
    assert data_login['user']['must_change_password'] == True
    session_token = data_login['session_token']

    # 5. Sinh viên đổi mật khẩu
    new_pass = "MySecretPass2026"
    change_payload = {
        'new_password': new_pass
    }
    req_change = rf.post('/api/change-password/', data=json.dumps(change_payload), content_type='application/json', HTTP_X_SESSION_TOKEN=session_token)
    res_change = api_change_password(req_change)
    data_change = json.loads(res_change.content)
    print(f"5. Đổi mật khẩu lần đầu: success={data_change.get('success')}, msg={data_change.get('message')}")
    assert data_change['success'] == True

    # Kiểm tra cờ must_change_password đã tắt và pass mới đã lưu vào SSMS
    user.refresh_from_db()
    assert user.must_change_password == False
    assert user.check_password(new_pass) == True
    print("   ✓ Mật khẩu mới đã được cập nhật vào SSMS, cờ must_change_password đã tắt.")

    # 6. Đăng nhập lại với mật khẩu mới
    req_login2 = rf.post('/api/login/', data=json.dumps({'username': gen_student_id, 'password': new_pass}), content_type='application/json')
    res_login2 = api_login(req_login2)
    data_login2 = json.loads(res_login2.content)
    assert data_login2['success'] == True
    assert data_login2['user']['must_change_password'] == False
    print("6. Đăng nhập lại với mật khẩu mới: Thành công rực rỡ, không còn yêu cầu đổi pass.")

    # 7. Kiểm tra API Tra cứu bằng CCCD
    req_lookup = rf.get(f'/api/admission/check-status/?cccd={test_cccd}')
    res_lookup = api_admission_check_status(req_lookup)
    data_lookup = json.loads(res_lookup.content)
    print(f"7. Tra cứu CCCD ({test_cccd}): tìm thấy {len(data_lookup['applications'])} hồ sơ, Mã SV: {data_lookup['applications'][0]['generated_student_id']}")
    assert data_lookup['found'] == True
    assert data_lookup['applications'][0]['generated_student_id'] == gen_student_id

    # 8. Kiểm tra Admin Dashboard Admission API
    admin_user = CustomUser.objects.filter(role='admin').first()
    if not admin_user:
        admin_user = CustomUser.objects.create_superuser('admin_test', 'admin@unims.vn', '123')
        admin_user.role = 'admin'
        admin_user.save()
    admin_user.session_token = 'admin-test-token-123'
    admin_user.save()

    req_adm_list = rf.get('/admin/api/admissions/', HTTP_X_SESSION_TOKEN=admin_user.session_token)
    res_adm_list = api_admin_admissions(req_adm_list)
    data_adm_list = json.loads(res_adm_list.content)
    print(f"8. Admin API: Lấy danh sách hồ sơ: success={data_adm_list['success']}, tổng số={data_adm_list['total']}")
    assert data_adm_list['success'] == True
    assert data_adm_list['total'] >= 1

    print("\n==================================================")
    print("🎉 TẤT CẢ 8 BƯỚC KIỂM THỬ ĐỀU THÀNH CÔNG 100%!")
    print("==================================================")

if __name__ == '__main__':
    test_all()
