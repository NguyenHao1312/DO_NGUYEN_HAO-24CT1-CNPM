"""
student_management/management/commands/purge_ghost_accounts.py
Lệnh CLI quản trị: Quét và dọn dẹp các tài khoản ma không hoạt động làm đầy database.
Cách dùng:
    python manage.py purge_ghost_accounts --dry-run
    python manage.py purge_ghost_accounts --days 30
"""
from django.core.management.base import BaseCommand
from student_management.account_lifecycle import detect_ghost_accounts, purge_ghost_accounts


class Command(BaseCommand):
    help = 'Quét và dọn dẹp các tài khoản ma / tài khoản rác (Ghost Accounts) không hoạt động.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Số ngày không hoạt động kể từ khi tạo tài khoản (mặc định: 30 ngày).'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Chỉ quét và hiển thị danh sách tài khoản ma, không thực hiện xóa.'
        )

    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']

        self.stdout.write(self.style.NOTICE(f"🔍 Bắt đầu quét tài khoản ma (ngưỡng: >= {days} ngày)..."))

        result = purge_ghost_accounts(days_inactive=days, dry_run=dry_run)

        if dry_run:
            ghosts = result['ghosts']
            self.stdout.write(self.style.WARNING(f"⚠️ [DRY-RUN] Phát hiện {len(ghosts)} tài khoản ma đủ điều kiện xóa:"))
            for g in ghosts:
                self.stdout.write(f"  - [ID {g['user_id']}] {g['username']} ({g['role']}): {g['reason_display']}")
            self.stdout.write(self.style.SUCCESS("Hoàn tất chế độ xem trước (Dữ liệu chưa bị xóa)."))
        else:
            deleted_count = result['deleted_count']
            self.stdout.write(self.style.SUCCESS(f"✅ Đã dọn dẹp thành công {deleted_count} tài khoản ma khỏi database!"))
