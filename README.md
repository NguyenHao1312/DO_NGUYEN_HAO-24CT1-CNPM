<div align="center">

# 🎓 UniMS — University Management System

**Hệ thống Quản lý Đại học & Xét Tuyển Trực Tuyến Tự lưu trữ (Self-Hosted Enterprise Architecture)**

Kiến trúc Phân tầng • Xét Nguyện Vọng Trực Tuyến • Cấp Mã SV & Mật Khẩu Tự Động • Xác Thực Gmail OTP • Cô Lập Quản Trị Local • 100% Vanilla JS SPA

**Hệ thống quản lý đại học toàn diện do bạn hoàn toàn làm chủ.**

![License](https://img.shields.io/badge/license-MIT-green)
![Self Hosted](https://img.shields.io/badge/self_hosted-🏠-blue)
![Backend](https://img.shields.io/badge/backend-Django_6.1_+_MSSQL-092E20)
![Database](https://img.shields.io/badge/database-SQL_Server_(SSMS)-CC292B)
![Security](https://img.shields.io/badge/OWASP-CWE--204_Hardened-success)
![Tests](https://img.shields.io/badge/tests-45%2F45_passed-brightgreen)
![UI](https://img.shields.io/badge/UI-Vanilla_JS_SPA-yellow)

*Dual-Port Architecture — Local-Only Admin (Port 9000) — Public User Portal (Port 8000) — Online Admission Portal (`/admission/`)*

</div>

---

## 💡 Tổng Quan Dự Án

UniMS giải quyết triệt để các nhược điểm cố hữu của phần mềm quản lý đại học truyền thống: nặng nề, phụ thuộc cloud bên ngoài, bảo mật lỏng lẻo và phân quyền nhập nhằng. 

Dự án được xây dựng với kiến trúc **Hybrid Web**:
- **Cơ sở dữ liệu trung tâm:** Microsoft SQL Server (MSSQL / SSMS) với bảo mật cơ sở dữ liệu cao cấp.
- **Backend Django 6.1:** Kiến trúc module sạch, phân vùng rõ ràng theo 5 nhóm đối tượng (`user`, `student`, `teacher`, `admin`, `admission`).
- **Frontend SPA (Vanilla JS):** Không cồng kềnh framework, hỗ trợ Offline-First, hàng đợi đồng bộ (`SyncQueue`) và mã hóa dữ liệu cục bộ AES-256-GCM.
- **Bảo mật chuyên sâu:** Cách ly cổng Quản trị viên (Localhost Port 9000), chặn rò rỉ qua Tunnel, phòng thủ dò tìm tài khoản (CWE-204), và hệ thống theo dõi bất thường/tấn công thời gian thực.
- **Cổng Tuyển sinh & Cấp mã tự động:** Cổng xét nguyện vọng trực tuyến độc lập, tự động hóa toàn bộ quy trình tiếp nhận hồ sơ, đối soát điểm chuẩn, xác thực email qua OTP và cấp mã số sinh viên vào CSDL SSMS.

---

## 🌟 Các Tính Năng & Kiến Trúc Nổi Bật

### 1. 🎓 Cổng Xét Nguyện Vọng Đại Học & Cấp Mã Tự Động (`/admission/`)
- **Đăng ký xét tuyển trực tuyến:** Thí sinh nhập Họ tên, CCCD (12 chữ số), Gmail, SĐT, chọn Trường & Ngành xét tuyển và Điểm thi (thang 30đ, 2 chữ số thập phân).
- **Chống gian lận & Trùng lặp thông tin 1:1 nghiêm ngặt:**
  - Hệ thống tự động xác thực chéo dữ liệu thời gian thực: CCCD, Gmail, Số điện thoại và Họ tên thí sinh với CSDL SQL Server (bao gồm cả tài khoản sinh viên đã cấp và hồ sơ tuyển sinh đã duyệt).
  - Chặn triệt để tình trạng một người dùng nhiều CCCD, một CCCD dùng nhiều Gmail hoặc một Gmail/SĐT dùng cho nhiều người.
  - Phản hồi mã lỗi `409 Conflict` kèm thông điệp cảnh báo rõ ràng khi phát hiện trùng lặp.
- **Kiểm tra CCCD độc lập & Thông minh:**
  - Nút *"Kiểm tra"* cạnh ô CCCD thực hiện kiểm tra riêng biệt số định danh trong hệ thống (`check_mode: cccd_only`), hoàn toàn không gây xung đột hoặc báo lỗi sai khi các ô Gmail và Số điện thoại còn đang để trống.
  - Nếu CCCD đã có trong hệ thống (đã được cấp mã sinh viên hoặc trúng tuyển), giao diện lập tức cảnh báo đỏ.
  - Khi thí sinh điền đầy đủ và bấm *"Nộp hồ sơ"*, hệ thống tiếp tục đối soát toàn diện (`check_mode: all`); nếu thí sinh phớt lờ cảnh báo trước đó thì hệ thống sẽ hiện cảnh báo thứ hai và chặn nộp hồ sơ.
- **Đối soát Điểm chuẩn & Thông báo Trúng tuyển trước khi gửi OTP (Lựa chọn A):**
  - Hệ thống tự động so khớp điểm thi của thí sinh với điểm chuẩn của ngành đã chọn ngay tại Cổng xét tuyển.
  - **Trường hợp Trúng tuyển (Đậu):** Hiển thị Modal chúc mừng trúng tuyển trang trọng với đầy đủ thông tin: Trường, Ngành, Điểm của thí sinh, Điểm chuẩn và Điểm vượt chuẩn. Khi thí sinh bấm *"Tiếp tục nhận mã OTP"*, hệ thống mới kích hoạt gửi OTP về Gmail và chuyển sang Bước 2.
  - **Trường hợp Chưa đạt (Rớt):** Hiển thị Modal thông báo không đạt kèm số điểm còn thiếu (ví dụ: `-2.50đ`) và gợi ý chọn ngành hoặc trường khác phù hợp hơn; hệ thống dừng lại tại Bước 1 và tuyệt đối không gửi OTP.
- **Xác thực Gmail qua OTP 6 số (Giao diện tinh giản Clean UI/UX):** 
  - Lọc nghiêm ngặt tài khoản `@gmail.com` thật, loại trừ hoàn toàn email rác/ảo.
  - Giao diện nhập OTP tối giản, tự động focus, hỗ trợ phím Enter để xác thực tức thời, đếm ngược hiệu lực 10 phút và nút gửi lại OTP.
  - Tự động sinh mã OTP 6 số và gửi qua hệ thống SMTP Gmail (cấu hình trong file .env).
- **Điểm Chuẩn tham chiếu các trường:**
  - Bách Khoa (10011): 27.00 – 29.10đ.
  - Các trường khác (10012 – 10021): 18.00 – 26.50đ.
- **Tự động cấp Mã Sinh Viên & Mật khẩu vào SSMS:**
  - **Quy tắc sinh mã theo trường:** Bắt đầu bằng mã số trường nối tiếp số thứ tự tăng dần.
    - ĐH Bách Khoa (`10011`): `100110`, `100111`, `100112`...
    - ĐH Duy Tân (`10012`): `100120`, `100121`...
    - Tương tự cho các trường: FPT (`10013`), Đông Á (`10014`), Sư phạm (`10015`), Việt - Hàn (`10016`), Y Dược (`10017`), Kinh tế (`10018`), Kiến trúc (`10019`), Ngoại ngữ (`10020`), Sư phạm Kỹ thuật (`10021`).
  - **Mật khẩu khởi tạo an toàn:** Chuỗi ký tự ngẫu nhiên 8 ký tự gồm chữ hoa, chữ thường và chữ số.
  - Tự động lưu hồ sơ vào bảng `CustomUser` (cờ `must_change_password=True`) và `Student` (cờ `tuition_debt=True`) trong SQL Server với khóa hàng (`transaction.atomic`) chống xung đột/trùng mã.
  - Tự động gửi email chúc mừng trúng tuyển kèm thông tin tài khoản đến Gmail của tân sinh viên.
- **Tra cứu kết quả xét tuyển:** Tab tra cứu bằng số CCCD giúp thí sinh theo dõi trạng thái hồ sơ và xem mã sinh viên đã cấp.

### 2. 🔑 Cơ Chế Đổi Mật Khẩu Bắt Buộc & Tự Nguyện
- **Bắt buộc đổi mật khẩu lần đầu (An toàn thông tin):** Khi tân sinh viên được cấp tài khoản đăng nhập lần đầu tiên vào hệ thống chính (`/review/`), popup an ninh lập tức xuất hiện và khóa modal:
  > *"Hãy đổi lại mật khẩu để tránh mất thông tin"*
  - Sinh viên bắt buộc phải thiết lập mật khẩu mới (có thể nhập trực tiếp trên modal hoặc bấm nút chuyển đến trang Hồ sơ cá nhân `#/profile`).
  - API `/api/change-password/` cập nhật mật khẩu băm mới vào SSMS và gỡ cờ bắt buộc. Các lần đăng nhập sau sinh viên sử dụng mật khẩu mới đã đổi.
- **Chủ động đổi mật khẩu tại trang cá nhân:** Giao diện đổi mật khẩu trong Hồ sơ cá nhân (`Profile`), cho phép cả Sinh viên và Giảng viên chủ động thay đổi mật khẩu định kỳ để bảo vệ tài khoản.

### 3. 💳 Quản Lý Học Phí Tân Sinh Viên & Thanh Toán VietQR
- **Khởi tạo nợ học phí tự động:** Tất cả sinh viên mới trúng tuyển được tự động khởi tạo trạng thái `tuition_debt = True` trong SSMS.
- **Banner cảnh báo học phí trên Bàn làm việc (Dashboard):** Hiển thị cảnh báo trực quan kèm số tiền học phí tạm tính theo định mức 15 tín chỉ tiêu chuẩn của Học kỳ 1 (`15 tín chỉ x Đơn giá tín chỉ của trường`).
- **Cổng Học Phí (`#/tuition`) & Thanh toán VietQR:**
  - Bảng kê 15 tín chỉ chuẩn HK1 cho tân sinh viên chưa đăng ký môn.
  - Tích hợp mã QR VietQR chuẩn ngân hàng với cú pháp bắt buộc: `UNIMS <MãSV> HOCPHI HK1`.

### 4. 📚 Khung Chương Trình Đào Tạo 4 Năm (8 Học Kỳ)
- **Vị trí ưu tiên trên giao diện Sinh viên:**
  - Đặt tại **vị trí số #2** trên thanh điều hướng bên trái (Left Sidebar) ngay liền kề *Bảng điều khiển*.
  - Bổ sung nút truy cập trực tiếp *"Xem Khung chương trình đào tạo"* ngay tại thẻ *Tiến độ học tập* trên Dashboard sinh viên.
- **Tra cứu lộ trình học tập toàn diện:** Module `#/curriculum` cho phép tất cả sinh viên (cũ và mới) xem chi tiết các môn học từ HK1 Năm 1 đến HK2 Năm 4 kèm tổng số tín chỉ.
- **Dropdown chọn chuyên ngành:** Tự động nhận diện ngành của sinh viên đăng nhập và cho phép chuyển đổi xem khung môn học của các ngành khác (Công nghệ thông tin, Kỹ thuật Điều khiển & TĐH, Quản trị kinh doanh, Ngôn ngữ Anh...).
- **Bộ lọc linh hoạt:** Lọc theo Năm học (Năm 1, Năm 2, Năm 3, Năm 4, Tất cả 4 năm), ô tìm kiếm nhanh môn học/mã môn, phân loại Bắt buộc/Tự chọn và kiểm tra điều kiện tiên quyết.

### 5. 🛡️ Cô Lập Cổng Quản Trị Local-Only (Port 9000) & Cyber-Office Dashboard
- **Local Control Panel riêng biệt:** Admin đăng nhập và điều hành độc lập tại cổng Local qua lệnh `python manage.py run_admin_server 9000`.
- **Cơ chế Hết hạn Phiên Đơn điệu 10 Phút (Monotonic 10-Min Session):**
  - Rút ngắn thời gian hết hạn phiên làm việc từ 30 phút xuống 10 phút (`600s`) đảm bảo chuẩn an ninh cao.
  - Đồng hồ đếm ngược time-age tính toán chính xác dựa trên mốc thời gian hết hạn cố định của server (`session_expires_at_ms`). Khi Quản trị viên F5, reload trang hoặc forced reload, thời gian đếm ngược không bị reset về 10:00 mà tiếp tục trôi tuyến tính.
  - Khi hết 10 phút, hệ thống tự động hủy token xác thực và chuyển hướng an toàn về `/admin/login/?error=session_expired`.
- **Đối Soát & Duyệt Học Phí VietQR Nhanh:** Bổ sung thanh công cụ đối soát trên Tab "Sinh viên & Học phí". Khi nhận được sao kê ngân hàng, Admin chỉ cần nhập Mã SV và bấm *"Duyệt Đã Thanh Toán"*, hệ thống lập tức gỡ nợ trong SQL Server và đồng bộ về Cổng sinh viên.
- **Chống rò rỉ qua Internet/Tunnel:** `LocalOnlyAdminMiddleware` giám sát chặt chẽ cả Host Header lẫn Socket IP. Mọi yêu cầu truy cập cổng Admin thông qua domain Ngrok, Cloudflare Tunnel hoặc Reverse Proxy công khai đều bị chặn và trả về **HTTP 404 Not Found** (tàng hình tuyệt đối).
- **Tab Xét Nguyện Vọng trên Admin Dashboard:**
  - Theo dõi danh sách thí sinh nộp hồ sơ, điểm thi, điểm chuẩn, trạng thái OTP.
  - **Nút Duyệt Thủ Công:** Cho phép Admin xét vớt hoặc cấp mã thủ công khi cần. Hệ thống vẫn tự động sinh mã SV, tạo user SSMS và gửi Gmail mật khẩu như luồng tự động.
  - Thiết kế phong cách **Văn phòng kết hợp Cyber**: Giao diện tối hiện đại, bố cục rõ ràng, điều hướng mượt mà, tích hợp `AbortController` chống nghẽn đường truyền và triệt tiêu lỗi va chạm dữ liệu.

### 6. 🔐 Bảo Mật Xác Thực & Chống User Enumeration (CWE-204)
- **Thông báo đăng nhập chuẩn hóa:** Mọi trường hợp sai mật khẩu, sai mã số hoặc đăng nhập nhầm tab vai trò đều trả về thông báo lỗi chung: `"Sai thông tin đăng nhập"`, ngăn chặn kẻ tấn công dò quét tài khoản.
- **Single-Session Enforcement:** Mỗi tài khoản chỉ duy trì 1 phiên hoạt động duy nhất; tự động ép đăng xuất phiên cũ khi phát hiện đăng nhập mới từ thiết bị khác.

### 7. 📊 Giám Sát An Ninh & Nhật Ký Kiểm Toán (Audit Trail)
- **Ghi vết tự động (Global Audit Logging):** Bắt và phân loại các hành vi bất thường, đo đạc độ trễ mạng và phát hiện tấn công DDoS/Brute-force.
- **Bảo toàn WORM trong SQL Server:** Bảng `student_management_auditlog` được khóa bằng Trigger ngăn chặn mọi thao tác UPDATE/DELETE để đảm bảo tính toàn vẹn pháp lý của nhật ký kiểm toán.
- **Dọn dẹp tài khoản ma (Ghost Accounts Cleaner) & Làm sạch dữ liệu:**
  - Quản trị viên có công cụ quét và xóa an toàn các tài khoản không hoạt động (0 môn học, 0 điểm thi) làm nhiễu database.
  - Toàn bộ tài khoản mẫu trong hệ thống đã được nạp đầy đủ dữ liệu học vụ cơ bản (CourseClass, Registration, Grade, Attendance qua script `seed_academic_data.py`), đưa số lượng tài khoản ma về **0 tài khoản ma**.

### 8. 🌐 Đồng Bộ Đa Ngôn Ngữ Song Ngữ (VN/EN i18n Synchronization)
- **Hỗ trợ song ngữ Tiếng Việt & Tiếng Anh tức thì:** Nút chuyển đổi VN/EN hoạt động đồng bộ trên toàn bộ hệ thống.
- **Bao phủ trọn vẹn từ Cổng Đăng nhập đến Dashboard sau Đăng nhập:**
  - Cổng Đăng nhập (`/review/`): Chuyển đổi linh hoạt tiêu đề, placeholder, mô tả tiện ích, thống kê tuyển sinh và liên kết tuyển sinh.
  - Sau Đăng nhập (Sinh viên / Giảng viên): Chuyển đổi mượt mà toàn bộ thanh điều hướng, cảnh báo nợ học phí, bảng kê học phí VietQR, và khung chương trình đào tạo 4 năm.

### 9. 📚 Quản Lý Nghiệp Vụ Đào Tạo Hoàn Chỉnh
- Quản lý Sinh viên, bật/tắt nợ học phí (`toggle-tuition`).
- Quản lý Bảng điểm, tự động tính GPA hệ 10 và hệ 4 theo thang điểm tín chỉ Việt Nam.
- Khóa mốc học kỳ đa tầng (trước thi, trước ĐKHP, tạm thời chấm thi).
- Quản lý Lớp học phần, điều chỉnh lịch học / phòng học / báo nghỉ bù.

---

## 🏛️ Bảng Mã Trường & Quy Ước Mã Sinh Viên

| STT | Trường Đại Học | Mã Trường | Quy Ước Mã Sinh Viên | Điểm Chuẩn Tham Chiếu |
|---|---|---|---|---|
| 1 | **ĐH Bách Khoa (DUT)** | `10011` | `100110`, `100111`, `100112`... | 27.00 – 29.10đ |
| 2 | **ĐH Duy Tân (DTU)** | `10012` | `100120`, `100121`, `100122`... | 18.00 – 22.50đ |
| 3 | **ĐH FPT Đà Nẵng (FPT)** | `10013` | `100130`, `100131`, `100132`... | 21.00 – 24.50đ |
| 4 | **ĐH Đông Á (UDA)** | `10014` | `100140`, `100141`, `100142`... | 18.00 – 20.50đ |
| 5 | **ĐH Sư phạm (UED)** | `10015` | `100150`, `100151`, `100152`... | 22.00 – 26.50đ |
| 6 | **ĐH CNTT & TT Việt - Hàn (VKU)** | `10016` | `100160`, `100161`, `100162`... | 22.50 – 25.25đ |
| 7 | **ĐH Y Dược Đà Nẵng (UMP)** | `10017` | `100170`, `100171`, `100172`... | 21.00 – 26.50đ |
| 8 | **ĐH Kinh tế (DUE)** | `10018` | `100180`, `100181`, `100182`... | 24.50 – 26.25đ |
| 9 | **ĐH Kiến trúc Đà Nẵng (DAU)** | `10019` | `100190`, `100191`, `100192`... | 19.00 – 23.50đ |
| 10 | **ĐH Ngoại ngữ (UFLS)** | `10020` | `100200`, `100201`, `100202`... | 24.00 – 26.50đ |
| 11 | **ĐH Sư phạm Kỹ thuật (UTE)** | `10021` | `100210`, `100211`, `100212`... | 22.50 – 24.50đ |

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

### 3. Sinh viên mẫu đã được bổ sung đầy đủ thông tin
| Mã số SV | Họ và tên | Ngày sinh | Giới tính | Khoa / Ngành | Trường | GPA | Cổng đăng nhập |
|---|---|---|---|---|---|---|---|
| `100011` | Nguyễn Văn Nam | 15/03/2004 | Nam | CNTT | ĐH Bách Khoa | 3.42 | Port 8000 (`/review/`) |
| `100012` | Trần Thị Mai | 22/07/2004 | Nữ | CNTT | ĐH Bách Khoa | 3.65 | Port 8000 (`/review/`) |
| `100013` | Lê Bình | 05/11/2004 | Nam | Kỹ thuật Phần mềm | ĐH Bách Khoa | 3.15 | Port 8000 (`/review/`) |
| `100021` | Phạm Tuấn | 19/05/2003 | Nam | QTKD | ĐH Kinh tế | 3.30 | Port 8000 (`/review/`) |
| `100041` | Hoàng Quyên | 30/09/2004 | Nữ | Ngôn ngữ Anh | ĐH Ngoại ngữ | 3.55 | Port 8000 (`/review/`) |
| `100015` | USER_002 | 02/02/2004 | Nam | Hệ thống Thông tin | ĐH Bách Khoa | 3.20 | Port 8000 (`/review/`) |
| `testreg1233` | Test User1 | 01/01/2003 | Nam | CNTT | ĐH Bách Khoa | 3.00 | Port 8000 (`/review/`) |

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
```powershell
cp .env.example .env
```
*(Điền cấu hình SMTP Gmail và Database nếu cần tùy chỉnh)*

### Bước 3: Cài đặt thư viện & Migrate
```powershell
pip install -r requirements.txt
python manage.py migrate
```

### Bước 4: Nạp dữ liệu ban đầu & Làm giàu thông tin
```powershell
python scripts/seed_db.py
python scripts/seed_enrich_data.py
```

### Bước 5: Khởi chạy Máy chủ

#### Cổng 1: Máy chủ Người dùng công khai & Xét tuyển (Port 8000)
```powershell
python manage.py runserver 127.0.0.1:8000
```
- **Cổng Xét Nguyện Vọng Tuyển Sinh:** [http://127.0.0.1:8000/admission/](http://127.0.0.1:8000/admission/)
- **Cổng Đăng Nhập Người Dùng (SV / GV):** [http://127.0.0.1:8000/review/](http://127.0.0.1:8000/review/)
- **Dashboard Sinh Viên & Đào Tạo:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

#### Cổng 2: Máy chủ Quản trị viên Cục bộ (Admin Control Panel - Port 9000)
```powershell
python manage.py run_admin_server 9000
```
- **Cổng Đăng nhập Quản trị:** [http://127.0.0.1:9000/admin/login/](http://127.0.0.1:9000/admin/login/)
- **Dashboard Quản trị:** [http://127.0.0.1:9000/admin/dashboard/](http://127.0.0.1:9000/admin/dashboard/)

---

## 🧪 Kiểm Thử Hệ Thống (Unit & Integration Tests)

### 1. Kiểm thử Toàn bộ Phân quyền & Bảo mật (45 Tests)
```powershell
python manage.py test student_management
```
- **Kết quả:** `Ran 45 tests — OK (100% Pass Rate)`

### 2. Kiểm thử Tích hợp Tuyển Sinh & Đổi Mật Khẩu (Phase 3 End-to-End)
```powershell
python scripts/test_phase3_flow.py
```
- **Kết quả:** `TẤT CẢ 8 BƯỚC KIỂM THỬ ĐỀU THÀNH CÔNG 100%!`

---

## 🏗 Cấu Trúc Thư Mục Dự Án

```
📁 24CT1-DO_NGUYEN_HAO/
├── 📁 core/                          ⚙️ Cấu hình Django Project
│   ├── settings.py                   # Cấu hình MSSQL, SMTP Gmail, Security Middleware, Trusted Hosts
│   ├── urls.py                       # Root URL Routing
│   └── wsgi.py / asgi.py
│
├── 📁 student_management/            🗄️ Backend Core App
│   ├── models.py                     # 12 models (User, Student, Teacher, University, AdmissionApplication...)
│   ├── admission_service.py          # Nghiệp vụ xét tuyển, tra điểm chuẩn, sinh mã SV & mật khẩu
│   ├── email_service.py              # Dịch vụ gửi Gmail OTP và thông báo trúng tuyển
│   ├── middleware.py                 # GlobalAudit, LocalOnlyAdmin, SingleSession
│   ├── decorators.py                 # @require_session, @require_role, @audit_log, @rate_limit
│   ├── security_utils.py             # Tiện ích băm log SHA-256, kiểm tra IP tin cậy
│   ├── tests.py                      # 36 Unit Tests nghiệp vụ & phân quyền
│   ├── tests_security.py             # 9 Unit Tests chuyên sâu về bảo mật
│   ├── urls.py                       # Routing toàn bộ API endpoints
│   ├── 📁 management/commands/       # Quản lý lệnh tùy chỉnh
│   │   ├── run_admin_server.py       # Lệnh chạy máy chủ Admin riêng (Port 9000)
│   │   └── purge_ghost_accounts.py   # Lệnh dọn dẹp tài khoản ma theo chu kỳ
│   │
│   └── 📁 views/                     📦 Phân vùng Modules sạch theo vai trò
│       ├── 📁 admission/             # Cổng xét tuyển: render trang, apply, verify-otp, tra cứu CCCD
│       ├── 📁 user/                  # Dùng chung: auth (login, register, change-password), sync, ai, pages
│       ├── 📁 student/               # Tác vụ riêng sinh viên: profile, học phí cá nhân
│       ├── 📁 teacher/               # Tác vụ riêng giảng viên: attendance, điểm danh
│       └── 📁 admin/                 # Quản trị viên: dashboard, admissions, academic, audit logs
│
├── 📁 static/                        🌐 Frontend Vanilla JS SPA
│   ├── 📁 css/                       # main.css, mobile.css, review.css, admission.css
│   ├── 📁 js/core/                   # Engine: app, auth, crypto (AES-256), database, sync-queue
│   └── 📁 js/views/                  # Các views: public (admission.js), admin, common, student
│
├── 📁 templates/                     📄 Giao diện HTML
│   ├── admission.html                # Cổng Xét Nguyện Vọng Đại Học
│   ├── review.html                   # Cổng xác thực người dùng (SV / GV)
│   ├── index.html                    # Khung ứng dụng chính
│   └── 📁 admin/                     # Giao diện Quản trị viên
│       ├── login.html                # Đăng nhập Admin Control Panel
│       └── dashboard.html            # Cyber-Office Dashboard & Quản lý Xét tuyển
│
├── 📁 scripts/                       🔧 Scripts tiện ích & Kiểm thử
│   ├── seed_db.py                    # Nạp dữ liệu mẫu ban đầu
│   ├── seed_enrich_data.py           # Nạp mã số 11 trường & bổ sung đầy đủ hồ sơ SV
│   ├── seed_academic_data.py         # Nạp dữ liệu học vụ (CourseClass, Grade) chống tài khoản ma
│   ├── test_phase3_flow.py           # Test tích hợp luồng xét tuyển, sinh mã & đổi pass
│   ├── apply_mssql_hardening.py      # Thiết lập bảo mật MSSQL
│   └── deploy_ngrok.ps1              # Triển khai nhanh qua Ngrok Tunnel
│
├── 📁 docs/                          📚 Tài liệu & Sơ đồ hệ thống
│   ├── DiagramGit.md                 # Biểu đồ tuần tự (Sequence Diagrams) chi tiết từng chức năng
│   ├── Mermaid.md                    # Sơ đồ quan hệ thực thể (ERD) và Kiến trúc hệ thống
│   ├── Diagram.md                    # Báo cáo phân tích và sơ đồ Use Case
│   └── ActivityDiagram.md            # Sơ đồ luồng hoạt động
│
├── .env                              🔒 File cấu hình môi trường thực tế
├── .env.example                      📋 File mẫu biến môi trường
├── requirements.txt                  📦 Thư viện Python phụ thuộc
└── README.md                         📖 Hướng dẫn toàn diện UniMS
```

---

*UniMS — Hệ thống Quản lý Đại học Toàn diện, Độc lập và Tự chủ.*
