# BIỂU ĐỒ TUẦN TỰ (CHUẨN UML & ĐƯỜNG DẪN FILE TRỰC TIẾP)

> **CÁCH VẼ TỰ ĐỘNG TRÊN DIAGRAMS.NET (DRAW.IO):**
> 1. Trên thanh menu chọn: **Arrange** -> **Insert** -> **Advanced** -> **Mermaid...**
> 2. Copy đoạn code bên dưới chữ ````mermaid` của từng chức năng và dán vào hộp thoại.
> *(Các biểu đồ đã được cập nhật đường dẫn tuyệt đối trỏ thẳng tới các file Frontend/Backend tương ứng)*

---

## 1. Biểu đồ Tuần tự: Chức năng Đăng ký

```mermaid
sequenceDiagram
    autonumber

    actor U as Người dùng<br/>(Sinh viên hoặc Giảng viên)
    participant FE as Giao diện Đăng ký<br/>(static/js/views/student/registration.js)
    participant BE as Backend Đăng Ký()<br/>(student_management/views/user/auth.py)
    participant DB as Database<br/>(SQL Server - student_management_customuser)

    U->>FE: Điền form (Mã số, Họ tên, Mật khẩu, Vai trò, Trường) và bấm Đăng ký
    FE->>FE: Kiểm tra tính hợp lệ dữ liệu trống
    FE->>BE: POST /api/register/ (username, name, password, role, universityId)
    BE->>BE: Đọc JSON, strip username và name, role mặc định là student

    alt role = admin
        BE-->>FE: HTTP 403 (Không thể tự đăng ký tài khoản quản trị viên)
        FE-->>U: Hiển thị thông báo lỗi
    else role không thuộc student, teacher
        BE-->>FE: HTTP 400 (Role không hợp lệ)
        FE-->>U: Hiển thị thông báo lỗi
    else Thiếu Mã số hoặc Mật khẩu
        BE-->>FE: HTTP 200 với success = false (Mã số và mật khẩu là bắt buộc)
        FE-->>U: Hiển thị thông báo lỗi
    else Dữ liệu đầu vào hợp lệ
        BE->>DB: Kiểm tra tồn tại lần lượt ở customuser.username,<br/>student.student_id, teacher.teacher_id
        alt Mã đã tồn tại ở một trong 3 bảng
            DB-->>BE: Có tồn tại
            BE-->>FE: HTTP 400 (Mã đã có trong hệ thống)
            FE-->>U: Hiển thị thông báo cảnh báo đỏ
        else Mã chưa tồn tại
            DB-->>BE: Chưa tồn tại
            BE->>BE: set_password() băm mật khẩu bảo mật
            BE->>DB: INSERT customuser (username, first_name = name, role, password đã băm)
            DB-->>BE: Xác nhận lưu thành công

            opt Có universityId
                BE->>DB: get_or_create University theo id
                DB-->>BE: Trả về University
            end

            alt role = student
                BE->>DB: INSERT student (user, student_id, full_name, department = Chung, university)
            else role = teacher
                BE->>DB: INSERT teacher (user, teacher_id, full_name, department = Chung, university)
            end
            DB-->>BE: Xác nhận lưu thành công
            BE-->>FE: HTTP 200 với success = true (Đăng ký thành công)
            FE-->>U: Báo thành công và chuyển về Đăng nhập
        end
    end
