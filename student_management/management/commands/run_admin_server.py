"""
Admin Management Server — Chạy trên port riêng (mặc định 9000).
Cung cấp dashboard quản trị: Audit Log, User Management, System Health.
Chỉ admin mới được phép truy cập.

Cách dùng:
  python manage.py run_admin_server           → chạy trên port 9000
  python manage.py run_admin_server --port 8888  → port tuỳ chỉnh
"""
from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Khởi chạy Admin Management Server trên port riêng (mặc định 9000)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--port', type=int, default=9000,
            help='Port cho Admin Server (mặc định: 9000)'
        )
        parser.add_argument(
            '--host', type=str, default='127.0.0.1',
            help='Host bind (mặc định: 127.0.0.1 — chỉ local)'
        )

    def handle(self, *args, **options):
        port = options['port']
        host = options['host']

        self.stdout.write(self.style.SUCCESS(
            f'\n'
            f'╔══════════════════════════════════════════╗\n'
            f'║    UniMS Admin Management Server         ║\n'
            f'║    http://{host}:{port}/admin/           ║\n'
            f'║    http://{host}:{port}/admin/dashboard/ ║\n'
            f'╚══════════════════════════════════════════╝\n'
        ))
        self.stdout.write(self.style.WARNING(
            '⚠ Server này CHỈ dành cho Admin. Không expose ra internet!\n'
        ))

        # Chạy Django dev server trên port admin
        call_command('runserver', f'{host}:{port}')
