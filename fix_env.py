import os

env_content = '''# ==========================================
# CẤU HÌNH HỆ THỐNG
# ==========================================
DEBUG=True
SECRET_KEY=django-insecure-test-key-12345
DATABASE_URL=sqlite:///db.sqlite3

# ==========================================
# DANH SÁCH TÀI KHOẢN MẶC ĐỊNH TRONG HỆ THỐNG (TEST CASES)
# Mật khẩu chung: 123
# ==========================================

# 1. Quản trị viên (Admin)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=123

# 2. Giảng viên (Teachers)
# 1011: ThS. Nguyễn Văn A (Khoa học Máy tính)
TEACHER_1_USERNAME=1011
TEACHER_1_PASSWORD=123

# 1012: TS. Trần Thị B (Khoa học Máy tính)
TEACHER_2_USERNAME=1012
TEACHER_2_PASSWORD=123

# 1013: ThS. Lê Văn C (Kỹ thuật Phần mềm)
TEACHER_3_USERNAME=1013
TEACHER_3_PASSWORD=123

# 1021: TS. Phạm Văn D (Hệ thống Thông tin)
TEACHER_4_USERNAME=1021
TEACHER_4_PASSWORD=123

# 1041: PGS.TS Hoàng Thị E (Trí tuệ Nhân tạo)
TEACHER_5_USERNAME=1041
TEACHER_5_PASSWORD=123

# 3. Sinh viên (Students)
# 100011: Nguyễn Văn Nam (CNTT)
STUDENT_1_USERNAME=100011
STUDENT_1_PASSWORD=123

# 100012: Trần Thị Mai (CNTT)
STUDENT_2_USERNAME=100012
STUDENT_2_PASSWORD=123

# 100013: Lê Bình (CNTT)
STUDENT_3_USERNAME=100013
STUDENT_3_PASSWORD=123

# 100021: Phạm Tuấn (Kinh tế)
STUDENT_4_USERNAME=100021
STUDENT_4_PASSWORD=123

# 100041: Hoàng Quyên (Ngoại ngữ)
STUDENT_5_USERNAME=100041
STUDENT_5_PASSWORD=123

# 4. Tài khoản test đăng ký mới (Vừa tạo qua API)
TEST_REG_USERNAME=testreg123
TEST_REG_PASSWORD=123
'''

with open(r'd:\24CT1-DO_NGUYEN_HAO\.env', 'w', encoding='utf-8') as f:
    f.write(env_content)
