"""
student_management/models.py
Cấu trúc database hoàn chỉnh cho hệ thống UniMS.
Bao gồm: User, University, Semester, Student, Teacher, CourseClass,
Registration, Grade, Attendance, GradeEditConfig.
"""
from django.db import models
from django.contrib.auth.models import AbstractUser


# ============================================================
#  1. CUSTOM USER — Mở rộng Django User với session enforcement
# ============================================================
class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.TextField(blank=True, null=True)

    # --- Single-session enforcement (server-side) ---
    session_token = models.CharField(max_length=128, blank=True, null=True, db_index=True)
    session_ip = models.GenericIPAddressField(blank=True, null=True)
    session_device = models.TextField(blank=True, null=True)
    last_login_at = models.DateTimeField(blank=True, null=True)

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='student_management_user_set',
        blank=True,
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='student_management_user_set',
        blank=True,
    )

    class Meta:
        db_table = 'student_management_customuser'

    def __str__(self):
        return f"{self.username} ({self.role})"


# ============================================================
#  2. UNIVERSITY
# ============================================================
class University(models.Model):
    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=50, blank=True, null=True)
    code = models.CharField(max_length=20, unique=True, blank=True, null=True)
    fee_per_credit = models.IntegerField(default=500000)
    increase_rate = models.FloatField(default=0.0)

    class Meta:
        db_table = 'student_management_university'

    def __str__(self):
        return self.short_name or self.name


# ============================================================
#  3. SEMESTER — Quản lý học kì + Lock flags đa mốc
# ============================================================
class Semester(models.Model):
    STATUS_CHOICES = (
        ('active', 'Đang diễn ra'),
        ('upcoming', 'Sắp tới'),
        ('completed', 'Đã kết thúc'),
    )
    code = models.CharField(max_length=50, unique=True)          # VD: "HK1-2025-2026"
    name = models.CharField(max_length=100)                       # VD: "Học kì 1 - 2025-2026"
    academic_year = models.CharField(max_length=20)               # VD: "2025-2026"
    start_date = models.DateField()
    end_date = models.DateField()
    exam_start_date = models.DateField(null=True, blank=True)     # Ngày bắt đầu thi cuối kì
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')

    # --- Lock flags ---
    # Mốc 1: Trước thi — khoá điểm thành phần (CC, GK) + danh sách dự thi
    pre_exam_lock = models.BooleanField(default=False)
    pre_exam_lock_date = models.DateField(null=True, blank=True)

    # Mốc 2: Trước ĐKHP — khoá toàn bộ bảng điểm để tính GPA, kiểm tra tiên quyết
    pre_registration_lock = models.BooleanField(default=False)
    pre_registration_lock_date = models.DateField(null=True, blank=True)

    # Mốc 3: Tạm thời — đang chấm thi (khoá xem + chỉnh sửa)
    temporary_lock = models.BooleanField(default=False)
    temporary_lock_reason = models.CharField(max_length=255, blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_management_semester'
        ordering = ['-start_date']

    def __str__(self):
        return self.name


# ============================================================
#  4. STUDENT
# ============================================================
class Student(models.Model):
    GENDER_CHOICES = (('male', 'Nam'), ('female', 'Nữ'), ('other', 'Khác'))
    STATUS_CHOICES = (
        ('active', 'Đang học'),
        ('inactive', 'Nghỉ học'),
        ('graduated', 'Đã tốt nghiệp'),
        ('suspended', 'Đình chỉ'),
    )

    user = models.OneToOneField(
        CustomUser, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='student_profile'
    )
    student_id = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    department = models.CharField(max_length=255, blank=True, default='')
    academic_year = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='active')
    university = models.ForeignKey(University, on_delete=models.CASCADE, null=True, blank=True)

    gpa = models.FloatField(default=0.0)
    gpa10 = models.FloatField(default=0.0)

    # Mốc 4: Nợ học phí — cấm xem điểm + cấm ĐKHP
    tuition_debt = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_management_student'

    def __str__(self):
        return f"{self.student_id} - {self.full_name}"


