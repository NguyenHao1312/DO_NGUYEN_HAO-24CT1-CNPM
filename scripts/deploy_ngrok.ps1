param ()

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Khởi chạy Django qua Ngrok (UniMS)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Kiểm tra ngrok
if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Host "[!] Không tìm thấy Ngrok trong PATH. Vui lòng cài đặt ngrok." -ForegroundColor Red
    exit 1
}

# Kiểm tra SQL Server (tùy chọn)
$sqlService = Get-Service -Name "MSSQL`$SQLEXPRESS" -ErrorAction SilentlyContinue
if ($null -ne $sqlService -and $sqlService.Status -ne 'Running') {
    Write-Host "[!] Cảnh báo: SQL Server chưa chạy!" -ForegroundColor Yellow
}

# Kích hoạt venv
$venvPath = Join-Path $PSScriptRoot "..\venv\Scripts\Activate.ps1"
if (Test-Path $venvPath) {
    . $venvPath
    Write-Host "[+] Đã kích hoạt virtual environment." -ForegroundColor Green
} else {
    Write-Host "[!] Cảnh báo: Không tìm thấy venv tại $venvPath" -ForegroundColor Yellow
}

# Đặt biến môi trường cho Ngrok
$env:DJANGO_ALLOWED_HOSTS = "localhost,127.0.0.1,*.ngrok-free.app"

# Chạy collectstatic
Write-Host "[*] Đang chạy collectstatic..." -ForegroundColor Cyan
python (Join-Path $PSScriptRoot "..\manage.py") collectstatic --noinput

# Khởi chạy Django
Write-Host "[*] Khởi chạy Django server ở nền..." -ForegroundColor Cyan
$djangoJob = Start-Job -ScriptBlock {
    param($scriptRoot)
    cd (Join-Path $scriptRoot "..")
    if (Test-Path "venv\Scripts\Activate.ps1") { . "venv\Scripts\Activate.ps1" }
    $env:DJANGO_ALLOWED_HOSTS = "localhost,127.0.0.1,*.ngrok-free.app"
    python manage.py runserver 0.0.0.0:8000
} -ArgumentList $PSScriptRoot

Write-Host "[*] Chờ 3 giây để Django khởi động..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# Kiểm tra nếu job thất bại
if ($djangoJob.State -eq 'Failed') {
    Write-Host "[!] Django server không thể khởi động!" -ForegroundColor Red
    Receive-Job $djangoJob
    exit 1
}

# Chạy ngrok
Write-Host "[*] Khởi chạy Ngrok trên port 8000..." -ForegroundColor Cyan
try {
    ngrok http 8000
} finally {
    Write-Host "[*] Đang dọn dẹp Django server..." -ForegroundColor Cyan
    Stop-Job $djangoJob
    Remove-Job $djangoJob
    Write-Host "[+] Hoàn tất dọn dẹp." -ForegroundColor Green
}
