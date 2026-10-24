# Mô hình Cơ sở dữ liệu (Entity Relationship Diagram) & Kiến trúc Hệ thống

Dưới đây là sơ đồ thực thể liên kết (ERD) và sơ đồ kiến trúc hệ thống được trích xuất từ các Models và Services chính của hệ thống Student Management (UniMS), bao gồm các tính năng Đăng ký xét tuyển nguyện vọng, Xác thực Gmail OTP, Tự động cấp mã sinh viên và Đổi mật khẩu.

---

### 1. Sơ đồ ERD (Mermaid)

```mermaid
erDiagram
    %% Định nghĩa các bảng (Entities)
    CUSTOMUSER {
        int id PK
        string username
        string role "admin, teacher, student"
        string phone
        string session_token
        datetime last_login_at
        boolean must_change_password "Bắt buộc đổi MK lần đầu"
    }
    
    UNIVERSITY {
        int id PK
        string name
        string code
        string university_code "Mã trường số: 10011..10021"
        int fee_per_credit
    }

    ADMISSIONAPPLICATION {
        int id PK
        int university_id FK
        string full_name
        string cccd "12 chữ số CCCD"
        string email "Gmail thật của ứng viên"
        string major "Ngành đăng ký"
        float score "Điểm thi THPT (max 30.00)"
        string status "submitted, passed, failed, rejected"
        string otp_code "OTP 6 số xác thực"
        datetime otp_created_at
        boolean is_otp_verified
        int generated_student_id FK "Liên kết Student sau khi trúng tuyển"
        datetime created_at
    }
    
    SEMESTER {
        int id PK
        string code
        string name
        string academic_year
        date start_date
        date end_date
        string status "active, upcoming, completed"
    }
    
    STUDENT {
        int id PK
        int user_id FK
        int university_id FK
        string student_id "Mã SV: {univ_code}0..n"
        string full_name
        string email
        string status
        float gpa
        boolean tuition_debt
    }
    
    TEACHER {
        int id PK
        int user_id FK
        int university_id FK
        string teacher_id
        string full_name
        string department
        string status
    }
    
    COURSECLASS {
        int id PK
        int teacher_id FK
        int semester_id FK
        string class_code
        string name
        int credits
        string room
        int max_students
    }
    
    REGISTRATION {
        int id PK
        int student_id FK
        int course_class_id FK
        int semester_id FK
        string status
        datetime registered_at
    }
    
    GRADE {
        int id PK
        int student_id FK
        int course_class_id FK
        int semester_id FK
        float assignment "CC - 20%"
        float midterm "GK - 30%"
        float final "CK - 50%"
        float average10
        boolean is_fully_locked
    }
    
    ATTENDANCE {
        int id PK
        int student_id FK
        int course_class_id FK
        int created_by FK
        date date
        int session_number
        string status "present, absent, late, excused"
    }
    
    AUDITLOG {
        int id PK
        int user_id FK
        string role
        string endpoint
        string method
        int status_code
        datetime timestamp
    }
    
    GRADEEDITCONFIG {
        int id PK
        string name
        int start_hour
        int end_hour
        string days_of_week
        boolean is_active
    }

    %% Định nghĩa các mối quan hệ (Relationships)
    CUSTOMUSER ||--o| STUDENT : "has profile (1:1)"
    CUSTOMUSER ||--o| TEACHER : "has profile (1:1)"
    CUSTOMUSER ||--o{ AUDITLOG : "generates (1:N)"
    CUSTOMUSER ||--o{ ATTENDANCE : "created_by (1:N)"

    UNIVERSITY ||--o{ STUDENT : "has (1:N)"
    UNIVERSITY ||--o{ TEACHER : "has (1:N)"
    UNIVERSITY ||--o{ ADMISSIONAPPLICATION : "receives (1:N)"

    STUDENT ||--o| ADMISSIONAPPLICATION : "generated_from (1:1)"

    SEMESTER ||--o{ COURSECLASS : "contains (1:N)"
    SEMESTER ||--o{ REGISTRATION : "tracks (1:N)"
    SEMESTER ||--o{ GRADE : "tracks (1:N)"

    TEACHER ||--o{ COURSECLASS : "teaches (1:N)"

    COURSECLASS ||--o{ REGISTRATION : "has (1:N)"
    COURSECLASS ||--o{ GRADE : "has (1:N)"
    COURSECLASS ||--o{ ATTENDANCE : "has (1:N)"

    STUDENT ||--o{ REGISTRATION : "registers (1:N)"
    STUDENT ||--o{ GRADE : "receives (1:N)"
    STUDENT ||--o{ ATTENDANCE : "has (1:N)"
```

