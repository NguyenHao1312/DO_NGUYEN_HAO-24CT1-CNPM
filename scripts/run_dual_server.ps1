# scripts/run_dual_server.ps1
# Chay song song 2 server tren VS Code:
#   - User Portal: http://127.0.0.1:8000/review/
#   - Admin Portal: http://127.0.0.1:9000/admin/login/

$ErrorActionPreference = "Stop"
$WorkspaceRoot = Split-Path -Parent $PSScriptRoot
Set-Location $WorkspaceRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         UniMS - KHOI CHAY HE THONG SONG SONG (DUAL SERVER) " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

$PythonExe = Join-Path $WorkspaceRoot "venv\Scripts\python.exe"
if (-not (Test-Path $PythonExe)) {
    Write-Host "[!] Khong tim thay Python venv tai $PythonExe" -ForegroundColor Red
    exit 1
}

Write-Host "[+] Dang kiem tra ket noi Microsoft SQL Server (unims_db)..." -ForegroundColor Gray
$CheckDb = & $PythonExe -c "import django; django.setup(); from student_management.models import CustomUser; print(CustomUser.objects.count())" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] Khong the ket noi SQL Server. Hay dam bao dich vu MSSQL dang chay." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Ket noi SQL Server thanh cong ($CheckDb nguoi dung)." -ForegroundColor Green

Write-Host ""
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  1. USER PORTAL (Sinh vien / Giang vien):" -ForegroundColor White
Write-Host "     URL: http://127.0.0.1:8000/review/" -ForegroundColor Cyan
Write-Host "  2. ADMIN PORTAL (Cuc bo - Quan tri vien):" -ForegroundColor White
Write-Host "     URL: http://127.0.0.1:9000/admin/login/" -ForegroundColor Yellow
Write-Host "     Tai khoan mac dinh: admin | Mat khau: 123" -ForegroundColor Gray
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# Khoi chay Admin Server tren port 9000 trong background process
Write-Host "[*] Dang khoi dong Admin Server tren cong 9000..." -ForegroundColor Yellow
$AdminProcess = Start-Process -FilePath $PythonExe `
    -ArgumentList "manage.py run_admin_server --port 9000" `
    -WorkingDirectory $WorkspaceRoot `
    -PassThru `
    -WindowStyle Hidden

Write-Host "[OK] Admin Server da chay (PID: $($AdminProcess.Id)) tai http://127.0.0.1:9000/admin/login/" -ForegroundColor Green
Write-Host "[*] Dang khoi dong User Server tren cong 8000..." -ForegroundColor Cyan
Write-Host "    (Nhan Ctrl+C de dung ca 2 server bat cu luc nao)" -ForegroundColor DarkGray
Write-Host ""

try {
    # Chay User Server o foreground
    & $PythonExe manage.py runserver 8000
}
finally {
    Write-Host ""
    Write-Host "[*] Dang dung Admin Server (PID: $($AdminProcess.Id))..." -ForegroundColor Yellow
    if ($AdminProcess -and -not $AdminProcess.HasExited) {
        Stop-Process -Id $AdminProcess.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "[OK] Da dung tat ca he thong an toan." -ForegroundColor Green
}