```

---

## 2. Biểu đồ Tuần tự: Chức năng Đăng nhập

```mermaid
sequenceDiagram
    autonumber

    actor U as Người dùng
    participant FE as Xử lý Đăng nhập<br/>(static/js/core/auth.js)
    participant LS as Kho dữ liệu phía client<br/>(localStorage, sessionStorage)
    participant BE as Backend Đăng Nhập()<br/>(student_management/views/user/auth.py)
    participant DB as Database<br/>(SQL Server - student_management_customuser)

    U->>FE: Chọn vai trò, nhập Mã số, Mật khẩu rồi bấm Đăng nhập

    alt role = admin hoặc username = admin
        FE-->>U: Từ chối: Admin chỉ đăng nhập tại Cổng Quản trị Local (Port 9000)
    else Người dùng thường (Sinh viên / Giảng viên)
        FE->>BE: POST /api/login/ (username, password, role)
        BE->>DB: Truy vấn CustomUser theo username
        DB-->>BE: Trả về User

        alt User không tồn tại hoặc sai mật khẩu
            BE-->>FE: HTTP 401 (Sai thông tin đăng nhập - CWE-204)
            FE-->>U: Thông báo lỗi đăng nhập chung
        else Tài khoản bị khóa (is_active = False)
            BE-->>FE: HTTP 403 (Tài khoản bị khóa)
            FE-->>U: Thông báo tài khoản bị khóa
        else Hợp lệ
            BE->>BE: Sinh session_token (UUIDv4)
            BE->>DB: UPDATE session_token, session_ip, last_login_at
            BE-->>FE: HTTP 200 {session_token, user: {must_change_password}}
            FE->>LS: Lưu session và server_token
            FE-->>U: Đăng nhập thành công, chuyển hướng vào Dashboard
        end
    end
```

---

## 3. Biểu đồ Tuần tự: Chức năng Nhập Điểm & Tính GPA

```mermaid
sequenceDiagram
    autonumber
    
    actor U as Người dùng (Giáo viên)
    participant FE as Giao diện Nhập điểm<br/>(static/js/views/common/grades.js)
    participant BE as Xử lý Backend<br/>(student_management/views/user/sync.py)
    participant DB as Database<br/>(SQL Server - student_management_grade)

    U->>+FE: Chỉnh sửa điểm và bấm "Lưu"
    FE->>FE: Đóng gói dữ liệu điểm mới
    FE->>+BE: Gọi API POST /api/sync/up/ (action: update_grade)
    BE->>+DB: Truy vấn kiểm tra quyền truy cập (Role)
    
    alt Không có quyền hoặc sai lớp dạy
        DB-->>-BE: Không phải giáo viên của lớp này
        BE-->>FE: Trả về lỗi 403 (Forbidden)
        FE-->>U: Hiển thị thông báo "Không có quyền thao tác"
    else Hợp lệ (Giáo viên phụ trách)
        DB-->>+BE: Xác nhận quyền hợp lệ
        BE->>+DB: Truy vấn lấy bản ghi điểm cũ
        DB-->>-BE: Trả về bản ghi hiện tại
        BE->>BE: Tính toán tự động (Hệ 10, Hệ 4, Điểm chữ)
        BE->>+DB: Thực thi UPDATE dữ liệu điểm mới
        DB-->>-BE: Xác nhận cập nhật thành công
        BE-->>-FE: Trả về HTTP 200 (Thành công)
        FE-->>-U: Cập nhật UI bảng điểm & Thông báo xanh
    end
