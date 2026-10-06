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
python scripts/seed_db.py
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

```
📁 UniMS/
├── 📁 core/                          ⚙️ Django Project Config
│   ├── settings.py                   # Cấu hình chính (DB, Security, Ngrok)
│   ├── urls.py                       # Root URL routing
│   └── wsgi.py / asgi.py            # Web server entry points
│
├── 📁 student_management/            🗄️ Backend — App Django chính
│   ├── models.py                     # 11 models (User, Grade, Attendance...)
│   ├── middleware.py                 # SingleSession bảo mật
│   ├── decorators.py                 # @require_session, @rate_limit, @audit_log
│   ├── tests.py                      # Unit tests phân quyền
│   ├── urls.py                       # 17 API endpoints
│   └── 📁 views/                     # 6 view modules (auth, api, sync, export...)
│
├── 📁 static/                        🌐 Frontend — Vanilla JS SPA
│   ├── 📁 css/                       # Styles (main, mobile, variables)
│   ├── 📁 js/core/                   # Engine: app, auth, crypto, database, sync, translations
│   ├── 📁 js/views/                  # 12 view modules (dashboard, grades, chatbot...)
│   ├── 📁 js/vendor/                 # ApexCharts, SweetAlert2
│   └── 📁 assets/                    # Logo, favicon, images
│
├── 📁 templates/                     📄 HTML Templates — Khung SPA
│
├── 📁 docs/                          📚 Tài liệu & Diagrams
│
├── 📁 scripts/                       🔧 Scripts tiện ích
│   ├── seed_db.py                    # Nạp dữ liệu mẫu vào DB
│   ├── deploy_ngrok.ps1              # Deploy nhanh qua Ngrok (1 lệnh)
│   └── run_seed.ps1                  # Wrapper chạy seed_db
│
├── .env.example                      🔒 Template biến môi trường
├── Dockerfile                        🐳 Docker config
├── Procfile / render.yaml            ☁️ Render.com deploy
├── requirements.txt                  📦 Python dependencies
└── README.md                         📖 Hướng dẫn này
```

---

## 🌐 Deploy qua Ngrok

**Yêu cầu:** Ngrok đã cài (`choco install ngrok`) + xác thực (`ngrok config add-authtoken YOUR_TOKEN`)

**Cách nhanh nhất (1 lệnh):**
```powershell
.\scripts\deploy_ngrok.ps1
```

**Cách thủ công:**
```powershell
# Terminal 1
python manage.py runserver 127.0.0.1:8000
# Terminal 2
ngrok http 8000
```

Truy cập URL `https://xxxxx.ngrok-free.app` hiển thị trên Ngrok terminal.

---
*UniMS — Thay đổi cách bạn quản lý giáo dục.*
