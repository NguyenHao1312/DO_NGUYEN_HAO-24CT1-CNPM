# BIỂU ĐỒ TUẦN TỰ (CHI TIẾT THEO FILE)

> **CÁCH VẼ TỰ ĐỘNG TRÊN DIAGRAM.NET (DRAW.IO):**
> 1. Trên thanh menu chọn: **Arrange** -> **Insert** -> **Advanced** -> **Mermaid...**
> 2. Copy đoạn code bên dưới chữ ````mermaid` của từng chức năng và dán vào hộp thoại.

---

## 1. Biểu đồ Tuần tự: Chức năng Đăng ký

```mermaid
sequenceDiagram
    autonumber
    actor U as Người dùng
    participant FE as Giao diện Đăng ký<br/>(registration.js)
    participant BE as Xử lý Backend<br/>(views/auth.py)
    database DB as Database<br/>(SQL Server Management)

    U->>FE: Điền form (Họ tên, Mã số, Pass) và bấm Đăng ký
    FE->>FE: Kiểm tra tính hợp lệ dữ liệu trống
    FE->>BE: Gọi API POST /api/register/
    BE->>DB: Truy vấn kiểm tra Mã số sinh viên
    
    alt Mã số đã tồn tại
        DB-->>BE: Trả về dữ liệu: Có tồn tại
        BE-->>FE: Trả về lỗi 400 (Tài khoản đã tồn tại)
        FE-->>U: Hiển thị thông báo cảnh báo đỏ trên màn hình
    else Mã số hợp lệ (Chưa tồn tại)
        DB-->>BE: Trả về: Chưa tồn tại
        BE->>BE: Mã hóa (Hash) mật khẩu bảo mật
        BE->>DB: INSERT thông tin vào bảng CustomUser
        DB-->>BE: Xác nhận lưu thành công
        BE-->>FE: Trả về HTTP 201 (Đăng ký thành công)
        FE-->>U: Báo thành công và tự động chuyển về Form Đăng nhập
    end
```

---

## 2. Biểu đồ Tuần tự: Chức năng Đăng nhập

```mermaid
sequenceDiagram
    autonumber
    actor U as Người dùng
    participant FE as Giao diện Đăng nhập<br/>(auth.js)
    participant BE as Xử lý Backend<br/>(views/auth.py)
    database DB as Database<br/>(SQL Server Management)

    U->>FE: Điền form (Mã số, Pass) và bấm Đăng nhập
    FE->>BE: Gọi API POST /api/login/
    BE->>DB: Truy vấn lấy thông tin User (CustomUser)
    
    alt Không tồn tại hoặc Sai Mật khẩu
        DB-->>BE: Trả về rỗng / Trả về dữ liệu để BE đối chiếu pass sai
        BE-->>FE: Trả về lỗi 401 (Unauthorized)
        FE-->>U: Hiển thị lỗi "Sai tài khoản hoặc mật khẩu"
    else Thông tin chính xác
        DB-->>BE: Trả về thông tin User hợp lệ
        BE->>BE: Khởi tạo Session Token & Lấy IP máy tính
        BE->>DB: UPDATE Session Token và IP vào bảng CustomUser
        DB-->>BE: Cập nhật thành công
        BE-->>FE: Trả về JSON chứa Token + HTTP 200
        FE->>FE: Lưu Token vào LocalStorage của trình duyệt
        FE-->>U: Cấp quyền và chuyển hướng vào Bảng điều khiển
    end
```

---

## 3. Biểu đồ Tuần tự: Chức năng Nhập điểm (Tự chọn 1)

```mermaid
sequenceDiagram
    autonumber
    actor U as Người dùng (Giáo viên)
    participant FE as Giao diện Nhập điểm<br/>(grades.js)
    participant BE as Xử lý Backend<br/>(views/api.py)
    database DB as Database<br/>(SQL Server Management)

    U->>FE: Chỉnh sửa điểm (QT, GK, CK) và bấm "Lưu"
    FE->>FE: Đóng gói dữ liệu điểm mới
    FE->>BE: Gọi API POST /api/grades/save/
    BE->>DB: Truy vấn kiểm tra quyền truy cập (Role)
    
    alt Không có quyền (Sinh viên)
        DB-->>BE: Trả về Role không hợp lệ
        BE-->>FE: Trả về lỗi 403 (Forbidden)
        FE-->>U: Hiển thị thông báo "Không có quyền thao tác"
    else Hợp lệ (Giáo viên)
        DB-->>BE: Xác nhận quyền hợp lệ
        BE->>DB: Truy vấn lấy bản ghi điểm cũ
        DB-->>BE: Trả về bản ghi hiện tại
        BE->>BE: Tính toán tự động (Hệ 10, Hệ 4, Điểm chữ)
        BE->>DB: Thực thi UPDATE dữ liệu điểm mới
        DB-->>BE: Xác nhận cập nhật thành công
        BE-->>FE: Trả về HTTP 200 (Thành công)
        FE-->>U: Cập nhật UI bảng điểm mới & Thông báo xanh
    end
```

---

## 4. Biểu đồ Tuần tự: Chức năng Đồng bộ Dữ liệu Offline (Tự chọn 2)

```mermaid
sequenceDiagram
    autonumber
    actor U as Người dùng
    participant FE as Hàng đợi Đồng bộ<br/>(sync-queue.js)
    participant BE as Xử lý Backend<br/>(views/sync.py)
    database DB as Database<br/>(SQL Server Management)

    U->>FE: Bấm "Đồng bộ" (Khi thiết bị có mạng trở lại)
    FE->>FE: Đọc dữ liệu chờ lưu từ bộ nhớ LocalStorage
    FE->>BE: Gọi API POST /api/sync/up/ (Gửi toàn bộ gói Data)
    BE->>DB: Bật chế độ Giao dịch (Mở Database Transaction)
    BE->>DB: Gửi danh sách dữ liệu cần INSERT/UPDATE
    
    alt Có lỗi ràng buộc hoặc Xung đột
        DB-->>BE: Trả về mã lỗi SQL
        BE->>DB: Gửi lệnh ROLLBACK (Hủy bỏ toàn bộ thao tác)
        BE-->>FE: Trả về lỗi 500 (Internal Server Error)
        FE-->>U: Thông báo "Đồng bộ thất bại, vui lòng thử lại"
    else Lưu an toàn 100%
        DB-->>BE: Trả về kết quả ghi thành công từng bản ghi
        BE->>DB: Gửi lệnh COMMIT (Chốt lưu thay đổi vĩnh viễn)
        DB-->>BE: Xác nhận hoàn tất Giao dịch
        BE-->>FE: Trả về HTTP 200 (Đồng bộ hoàn chỉnh)
        FE->>FE: Xóa sạch dữ liệu tạm trong LocalStorage
        FE-->>U: Hiển thị thông báo "Đồng bộ dữ liệu thành công"
    end
```
