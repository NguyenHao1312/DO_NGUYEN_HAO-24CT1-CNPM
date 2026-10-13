"""
scripts/apply_mssql_hardening.py
Thực thi cấu hình an toàn trên Microsoft SQL Server cho UniMS:
- Tạo Anti-tampering Trigger chống DELETE/UPDATE trên student_management_auditlog.
- Kiểm tra tính bất biến của log bằng lệnh test.
"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection


def main():
    print("--- [1] Bắt đầu cấu hình WORM Trigger trên Microsoft SQL Server ---")
    with connection.cursor() as cursor:
        trigger_sql = """
        IF OBJECT_ID('trg_PreventAuditLogTamper', 'TR') IS NOT NULL
            DROP TRIGGER trg_PreventAuditLogTamper;
        """
        cursor.execute(trigger_sql)

        create_trigger = """
        CREATE TRIGGER trg_PreventAuditLogTamper
        ON student_management_auditlog
        FOR UPDATE, DELETE
        AS
        BEGIN
            SET NOCOUNT ON;
            IF EXISTS (SELECT 1 FROM deleted)
            BEGIN
                RAISERROR (
                    N'CẢNH BÁO BẢO MẬT: Bảng student_management_auditlog tuân thủ nguyên tắc WORM. Mọi hành vi sửa/xóa nhật ký đều bị chặn!',
                    16, 
                    1
                );
                ROLLBACK TRANSACTION;
                RETURN;
            END
        END;
        """
        cursor.execute(create_trigger)
        print("-> Đã tạo thành công Trigger: trg_PreventAuditLogTamper")

    print("\n--- [2] Kiểm thử tính toàn vẹn (Tamper Test) ---")
    with connection.cursor() as cursor:
        # Thử chèn 1 bản ghi test
        cursor.execute("""
            INSERT INTO student_management_auditlog 
            (role, endpoint, method, status_code, ip_address, execution_time_ms, is_suspicious, timestamp)
            VALUES ('system_test', '/api/security/test', 'GET', 200, '127.0.0.1', 1.0, 0, GETDATE());
        """)
        print("-> Chèn bản ghi Audit Log thành công.")

        # Lấy ID vừa tạo
        cursor.execute("SELECT TOP 1 id FROM student_management_auditlog WHERE role = 'system_test' ORDER BY id DESC")
        test_id = cursor.fetchone()[0]

        # Thử DELETE - phải bị Trigger ném lỗi!
        try:
            cursor.execute("DELETE FROM student_management_auditlog WHERE id = %s", [test_id])
            print("❌ LỖI: Trigger không chặn được lệnh DELETE!")
        except Exception as e:
            print(f"✅ THÀNH CÔNG: Lệnh DELETE đã bị Trigger chặn đứng với thông báo an toàn:\n   {e}")

    print("\n--- Hoàn tất cấu hình bảo vệ Database MSSQL ---")


if __name__ == '__main__':
    main()
