param ()

$projectRoot = Join-Path $PSScriptRoot ".."
Set-Location $projectRoot

$venvPath = Join-Path $projectRoot "venv\Scripts\Activate.ps1"
if (Test-Path $venvPath) {
    . $venvPath
    Write-Host "[+] Đã kích hoạt virtual environment." -ForegroundColor Green
} else {
    Write-Host "[!] Cảnh báo: Không tìm thấy venv tại $venvPath" -ForegroundColor Yellow
}

Write-Host "[*] Đang chạy seed_db.py..." -ForegroundColor Cyan
python scripts/seed_db.py
