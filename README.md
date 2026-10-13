<div align="center">

# 🎓 UniMS — University Management System

**Hệ thống Quản lý Đại học & Đào tạo Tự lưu trữ (Self-Hosted Enterprise Architecture)**

Kiến trúc Phân tầng • Bảo mật Đa lớp • Cô lập Quản trị Local • Tự động hóa Dọn dẹp • Trợ lý AI • 100% Vanilla JS

**Hệ thống quản lý đại học toàn diện do bạn hoàn toàn làm chủ.**

![License](https://img.shields.io/badge/license-MIT-green)
![Self Hosted](https://img.shields.io/badge/self_hosted-🏠-blue)
![Backend](https://img.shields.io/badge/backend-Django_6.1_+_MSSQL-092E20)
![Database](https://img.shields.io/badge/database-SQL_Server_(SSMS)-CC292B)
![Security](https://img.shields.io/badge/OWASP-CWE--204_Hardened-success)
![Tests](https://img.shields.io/badge/tests-45%2F45_passed-brightgreen)
![UI](https://img.shields.io/badge/UI-Vanilla_JS_SPA-yellow)

*Dual-Port Architecture — Local-Only Admin (Port 9000) — Public User Portal (Port 8000) — Audit Logging & Threat Analytics*

</div>

---

## 💡 Tổng Quan Dự Án

UniMS giải quyết triệt để các nhược điểm cố hữu của phần mềm quản lý đại học truyền thống: nặng nề, phụ thuộc cloud bên ngoài, bảo mật lỏng lẻo và phân quyền nhập nhằng. 

Dự án được xây dựng với kiến trúc **Hybrid Web**:
- **Cơ sở dữ liệu trung tâm:** Microsoft SQL Server (MSSQL / SSMS) với bảo mật cơ sở dữ liệu cao cấp.
- **Backend Django 6.1:** Kiến trúc module sạch, phân vùng rõ ràng theo 4 nhóm đối tượng (`user`, `student`, `teacher`, `admin`).
- **Frontend SPA (Vanilla JS):** Không cồng kềnh framework, hỗ trợ Offline-First, hàng đợi đồng bộ (`SyncQueue`) và mã hóa dữ liệu cục bộ AES-256-GCM.
- **Bảo mật chuyên sâu:** Cách ly cổng Quản trị viên (Localhost Port 9000), chặn rò rỉ qua Tunnel, phòng thủ dò tìm tài khoản (CWE-204), và hệ thống theo dõi bất thường/tấn công thời gian thực.

---

## 🌟 Các Tính Năng & Kiến Trúc Nâng Cấp Nổi Bật

### 1. 🛡️ Cô lập Cổng Quản trị Local-Only (Port 9000)
- **Local Control Panel riêng biệt:** Admin đăng nhập và điều hành độc lập tại cổng Local qua lệnh `python manage.py run_admin_server` (mặc định Port 9000).
- **Chống rò rỉ qua Internet/Tunnel:** `LocalOnlyAdminMiddleware` giám sát chặt chẽ cả Host Header lẫn Socket IP. Mọi yêu cầu truy cập cổng Admin thông qua domain Ngrok, Cloudflare Tunnel hoặc Reverse Proxy công khai đều bị chặn và trả về **HTTP 404 Not Found** (tàng hình tuyệt đối).
- **Phân tách cửa đăng nhập:** Tài khoản Admin tuyệt đối bị từ chối tại cổng đăng nhập công khai (`/api/login/`), và ngược lại người dùng công khai (Sinh viên, Giảng viên) không thể vào trang Quản trị.

### 2. 🔐 Bảo mật Xác thực & Chống User Enumeration (CWE-204)
- **Thông báo đăng nhập chuẩn hóa:** Khi đăng nhập sai mật khẩu, sai mã số hoặc đăng nhập nhầm tab vai trò (Sinh viên vào tab Giảng viên hoặc ngược lại), hệ thống đồng nhất phản hồi lỗi: `"Sai thông tin đăng nhập"`. Kẻ tấn công không thể dựa vào phản hồi để dò quét tài khoản hợp lệ.
- **Đăng ký theo Mã định danh:** Hỗ trợ kiểm tra mã real-time với endpoint `/api/check-code/?code=...` (`"Mã đã có trong hệ thống"` / `"Mã không có trong hệ thống"`), loại bỏ hoàn toàn các chuỗi cảnh báo "Tên đăng nhập" dễ gây nhầm lẫn.

### 3. 📊 Hệ thống Giám sát & Phân tích Đe dọa Thời gian thực (Security Analytics)
- **Ghi vết tự động (Global Audit Logging):** Tự động bắt và phân loại các hành vi nguy hiểm: SQL Injection, Brute Force, User Enumeration, IP Spoofing, Session Hijacking, Tunnel Scanner.
- **Threat Score & Báo động DDoS:** Tự động tính điểm nguy cơ (An toàn, Cảnh báo, Nguy hiểm, Khẩn cấp) dựa trên tần suất request bất thường từ các IP lạ và hiển thị biểu đồ cảnh báo trực tiếp trên Admin Dashboard.
- **Log bất biến (MSSQL Hardening):** Kết cấu bảng `AuditLog` lưu vết chi tiết (Timestamp, IP, Endpoint, Action, Severity, Threat Reason) hỗ trợ điều tra số học.

### 4. 🧹 Cơ chế Dọn dẹp Tài khoản "Ma" (Ghost Accounts Cleaner)
- **Giải phóng dung lượng SSM:** Quản trị viên có công cụ quét và xóa an toàn các tài khoản không đăng nhập theo các mốc chu kỳ (1 năm, 3 năm, 5 năm, 10 năm) hoặc tài khoản đăng ký rác không có dữ liệu học tập/giảng dạy liên kết.
- **An toàn dữ liệu:** Bảo lưu các tài khoản có hồ sơ học tập hoặc tài khoản quản trị, đảm bảo tính toàn vẹn của bảng điểm và lịch sử đào tạo.

### 5. 📚 Quản lý Nghiệp vụ Đào tạo Hoàn chỉnh (Academic Management)
- **Quản lý Sinh viên & Học phí:** Tìm kiếm đa tiêu chí, lọc theo khoa, kích hoạt/hủy nợ học phí (`toggle-tuition`).
- **Quản lý Điểm & Tính GPA tự động:** Nhập điểm chuyên cần, giữa kỳ, cuối kỳ; tự động tính GPA hệ 4 và hệ 10 có trọng số tín chỉ (`recalculate_student_gpa`).
- **Khóa mốc học kỳ đa tầng:** Khóa điểm trước thi, khóa trước đăng ký học phần, và khóa tạm thời trong thời gian chấm thi.
- **Lịch dạy & Lớp học phần:** Nhân bản lớp học kỳ tự động (`copy-classes-semester`), điều chỉnh thời khóa biểu giảng viên, xuất báo cáo Excel chuyên nghiệp.

### 6. ⚡ Offline-First & Mã hóa Cục bộ
- Frontend duy trì hoạt động mượt mà khi mất mạng nhờ hàng đợi `SyncQueue`.
- Toàn bộ dữ liệu đệm được mã hóa tại chỗ (Encrypt-at-Rest) bằng thuật toán **AES-256-GCM** với Web Crypto API.
- Cơ chế **Single-Session Enforcement**: Mỗi tài khoản chỉ duy trì 1 phiên đăng nhập hợp lệ; tự động vô hiệu hóa phiên cũ khi phát hiện đăng nhập mới từ thiết bị khác.

---

## 👥 Danh Sách Tài Khoản Mẫu Có Sẵn (Seed Accounts)

> **Mật khẩu chung cho toàn bộ tài khoản mẫu:** `123`

### 1. Quản trị viên (Admin)
| Mã / Username | Họ và tên | Quyền hạn | Cổng đăng nhập |
|---|---|---|---|
| `admin` | Administrator | Toàn quyền quản trị hệ thống | Local Port 9000 (`/admin/login/`) |

### 2. Giảng viên (Teachers)
| Mã số GV | Họ và tên | Khoa / Chuyên ngành | Cổng đăng nhập |
|---|---|---|---|
| `1011` | ThS. Nguyễn Văn A | Khoa học Máy tính | Port 8000 (`/review/` - Tab Giáo viên) |
| `1012` | TS. Trần Thị B | Khoa học Máy tính | Port 8000 (`/review/` - Tab Giáo viên) |
| `1013` | ThS. Lê Văn C | Kỹ thuật Phần mềm | Port 8000 (`/review/` - Tab Giáo viên) |
| `1021` | TS. Phạm Văn D | Hệ thống Thông tin | Port 8000 (`/review/` - Tab Giáo viên) |
| `1041` | PGS.TS Hoàng Thị E | Trí tuệ Nhân tạo | Port 8000 (`/review/` - Tab Giáo viên) |
| `GV001` | ThS. Nguyễn Văn An | Công nghệ Thông tin | Port 8000 (`/review/` - Tab Giáo viên) |
| `GV002` | TS. Trần Thị Bình | Công nghệ Thông tin | Port 8000 (`/review/` - Tab Giáo viên) |

### 3. Sinh viên (Students)
| Mã số SV | Họ và tên | Khoa / Ngành | Cổng đăng nhập |
|---|---|---|---|
| `100011` | Nguyễn Văn Nam | Công nghệ Thông tin | Port 8000 (`/review/` - Tab Sinh viên) |
| `100012` | Trần Thị Mai | Công nghệ Thông tin | Port 8000 (`/review/` - Tab Sinh viên) |
| `100013` | Lê Bình | Công nghệ Thông tin | Port 8000 (`/review/` - Tab Sinh viên) |
| `100021` | Phạm Tuấn | Kinh tế | Port 8000 (`/review/` - Tab Sinh viên) |
| `100041` | Hoàng Quyên | Ngoại ngữ | Port 8000 (`/review/` - Tab Sinh viên) |
| `100015` | USER_002 | Đại cương | Port 8000 (`/review/` - Tab Sinh viên) |
| `testreg123` | Test User | Đại cương | Port 8000 (`/review/` - Tab Sinh viên) |

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu Cầu Môi Trường
1. **Python 3.10+** (đã kiểm thử tương thích hoàn hảo trên Python 3.13).
2. **Microsoft SQL Server** (bản Developer hoặc Express).
3. **ODBC Driver 17/18 for SQL Server** cài đặt sẵn trên máy.

### Bước 1: Khởi tạo Cơ sở dữ liệu
Mở SSMS hoặc Azure Data Studio và chạy câu lệnh:
```sql
CREATE DATABASE unims_db;
```

### Bước 2: Thiết lập file môi trường (.env)
Sao chép `.env.example` thành `.env` (hoặc sử dụng file `.env` mẫu đã tạo sẵn):
```powershell
cp .env.example .env
```
*(Mặc định hệ thống kết nối vào `.\SQLEXPRESS` với database `unims_db` qua Windows Authentication)*

### Bước 3: Cài đặt thư viện & Migrate
```powershell
pip install -r requirements.txt
python manage.py migrate
```

### Bước 4: Nạp dữ liệu ban đầu (Seeding)
Nạp đầy đủ các khoa, học kỳ, lớp môn học và tài khoản mẫu:
```powershell
python scripts/seed_db.py
```

### Bước 5: Khởi chạy Máy chủ

Hệ thống hỗ trợ 2 cổng hoạt động song song để bảo đảm tính an toàn:

#### Cổng 1: Máy chủ Người dùng công khai (Public Portal - Port 8000)
Dành cho Sinh viên, Giảng viên và khách truy cập:
```powershell
python manage.py runserver 127.0.0.1:8000
```
- **Trang chủ / Đăng nhập:** [http://127.0.0.1:8000/review/](http://127.0.0.1:8000/review/)
- **Cổng thông tin Sinh viên:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

#### Cổng 2: Máy chủ Quản trị viên Cục bộ (Admin Control Panel - Port 9000)
Dành riêng cho Quản trị viên hệ thống (chỉ cho phép truy cập Local):
```powershell
python manage.py run_admin_server 9000
```
- **Cổng Quản trị Local:** [http://127.0.0.1:9000/admin/login/](http://127.0.0.1:9000/admin/login/)
- **Dashboard Quản trị:** [http://127.0.0.1:9000/admin/dashboard/](http://127.0.0.1:9000/admin/dashboard/)

---

## 🧪 Kiểm Thử Hệ Thống (Unit Tests)

Hệ thống tích hợp bộ test tự động kiểm tra toàn bộ luồng nghiệp vụ và bảo mật:
```powershell
python manage.py test student_management
```
- **Kết quả:** `Ran 45 tests in ~140s — OK (100% Pass Rate)`
- **Nội dung kiểm thử:** Phân quyền RBAC, Chặn Tunnel Ngrok trên cổng Admin, Single-Session, Rate Limiting, Academic Management, Dọn dẹp tài khoản ma, Phân tích an ninh và Tính điểm GPA.

---

## 🏗 Cấu Trúc Thư Mục Dự Án (Sau Refactor)

```
📁 24CT1-DO_NGUYEN_HAO/
├── 📁 core/                          ⚙️ Cấu hình Django Project
│   ├── settings.py                   # Cấu hình MSSQL, Security Middleware, Trusted Hosts
│   ├── urls.py                       # Root URL Routing
│   └── wsgi.py / asgi.py
│
├── 📁 student_management/            🗄️ Backend Core App
│   ├── models.py                     # 11 models (User, Student, Teacher, Semester, Grade...)
│   ├── middleware.py                 # GlobalAudit, LocalOnlyAdmin, SingleSession
│   ├── decorators.py                 # @require_session, @require_role, @audit_log, @rate_limit
│   ├── security_utils.py             # Tiện ích băm log SHA-256, kiểm tra IP tin cậy
│   ├── tests.py                      # 36 Unit Tests nghiệp vụ & phân quyền
│   ├── tests_security.py             # 9 Unit Tests chuyên sâu về bảo mật
│   ├── urls.py                       # Routing các API endpoints
│   ├── 📁 management/commands/       # Quản lý lệnh tùy chỉnh
│   │   ├── run_admin_server.py       # Lệnh chạy máy chủ Admin riêng (Port 9000)
│   │   └── purge_ghost_accounts.py   # Lệnh dọn dẹp tài khoản ma theo chu kỳ
│   │
│   └── 📁 views/                     📦 Phân vùng Modules sạch (RBAC)
│       ├── 📁 user/                  # Dùng chung: auth (login, register, check-code), sync, ai, pages
│       ├── 📁 student/               # Tác vụ riêng sinh viên: profile, học phí cá nhân
│       ├── 📁 teacher/               # Tác vụ riêng giảng viên: attendance, điểm danh
│       └── 📁 admin/                 # Quản trị viên: dashboard, academic, audit logs, analytics
│
├── 📁 static/                        🌐 Frontend Vanilla JS SPA
│   ├── 📁 css/                       # Theme & responsive stylesheets
│   ├── 📁 js/core/                   # Engine: app, auth, crypto (AES-256), database, sync-queue
│   └── 📁 js/views/                  # 12 modules hiển thị theo vai trò người dùng
│
├── 📁 templates/                     📄 Giao diện HTML
│   ├── review.html                   # Cổng xác thực người dùng (SV / GV)
│   ├── index.html                    # Khung ứng dụng người dùng
│   └── 📁 admin/                     # Giao diện Quản trị viên
│       ├── login.html                # Đăng nhập Admin Control Panel
│       └── dashboard.html            # Dashboard KPIs, Audit Logs & Quản lý đào tạo
│
├── 📁 scripts/                       🔧 Script tiện ích hỗ trợ
│   ├── seed_db.py                    # Nạp dữ liệu mẫu ban đầu
│   ├── apply_mssql_hardening.py      # Thiết lập bảo mật và bảng log MSSQL
│   └── deploy_ngrok.ps1              # Triển khai nhanh qua Ngrok Tunnel
│
├── .env                              🔒 File cấu hình môi trường thực tế (chứa danh sách user)
├── .env.example                      📋 File mẫu biến môi trường gọn gàng
├── requirements.txt                  📦 Thư viện Python phụ thuộc
└── README.md                         📖 Tài liệu hướng dẫn hệ thống
```

---

## 🌐 Triển khai Public qua Ngrok (Tùy chọn)

Để mở cổng Người dùng (Port 8000) cho truy cập bên ngoài mà vẫn đảm bảo cổng Admin (Port 9000) được giữ an toàn tuyệt đối:

```powershell
# Chạy script tự động kiểm tra và khởi động:
.\scripts\deploy_ngrok.ps1
```
*Lưu ý: Domain Ngrok chỉ trỏ tới cổng 8000. Mọi nỗ lực truy cập `/admin/` qua URL Ngrok đều bị trả về 404 Not Found theo chính sách bảo mật.*

---

*UniMS — Hệ thống Quản lý Đại học Toàn diện, Độc lập và Tự chủ.*
