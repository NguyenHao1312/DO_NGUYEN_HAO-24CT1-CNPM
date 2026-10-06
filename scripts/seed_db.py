# Cách chạy: cd d:\24CT1-DO_NGUYEN_HAO && python scripts/seed_db.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from student_management.models import CustomUser, University, Student, Teacher

def seed():
    print("Bắt đầu nạp dữ liệu mẫu vào SSM Database...")

    # 1. Tạo University
    uni, _ = University.objects.get_or_create(
        id=1,
        defaults={'name': 'Đại học Bách Khoa', 'code': 'DUT'}
    )

    # 2. Tạo Admin
    if not CustomUser.objects.filter(username='admin').exists():
        admin = CustomUser.objects.create_superuser(
            username='admin',
            email='admin@unims.edu.vn',
            password='123'
        )
        admin.first_name = 'Administrator'
        admin.role = 'admin'
        admin.save()
        print("- Đã tạo tài khoản Admin (admin/123)")

    # 3. Tạo Teachers (giống với mock data của database.js)
    teachers_data = [
        {'id': '1011', 'name': 'ThS. Nguyễn Văn A', 'dept': 'Khoa học Máy tính'},
        {'id': '1012', 'name': 'TS. Trần Thị B', 'dept': 'Khoa học Máy tính'},
        {'id': '1013', 'name': 'ThS. Lê Văn C', 'dept': 'Kỹ thuật Phần mềm'},
        {'id': '1021', 'name': 'TS. Phạm Văn D', 'dept': 'Hệ thống Thông tin'},
        {'id': '1041', 'name': 'PGS.TS Hoàng Thị E', 'dept': 'Trí tuệ Nhân tạo'},
    ]
    for t in teachers_data:
        code = t['id']
        name = t['name']
        dept = t['dept']
        if not CustomUser.objects.filter(username=code).exists():
            user = CustomUser.objects.create_user(
                username=code,
                password='123',
                first_name=name,
                role='teacher'
            )
            Teacher.objects.create(
                user=user,
                teacher_id=code,
                full_name=name,
                department=dept,
                university=uni
            )
            print(f"- Đã tạo giáo viên {name} ({code}/123)")

    # 4. Tạo Students (giống với mock data của database.js)
    students_data = [
        {'id': '100011', 'name': 'Nguyễn Văn Nam', 'dept': 'CNTT'},
        {'id': '100012', 'name': 'Trần Thị Mai', 'dept': 'CNTT'},
        {'id': '100013', 'name': 'Lê Bình', 'dept': 'CNTT'},
        {'id': '100021', 'name': 'Phạm Tuấn', 'dept': 'Kinh tế'},
        {'id': '100041', 'name': 'Hoàng Quyên', 'dept': 'Ngoại ngữ'},
    ]
    for s in students_data:
        code = s['id']
        name = s['name']
        dept = s['dept']
        if not CustomUser.objects.filter(username=code).exists():
            user = CustomUser.objects.create_user(
                username=code,
                password='123',
                first_name=name,
                role='student'
            )
            Student.objects.create(
                user=user,
                student_id=code,
                full_name=name,
                department=dept,
                university=uni
            )
            print(f"- Đã tạo sinh viên {name} ({code}/123)")

    print("Hoàn tất nạp dữ liệu!")

if __name__ == '__main__':
    seed()
