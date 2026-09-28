<div align="center">

# 🎓 UniMS

**Hệ thống quản lý đại học và sinh viên tự lưu trữ (Self-hosted)**

Phân quyền mạnh mẽ • Dữ liệu của bạn • Trợ lý AI • Vanilla JS

**Hệ thống quản lý đại học mà bạn thực sự sở hữu.**

Lên kế hoạch học tập, quản lý điểm số, và theo dõi tiến độ sinh viên qua từng học kỳ — ngay trên trình duyệt, siêu nhanh và mượt mà. Đăng nhập phân quyền mạnh mẽ, không cần cài đặt phức tạp. Tất cả gói gọn trong một lệnh `python manage.py runserver`.

![License](https://img.shields.io/badge/license-MIT-green)
![Self Hosted](https://img.shields.io/badge/self_hosted-🏠-blue)
![UI](https://img.shields.io/badge/UI-Vanilla_JS-yellow)
![Backend](https://img.shields.io/badge/backend-Django_Server-092E20)
![Telemetry](https://img.shields.io/badge/telemetry-none-red)

*Dashboard — Quản lý điểm số chi tiết — AI Chatbot hỗ trợ — Bảo mật cấp doanh nghiệp*

</div>

---

## Why

Phần lớn các hệ thống quản lý đại học hiện nay cồng kềnh, giao diện cứng nhắc, tốc độ tải chậm và khó tùy biến. UniMS là một thái cực ngược lại: nó chạy trực tiếp trên máy của bạn, dữ liệu nằm trong quyền kiểm soát của bạn, giao diện thích ứng thông minh và cực kỳ mượt mà nhờ kiến trúc lai độc đáo.

---

## 🌟 Kiến Trúc & Tính Năng Nổi Bật

1. **Offline-First & Auto-Sync Pipeline**
   - Frontend có khả năng hoạt động độc lập ngay cả khi mất kết nối mạng dựa trên bộ nhớ đệm `localStorage` (Offline mode).
   - Hệ thống hàng đợi đồng bộ (`SyncQueue`) tự động lưu vết và gửi các thay đổi (Sync Up) lên máy chủ ngay khi có mạng.
   - **Bảo mật tuyệt đối:** Toàn bộ dữ liệu bộ nhớ đệm được mã hoá tại chỗ (Encrypt-at-rest) với AES-256-GCM.

2. **Bảo Mật Nhiều Lớp (Enterprise Security)**
   - **Xác thực API**: Mọi API gọi từ Client đều yêu cầu `X-Session-Token` hợp lệ, được quản lý nghiêm ngặt qua `SingleSessionMiddleware`.
   - **Single-Session**: Giới hạn 1 thiết bị/1 tài khoản trong cùng một thời điểm. Tự động "đá" (kick) thiết bị cũ nếu phát hiện đăng nhập mới.
   - **Đồng bộ đa tab**: Sử dụng `BroadcastChannel` để đăng xuất đồng loạt tất cả các tab trình duyệt ngay khi phiên làm việc hết hạn.

3. **Role-Based Access Control (RBAC)**
   - Phân quyền chặt chẽ theo 3 cấp độ: Quản trị viên (Admin), Giáo viên và Sinh viên.
   - UI thông minh tự động Render lại các module (Sidebar, Dashboard) tương ứng với từng Role mà không cần load lại trang.

4. **Trợ Lý Thông Minh & Quản Lý Điểm Số**
   - Hệ thống khoá điểm nhiều lớp: Khoá tạm thời, khoá trước thi và khoá cố định trước đăng ký học phần.
   - Tích hợp AI Chatbot (Helpdesk) giải đáp nhanh thắc mắc cho sinh viên.

---

## 🚀 Hướng Dẫn Cài Đặt

Dự án này không đính kèm file Database có sẵn (file `*.sqlite3` đã được đưa vào `.gitignore` để tránh rò rỉ dữ liệu lên mạng). Nếu bạn tải repository này về máy, vui lòng làm theo 5 bước chuẩn mực sau để khởi tạo:

### Yêu Cầu Hệ Thống
1. **Python 3.10+**
2. **Microsoft SQL Server** (hoặc SQL Server Express) đang chạy trên máy cục bộ.
3. **ODBC Driver for SQL Server** (đã cài đặt sẵn trên hệ điều hành Windows).

### Bước 1: Khởi Tạo Cơ Sở Dữ Liệu
Mở SQL Server Management Studio (SSMS) hoặc Azure Data Studio và chạy lệnh SQL sau để tạo cơ sở dữ liệu rỗng:
```sql
CREATE DATABASE unims_db;
```
*(Lưu ý: Hệ thống đang sử dụng cấu hình Windows Authentication `Trusted_Connection=yes` trỏ vào `.\SQLEXPRESS`. Nếu bạn sử dụng tài khoản `sa`, vui lòng cấu hình lại chuỗi kết nối trong thư mục `core/settings.py`)*

### Bước 2: Cài Đặt Môi Trường
Mở Terminal tại thư mục gốc dự án và cài đặt các thư viện cần thiết:
```bash
pip install -r requirements.txt
```

### Bước 3: Migrate (Khởi Tạo Bảng)
Lệnh này sẽ phân tích các Models của Django và tự động xây dựng toàn bộ cấu trúc bảng vào bên trong `unims_db` trên SQL Server:
```bash
python manage.py makemigrations
python manage.py migrate
```

### Bước 4: Nạp Dữ Liệu Mẫu (Seeding)
Do database của bạn mới được tạo và hoàn toàn trống, hệ thống sẽ từ chối mọi nỗ lực đăng nhập. Bạn **BẮT BUỘC** phải chạy script sau để nạp dữ liệu mẫu ban đầu và các tài khoản cần thiết:
```bash
python seed_db.py
```
Sau khi nạp dữ liệu thành công, bạn có thể sử dụng các tài khoản sau (Mật khẩu chung cho tất cả là `123`):

- **Quản trị viên (Admin):** `admin`
- **Giáo viên (Teacher):** `1011`, `1012`, `1013`, `1021`, `1041`
- **Sinh viên (Student):** `100011`, `100012`, `100013`, `100021`, `100041`

### Bước 5: Chạy Máy Chủ
```bash
python manage.py runserver
```
Truy cập vào [http://127.0.0.1:8000/](http://127.0.0.1:8000/) để trải nghiệm hệ thống. Hãy nhấn `Ctrl + F5` (Hard Reload) nếu trình duyệt của bạn đang lưu cache giao diện cũ.

---

## 🏗 Cấu Trúc Dự Án

- `/student_management`: Vùng lõi Backend (Django), quản trị Models (MSSQL), REST API Views, Middleware bảo mật và Security Decorators.
- `/static/js/core`: Trái tim xử lý phía Frontend.
  - `database.js`: Trình quản lý LocalStorage & Engine Mã hoá AES-GCM.
  - `sync-queue.js`: Xử lý hàng đợi đồng bộ Offline -> Online.
  - `auth.js`: Phân hệ xác thực, cấp phát token và giám sát Single Session.
  - `app.js`: Vòng đời ứng dụng, hệ thống định tuyến (Router).
- `/static/js/views`: Các module logic nghiệp vụ chuyên biệt (Login, Dashboard, Grading, Registry).
- `/templates`: Tệp giao diện HTML tối giản dùng để làm khung sườn cho ứng dụng trang đơn (SPA).
- `seed_db.py`: Mã kịch bản (Script) tự động hoá nạp dữ liệu mẫu vào SQL Server.

---
*UniMS — Thay đổi cách bạn quản lý giáo dục.*