# ============================================================
#  5. TEACHER
# ============================================================
class Teacher(models.Model):
    STATUS_CHOICES = (
        ('active', 'Đang giảng dạy'),
        ('inactive', 'Nghỉ'),
    )

    user = models.OneToOneField(
        CustomUser, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='teacher_profile'
    )
    teacher_id = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    department = models.CharField(max_length=255, blank=True, default='')
    specialization = models.CharField(max_length=255, blank=True, null=True)
    degree = models.CharField(max_length=100, blank=True, null=True)
    position = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='active')
    university = models.ForeignKey(University, on_delete=models.CASCADE, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_management_teacher'

    def __str__(self):
        return f"{self.teacher_id} - {self.full_name}"


# ============================================================
#  6. COURSE CLASS — Lớp học phần (gắn Semester)
# ============================================================
class CourseClass(models.Model):
    class_code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True)
    department = models.CharField(max_length=255, blank=True, default='')
    schedule = models.CharField(max_length=100, blank=True, default='')
    room = models.CharField(max_length=50, blank=True, default='')
    max_students = models.IntegerField(default=40)
    semester = models.ForeignKey(Semester, on_delete=models.SET_NULL, null=True, blank=True)
    credits = models.IntegerField(default=3)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_management_courseclass'

    def __str__(self):
        return f"{self.class_code} - {self.name}"


# ============================================================
#  7. REGISTRATION — Đăng ký học phần
# ============================================================
class Registration(models.Model):
    STATUS_CHOICES = (
        ('registered', 'Đã đăng ký'),
        ('cancelled', 'Đã huỷ'),
        ('completed', 'Hoàn thành'),
    )

    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    course_class = models.ForeignKey(CourseClass, on_delete=models.CASCADE)
    semester = models.ForeignKey(Semester, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='registered')
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'student_management_registration'
        unique_together = ('student', 'course_class')

    def __str__(self):
        return f"{self.student} → {self.course_class}"


