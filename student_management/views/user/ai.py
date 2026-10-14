"""
student_management/views/user/ai.py
Server-side AI Gateway cho UniMS AI Assistant.
BẢO MẬT:
- API Key (GEMINI_API_KEY) được lưu giữ bí mật trên máy chủ (file .env), không bao giờ gửi về client.
- Bắt buộc xác thực người dùng qua session token (@require_session).
- Rate limit 25 câu hỏi/phút (@rate_limit) và ghi log truy cập (@audit_log).
- Tự động bổ sung ngữ cảnh học vụ cá nhân hóa (Personalized Academic Context).
"""
import os
import json
import logging
import urllib.request
import urllib.error
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from student_management.decorators import require_session, rate_limit, audit_log
from student_management.models import Student, Teacher, CourseClass, Registration, Grade

logger = logging.getLogger(__name__)

# Bộ quy tắc tri thức học vụ dự phòng (Offline Knowledge Base)
OFFLINE_KB = [
    {
        'keywords': ['tuyển sinh', 'xét tuyển', 'điểm chuẩn', 'chỉ tiêu', 'nguyện vọng', 'hồ sơ'],
        'reply': 'Các trường đại học thành viên xét tuyển theo 4 phương thức chính: Điểm thi THPT, Xét học bạ, Tuyển thẳng và Đánh giá năng lực. Chi tiết xem tại cổng tuyển sinh của trường.'
    },
    {
        'keywords': ['học phí', 'lệ phí', 'tiền học', 'đóng tiền'],
        'reply': 'Học phí được tính theo số tín chỉ đăng ký nhân với đơn giá tín chỉ của trường. Thông thường hạn thanh toán là 30 ngày sau khi đăng ký học phần.'
    },
    {
        'keywords': ['học bổng', 'trợ cấp', 'miễn giảm'],
        'reply': 'Trường có học bổng khuyến khích học tập dựa trên điểm GPA cuối kỳ, cùng các gói học bổng doanh nghiệp và hỗ trợ vay vốn sinh viên lãi suất 0%.'
    },
    {
        'keywords': ['đăng ký', 'đkhp', 'tín chỉ', 'lớp học phần', 'môn học'],
        'reply': 'Sinh viên đăng ký học phần tại menu "Đăng ký môn học". Trung bình mỗi học kỳ tích lũy từ 14 đến 22 tín chỉ.'
    },
    {
        'keywords': ['cơ cấu điểm', 'tính điểm', 'thang điểm', 'xếp loại', 'thi lại'],
        'reply': 'Cơ cấu điểm học phần gồm: Chuyên cần (20%), Giữa kì (30%) và Cuối kì (50%). Điểm tổng kết quy đổi sang thang điểm 4 và xếp loại A, B+, B, C+, C, D+, D, F.'
    },
    {
        'keywords': ['lịch học', 'thời khóa biểu', 'phòng học'],
        'reply': 'Thời khóa biểu chi tiết có thể xem tại tab "Lớp học" hoặc widget lịch học tại trang Tổng quan (Dashboard).'
    },
    {
        'keywords': ['hỗ trợ', 'helpdesk', 'báo lỗi', 'sự cố'],
        'reply': 'Nếu gặp sự cố kỹ thuật hoặc cần hỗ trợ học vụ, vui lòng tạo phiếu hỗ trợ tại mục "Hỗ trợ" (Help Desk) ở thanh điều hướng bên trái.'
    },
]


def _build_user_context(user):
    """Trích xuất ngữ cảnh học vụ thực tế của người dùng hiện tại."""
    context_lines = []
    context_lines.append(f"Người dùng hiện tại: {user.first_name or user.username} (Vai trò: {user.role}).")

    if user.role == 'student':
        try:
            student = getattr(user, 'student_profile', None)
            if student:
                context_lines.append(
                    f"Mã sinh viên: {student.student_id}, Khoa/Ngành: {student.department}, "
                    f"GPA thang 4: {student.gpa}, GPA thang 10: {student.gpa10}, "
                    f"Tình trạng nợ học phí: {'Đang nợ học phí' if student.tuition_debt else 'Không nợ học phí'}."
                )
                # Lấy danh sách môn đã đăng ký
                regs = Registration.objects.filter(student=student).select_related('course_class')
                class_names = [r.course_class.name for r in regs[:5]]
                if class_names:
                    context_lines.append(f"Các lớp đang học: {', '.join(class_names)}.")
        except Exception as e:
            logger.debug("Error building student context: %s", e)

    elif user.role == 'teacher':
        try:
            teacher = getattr(user, 'teacher_profile', None)
            if teacher:
                classes = CourseClass.objects.filter(teacher=teacher)
                context_lines.append(f"Giảng viên phụ trách {classes.count()} lớp học phần.")
        except Exception as e:
            logger.debug("Error building teacher context: %s", e)

    return " ".join(context_lines)


