# scripts/seed_academic_data.py
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.utils import timezone
from student_management.models import (
    CustomUser, Student, Teacher, CourseClass, Registration, Grade, Attendance, Semester, University
)
from student_management.account_lifecycle import detect_ghost_accounts

def seed_academic_info():
    print("=== SEEDING BASIC ACADEMIC INFO TO PREVENT GHOST ACCOUNTS ===")
    
    # 1. Get or create Semester
    sem1 = Semester.objects.filter(code='HK1-2025-2026').first()
    if not sem1:
        sem1 = Semester.objects.create(
            name='Học kì 1 - 2025-2026',
            code='HK1-2025-2026',
            academic_year='2025-2026'
        )

    # 2. Universities
    bk = University.objects.filter(university_code='10011').first()
    due = University.objects.filter(university_code='10018').first()
    ufls = University.objects.filter(university_code='10020').first()

    # 3. Fix orphan teacher users GV001, GV002
    u_gv001 = CustomUser.objects.filter(username='GV001').first()
    if u_gv001:
        t_gv001, _ = Teacher.objects.get_or_create(
            teacher_id='GV001',
            defaults={
                'user': u_gv001,
                'full_name': 'ThS. Vũ Đình Trọng',
                'department': 'Khoa học Máy tính',
                'degree': 'Thạc sĩ',
                'university': bk,
                'status': 'active'
            }
        )
        if not t_gv001.user:
            t_gv001.user = u_gv001
            t_gv001.save()

    u_gv002 = CustomUser.objects.filter(username='GV002').first()
    if u_gv002:
        t_gv002, _ = Teacher.objects.get_or_create(
            teacher_id='GV002',
            defaults={
                'user': u_gv002,
                'full_name': 'TS. Đặng Thị Nga',
                'department': 'Kỹ thuật Phần mềm',
                'degree': 'Tiến sĩ',
                'university': bk,
                'status': 'active'
            }
        )
        if not t_gv002.user:
            t_gv002.user = u_gv002
            t_gv002.save()

    # 4. Create Classes for Teachers
    classes_def = [
        ('CS101', 'Nhập môn Lập trình', '1011', 3, 'A1-201', 'Thứ 2, Tiết 1-3'),
        ('CS102', 'Cấu trúc Dữ liệu & Giải thuật', '1012', 4, 'A1-202', 'Thứ 3, Tiết 4-6'),
        ('CS103', 'Cơ sở Dữ liệu Nâng cao', '1013', 3, 'B2-101', 'Thứ 4, Tiết 1-3'),
        ('IS201', 'Hệ thống Thông tin Doanh nghiệp', '1021', 3, 'B2-102', 'Thứ 5, Tiết 7-9'),
        ('AI301', 'Nhập môn Trí tuệ Nhân tạo', '1041', 3, 'C3-301', 'Thứ 6, Tiết 1-3'),
        ('SE201', 'Công nghệ Phần mềm', '100018', 3, 'A2-105', 'Thứ 7, Tiết 4-6'),
        ('BA101', 'Quản trị Học đại cương', 'GV001', 3, 'D1-101', 'Thứ 2, Tiết 7-9'),
        ('EN101', 'Tiếng Anh Học thuật', 'GV002', 3, 'D1-102', 'Thứ 3, Tiết 1-3'),
    ]

    created_classes = {}
    for code, name, t_id, credits, room, sched in classes_def:
        teacher = Teacher.objects.filter(teacher_id=t_id).first()
        c, _ = CourseClass.objects.get_or_create(
            class_code=code,
            defaults={
                'name': name,
                'teacher': teacher,
                'credits': credits,
                'room': room,
                'schedule': sched,
                'semester': sem1,
                'max_students': 50
            }
        )
        if teacher and c.teacher != teacher:
            c.teacher = teacher
            c.save()
        created_classes[code] = c

    # 5. Populate Student Registrations & Grades
    cs101 = created_classes.get('CS101')
    cs102 = created_classes.get('CS102')
    ba101 = created_classes.get('BA101')
    en101 = created_classes.get('EN101')

    now = timezone.now()
    for student in Student.objects.all():
        # Pick 2 classes based on department/university
        if 'Kinh tế' in (student.department or '') or (student.university and student.university.university_code == '10018'):
            target_classes = [ba101, en101]
        elif 'Ngoại ngữ' in (student.department or '') or (student.university and student.university.university_code == '10020'):
            target_classes = [en101, cs101]
        else:
            target_classes = [cs101, cs102]

        for cc in target_classes:
            if not cc:
                continue
            reg, _ = Registration.objects.get_or_create(
                student=student,
                course_class=cc,
                defaults={
                    'semester': sem1,
                    'status': 'completed'
                }
            )

            grd, created = Grade.objects.get_or_create(
                student=student,
                course_class=cc,
                defaults={
                    'semester': sem1,
                    'assignment': 8.5,
                    'midterm': 8.0,
                    'final': 8.5
                }
            )
            if created or not grd.average10:
                grd.assignment = 8.5
                grd.midterm = 8.0
                grd.final = 8.5
                grd.calculate_and_save()

            att, _ = Attendance.objects.get_or_create(
                student=student,
                course_class=cc,
                date=now.date(),
                defaults={'status': 'present'}
            )

        # Update user activity
        if student.user:
            student.user.last_login_at = now
            student.user.save(update_fields=['last_login_at'])

    # Update teacher activity
    for teacher in Teacher.objects.all():
        if teacher.user:
            teacher.user.last_login_at = now
            teacher.user.save(update_fields=['last_login_at'])

    print("✓ Successfully assigned CourseClasses to Teachers.")
    print("✓ Successfully populated Registrations, Grades, and Attendance for Students.")

    # 6. Check ghost accounts now
    ghosts = detect_ghost_accounts(days_inactive=30)
    print(f"\n-> Kết quả quét tài khoản ma sau khi bổ sung thông tin: {len(ghosts)} tài khoản ma.")
    for g in ghosts:
        print(f"   - {g['username']} ({g['role']}): {g['reason_display']}")

if __name__ == '__main__':
    seed_academic_info()
