# 🔧 Scripts Tiện Ích UniMS

Thư mục này chứa các scripts hỗ trợ trong quá trình phát triển, kiểm thử, chuẩn hóa dữ liệu và vận hành hệ thống UniMS.

---

## Danh Sách Scripts

### 1. `run_dual_server.ps1`
Script PowerShell khởi chạy đồng thời kiến trúc **Dual-Port**:
- **Port 8000**: Public Portal & Cổng xét tuyển trực tuyến (`/admission/`, `/review/`, `/api/*`).
- **Port 9000**: Admin Control Panel (`/admin/dashboard/`), bảo vệ bởi `LocalOnlyAdminMiddleware`.
- **Cách chạy**:
  ```powershell
  .\scripts\run_dual_server.ps1
  ```

### 2. `seed_enrich_data.py`
Script Python làm giàu và đồng bộ hóa toàn bộ dữ liệu trong SQL Server (SSMS) theo chuẩn Giai đoạn 3:
- Cập nhật mã trường dạng số (`university_code`): Bách Khoa `10011`, Duy Tân `10012`, FPT `10013`, ..., Sư phạm Kỹ thuật `10021`.
- Cập nhật đầy đủ dữ liệu không rỗng cho 7 sinh viên hiện có trong SSMS (`student_id` tuân thủ quy tắc `{university_code}0`..`{university_code}n`, email định dạng `@gmail.com`, họ tên, số điện thoại, GPA, trạng thái nợ học phí).
- Đồng bộ `CustomUser` tương ứng và đặt mật khẩu an toàn mặc định (`SinhVien@123`).
- **Cách chạy**:
  ```powershell
  python scripts/seed_enrich_data.py
  ```

### 3. `test_phase3_flow.py`
Bộ kịch bản kiểm thử tích hợp tự động (End-to-End Integration Test) chạy 8 bước kiểm thử toàn diện:
1. Kiểm tra cấu hình `university_code` của tất cả 11 trường đại học.
2. Kiểm tra định dạng dữ liệu và mã số của các sinh viên hiện có.
3. Nộp hồ sơ xét tuyển trực tuyến qua API `/api/admission/apply/`.
4. Tra cứu trạng thái hồ sơ theo số CCCD qua API `/api/admission/check-status/`.
5. Xác thực OTP qua API `/api/admission/verify-otp/`, kích hoạt tự động sinh mã SV, mật khẩu và lưu vào SSMS.
6. Đăng nhập vào cổng chính `/api/login/` và phát hiện cờ bắt buộc đổi mật khẩu `must_change_password=True`.
7. Thực hiện đổi mật khẩu bắt buộc qua API `/api/user/change-password/` và xác nhận mật khẩu đã cập nhật trong SSMS.
8. Đăng nhập lại với mật khẩu mới đã đổi thành công.
- **Cách chạy**:
  ```powershell
  python scripts/test_phase3_flow.py
  ```

### 4. `seed_db.py` & `run_seed.ps1`
Script tạo dữ liệu nền tảng ban đầu (Admin, University, Giáo viên, Sinh viên cơ bản).
- **Cách chạy**:
  ```powershell
  .\scripts\run_seed.ps1
  # hoặc
  python scripts/seed_db.py
  ```

### 5. `apply_mssql_hardening.py` & `harden_mssql_auditlog.sql`
Script Python và SQL áp dụng tối ưu hóa chỉ mục (Indexes) và cơ chế phân quyền bảo mật cho bảng `AuditLog` trên Microsoft SQL Server.
- **Cách chạy**:
  ```powershell
  python scripts/apply_mssql_hardening.py
  ```

### 6. `deploy_ngrok.ps1`
Script PowerShell dùng để mở port server ra Internet qua Ngrok nhằm phục vụ kiểm thử thiết bị di động hoặc chia sẻ bản demo.
- **Cách chạy**:
  ```powershell
  .\scripts\deploy_ngrok.ps1
  ```