def _get_offline_reply(user_message, user=None):
    """
    Trả lời từ ngữ cảnh thực tế của người dùng kết hợp kho tri thức nội bộ.
    Giúp trợ lý trả lời được các câu hỏi về bản thân học sinh (GPA, nợ, lớp học)
    kể cả khi không có kết nối internet hoặc chưa thiết lập GEMINI_API_KEY.
    """
    lower_msg = user_message.lower()

    # 1. Trả lời câu hỏi cá nhân hóa cho sinh viên
    if user and user.role == 'student':
        try:
            student = getattr(user, 'student_profile', None)
            if student:
                # Hỏi về GPA / Điểm số
                if any(kw in lower_msg for kw in ['gpa', 'điểm của tôi', 'điểm tb', 'điểm trung bình', 'kết quả học tập']):
                    return (
                        f"📊 Thông tin học tập của bạn ({student.name} - MSSV: {student.student_id}):\n"
                        f"• Điểm GPA (Hệ 4): {student.gpa:.2f}\n"
                        f"• Điểm GPA (Hệ 10): {student.gpa10:.2f}\n"
                        f"Bạn có thể vào mục 'Bảng điểm' để xem chi tiết từng môn."
                    )
                # Hỏi về nợ học phí / tiền học
                if any(kw in lower_msg for kw in ['nợ', 'còn nợ', 'đã đóng', 'học phí của tôi']):
                    if student.tuition_debt:
                        return (
                            f"⚠️ Bạn hiện ĐANG NỢ HỌC PHÍ. "
                            f"Vui lòng vào mục 'Học phí' trên thanh điều hướng để xem chi tiết số tiền và hướng dẫn thanh toán kịp thời."
                        )
                    else:
                        return f"✅ Bạn hiện KHÔNG NỢ HỌC PHÍ. Trạng thái học phí của bạn hoàn toàn hợp lệ."
                # Hỏi về các môn học / lớp học phần đang tham gia
                if any(kw in lower_msg for kw in ['lớp của tôi', 'môn của tôi', 'đang học gì', 'môn đã đăng ký', 'lớp đang học']):
                    regs = Registration.objects.filter(student=student).select_related('course_class')
                    if regs.exists():
                        class_list = "\n".join([f"• {r.course_class.name} ({r.course_class.class_code or r.course_class.id[:6].upper()})" for r in regs[:5]])
                        return f"📚 Danh sách các lớp học phần bạn đang tham gia:\n{class_list}\nChi tiết xem tại tab 'Lớp học'."
                    else:
                        return "Bạn hiện chưa đăng ký lớp học phần nào trong học kỳ này. Hãy vào mục 'Đăng ký học phần' để chọn môn."
                # Hỏi về mã sinh viên / thông tin cá nhân
                if any(kw in lower_msg for kw in ['mã số', 'mssv', 'mã sinh viên', 'thông tin của tôi']):
                    return (
                        f"👤 Thông tin sinh viên:\n"
                        f"• Họ và tên: {student.name}\n"
                        f"• Mã sinh viên: {student.student_id}\n"
                        f"• Khoa: {student.department}\n"
                        f"• Tình trạng: {student.status}"
                    )
        except Exception as e:
            logger.debug("Error in offline personalized reply: %s", e)

    # 2. Trả lời theo bộ tri thức chung
    for item in OFFLINE_KB:
        if any(kw in lower_msg for kw in item['keywords']):
            return item['reply']

    return (
        "Chào bạn! Tôi là trợ lý học vụ thông minh của UniMS. Tôi có thể hỗ trợ bạn tra cứu:\n"
        "• Điểm GPA và kết quả học tập của bạn\n"
        "• Tình trạng nợ học phí và hạn đóng\n"
        "• Danh sách lớp học phần đang tham gia\n"
        "• Quy chế tuyển sinh, học bổng và quy trình hỗ trợ.\n"
        "Bạn cần tìm hiểu thông tin nào?"
    )


@csrf_exempt
@require_session
@rate_limit(max_requests=25, window_seconds=60)
@audit_log
def api_ai_chat(request):
    """
    POST: /api/ai/chat/
    Body: { "message": "Câu hỏi của người dùng" }
    Trả về: { "success": true, "reply": "...", "provider": "gemini"|"offline" }
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Chỉ chấp nhận phương thức POST'}, status=405)

    try:
        data = json.loads(request.body)
        user_message = data.get('message', '').strip()
        if not user_message:
            return JsonResponse({'success': False, 'error': 'Nội dung tin nhắn không được để trống'}, status=400)

        user = request.session_user
        academic_context = _build_user_context(user)
        api_key = os.environ.get('GEMINI_API_KEY', '').strip()

        # Nếu có API Key máy chủ -> Gọi Google Gemini API
        if api_key:
            system_instruction = (
                "Bạn là UniMS AI Assistant - trợ lý thông minh của Hệ thống Quản lý Đại học UniMS. "
                "Hãy trả lời bằng tiếng Việt lịch sự, ngắn gọn, súc tích và chuẩn xác. "
                f"Thông tin thực tế của người dùng: {academic_context}."
            )
            prompt = f"{system_instruction}\n\nNgười dùng hỏi: {user_message}"

            # Thử model gemini-1.5-flash (chuẩn, ổn định)
            model_name = os.environ.get('GEMINI_MODEL', 'gemini-1.5-flash')
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }

            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )

            try:
                with urllib.request.urlopen(req, timeout=12) as resp:
                    resp_data = json.loads(resp.read().decode('utf-8'))
                    candidates = resp_data.get('candidates', [])
                    if candidates and 'content' in candidates[0]:
                        parts = candidates[0]['content'].get('parts', [])
                        if parts and 'text' in parts[0]:
                            return JsonResponse({
                                'success': True,
                                'reply': parts[0]['text'],
                                'provider': 'gemini'
                            })
            except urllib.error.HTTPError as http_err:
                logger.warning("Gemini API HTTP Error %s: %s", http_err.code, http_err.reason)
            except Exception as e:
                logger.warning("Gemini API Connection Error: %s", str(e))

        # Fallback về bộ tri thức học vụ cá nhân hóa nội bộ
        offline_reply = _get_offline_reply(user_message, user)
        return JsonResponse({
            'success': True,
            'reply': offline_reply,
            'provider': 'offline_context' if user.role == 'student' else 'offline_kb'
        })

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Định dạng JSON không hợp lệ'}, status=400)
    except Exception as e:
        logger.error("api_ai_chat unexpected error: %s", str(e))
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