```

---

## 4. Biểu đồ Tuần tự: Luồng Đồng bộ Dữ liệu (Sync Down)

```mermaid
sequenceDiagram
    autonumber
    
    actor U as Người dùng
    participant FE as Hàng đợi Đồng bộ<br/>(static/js/core/sync-queue.js)
    participant MW as Middleware<br/>(student_management/middleware.py)
    participant BE as Sync Backend<br/>(student_management/views/user/sync.py)
    participant DB as Database<br/>(SQL Server)

    U->>+FE: Truy cập hệ thống
    FE->>+MW: Gọi GET /api/sync/down/ kèm Session-Token
    
    alt Token không hợp lệ
        MW-->>FE: Trả về HTTP 401 (Unauthorized)
        FE-->>U: Yêu cầu Đăng nhập lại
    else Token hợp lệ
        MW->>+BE: Cho phép đi qua
        BE->>BE: Lấy thông tin role (Admin/Teacher/Student)
        
        alt role == 'admin'
            BE->>+DB: Truy vấn TẤT CẢ Classes, Registrations, Grades
            DB-->>-BE: Trả về toàn bộ dữ liệu
        else role == 'teacher'
            BE->>+DB: Truy vấn Classes LỚP MÌNH DẠY + Grades
            DB-->>-BE: Trả về dữ liệu của giáo viên
        else role == 'student'
            BE->>+DB: Truy vấn Classes + Grades/Registrations CỦA MÌNH
            DB-->>-BE: Trả về dữ liệu cá nhân
        end
        
        BE->>BE: Serialize dữ liệu thành JSON
        BE-->>-MW: Trả về Response chứa JSON Data
        MW-->>-FE: Nhận dữ liệu JSON
        FE->>FE: Ghi đè vào Offline Cache (database.js)
        FE-->>-U: Giao diện sẵn sàng sử dụng
    end
