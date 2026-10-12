"""
student_management/views/ai.py
Server-side AI Gateway cho UniMS AI Assistant.
BẢO MẬT:
- API Key (GEMINI_API_KEY) được lưu giữ bí mật trên máy chủ (file .env), không bao giờ gửi về client.
- Bắt buộc xác thực người dùng qua session token (@require_session).
- Rate limit 20 câu hỏi/phút (@rate_limit) và ghi log truy cập (@audit_log).
- Tự động bổ sung ngữ cảnh học vụ cá nhân hóa (Personalized Academic Context).
"""
import os
import json
import urllib.request
import urllib.error
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from ..decorators import require_session, rate_limit, audit_log
from ..models import Student, Teacher, CourseClass, Registration, Grade


# Bộ quy tắc tri thức học vụ dự phòng (Offline Knowledge Base)
OFFLINE_KB = [
    {
        'keywords': ['tuyển sinh', 'xét tuyển', 'điểm chuẩn', 'chỉ tiêu', 'nguyện vọng', 'hồ sơ'],
        'reply': 'Các trường đại học thành viên xét tuyển theo 4 phương thức chính: Điểm thi THPT, Xét học bạ, Tuyển thẳng và Đánh giá năng lực. Chi tiết xem tại cổng tuyển sinh của trường.'
    },
    {
        'keywords': ['học phí', 'lệ phí', 'tiền học', 'nợ học phí', 'đóng tiền'],
        'reply': 'Học phí được tính theo số tín chỉ đăng ký nhân với đơn giá tín chỉ của trường. Sinh viên còn nợ học phí sẽ bị khóa chức năng xem điểm và đăng ký học phần mới.'
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
        'keywords': ['bảng điểm', 'điểm', 'gpa', 'xếp loại', 'thi lại'],
        'reply': 'Cơ cấu điểm học phần gồm: Chuyên cần (20%), Giữa kì (30%) và Cuối kì (50%). Điểm tổng kết quy đổi sang thang điểm 4 và xếp loại A, B+, B, C+, C, D+, D, F.'
    },
    {
        'keywords': ['lịch học', 'thời khóa biểu', 'phòng học'],
        'reply': 'Thời khóa biểu chi tiết có thể xem tại tab "Lớp học" hoặc widget lịch học tại trang Tổng quan (Dashboard).'
    },
    {
        'keywords': ['hỗ trợ', 'helpdesk', 'báo lỗi', 'sự cố'],
        'reply': 'Nếu gặp sự cố kỹ thuật hoặc cần hỗ trợ học vụ, vui lòng tạo phiếu hỗ trợ tại mục "Hỗ trợ" (Helpdesk) ở thanh điều hướng bên trái.'
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
        except Exception:
            pass

    elif user.role == 'teacher':
        try:
            teacher = getattr(user, 'teacher_profile', None)
            if teacher:
                classes = CourseClass.objects.filter(teacher=teacher)
                context_lines.append(f"Giảng viên phụ trách {classes.count()} lớp học phần.")
        except Exception:
            pass

    return " ".join(context_lines)


def _get_offline_reply(user_message):
    """Tìm câu trả lời từ kho tri thức nội bộ khi không có kết nối Gemini."""
    lower_msg = user_message.lower()
    for item in OFFLINE_KB:
        if any(kw in lower_msg for kw in item['keywords']):
            return item['reply']
    return (
        "Chào bạn! Tôi là trợ lý AI của UniMS. Hiện tại tôi có thể hỗ trợ bạn thông tin "
        "về tuyển sinh, học phí, đăng ký tín chỉ, bảng điểm, thời khóa biểu và gửi yêu cầu hỗ trợ. "
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

            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
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
                with urllib.request.urlopen(req, timeout=15) as resp:
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
            except Exception as e:
                # Nếu API lỗi hoặc timeout -> Tự động fallback về kho tri thức nội bộ
                pass

        # Fallback về bộ tri thức trường học nội bộ
        offline_reply = _get_offline_reply(user_message)
        return JsonResponse({
            'success': True,
            'reply': offline_reply,
            'provider': 'offline_kb'
        })

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Định dạng JSON không hợp lệ'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
