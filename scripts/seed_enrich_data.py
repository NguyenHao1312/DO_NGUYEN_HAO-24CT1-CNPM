# scripts/seed_enrich_data.py
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from student_management.models import University, Student, Teacher, CustomUser

def run():
    print("=== 1. CẬP NHẬT / SEED MÃ SỐ TRƯỜNG ĐẠI HỌC ===")
    universities_data = [
        {'code': 'DUT', 'university_code': '10011', 'name': 'Đại học Bách Khoa - ĐH Đà Nẵng', 'short_name': 'ĐH Bách Khoa', 'fee': 550000},
        {'code': 'DTU', 'university_code': '10012', 'name': 'Đại học Duy Tân', 'short_name': 'ĐH Duy Tân', 'fee': 600000},
        {'code': 'FPT', 'university_code': '10013', 'name': 'Đại học FPT Đà Nẵng', 'short_name': 'ĐH FPT', 'fee': 750000},
        {'code': 'UDA', 'university_code': '10014', 'name': 'Đại học Đông Á', 'short_name': 'ĐH Đông Á', 'fee': 500000},
        {'code': 'UED', 'university_code': '10015', 'name': 'Đại học Sư phạm - ĐH Đà Nẵng', 'short_name': 'ĐH Sư phạm', 'fee': 400000},
        {'code': 'VKU', 'university_code': '10016', 'name': 'Đại học CNTT & Truyền thông Việt - Hàn', 'short_name': 'ĐH Việt - Hàn (VKU)', 'fee': 520000},
        {'code': 'UMP', 'university_code': '10017', 'name': 'Đại học Kỹ thuật Y - Dược Đà Nẵng', 'short_name': 'ĐH Y Dược', 'fee': 700000},
        {'code': 'DUE', 'university_code': '10018', 'name': 'Đại học Kinh tế - ĐH Đà Nẵng', 'short_name': 'ĐH Kinh tế', 'fee': 520000},
        {'code': 'DAU', 'university_code': '10019', 'name': 'Đại học Kiến trúc Đà Nẵng', 'short_name': 'ĐH Kiến trúc', 'fee': 550000},
        {'code': 'UFLS', 'university_code': '10020', 'name': 'Đại học Ngoại ngữ - ĐH Đà Nẵng', 'short_name': 'ĐH Ngoại ngữ', 'fee': 480000},
        {'code': 'UTE', 'university_code': '10021', 'name': 'Đại học Sư phạm Kỹ thuật - ĐH Đà Nẵng', 'short_name': 'ĐH SP Kỹ thuật', 'fee': 500000},
    ]

    uni_map = {}
    for udata in universities_data:
        uni = University.objects.filter(code=udata['code']).first()
        if not uni:
            uni = University.objects.create(
                code=udata['code'],
                university_code=udata['university_code'],
                name=udata['name'],
                short_name=udata['short_name'],
                fee_per_credit=udata['fee']
            )
            print(f"+ Đã tạo mới trường {uni.short_name} ({uni.university_code})")
        else:
            uni.university_code = udata['university_code']
            uni.name = udata['name']
            uni.short_name = udata['short_name']
            uni.fee_per_credit = udata['fee']
            uni.save()
            print(f"* Đã cập nhật mã trường {uni.short_name} -> {uni.university_code}")
        uni_map[udata['code']] = uni

    print("\n=== 2. BỔ SUNG ĐẦY ĐỦ THÔNG TIN CHO CÁC SINH VIÊN HIỆN CÓ ===")
    dut = uni_map.get('DUT')
    due = uni_map.get('DUE')
    ufls = uni_map.get('UFLS')

    student_enrichments = [
        {
            'student_id': '100011',
            'full_name': 'Nguyễn Văn Nam',
            'email': 'nam.nv100011@dut.udn.vn',
            'phone': '0905123456',
            'dob': date(2004, 3, 15),
            'gender': 'male',
            'department': 'Công nghệ Thông tin',
            'academic_year': '2022-2026',
            'university': dut,
            'status': 'active',
            'gpa': 3.42,
            'gpa10': 8.2,
        },
        {
            'student_id': '100012',
            'full_name': 'Trần Thị Mai',
            'email': 'mai.tt100012@dut.udn.vn',
            'phone': '0905234567',
            'dob': date(2004, 7, 22),
            'gender': 'female',
            'department': 'Công nghệ Thông tin',
            'academic_year': '2022-2026',
            'university': dut,
            'status': 'active',
            'gpa': 3.65,
            'gpa10': 8.7,
        },
        {
            'student_id': '100013',
            'full_name': 'Lê Bình',
            'email': 'binh.l100013@dut.udn.vn',
            'phone': '0905345678',
            'dob': date(2004, 11, 5),
            'gender': 'male',
            'department': 'Kỹ thuật Phần mềm',
            'academic_year': '2022-2026',
            'university': dut,
            'status': 'active',
            'gpa': 3.15,
            'gpa10': 7.6,
        },
        {
            'student_id': '100021',
            'full_name': 'Phạm Tuấn',
            'email': 'tuan.p100021@due.udn.vn',
            'phone': '0905456789',
            'dob': date(2003, 5, 19),
            'gender': 'male',
            'department': 'Quản trị Kinh doanh',
            'academic_year': '2021-2025',
            'university': due,
            'status': 'active',
            'gpa': 3.30,
            'gpa10': 8.0,
        },
        {
            'student_id': '100041',
            'full_name': 'Hoàng Quyên',
            'email': 'quyen.h100041@ufls.udn.vn',
            'phone': '0905567890',
            'dob': date(2004, 9, 30),
            'gender': 'female',
            'department': 'Ngôn ngữ Anh',
            'academic_year': '2022-2026',
            'university': ufls,
            'status': 'active',
            'gpa': 3.55,
            'gpa10': 8.5,
        },
        {
            'student_id': 'testreg1233',
            'full_name': 'Test User1',
            'email': 'testuser1@student.unims.edu.vn',
            'phone': '0905999888',
            'dob': date(2003, 1, 1),
            'gender': 'male',
            'department': 'Công nghệ Thông tin',
            'academic_year': '2022-2026',
            'university': dut,
            'status': 'active',
            'gpa': 3.0,
            'gpa10': 7.5,
        },
        {
            'student_id': '100015',
            'full_name': 'USER_002',
            'email': 'user002@student.unims.edu.vn',
            'phone': '0905888777',
            'dob': date(2004, 2, 2),
            'gender': 'male',
            'department': 'Hệ thống Thông tin',
            'academic_year': '2022-2026',
            'university': dut,
            'status': 'active',
            'gpa': 3.2,
            'gpa10': 7.8,
        },
    ]

    for item in student_enrichments:
        sid = item['student_id']
        s = Student.objects.filter(student_id=sid).first()
        if s:
            s.full_name = item['full_name']
            s.email = item['email']
            s.phone = item['phone']
            s.dob = item['dob']
            s.gender = item['gender']
            s.department = item['department']
            s.academic_year = item['academic_year']
            s.university = item['university']
            s.status = item['status']
            s.gpa = item['gpa']
            s.gpa10 = item['gpa10']
            s.save()
            
            # Cập nhật cả User nếu có
            if s.user:
                s.user.email = item['email']
                s.user.phone = item['phone']
                s.user.first_name = item['full_name']
                s.user.save()
            print(f"✓ Đã bổ sung đầy đủ thông tin cho sinh viên: {s.student_id} - {s.full_name}")

    print("\nHoàn tất nạp dữ liệu trường & sinh viên!")

if __name__ == '__main__':
    run()