```

---

## 5. Biểu đồ Tuần tự: Đăng Ký Xét Nguyện Vọng, Gửi OTP Gmail & Cấp Mã Sinh Viên Tự Động

```mermaid
sequenceDiagram
    autonumber

    actor C as Thí sinh (Candidate)
    participant FE as Cổng Xét Tuyển<br/>(templates/admission.html & admission.js)
    participant BE as Admission Views<br/>(student_management/views/admission/views.py)
    participant SVC as Admission Service<br/>(student_management/admission_service.py)
    participant MAIL as Email Service<br/>(student_management/email_service.py)
    participant DB as SQL Server (SSMS)<br/>(AdmissionApplication, CustomUser, Student)

    Note over C,DB: BƯỚC 1: KIỂM TRA CCCD ĐỘC LẬP (Nút "Kiểm tra" cạnh ô CCCD)
    C->>FE: Nhập 12 số CCCD và bấm nút "Kiểm tra"
    FE->>BE: POST /api/admission/check-duplicate/ {cccd, check_mode: 'cccd_only'}
    BE->>DB: Kiểm tra CCCD trong CustomUser & AdmissionApplication (đã cấp mã/trúng tuyển)
    alt CCCD đã có trong hệ thống UniMS
        DB-->>BE: CCCD đã tồn tại
        BE-->>FE: HTTP 409 Conflict (Số CCCD đã được cấp mã SV hoặc tài khoản)
        FE-->>C: Cảnh báo đỏ: "Số CCCD này đã có trong hệ thống UniMS"
    else CCCD hợp lệ và chưa từng đăng ký
        DB-->>BE: Không tìm thấy
        BE-->>FE: HTTP 200 {is_duplicate: false}
        FE-->>C: Huy hiệu xanh: "Số CCCD hợp lệ và sẵn sàng đăng ký xét tuyển"
    end

    Note over C,DB: BƯỚC 2: ĐIỀN ĐỦ THÔNG TIN VÀ NỘP HỒ SƠ XÉT TUYỂN
    C->>FE: Điền Họ tên, Gmail thật, SĐT, Chọn Trường, Chọn Ngành, Nhập Điểm thi
    C->>FE: Bấm "Nộp Hồ Sơ & Nhận Mã OTP Xác Thực"
    FE->>BE: POST /api/admission/check-duplicate/ {full_name, cccd, email, phone, check_mode: 'all'}
    alt Người dùng mặc kệ cảnh báo CCCD ở bước trước HOẶC trùng Gmail/SĐT
        BE-->>FE: HTTP 409 Conflict (Phát hiện trùng lặp dữ liệu)
        FE-->>C: Modal cảnh báo thứ 2: Chặn nộp hồ sơ, yêu cầu kiểm tra lại
    else Dữ liệu hợp lệ toàn diện (1:1 duy nhất)
        BE-->>FE: HTTP 200 {is_duplicate: false}
        
        Note over C,FE: BƯỚC 3: ĐỐI SOÁT ĐIỂM CHUẨN TRƯỚC KHI GỬI OTP (LỰA CHỌN A)
        FE->>FE: Tra cứu điểm chuẩn ngành đã chọn (Ví dụ: FPT CNTT 24.50đ)
        alt Điểm thi < Điểm chuẩn (VD: 22.00đ < 24.50đ)
            FE-->>C: Modal BÁO RỚT ĐIỂM CHUẨN (Hiện rõ số điểm thiếu: -2.50đ). Dừng ngay, KHÔNG gửi OTP!
        else Điểm thi >= Điểm chuẩn (Trúng tuyển đợt 1)
            FE-->>C: Modal CHÚC MỪNG TRÚNG TUYỂN! Hiển thị điểm vượt chuẩn & mời nhận OTP
            C->>FE: Bấm "Tiếp Tục Nhận Mã OTP"
            FE->>BE: POST /api/admission/apply/
            BE->>BE: Kiểm tra lại điểm chuẩn & khóa hàng atomic
            BE->>SVC: Sinh mã OTP 6 số (generate_otp)
            BE->>DB: Lưu AdmissionApplication (status = approved, otp_code, otp_created_at)
            BE->>MAIL: Gửi mã OTP xác thực qua SMTP Gmail (kèm on-screen OTP fallback)
            MAIL-->>C: Email chứa mã OTP 6 số
            BE-->>FE: HTTP 200 {application_id, is_qualified: true, dev_otp}
            FE-->>C: Chuyển sang Bước 2: Nhập OTP đơn giản (tự động focus + đếm ngược 10 phút)
        end
    end

    C->>FE: Nhập mã OTP 6 số và nhấn Enter / "Xác Thực"
    FE->>BE: POST /api/admission/verify-otp/ (application_id, otp)
    BE->>DB: Kiểm tra OTP khớp và trong thời hạn 10 phút
    
    alt OTP sai hoặc hết hạn
        BE-->>FE: HTTP 400 (Mã OTP không chính xác hoặc quá 10 phút)
        FE-->>C: Báo lỗi và cho phép bấm "Gửi lại mã OTP"
    else OTP hợp lệ
        BE->>DB: Cập nhật email_verified = True
        BE->>SVC: create_candidate_account_and_notify(application)
        SVC->>DB: Sinh mã SV kế tiếp (VD: 100110) có khóa hàng atomic
        SVC->>SVC: Sinh mật khẩu ngẫu nhiên 8 ký tự (chữ + số)
        SVC->>DB: INSERT CustomUser (username = mã SV, role = student, must_change_password = True)
        SVC->>DB: INSERT Student (student_id = mã SV, tuition_debt = True)
        SVC->>DB: UPDATE AdmissionApplication (status = credentials_sent, generated_student_id = mã SV)
        SVC->>MAIL: Gửi email trúng tuyển kèm Mã SV & Mật khẩu khởi tạo
        MAIL-->>C: Nhận Gmail thông báo Mã SV + Mật khẩu
        BE-->>FE: HTTP 200 {qualified: true, student_id: 100110}
        FE-->>C: Hiển thị thiệp chúc mừng chính thức, hiện Mã SV và nút "Đăng Nhập Cổng Sinh Viên"
    end
