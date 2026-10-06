# Mô hình Cơ sở dữ liệu (Entity Relationship Diagram)

Dưới đây là sơ đồ thực thể liên kết (ERD) được trích xuất từ các Models chính của hệ thống Student Management (UniMS). Sơ đồ được vẽ bằng cú pháp **Mermaid**.

### Sơ đồ ERD (Mermaid)

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
    }
    
    UNIVERSITY {
        int id PK
        string name
        string code
        int fee_per_credit
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
        string student_id
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

### Giải thích các Mối quan hệ chính:
- **CustomUser (Người dùng):** Đóng vai trò là tài khoản đăng nhập chung. Bảng này có quan hệ `1:1` với `Student` hoặc `Teacher`. Mỗi Sinh viên hoặc Giảng viên sẽ liên kết tới 1 User.
- **Semester (Học kỳ):** Là mốc thời gian cốt lõi. Lớp học phần (`CourseClass`), Đăng ký học (`Registration`) và Bảng điểm (`Grade`) đều liên kết trực tiếp với Học kỳ để dễ dàng truy xuất dữ liệu theo mùa vụ.
- **CourseClass (Lớp học phần):** Do `Teacher` giảng dạy. Nó chứa danh sách các sinh viên tham gia thông qua `Registration`. Điểm số (`Grade`) và Điểm danh (`Attendance`) được đánh giá dựa trên sự kết hợp giữa `Student` và `CourseClass`.
- **AuditLog:** Ghi lại vết truy cập hệ thống, liên kết trực tiếp với `CustomUser`.