# ============================================================
#  8. GRADE — Bảng điểm (với lock per-record)
# ============================================================
class Grade(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    course_class = models.ForeignKey(CourseClass, on_delete=models.CASCADE)
    semester = models.ForeignKey(Semester, on_delete=models.SET_NULL, null=True, blank=True)

    # Điểm thành phần
    assignment = models.FloatField(null=True, blank=True, help_text='Chuyên cần (CC) — 20%')
    midterm = models.FloatField(null=True, blank=True, help_text='Giữa kì (GK) — 30%')
    final = models.FloatField(null=True, blank=True, help_text='Cuối kì (CK) — 50%')

    # Điểm tổng hợp (tự tính)
    average10 = models.FloatField(null=True, blank=True)
    average4 = models.FloatField(null=True, blank=True)
    letter_grade = models.CharField(max_length=5, blank=True, null=True)
    classification = models.CharField(max_length=50, blank=True, null=True)

    # Lock flags per-record
    is_component_locked = models.BooleanField(
        default=False,
        help_text='Khoá điểm thành phần (CC, GK) — kích hoạt trước thi'
    )
    is_fully_locked = models.BooleanField(
        default=False,
        help_text='Khoá toàn bộ bảng điểm — kích hoạt trước ĐKHP'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_management_grade'
        unique_together = ('student', 'course_class')

    def __str__(self):
        return f"Grade: {self.student} | {self.course_class}"

    def calculate_and_save(self):
        """Tính toán điểm tổng hợp theo thang VN và lưu."""
        a = float(self.assignment or 0)
        m = float(self.midterm or 0)
        f = float(self.final or 0)

        avg10 = round(a * 0.2 + m * 0.3 + f * 0.5, 1)
        self.average10 = avg10

        if avg10 >= 8.5:
            self.average4, self.letter_grade, self.classification = 4.0, 'A', 'Xuất sắc'
        elif avg10 >= 8.0:
            self.average4, self.letter_grade, self.classification = 3.5, 'B+', 'Giỏi'
        elif avg10 >= 7.0:
            self.average4, self.letter_grade, self.classification = 3.0, 'B', 'Khá'
        elif avg10 >= 6.5:
            self.average4, self.letter_grade, self.classification = 2.5, 'C+', 'Trung bình khá'
        elif avg10 >= 5.5:
            self.average4, self.letter_grade, self.classification = 2.0, 'C', 'Trung bình'
        elif avg10 >= 5.0:
            self.average4, self.letter_grade, self.classification = 1.5, 'D+', 'Trung bình yếu'
        elif avg10 >= 4.0:
            self.average4, self.letter_grade, self.classification = 1.0, 'D', 'Yếu'
        else:
            self.average4, self.letter_grade, self.classification = 0.0, 'F', 'Kém'

        self.save()


# ============================================================
#  9. ATTENDANCE — Điểm danh theo từng buổi/ngày
# ============================================================
class Attendance(models.Model):
    STATUS_CHOICES = (
        ('present', 'Có mặt'),
        ('absent', 'Vắng mặt'),
        ('late', 'Đi trễ'),
        ('excused', 'Có phép'),
    )

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendances')
    course_class = models.ForeignKey(CourseClass, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    session_number = models.IntegerField(default=1, help_text='Buổi học thứ mấy trong ngày (1, 2, ...)')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    note = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='attendance_records'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_management_attendance'
        unique_together = ('student', 'course_class', 'date', 'session_number')
        ordering = ['-date', 'session_number']

    def __str__(self):
        return f"{self.student} | {self.course_class} | {self.date} Buổi {self.session_number}: {self.status}"

    @staticmethod
    def summarize_for_grade(student, course_class):
        """
        Tổng hợp điểm chuyên cần từ dữ liệu điểm danh.
        Công thức: (số buổi có mặt + 0.5 * số buổi trễ) / tổng buổi * 10
        Trả về điểm từ 0–10.
        """
        records = Attendance.objects.filter(student=student, course_class=course_class)
        total = records.count()
        if total == 0:
            return None

        present = records.filter(status='present').count()
        late = records.filter(status='late').count()
        excused = records.filter(status='excused').count()
        # Có phép = tính 0.75, trễ = tính 0.5
        score = (present + excused * 0.75 + late * 0.5) / total * 10
        return round(min(score, 10.0), 1)


# ============================================================
#  10. GRADE EDIT CONFIG — Cấu hình khung giờ sửa điểm
# ============================================================
class GradeEditConfig(models.Model):
    """
    Bảng cấu hình thời gian cho phép giáo viên sửa điểm.
    Admin quản lý qua giao diện (sẽ triển khai UI sau).
    """
    name = models.CharField(max_length=100, default='Mặc định')
    start_hour = models.IntegerField(default=8, help_text='Giờ bắt đầu (0-23)')
    start_minute = models.IntegerField(default=0, help_text='Phút bắt đầu (0-59)')
    end_hour = models.IntegerField(default=22, help_text='Giờ kết thúc (0-23)')
    end_minute = models.IntegerField(default=0, help_text='Phút kết thúc (0-59)')
    days_of_week = models.CharField(
        max_length=30, default='0,1,2,3,4,5,6',
        help_text='Ngày trong tuần cho phép (0=Thứ 2, 6=Chủ nhật)'
    )
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_management_gradeeditconfig'

    def __str__(self):
        return f"{self.name}: {self.start_hour:02d}:{self.start_minute:02d}–{self.end_hour:02d}:{self.end_minute:02d}"

    @staticmethod
    def is_edit_allowed_now():
        """Kiểm tra thời điểm hiện tại có nằm trong khung giờ cho phép không."""
        from django.utils import timezone
        now = timezone.localtime()
        current_dow = now.weekday()  # 0=Monday=Thứ 2
        current_minutes = now.hour * 60 + now.minute

        configs = GradeEditConfig.objects.filter(is_active=True)
        if not configs.exists():
            # Không có config → cho phép mặc định
            return True

        for cfg in configs:
            allowed_days = [int(d.strip()) for d in cfg.days_of_week.split(',') if d.strip().isdigit()]
            if current_dow not in allowed_days:
                continue
            start_minutes = cfg.start_hour * 60 + cfg.start_minute
            end_minutes = cfg.end_hour * 60 + cfg.end_minute
            if start_minutes <= current_minutes <= end_minutes:
                return True

        return False


# ============================================================
#  11. AUDIT LOG — Ghi log truy cập API nhạy cảm
# ============================================================
class AuditLog(models.Model):
    """Ghi log mọi hành động gọi vào các API nhạy cảm."""
    user = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='audit_logs'
    )
    role = models.CharField(max_length=20, default='anonymous')
    endpoint = models.CharField(max_length=255)
    method = models.CharField(max_length=10)
    status_code = models.IntegerField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'student_management_auditlog'
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp}] {self.role}:{self.user_id} → {self.method} {self.endpoint} ({self.status_code})"