```

---

## 6. Biểu đồ Tuần tự: Quy Trình Đổi Mật Khẩu Bắt Buộc (Lần Đầu) & Tự Nguyện

```mermaid
sequenceDiagram
    autonumber

    actor S as Sinh viên mới trúng tuyển
    participant FE as Giao diện Web Chính<br/>(static/js/core/app.js & profile.js)
    participant BE as Auth API<br/>(student_management/views/user/auth.py)
    participant DB as SQL Server (SSMS)<br/>(student_management_customuser)

    S->>FE: Đăng nhập tại /review/ bằng Mã SV (100110) và Mật khẩu tạm từ Gmail
    FE->>BE: POST /api/login/
    BE->>DB: Kiểm tra thông tin đăng nhập
    DB-->>BE: User hợp lệ, must_change_password = True
    BE-->>FE: HTTP 200 {session_token, user: {must_change_password: true}}
    FE->>FE: App.init() phát hiện must_change_password = True
    FE-->>S: Bật modal cảnh báo an ninh bắt buộc: "Hãy đổi lại mật khẩu để tránh mất thông tin"

    S->>FE: Nhập Mật khẩu mới & Xác nhận mật khẩu mới (tối thiểu 6 ký tự)
    S->>FE: Bấm "Đổi Mật Khẩu & Lưu Vào Hệ Thống"
    FE->>BE: POST /api/change-password/ (new_password) kèm Header X-Session-Token
    BE->>BE: Kiểm tra độ dài mật khẩu >= 6 ký tự
    BE->>DB: user.set_password(new_password) & must_change_password = False
    DB-->>BE: Cập nhật thành công vào SSMS
    BE-->>FE: HTTP 200 {success: true, message: Đổi mật khẩu thành công}
    FE->>FE: Tắt modal bắt buộc, gỡ cờ must_change_password trong session client
    FE-->>S: Thông báo thành công! Sinh viên truy cập Dashboard bình thường

    opt Khi Sinh viên hoặc Giảng viên muốn tự đổi mật khẩu sau này
        S->>FE: Truy cập Hồ sơ cá nhân (Profile)
        S->>FE: Nhập Mật khẩu cũ, Mật khẩu mới và bấm "Lưu Mật Khẩu Mới"
        FE->>BE: POST /api/change-password/ (current_password, new_password)
        BE->>DB: Xác thực mật khẩu cũ và cập nhật mật khẩu mới vào SSMS
        DB-->>BE: Cập nhật thành công
        BE-->>FE: HTTP 200 (Thành công)
        FE-->>S: Toast thông báo: "Đổi mật khẩu thành công!"
    end
```

---

## 7. Biểu đồ Tuần tự: Quản Trị Viên Duyệt Hồ Sơ Thủ Công Trên Admin Dashboard

```mermaid
sequenceDiagram
    autonumber

    actor A as Quản trị viên (Admin)
    participant ADM_FE as Admin Dashboard<br/>(templates/admin/dashboard.html)
    participant ADM_BE as Admin Admission API<br/>(student_management/views/admin/admissions.py)
    participant SVC as Admission Service<br/>(student_management/admission_service.py)
    participant MAIL as Email Service<br/>(student_management/email_service.py)
    participant DB as SQL Server (SSMS)

    A->>ADM_FE: Mở Tab "Xét Nguyện Vọng" trên Cyber-Office Dashboard (Port 9000)
    ADM_FE->>ADM_BE: GET /admin/api/admissions/?status=&q= (có AbortController chống lag)
    ADM_BE->>DB: Truy vấn danh sách hồ sơ thí sinh nộp trực tuyến
    DB-->>ADM_BE: Trả về danh sách thí sinh kèm điểm thi, điểm chuẩn, trạng thái OTP
    ADM_BE-->>ADM_FE: HTTP 200 {admissions: [...], stats: {...}}
    ADM_FE-->>A: Hiển thị bảng thí sinh, điểm xét tuyển và trạng thái trúng tuyển

    A->>ADM_FE: Bấm nút "Duyệt thủ công" cho thí sinh cần xét vớt
    ADM_FE-->>A: Hộp thoại xác nhận duyệt và cấp mã cho thí sinh
    A->>ADM_FE: Xác nhận
    ADM_FE->>ADM_BE: POST /admin/api/admissions/approve/ {id: application_id}
    ADM_BE->>SVC: create_candidate_account_and_notify(application)
    SVC->>DB: Sinh mã SV mới theo trường (VD: 100111) với transaction.atomic
    SVC->>SVC: Sinh mật khẩu ngẫu nhiên (chữ + số)
    SVC->>DB: Tạo CustomUser (must_change_password=True) & Student trong SSMS
    SVC->>DB: Cập nhật AdmissionApplication (status = credentials_sent, reviewed_by = admin)
    SVC->>MAIL: Gửi Gmail thông báo trúng tuyển kèm Mã SV & Mật khẩu
    MAIL-->>A: Hoàn tất gửi mail
    ADM_BE-->>ADM_FE: HTTP 200 {success: true, student_id: 100111}
    ADM_FE-->>A: Toast xanh: "Đã duyệt thủ công và cấp mã sinh viên 100111 thành công!"
    ADM_FE->>ADM_FE: Cập nhật lại dòng trạng thái trên bảng tức thời
