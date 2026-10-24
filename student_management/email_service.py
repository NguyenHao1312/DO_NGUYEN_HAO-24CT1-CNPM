"""
student_management/email_service.py
Dịch vụ gửi email thông báo qua Gmail SMTP:
- Gửi mã OTP 6 số xác thực Gmail
- Gửi thông báo trúng tuyển kèm Mã Sinh Viên & Mật khẩu khởi tạo
"""
import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

def send_otp_email(to_email: str, otp_code: str, candidate_name: str) -> bool:
    """
    Gửi mã OTP 6 chữ số đến Gmail của thí sinh để xác minh email.
    """
    subject = f"[{otp_code}] Mã xác thực đăng ký xét nguyện vọng - UniMS"
    
    html_message = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #1e3a8a; margin: 0; font-size: 24px;">CỔNG XÉT TUYỂN ĐẠI HỌC TRỰC TUYẾN</h2>
            <p style="color: #64748b; margin-top: 6px; font-size: 14px;">Hệ thống Quản lý Giáo dục UniMS</p>
        </div>
        <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #2563eb;">
            <p style="margin: 0 0 12px 0; font-size: 15px; color: #1e293b;">Kính gửi thí sinh <strong>{candidate_name}</strong>,</p>
            <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                Bạn đang thực hiện đăng ký xét nguyện vọng trên Cổng tuyển sinh UniMS. Dưới đây là mã xác thực Gmail của bạn:
            </p>
            <div style="text-align: center; margin: 24px 0;">
                <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1d4ed8; background: #e0e7ff; padding: 12px 28px; border-radius: 8px; border: 1px dashed #3b82f6;">
                    {otp_code}
                </span>
            </div>
            <p style="margin: 0; font-size: 13px; color: #64748b; text-align: center;">
                Mã xác thực có hiệu lực trong <strong>10 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.
            </p>
        </div>
        <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            Email này được gửi tự động từ hệ thống UniMS. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email.
        </div>
    </div>
    """
    
    plain_message = f"Kính gửi {candidate_name}, Mã xác thực OTP xét nguyện vọng của bạn là: {otp_code}. Mã có hiệu lực trong 10 phút."
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Đã gửi OTP thành công tới: {to_email}")
        return True
    except Exception as e:
        logger.error(f"Lỗi khi gửi OTP qua Gmail ({to_email}): {e}")
        # In debug mode or if SMTP is blocked by Google App Password, log OTP to console for testing
        print(f"[UniMS EMAIL OTP FALLBACK] To: {to_email} | OTP: {otp_code} | Error: {e}")
        return False


def send_admission_success_email(to_email: str, candidate_name: str, university_name: str, department_name: str, student_id: str, temp_password: str, login_url: str) -> bool:
    """
    Gửi email thông báo TRÚNG TUYỂN kèm Mã số sinh viên và Mật khẩu khởi tạo.
    """
    subject = f"🎉 CHÚC MỪNG TRÚNG TUYỂN — Cấp Mã Sinh Viên & Mật khẩu ({university_name})"
    
    html_message = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #cbd5e1; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
            <span style="background-color: #dcfce7; color: #166534; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 20px; display: inline-block; margin-bottom: 8px;">
                ✓ THÔNG BÁO CHÍNH THỨC
            </span>
            <h2 style="color: #0f172a; margin: 0; font-size: 22px;">CHÚC MỪNG BẠN ĐÃ TRÚNG TUYỂN!</h2>
            <p style="color: #475569; margin-top: 4px; font-size: 14px;">Trường: <strong>{university_name}</strong></p>
        </div>

        <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
            <p style="margin: 0 0 12px 0; font-size: 15px; color: #1e293b;">
                Chào mừng tân sinh viên <strong>{candidate_name}</strong>!
            </p>
            <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
                Hồ sơ xét tuyển của bạn vào ngành <strong>{department_name}</strong> đã đủ điều kiện trúng tuyển. Hệ thống quản lý trường đã khởi tạo thành công tài khoản sinh viên của bạn:
            </p>

            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #ffffff; border-radius: 6px; overflow: hidden; border: 1px solid #e2e8f0;">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 12px 16px; font-size: 14px; color: #64748b; width: 40%;">Mã Sinh Viên (Tài khoản):</td>
                    <td style="padding: 12px 16px; font-size: 16px; font-weight: 800; color: #2563eb;">{student_id}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 16px; font-size: 14px; color: #64748b;">Mật khẩu tạm thời:</td>
                    <td style="padding: 12px 16px; font-size: 16px; font-weight: 700; color: #dc2626; font-family: monospace;">{temp_password}</td>
                </tr>
            </table>

            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px 16px; margin-top: 16px;">
                <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.5;">
                    ⚠️ <strong>Lưu ý bảo mật:</strong> Để đảm bảo an toàn, khi đăng nhập lần đầu tiên hệ thống sẽ yêu cầu bạn <strong>"Hãy đổi lại mật khẩu để tránh mất thông tin"</strong>.
                </p>
            </div>
        </div>

        <div style="text-align: center; margin: 24px 0;">
            <a href="{login_url}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
                Đăng Nhập Cổng Sinh Viên
            </a>
        </div>

        <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            UniMS — Hệ thống Quản trị Đại học Doanh nghiệp.<br>Mọi thắc mắc vui lòng liên hệ phòng Đào tạo trường {university_name}.
        </div>
    </div>
    """

    plain_message = f"""
    CHÚC MỪNG BẠN ĐÃ TRÚNG TUYỂN vào {university_name} - Ngành {department_name}!
    Mã sinh viên của bạn: {student_id}
    Mật khẩu tạm thời: {temp_password}
    Link đăng nhập: {login_url}
    Lưu ý: Hãy đổi lại mật khẩu ngay khi đăng nhập để tránh mất thông tin!
    """

    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Đã gửi email trúng tuyển thành công tới: {to_email}")
        return True
    except Exception as e:
        logger.error(f"Lỗi khi gửi email trúng tuyển ({to_email}): {e}")
        print(f"[UniMS ADMISSION SUCCESS EMAIL FALLBACK] To: {to_email} | StudentID: {student_id} | Pass: {temp_password} | Error: {e}")
        return False