### 2. Sơ đồ Kiến trúc Hệ thống UniMS (Mermaid Architecture)

```mermaid
flowchart TD
    subgraph CLIENTS["Khách hàng & Người dùng cuối"]
        CANDIDATE["Thí sinh Xét tuyển\n(Trang /admission/)"]
        STUDENT_USER["Sinh viên\n(Trang /review/)"]
        TEACHER_USER["Giảng viên\n(Trang /review/)"]
        ADMIN_USER["Quản trị viên\n(Trang /admin/dashboard/)"]
    end

    subgraph NETWORK["Mạng & Kiểm soát Phân quyền"]
        PORT_8000["Cổng 8000 (Công khai / Public)\n- /admission/ (Xét tuyển)\n- /review/ (Dashboard/Login)\n- /api/* (API nghiệp vụ)"]
        PORT_9000["Cổng 9000 (Nội bộ / Local Only)\n- /admin/* (Admin Dashboard)\n- Middleware: LocalOnlyAdminMiddleware"]
    end

    subgraph APPLICATION_SERVICES["UniMS Django Core Services"]
        AUTH_SVC["Auth & Session Service\n(Login, Must-Change-PW, Change-PW)"]
        ADMISSION_SVC["Admission Service\n(Đánh giá điểm sàn, Cấp mã SV {code}0..n,\nTạo mật khẩu 8 ký tự alphanumeric)"]
        EMAIL_SVC["Email Service\n(Gửi OTP 6 số, Gửi thông báo trúng tuyển,\nSMTP bruhlmaobruhlmaoooo@gmail.com)"]
        ACADEMIC_SVC["Academic Service\n(Điểm danh, Lớp học phần, Bảng điểm)"]
    end

    subgraph DATABASE["Microsoft SQL Server (SSMS)"]
        DB_TABLES[("Cơ sở dữ liệu UniMS_DB\n- CustomUser (must_change_password)\n- University (university_code: 10011..10021)\n- AdmissionApplication\n- Student, Teacher, CourseClass, Grade")]
    end

    CANDIDATE -->|Gửi hồ sơ & Xác thực OTP| PORT_8000
    STUDENT_USER -->|Đăng nhập & Đổi mật khẩu| PORT_8000
    TEACHER_USER -->|Đăng nhập & Điểm danh| PORT_8000
    ADMIN_USER -->|Duyệt hồ sơ & Quản trị| PORT_9000

    PORT_8000 --> AUTH_SVC
    PORT_8000 --> ADMISSION_SVC
    PORT_8000 --> ACADEMIC_SVC
    PORT_9000 --> ADMISSION_SVC
    PORT_9000 --> AUTH_SVC

    ADMISSION_SVC --> EMAIL_SVC
    EMAIL_SVC -.->|SMTP TLS 587| CANDIDATE
    AUTH_SVC --> DB_TABLES
    ADMISSION_SVC --> DB_TABLES
    ACADEMIC_SVC --> DB_TABLES
```

### 3. Giải thích các Thực thể và Mối quan hệ Mới:
- **`AdmissionApplication` (Hồ sơ xét tuyển):** Lưu trữ thông tin thí sinh nộp hồ sơ, bao gồm họ tên, CCCD (12 số), Gmail thật, ngành xét tuyển, điểm thi THPT (thang điểm 30.00 với 2 chữ số thập phân), mã OTP xác thực (hết hạn sau 10 phút) và trạng thái xét tuyển (`submitted`, `passed`, `failed`, `rejected`).
- **`University.university_code`:** Lưu mã định danh số của trường đại học, bắt đầu từ `10011` (Bách Khoa - DUT) và tăng dần theo thứ tự: `10012` (Duy Tân - DTU), `10013` (FPT), ..., `10021` (Sư phạm Kỹ thuật - UTE).
- **`CustomUser.must_change_password`:** Cờ boolean đánh dấu tài khoản vừa được cấp qua xét tuyển, bắt buộc sinh viên phải đổi mật khẩu ngay lần đầu tiên đăng nhập vào cổng chính `/review/`.
- **Liên kết `Student` và `AdmissionApplication`:** Quan hệ 1:1 tùy chọn (`generated_from`), cho phép truy vết sinh viên trúng tuyển từ hồ sơ đăng ký nguyện vọng ban đầu.