```

---

## 8. Biểu đồ Tuần tự: Tra Cứu Kết Quả Xét Tuyển & Mã Sinh Viên Bằng Số CCCD

```mermaid
sequenceDiagram
    autonumber

    actor C as Thí sinh (Candidate)
    participant FE as Cổng Xét Tuyển<br/>(templates/admission.html - Tab Tra Cứu)
    participant BE as Admission Views<br/>(student_management/views/admission/views.py)
    participant DB as SQL Server (SSMS)<br/>(student_management_admissionapplication)

    C->>FE: Chuyển sang Tab "Tra Cứu Kết Quả", nhập số CCCD (12 chữ số)
    C->>FE: Bấm nút "Tra Cứu"
    FE->>BE: GET /api/admission/check-status/?cccd=048099887766
    BE->>DB: SELECT AdmissionApplication WHERE cccd = '048099887766' ORDER BY created_at DESC
    
    alt Không tìm thấy hồ sơ
        DB-->>BE: Không có bản ghi
        BE-->>FE: HTTP 200 {found: false, message: Chưa tìm thấy hồ sơ}
        FE-->>C: Hiển thị thông báo không tìm thấy kết quả
    else Tìm thấy hồ sơ
        DB-->>BE: Trả về danh sách hồ sơ nộp vào các trường
        BE-->>FE: HTTP 200 {found: true, applications: [{university_name, department, score, benchmark, status, generated_student_id, created_at}]}
        FE-->>C: Hiển thị danh thiếp kết quả: Tên trường, Ngành, Điểm thi/Điểm chuẩn, Trạng thái (Trúng tuyển / Đã cấp mã SV) và Mã SV (nếu đã cấp)
    end
