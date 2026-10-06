# 🔧 Scripts Tiện Ích UniMS

Thư mục này chứa các scripts hỗ trợ trong quá trình phát triển và triển khai dự án UniMS.

## Danh sách scripts

### 1. `deploy_ngrok.ps1`
Script PowerShell dùng để khởi chạy Django server và mở port qua Ngrok (rất tiện để test Webhook hoặc chia sẻ demo).
- **Cách chạy**: 
  ```powershell
  .\scripts\deploy_ngrok.ps1
  ```

### 2. `seed_db.py`
Script Python dùng để tạo dữ liệu mẫu (mock data) cho database, bao gồm Admin, University, Giáo viên và Sinh viên.
- **Cách chạy**: 
  Từ thư mục gốc của dự án:
  ```cmd
  cd d:\24CT1-DO_NGUYEN_HAO
  python scripts/seed_db.py
  ```

### 3. `run_seed.ps1`
Script PowerShell tự động thay đổi đường dẫn về thư mục gốc, kích hoạt môi trường ảo (venv) và chạy file `seed_db.py`.
- **Cách chạy**: 
  ```powershell
  .\scripts\run_seed.ps1
  ```
