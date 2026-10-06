# BIỂU ĐỒ TUẦN TỰ (CHUẨN UML & ĐƯỜNG DẪN FILE TRỰC TIẾP)

> **CÁCH VẼ TỰ ĐỘNG TRÊN DIAGRAMS.NET (DRAW.IO):**
> 1. Trên thanh menu chọn: **Arrange** -> **Insert** -> **Advanced** -> **Mermaid...**
> 2. Copy đoạn code bên dưới chữ ````mermaid` của từng chức năng và dán vào hộp thoại.
> *(Các biểu đồ đã được cập nhật đường dẫn tuyệt đối (ổ đĩa D:) trỏ thẳng tới các file Frontend/Backend tương ứng)*

---

## 1. Biểu đồ Tuần tự: Chức năng Đăng ký

```mermaid
sequenceDiagram
    autonumber
    
    actor U as Người dùng
    participant FE as Giao diện Đăng ký<br/>(D:\24CT1-DO_NGUYEN_HAO\static\js\views\student\registration.js)
    participant BE as Xử lý Backend<br/>(D:\24CT1-DO_NGUYEN_HAO\student_management\views\auth.py)
    participant DB as Database<br/>(SQL Server Management)

    U->>+FE: Điền form (Họ tên, Mã số, Pass) và bấm Đăng ký
    FE->>FE: Kiểm tra tính hợp lệ dữ liệu trống
    
    FE->>+BE: Gọi API POST /api/register/
    
    BE->>+DB: Truy vấn kiểm tra Mã số sinh viên
    
    alt Mã số đã tồn tại
        DB-->>-BE: Trả về dữ liệu: Có tồn tại
        BE-->>FE: Trả về lỗi 400 (Tài khoản đã tồn tại)
        FE-->>U: Hiển thị thông báo cảnh báo đỏ
        
    else Mã số hợp lệ (Chưa tồn tại)
        DB-->>+BE: Trả về: Chưa tồn tại
        BE->>BE: Mã hóa (Hash) mật khẩu bảo mật
        BE->>+DB: INSERT thông tin vào bảng CustomUser
        DB-->>-BE: Xác nhận lưu thành công
        BE-->>-FE: Trả về HTTP 201 (Đăng ký thành công)
        FE-->>-U: Báo thành công và chuyển về Đăng nhập
    end
```

---

## 2. Biểu đồ Tuần tự: Chức năng Đăng nhập

```mermaid
sequenceDiagram
    autonumber
    
    actor U as Người dùng
    participant FE as Xử lý Đăng nhập<br/>(D:\24CT1-DO_NGUYEN_HAO\static\js\core\auth.js)
    participant BE as Xử lý Backend<br/>(D:\24CT1-DO_NGUYEN_HAO\student_management\views\auth.py)
    participant DB as Database<br/>(SQL Server Management)

    U->>+FE: Điền form (Mã số, Pass) và bấm Đăng nhập
    FE->>+BE: Gọi API POST /api/login/
    BE->>+DB: Truy vấn lấy thông tin User (CustomUser)
    
    alt Không tồn tại hoặc Sai Mật khẩu
        DB-->>-BE: Trả về rỗng / Sai pass
        BE-->>FE: Trả về lỗi 401 (Unauthorized)
        FE-->>U: Hiển thị lỗi "Sai tài khoản hoặc mật khẩu"
    else Thông tin chính xác
        DB-->>+BE: Trả về thông tin User hợp lệ
        BE->>BE: Khởi tạo Session Token & Lấy IP máy tính
        BE->>+DB: UPDATE Session Token và IP vào bảng CustomUser
        DB-->>-BE: Cập nhật thành công
        BE-->>-FE: Trả về JSON chứa Token + HTTP 200
        FE->>FE: Lưu Token vào LocalStorage
        FE-->>-U: Cấp quyền và chuyển hướng vào Dashboard
    end
```

---

## 3. Biểu đồ Tuần tự: Chức năng Nhập điểm (Có phân quyền theo Role)

```mermaid
sequenceDiagram
    autonumber
    
    actor U as Người dùng (Giáo viên)
    participant FE as Giao diện Nhập điểm<br/>(D:\24CT1-DO_NGUYEN_HAO\static\js\views\common\grades.js)
    participant BE as Xử lý Backend<br/>(D:\24CT1-DO_NGUYEN_HAO\student_management\views\sync.py)
    participant DB as Database<br/>(SQL Server Management)

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
    participant FE as Hàng đợi Đồng bộ<br/>(D:\24CT1-DO_NGUYEN_HAO\static\js\core\sync-queue.js)
    participant MW as Middleware<br/>(D:\24CT1-DO_NGUYEN_HAO\student_management\middleware.py)
    participant BE as Sync Backend<br/>(D:\24CT1-DO_NGUYEN_HAO\student_management\views\sync.py)
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
