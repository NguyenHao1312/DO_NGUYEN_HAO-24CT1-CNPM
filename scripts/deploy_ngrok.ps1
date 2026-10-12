param ()

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   UniMS - Khởi Chạy Song Song: Local Admin & Public Tunnel" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Kiểm tra ngrok
if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Host "[!] Không tìm thấy Ngrok trong PATH. Vui lòng cài đặt ngrok hoặc kiểm tra môi trường." -ForegroundColor Red
    exit 1
}

# 2. Kiểm tra dịch vụ SQL Server
$sqlService = Get-Service -Name "MSSQL`$SQLEXPRESS" -ErrorAction SilentlyContinue
if ($null -ne $sqlService) {
    if ($sqlService.Status -ne 'Running') {
        Write-Host "[!] Cảnh báo: Dịch vụ SQL Server (SQLEXPRESS) đang dừng. Đang cố khởi động..." -ForegroundColor Yellow
        Start-Service -Name "MSSQL`$SQLEXPRESS" -ErrorAction SilentlyContinue
    } else {
        Write-Host "[+] Dịch vụ Microsoft SQL Server đang hoạt động tốt." -ForegroundColor Green
    }
}

# 3. Kích hoạt venv
$venvPath = Join-Path $PSScriptRoot "..\venv\Scripts\Activate.ps1"
if (Test-Path $venvPath) {
    . $venvPath
    Write-Host "[+] Đã kích hoạt môi trường ảo Python (venv)." -ForegroundColor Green
} else {
    Write-Host "[!] Cảnh báo: Không tìm thấy venv tại $venvPath" -ForegroundColor Yellow
}

# 4. Đặt biến môi trường chuẩn hóa
$env:DJANGO_ALLOWED_HOSTS = "localhost,127.0.0.1,.ngrok-free.app,.ngrok.io"

# 5. Thu thập file tĩnh nếu cần
Write-Host "[*] Kiểm tra file tĩnh..." -ForegroundColor Cyan
python (Join-Path $PSScriptRoot "..\manage.py") collectstatic --noinput

# 6. Khởi chạy Django Server nền
Write-Host "[*] Khởi chạy Django Server trên 0.0.0.0:8000..." -ForegroundColor Cyan
$djangoJob = Start-Job -ScriptBlock {
    param($scriptRoot)
    cd (Join-Path $scriptRoot "..")
    if (Test-Path "venv\Scripts\Activate.ps1") { . "venv\Scripts\Activate.ps1" }
    $env:DJANGO_ALLOWED_HOSTS = "localhost,127.0.0.1,.ngrok-free.app,.ngrok.io"
    python manage.py runserver 0.0.0.0:8000
} -ArgumentList $PSScriptRoot

Start-Sleep -Seconds 3

if ($djangoJob.State -eq 'Failed') {
    Write-Host "[!] Django server không thể khởi động!" -ForegroundColor Red
    Receive-Job $djangoJob
    exit 1
}

Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "✅ HỆ THỐNG ĐÃ SẴN SÀNG:" -ForegroundColor Green
Write-Host "  🔑 CỔNG ADMIN NỘI BỘ (Chỉ mở trên máy tính của bạn):" -ForegroundColor Yellow
Write-Host "     -> http://127.0.0.1:8000/admin/dashboard/" -ForegroundColor White
Write-Host "  🌐 CỔNG PUBLIC (Dành cho Sinh viên & Giảng viên):" -ForegroundColor Yellow
Write-Host "     -> Sẽ được hiển thị bên dưới bởi Ngrok Tunnel" -ForegroundColor White
Write-Host "     (Mọi nỗ lực truy cập /admin/ từ đường link Ngrok sẽ bị CHẶN 404)" -ForegroundColor DarkGray
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray

# 7. Khởi chạy Ngrok Tunnel
Write-Host "[*] Đang kết nối đường hầm Ngrok tới port 8000..." -ForegroundColor Cyan
try {
    ngrok http 8000
} finally {
    Write-Host "[*] Đang dừng Django server..." -ForegroundColor Cyan
    Stop-Job $djangoJob -ErrorAction SilentlyContinue
    Remove-Job $djangoJob -ErrorAction SilentlyContinue
    Write-Host "[+] Đã dọn dẹp và đóng máy chủ an toàn." -ForegroundColor Green
}