```


---

## 9. Biểu đồ Tuần tự: Khung Chương Trình Đào Tạo 4 Năm & Tra Cứu Lộ Trình Học Tập

```mermaid
sequenceDiagram
    autonumber

    actor S as Sinh viên (Mới hoặc Hiện tại)
    participant FE as Giao diện Khung Chương Trình<br/>(static/js/views/student/curriculum.js)
    participant APP as Core Router & State<br/>(static/js/core/app.js)
    participant DB_CLIENT as Local Database<br/>(static/js/core/database.js)

    Note over S,DB_CLIENT: Truy cập trực tiếp từ Menu #2 (Left Sidebar) hoặc Nút bấm trên Dashboard
    alt Cách 1: Bấm menu "Khung chương trình" trên thanh điều hướng bên trái (Vị trí #2)
        S->>FE: Click "Khung chương trình" (#/curriculum)
    else Cách 2: Bấm nút "Xem Khung chương trình đào tạo" tại thẻ Tiến độ học tập
        S->>FE: Click nút CTA tại Dashboard (#/curriculum)
    end
    FE->>APP: Lấy thông tin sinh viên hiện tại (Auth.getCurrentUser())
    FE->>FE: Tự động nhận diện ngành của sinh viên (VD: Công nghệ Thông tin)
    FE->>DB_CLIENT: Truy vấn kết quả học tập & lớp học đã đăng ký
    DB_CLIENT-->>FE: Trả về danh sách môn đã học / hoàn thành
    FE-->>S: Hiển thị giao diện 8 học kỳ (từ HK1 Năm 1 đến HK2 Năm 4)

    alt Sinh viên đổi ngành cần xem
        S->>FE: Chọn ngành khác trên Dropdown (Kỹ thuật Điều khiển & TĐH, QTKD, Ngôn ngữ Anh...)
        FE->>FE: Nạp lại lộ trình 4 năm và cập nhật tổng tín chỉ (130 - 145 TC)
        FE-->>S: Hiển thị danh sách môn học, số tín chỉ, phân loại và điều kiện tiên quyết
    else Sinh viên lọc theo năm học
        S->>FE: Bấm tab "Năm 1", "Năm 2", "Năm 3" hoặc "Năm 4"
        FE->>FE: Thu gọn chỉ hiển thị 2 học kỳ của năm được chọn
        FE-->>S: Giao diện học kỳ tương ứng được hiển thị rõ ràng
    end
```

---

## 10. Biểu đồ Tuần tự: Nợ Học Phí Tân Sinh Viên, Quét Mã VietQR & Admin Duyệt Thanh Toán

```mermaid
sequenceDiagram
    autonumber

    actor S as Tân Sinh Viên
    participant DASH as Cổng Sinh Viên / Bàn Làm Việc<br/>(static/js/views/common/dashboard.js)
    participant TUI as Cổng Học Phí<br/>(static/js/views/student/tuition.js)
    actor A as Quản trị viên (Admin)
    participant ADM as Admin Control Panel (Port 9000)<br/>(templates/admin/dashboard.html)
    participant API as Admin Academic API<br/>(student_management/views/admin/academic.py)
    participant DB as SQL Server (SSMS)<br/>(student_management_student)

    Note over S,DB: 1. Tân sinh viên được cấp tài khoản với tuition_debt = True
    S->>DASH: Đăng nhập Cổng sinh viên lần đầu
    DASH-->>S: Hiển thị Banner cảnh báo nợ học phí HK1 (15 tín chỉ x đơn giá)
    S->>TUI: Bấm "Thanh toán QR Học phí" (chuyển tới #/tuition)
    TUI-->>S: Hiển thị bảng kê 15 tín chỉ HK1 và mã QR VietQR kèm cú pháp: UNIMS [MãSV] HOCPHI HK1
    S->>S: Thực hiện chuyển khoản ngân hàng qua App Mobile Banking

    Note over A,ADM: 2. Nhà trường nhận tiền và Quản trị viên đối soát
    A->>ADM: Mở Tab "Sinh viên & Học phí" trên Admin Dashboard
    A->>ADM: Nhập Mã SV vào ô "Đối soát & Duyệt học phí VietQR nhanh"
    A->>ADM: Bấm "Duyệt Đã Thanh Toán" (hoặc bấm nút "Duyệt Đã Nộp" trên bảng)
    ADM->>API: POST /admin/api/students/toggle-tuition/ {student_id, tuition_debt: false}
    API->>DB: UPDATE student_management_student SET tuition_debt = 0 WHERE student_id = ...
    DB-->>API: Ghi nhận thành công vào SSMS
    API-->>ADM: HTTP 200 {success: true, message: Đã hoàn thành học phí}
    ADM-->>A: Toast xanh: Sinh viên đã hoàn thành học phí (Đã mở khoá hệ thống)

    Note over S,DASH: 3. Sinh viên đồng bộ trạng thái mới
    S->>DASH: F5 hoặc chuyển trang (kích hoạt Sync Down)
    DASH->>DB: GET /api/sync/down/
    DB-->>DASH: Trả về student_profile {tuition_debt: false}
    DASH-->>S: Banner cảnh báo nợ học phí biến mất, sinh viên được phép ĐKHP và xem điểm
```
