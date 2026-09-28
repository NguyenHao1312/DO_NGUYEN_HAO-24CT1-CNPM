// app.js

// Global Error Handler
window.addEventListener('error', (event) => {
    if (window.Utils && typeof window.Utils.showToast === 'function') {
        window.Utils.showToast('Lỗi hệ thống: ' + event.message, 'error');
    }
    console.error('Global JS Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    if (window.Utils && typeof window.Utils.showToast === 'function') {
        window.Utils.showToast('Lỗi Promise ngầm: ' + (event.reason ? event.reason.message || event.reason : 'Không xác định'), 'error');
    }
    console.error('Unhandled Promise Rejection:', event.reason);
});

const translations = {
  vi: {
    // Navigation
    nav_dashboard: 'Bảng điều khiển',
    nav_students: 'Sinh viên',
    nav_teachers: 'Giáo viên',
    nav_classes: 'Lớp học',
    nav_registration: 'Đăng ký học phần',
    nav_tuition: 'Học phí',
    nav_grades: 'Bảng điểm',
    nav_chatbot: 'AI Trợ lý',
    nav_helpdesk: 'Hỗ trợ',
    nav_workshop: 'Workshop',
    nav_profile: 'Profile',

    // Common
    search_placeholder: 'Tìm kiếm...',
    add_new: 'Thêm mới',
    edit: 'Sửa',
    delete: 'Xóa',
    save: 'Lưu',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    close: 'Đóng',
    actions: 'Thao tác',
    status: 'Trạng thái',
    export: 'Xuất dữ liệu',
    import: 'Nhập dữ liệu',
    filter: 'Lọc',
    showing: 'Hiển thị',
    of: 'của',
    entries: 'mục',
    no_data: 'Không có dữ liệu',
    confirm_delete: 'Bạn có chắc muốn xóa?',
    success: 'Thành công',
    error: 'Lỗi',
    warning: 'Cảnh báo',
    view_detail: 'Xem chi tiết',
    previous: 'Trước',
    next: 'Tiếp',

    // Dashboard
    dashboard_title: 'Bảng điều khiển',
    dashboard_subtitle: 'Tổng quan hệ thống',
    total_students: 'Tổng sinh viên',
    total_teachers: 'Tổng giáo viên',
    total_classes: 'Tổng lớp học',
    pending_bugs: 'Hỗ trợ cần xử lý',
    recent_activity: 'Hoạt động gần đây',
    system_log: 'Nhật ký hệ thống',
    backup_restore: 'Sao lưu & Phục hồi dữ liệu',
    quick_actions: 'Thao tác nhanh',
    grade_change_log: 'Nhật ký thay đổi điểm',
    no_grade_changes: 'Chưa có thay đổi điểm nào',
    course_stats_by_teacher: 'Thống kê môn học theo Giáo viên',
    quick_grade_update: 'Cập nhật điểm nhanh',
    grade_distribution: 'Phân bố điểm',
    department_stats: 'Thống kê theo khoa',

    // Students
    students_title: 'Quản lý Sinh viên',
    students_subtitle: 'Danh sách và quản lý thông tin sinh viên',
    student_id: 'Mã sinh viên',
    student_name: 'Họ và tên',
    email: 'Email',
    phone: 'Số điện thoại',
    dob: 'Ngày sinh',
    gender: 'Giới tính',
    male: 'Nam',
    female: 'Nữ',
    class: 'Lớp',
    department: 'Khoa',
    address: 'Địa chỉ',
    active: 'Đang học',
    inactive: 'Nghỉ học',
    graduated: 'Đã tốt nghiệp',
    suspended: 'Đình chỉ',
    add_student: 'Thêm sinh viên',
    edit_student: 'Sửa thông tin sinh viên',

    // Teachers
    teachers_title: 'Quản lý Giáo viên',
    teachers_subtitle: 'Danh sách và quản lý thông tin giáo viên',
    teacher_id: 'Mã giáo viên',
    teacher_name: 'Họ và tên',
    specialization: 'Chuyên ngành',
    position: 'Chức vụ',
    lecturer: 'Giảng viên',
    assoc_prof: 'Phó Giáo sư',
    professor: 'Giáo sư',
    add_teacher: 'Thêm giáo viên',
    edit_teacher: 'Sửa thông tin giáo viên',

    // Classes
    classes_title: 'Quản lý Lớp học',
    classes_subtitle: 'Danh sách môn học và lớp',
    class_code: 'Mã lớp',
    class_name: 'Tên môn học',
    teacher: 'Giáo viên',
    schedule: 'Lịch học',
    room: 'Phòng học',
    max_students: 'Sĩ số tối đa',
    semester: 'Học kỳ',
    credits: 'Số tín chỉ',
    enrolled: 'Đã đăng ký',
    add_class: 'Thêm lớp học',
    edit_class: 'Sửa lớp học',

    // Grades
    grades_title: 'Quản lý Điểm',
    grades_subtitle: 'Nhập và quản lý điểm sinh viên',
    midterm: 'Giữa kỳ',
    final_exam: 'Cuối kỳ',
    assignment: 'Bài tập',
    average: 'Trung bình',
    classification: 'Xếp loại',
    excellent: 'Xuất sắc',
    good: 'Giỏi',
    fair: 'Khá',
    average_grade: 'Trung bình',
    weak: 'Yếu',
    poor: 'Kém',
    add_grade: 'Thêm điểm',
    edit_grade: 'Sửa điểm',
    total_grades_record: 'Tổng số bản ghi điểm',
    letter_grade_distribution: 'Phân bố điểm chữ',
    attention_students: 'SV cần lưu ý (≤ D)',

    // Chatbot
    chatbot_title: 'AI Trợ lý',
    chatbot_subtitle: 'Trợ lý thông minh hỗ trợ giải đáp thắc mắc',
    type_message: 'Nhập tin nhắn...',
    send: 'Gửi',
    clear_history: 'Xóa lịch sử',
    chatbot_welcome: 'Xin chào! Tôi là trợ lý AI của UniMS. Tôi có thể giúp bạn tra cứu thông tin, giải đáp thắc mắc về quy chế, và nhiều hơn nữa. Hãy hỏi tôi bất cứ điều gì!',

    // Help Desk
    helpdesk_title: 'Trung tâm Hỗ trợ',
    helpdesk_subtitle: 'Báo cáo lỗi và yêu cầu hỗ trợ',
    ticket_id: 'Mã phiếu',
    title: 'Tiêu đề',
    description: 'Mô tả',
    severity: 'Mức độ',
    reporter: 'Người báo cáo',
    category: 'Danh mục',
    reply: 'Phản hồi',
    new_ticket: 'Phiếu mới',
    in_progress: 'Đang xử lý',
    resolved: 'Đã giải quyết',
    closed: 'Đã đóng',
    new: 'Mới',
    low: 'Thấp',
    medium: 'Trung bình',
    high: 'Cao',
    critical: 'Nghiêm trọng',
    add_ticket: 'Tạo phiếu hỗ trợ',

    // Workshop
    workshop_title: 'Admin Workshop',
    workshop_subtitle: 'Công cụ quản trị và bảo trì hệ thống',
    export_data: 'Xuất dữ liệu',
    import_data: 'Nhập dữ liệu',
    reset_data: 'Reset dữ liệu',
    system_info: 'Thông tin hệ thống',
    activity_log: 'Nhật ký hoạt động',
    db_stats: 'Thống kê Database',
    school_settings: 'Cấu hình trường học',
    danger_zone: 'Vùng nguy hiểm',
    // Dashboard extra
    welcome_user: 'Xin chào, {name}',
    dashboard_quote: '"Chào mừng bạn đến với hệ sinh thái học thuật xuất sắc. Nơi tri thức kiến tạo tương lai và kỷ luật định hình nhân cách. Hãy bắt đầu hành trình của bạn ngay hôm nay với sự đam mê và khát vọng."',
    news_board: 'BẢNG TIN',
    moet_news: '[BGDĐT] Ban hành quy chế đào tạo mới năm 2026',
    learning_results: 'Kết quả học tập',
    study_progress: 'Tiến độ học tập',
    all_semesters: 'Tất cả học kỳ',
    no_grade_data: 'Chưa có dữ liệu điểm số',
    total_credits: 'Tổng: {total} tín chỉ',
    today_schedule: 'Lịch trình hôm nay',
    no_schedule: 'Không có lịch học hoặc sự kiện nào trong ngày hôm nay.',
    upcoming_events: 'Sự kiện sắp tới',
    tuition: 'Học phí',
    tuition_desc: 'Kiểm tra học phần và thanh toán học phí',
    unit_price: 'Đơn giá',
    course: 'Môn học',
    total_tuition: 'Tổng học phí cần đóng',
    course_reg: 'Đăng ký học phần',
    course_reg_desc: 'Xem chương trình khung và đăng ký môn học theo học kỳ',
    status: 'Trạng thái',
    reg_open: 'Đang mở đăng ký',
    reg_closed: 'Đã đóng đăng ký (Chỉ mở 01/07 - 15/08)',
    curriculum: 'Chương trình khung',
    course_code: 'Mã môn',
    course_name: 'Tên môn',
    credit: 'TC',
    type: 'Loại',
    reg_semester: 'Đăng ký học kỳ',
    select_courses: 'Chọn các môn học muốn đăng ký cho học kỳ tới.',
    total_reg_credits: 'Tổng tín chỉ đăng ký',
    est_tuition: 'Tổng học phí dự kiến',
    save_reg: 'Lưu Đăng ký',
    already_reg: 'Đã đăng ký',
    full_slot: 'Hết chỗ',
    slot_count: 'Sĩ số',
    pay_tuition: 'Thanh toán học phí',
    registered_courses: 'Học phần đã đăng ký',
    total_amount: 'TỔNG CỘNG',
    total_credits_fee: 'Tổng tín chỉ',
    notice: 'Thông báo',
    payment_deadline_desc: 'Thông thường khi đăng kí tín chỉ 1 tháng thì sau 1 tháng đấy sẽ là thời hạn thanh toán (ví dụ: đăng ký tháng 8, thanh toán trong tháng 9).',
    tuition_payment: 'Thanh toán học phí Học kỳ',
    note: 'Lưu ý',
    payment_warning: 'Thông thường sau 1 tháng kể từ ngày bắt đầu học kỳ, sinh viên phải hoàn thành việc đóng học phí. Vui lòng thanh toán đúng hạn để không bị ảnh hưởng đến kết quả học tập.',
    please_transfer: 'Xin vui lòng chuyển khoản số tiền',
    to_the_following_accounts: 'vào một trong các tài khoản ngân hàng dưới đây của nhà trường',
    mb_bank: 'Ngân hàng TMCP Quân Đội (MB Bank)',
    vcb_bank: 'Ngân hàng TMCP Ngoại thương VN (Vietcombank)',
    account_number: 'Số tài khoản',
    account_holder: 'Chủ tài khoản',
    transfer_syntax: 'Cú pháp chuyển khoản',
    student_info: 'Họ tên - Mã SV - Học kỳ',
    close: 'Đóng',
    payment_note: '* Hãy cung cấp thông tin sinh viên chính xác để ngân hàng có thể thanh toán đúng với sinh viên. Hãy kiểm tra lại phần thanh toán của website và liên hệ cho phòng ban hỗ trợ sinh viên nếu hệ thống vẫn chưa cập nhật được trạng thái đóng tiền.',
    no_reg_courses: 'Chưa đăng ký môn học nào',
    
    // Notifications & Header
    'Thông báo ({count})': 'Thông báo ({count})',
    'Đánh dấu đã đọc tất cả': 'Đánh dấu đã đọc tất cả',
    'Không có thông báo nào': 'Không có thông báo nào',
    'Chào mừng đến với UniMS': 'Chào mừng đến với UniMS',
    'Hệ thống quản lý đại học UniMS đã chính thức đi vào hoạt động.': 'Hệ thống quản lý đại học UniMS đã chính thức đi vào hoạt động.',
    'Điểm số mới': 'Điểm số mới',
    'Bạn có điểm số mới được cập nhật.': 'Bạn có điểm số mới được cập nhật.',
    'Thông báo mới': 'Thông báo mới',
    no_notifications: 'Chưa có thông báo nào.',
    save_grades: 'Lưu điểm',
    select_student: '-- Chọn sinh viên --',
    select_student_first: '-- Vui lòng chọn sinh viên trước --',
    registered_course: 'Môn học (Đã đăng ký)',
    no_registered_courses: 'Sinh viên chưa đăng ký môn nào',
    select_course: '-- Chọn môn học --',
    'Đại học Bách Khoa': 'Đại học Bách Khoa',
    'Đại học kỹ thuật hàng đầu miền Trung': 'Đại học kỹ thuật hàng đầu miền Trung',
    'Đại học Kinh tế': 'Đại học Kinh tế',
    'Trường đào tạo kinh tế trọng điểm': 'Trường đào tạo kinh tế trọng điểm',
    'Đại học Ngoại ngữ': 'Đại học Ngoại ngữ',
    'Trung tâm đào tạo ngôn ngữ chuẩn quốc tế': 'Trung tâm đào tạo ngôn ngữ chuẩn quốc tế',
    'Hệ thống Quản trị': 'Hệ thống Quản trị',
    'Quyền điều hành đa trường học': 'Quyền điều hành đa trường học',
    'Phòng': 'Phòng',
    'TC': 'TC',
    'Lịch trình ngày {date}': 'Lịch trình ngày {date}',
    'Không có sự kiện hoặc lịch học nào trong ngày.': 'Không có sự kiện hoặc lịch học nào trong ngày.',
    'Thông báo từ Khoa / Trường': 'Thông báo từ Khoa / Trường',

    // Grades & Subjects
    'Trung bình Hệ 10': 'Trung bình Hệ 10',
    'Điểm cao nhất': 'Điểm cao nhất',
    'Điểm thấp nhất': 'Điểm thấp nhất',
    '-- Tất cả lớp --': '-- Tất cả lớp --',
    '-- Tất cả xếp loại --': '-- Tất cả xếp loại --',
    'MÃ SINH VIÊN': 'MÃ SINH VIÊN',
    'HỌ VÀ TÊN': 'HỌ VÀ TÊN',
    'LỚP': 'LỚP',
    'CC (20%)': 'CC (20%)',
    'GK (30%)': 'GK (30%)',
    'CK (50%)': 'CK (50%)',
    'HỆ 10': 'HỆ 10',
    'HỆ 4': 'HỆ 4',
    'ĐIỂM CHỮ': 'ĐIỂM CHỮ',
    'XẾP LOẠI': 'XẾP LOẠI',
    'Khá': 'Khá',
    'Xuất sắc': 'Xuất sắc',
    'Giỏi': 'Giỏi',
    'Trung bình': 'Trung bình',
    'Yếu': 'Yếu',
    'Kém': 'Kém',
    'Bắt buộc': 'Bắt buộc',
    'Chính khóa': 'Chính khóa',
    'tín chỉ': 'tín chỉ',

    // Course Names
    'Nhập môn Lập trình': 'Nhập môn Lập trình',
    'Cấu trúc Dữ liệu & Giải thuật': 'Cấu trúc Dữ liệu & Giải thuật',
    'Cơ sở Dữ liệu': 'Cơ sở Dữ liệu',
    'Mạng Máy tính': 'Mạng Máy tính',
    'Trí tuệ Nhân tạo': 'Trí tuệ Nhân tạo',
    'Kinh tế vi mô': 'Kinh tế vi mô',
    'Kinh tế vĩ mô': 'Kinh tế vĩ mô',
    'Kế toán tài chính': 'Kế toán tài chính',
    'Marketing cơ bản': 'Marketing cơ bản',
    'Tiếng Anh Giao tiếp': 'Tiếng Anh Giao tiếp',
    'Ngữ pháp Nâng cao': 'Ngữ pháp Nâng cao',
    'Văn hóa Anh Mỹ': 'Văn hóa Anh Mỹ',
    'Biên phiên dịch': 'Biên phiên dịch',
    'Toán cao cấp': 'Toán cao cấp',
    
    // Departments
    'Công nghệ thông tin': 'Công nghệ thông tin',
    'Kinh tế': 'Kinh tế',
    'Ngoại ngữ': 'Ngoại ngữ',
    'Cơ khí': 'Cơ khí',
    'Y dược': 'Y dược',
    'Kinh tế học': 'Kinh tế học',
    'Khoa học máy tính': 'Khoa học máy tính',
    'Trí tuệ nhân tạo': 'Trí tuệ nhân tạo',
    'Mạng máy tính': 'Mạng máy tính',
    'Kinh tế vĩ mô': 'Kinh tế vĩ mô',
    'Ngôn ngữ Anh': 'Ngôn ngữ Anh',
    'Chưa phân công': 'Chưa phân công',
    'Đại cương': 'Đại cương',
    'Toán cơ bản': 'Toán cơ bản',
    
    // Helpdesk
    'Phiếu mới': 'Phiếu mới',
    'Đang xử lý': 'Đang xử lý',
    'Đã giải quyết': 'Đã giải quyết',
    'Đã đóng': 'Đã đóng',
    '-- Trạng thái --': '-- Trạng thái --',
    '-- Mức độ --': '-- Mức độ --',
    '-- Danh mục --': '-- Danh mục --',
    'Ngày tạo': 'Ngày tạo',
    'UI/Giao diện': 'UI/Giao diện',
    'Dữ liệu': 'Dữ liệu',
    'Hiệu suất': 'Hiệu suất',
    'Tính năng': 'Tính năng',
    'Tài khoản': 'Tài khoản',
    'Khác': 'Khác',
    
    // Profile
    profile_title: 'Hồ sơ cá nhân',
    profile_subtitle: 'Quản lý thông tin tài khoản của bạn',
    change_avatar: 'Đổi ảnh đại diện',
    details_info: 'Thông tin chi tiết',
    full_name: 'Họ và tên',
    phone_number: 'Số điện thoại',
    dob: 'Ngày sinh',
    address: 'Địa chỉ',
    department: 'Khoa',
    cccd: 'CCCD',
    save_changes: 'Lưu thay đổi',
    profile_updated: 'Cập nhật thông tin thành công!',
    search_opt_1: 'Sinh viên',
    search_opt_2: 'Đăng ký môn học',
    search_opt_3: 'Xem bảng điểm',
    search_opt_4: 'Lịch học',
    search_opt_5: 'Cài đặt tài khoản',
    academic_results: 'Kết quả học tập',
    subject: 'Môn học',
    assignment_grade: 'Quá trình',
    midterm_grade: 'Giữa kỳ',
    final_grade: 'Cuối kỳ',
    no_grades_data: 'Chưa có dữ liệu điểm',
    edit_info: 'Chỉnh sửa TT',
    view_detail: 'Xem chi tiết',
    'Giảng viên': 'Giảng viên',
    'Phó Giáo sư': 'Phó Giáo sư',
    'Giáo sư': 'Giáo sư',
    unassigned_teacher: 'Chưa phân công',
    select_teacher: 'Chọn giáo viên',
    'Trưởng khoa': 'Trưởng khoa',
    'Phó khoa': 'Phó khoa',
    access_denied: 'Truy cập bị từ chối',
    student_access_only: 'Chỉ sinh viên hoặc quản trị viên mới có thể truy cập trang này.',
    admin_registration_title: 'Quản trị Đăng ký học phần',
    admin_registration_desc: 'Quản lý và đăng ký học phần thay cho sinh viên',
    select_student_manage: 'Chọn sinh viên để quản lý đăng ký',
    select_student: 'Chọn sinh viên',
    select_class: 'Chọn lớp',
    continue_btn: 'Tiếp tục',
    highest_score: 'Điểm cao nhất',
    lowest_score: 'Điểm thấp nhất',
    attendance_grade_label: 'Chuyên cần (20%)',
    midterm_grade_label: 'Giữa kỳ (30%)',
    final_grade_label: 'Cuối kỳ (50%)',
    'Xuất sắc': 'Xuất sắc',
    'Giỏi': 'Giỏi',
    'Khá': 'Khá',
    'Trung bình khá': 'Trung bình khá',
    'Trung bình': 'Trung bình',
    'Trung bình yếu': 'Trung bình yếu',
    'Yếu': 'Yếu',
    'Kém': 'Kém',
    '-- Tất cả lớp --': '-- Tất cả lớp --',
    '-- Tất cả xếp loại --': '-- Tất cả xếp loại --',
    'CC (20%)': 'CC (20%)',
    'GK (30%)': 'GK (30%)',
    'CK (50%)': 'CK (50%)',
    'HỆ 10': 'HỆ 10',
    'HỆ 4': 'HỆ 4',
    'ĐIỂM CHỮ': 'ĐIỂM CHỮ',
    no_replies: 'Chưa có phản hồi',
    enter_reply_placeholder: 'Nhập phản hồi...',
    ai_suggest_reply: 'AI Gợi ý Trả lời',
    send_reply: 'Gửi phản hồi',
    ticket_details_title: 'Chi tiết Phiếu',
    ai_thinking: 'Đang suy nghĩ...',
    ai_suggestion_error: 'Không thể lấy gợi ý AI',
    new_ticket_noti_title: 'Yêu cầu hỗ trợ mới',
    new_ticket_noti_body: 'Sinh viên/Giáo viên {name} vừa tạo ticket mới: {title}',

    // Dashboard Teacher
    teacher_stats_title: 'Thống kê khoa - Danh sách môn học đảm nhiệm',
    no_courses: 'Chưa có môn học',
    students_overview: 'Tổng quan Sinh viên & Lớp học',
    assigned_classes: 'Lớp học đảm nhiệm',
    managed_students: 'Sinh viên quản lý',

    // Toasts
    reg_success: 'Đăng ký thành công {count} môn học!',
    reg_failed: 'Không thể đăng ký. Có thể môn đã đầy hoặc bạn đã đăng ký.',
    signup_success_redirect: 'Tạo tài khoản thành công! Đang chuyển về đăng nhập...',
    feature_updating: 'Tính năng đang được cập nhật!',
    please_select_course: 'Vui lòng chọn ít nhất một môn học để đăng ký.',
    processing: 'Đang xử lý...',

    // Classes & Students & Teachers
    classes_title: 'Quản lý Lớp học',
    classes_subtitle: 'Tổ chức và quản lý các lớp học phần',
    add_class: 'Thêm lớp học',
    search_placeholder: 'Tìm kiếm...',
    department: 'Khoa',
    all: 'Tất cả',
    semester: 'Học kỳ',
    no_data: 'Không có dữ liệu',
    enrolled: 'Đã đăng ký',
    class_code: 'Mã lớp',
    class_name: 'Tên lớp',
    teacher: 'Giáo viên',
    schedule: 'Lịch học',
    room: 'Phòng học',
    max_students: 'Sĩ số tối đa',
    credits: 'Tín chỉ',
    cancel: 'Hủy',
    save: 'Lưu',
    edit_class: 'Sửa lớp học',
    success: 'Thành công',
    delete: 'Xóa',
    confirm_delete: 'Bạn có chắc chắn muốn xóa?',
    update_class_success: 'Đã điều chỉnh lớp học thành công!',
    add_class_success: 'Đã thêm lớp học thành công!',
    delete_class_success: 'Đã xoá lớp học thành công!',
    update_student_success: 'Đã điều chỉnh sinh viên thành công!',
    add_student_success: 'Đã thêm sinh viên thành công!',
    delete_student_success: 'Đã xoá sinh viên thành công!',
    update_teacher_success: 'Đã điều chỉnh giáo viên thành công!',
    add_teacher_success: 'Đã thêm giáo viên thành công!',
    delete_teacher_success: 'Đã xoá giáo viên thành công!',
    students_title: 'Quản lý Sinh viên',
    students_subtitle: 'Hồ sơ và thông tin sinh viên',
    add_student: 'Thêm sinh viên',
    teachers_title: 'Quản lý Giáo viên',
    teachers_subtitle: 'Danh sách và thông tin giảng viên',
    add_teacher: 'Thêm giáo viên',
    grades_title: 'Bảng Điểm',
    grades_subtitle: 'Kết quả học tập của sinh viên',
    settings_title: 'Cài đặt',
    settings_subtitle: 'Cấu hình hệ thống',
    save_settings: 'Lưu cài đặt',
    info: 'Thông tin',
    name: 'Họ và tên',
    email: 'Email',
    phone: 'Số điện thoại',
    address: 'Địa chỉ',
    role: 'Vai trò',
    status_active: 'Đang hoạt động',
    status_inactive: 'Vô hiệu hóa',
    action: 'Thao tác',
    edit: 'Sửa',
    delete: 'Xóa',
    total: 'Tổng',
    admin_reg_success: 'Cập nhật đăng ký thành công',
    unknown: 'Không xác định',
    student: 'Sinh viên',
    admin_role: 'Quản trị viên',
    teacher_role: 'Giáo viên',
    student_role: 'Sinh viên',
    user: 'Người dùng',
    no_permission: 'Bạn không có quyền truy cập trang này'
  },

  en: {
    // Basic EN Translations
    export: 'Export',
    total_students: 'Total Students',
    total_teachers: 'Total Teachers',
    total_classes: 'Total Classes',
    teacher_id: 'Teacher ID',
    teacher_name: 'Full Name',
    specialization: 'Specialization',
    position: 'Position',
    active: 'Studying',
    inactive: 'Inactive',
    graduated: 'Graduated',
    suspended: 'Suspended',
    recent_activity: 'Recent Activity',
    quick_actions: 'Quick Actions',
    grade_change_log: 'Grade Change Log',
    no_grade_changes: 'No grade changes yet',
    course_stats_by_teacher: 'Course Statistics by Teacher',
    quick_grade_update: 'Quick Grade Update',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    cancel: 'Cancel',
    save_grades: 'Save Grades',
    select_student: '-- Select student --',
    select_student_first: '-- Please select a student first --',
    registered_course: 'Registered Course',
    no_registered_courses: 'Student has no registered courses',
    select_course: '-- Select course --',
    nav_dashboard: 'Dashboard',
    nav_students: 'Students',
    nav_teachers: 'Teachers',
    nav_classes: 'Classes',
    nav_registration: 'Course Registration',
    nav_tuition: 'Tuition Fee',
    nav_grades: 'Grades',
    nav_chatbot: 'AI Assistant',
    nav_helpdesk: 'Help Desk',
    nav_workshop: 'Workshop',
    nav_profile: 'Profile',
    search_placeholder: 'Search...',
    dashboard_title: 'Dashboard',
    dashboard_subtitle: 'System Overview',
    chatbot_title: 'AI Assistant',
    chatbot_subtitle: 'Smart assistant for answering questions',
    chatbot_welcome: 'Hello! I am the AI assistant of UniMS. Ask me anything!',
    continue_btn: 'Continue',
    attendance_grade_label: 'Attendance (20%)',
    midterm_grade_label: 'Midterm (30%)',
    final_grade_label: 'Final (50%)',
    grade_10: '10-POINT:',
    grade_4: '4-POINT:',
    letter_grade: 'LETTER:',
    classification: 'Status:',
    'Xuất sắc': 'Excellent',
    'Giỏi': 'Good',
    'Khá': 'Fair',
    'Trung bình khá': 'Average Good',
    'Trung bình': 'Average',
    'Trung bình yếu': 'Below Average',
    'Yếu': 'Weak',
    'Kém': 'Poor',
    'Qua môn': 'Passed',
    'Trượt': 'Failed',
    
    // Dashboard extra
    welcome_user: 'Welcome, {name}',
    dashboard_quote: '"Welcome to the excellent academic ecosystem. Where knowledge creates the future and discipline shapes character. Start your journey today with passion and aspiration."',
    news_board: 'NEWS BOARD',
    moet_news: '[MOET] Issued new training regulations in 2026',
    learning_results: 'Learning Results',
    study_progress: 'Study Progress',
    all_semesters: 'All Semesters',
    no_grade_data: 'No grade data available',
    total_credits: 'Total: {total} credits',
    today_schedule: 'Today\'s Schedule',
    no_schedule: 'No events or classes today.',
    upcoming_events: 'Upcoming Events',
    tuition: 'Tuition Fee',
    tuition_desc: 'Check courses and pay tuition fee',
    unit_price: 'Unit Price',
    course: 'Course',
    total_tuition: 'Total Tuition Fee',
    course_reg: 'Course Registration',
    course_reg_desc: 'View curriculum and register for courses',
    status: 'Status',
    reg_open: 'Registration Open',
    reg_closed: 'Registration Closed (Only 01/07 - 15/08)',
    'Thông báo từ Khoa / Trường': 'Department / University Notifications',
    'Thông báo mới': 'New Notification',
    no_notifications: 'No notifications yet.',
    'Đại học Bách Khoa': 'University of Science and Technology',
    'Đại học kỹ thuật hàng đầu miền Trung': 'Leading technical university in Central Vietnam',
    'Đại học Kinh tế': 'University of Economics',
    'Đào tạo kinh tế, quản trị kinh doanh': 'Economics and business administration training',
    'Đại học Sư phạm': 'University of Education',
    'Trung tâm đào tạo giáo viên và khoa học cơ bản': 'Center for teacher training and basic sciences',
    'Đại học Ngoại ngữ': 'University of Foreign Language Studies',
    'Nơi khởi nguồn ngôn ngữ và văn hóa': 'Where languages and cultures originate',
    'Đại học FPT Đà Nẵng': 'FPT University Da Nang',
    'Trường đại học của doanh nghiệp (Tư thục)': 'Corporate University (Private)',
    'Đại học Duy Tân': 'Duy Tan University',
    'Đại học tư thục lớn nhất miền Trung (Tư thục)': 'The largest private university in Central Vietnam (Private)',
    'Đại học Đông Á': 'Dong A University',
    'Đầu tư phát triển toàn diện (Tư thục)': 'Comprehensive development investment (Private)',
    'Đại học Kiến trúc Đà Nẵng': 'Da Nang Architecture University',
    'Kiến trúc, Mỹ thuật và Xây dựng (Tư thục)': 'Architecture, Fine Arts and Construction (Private)',
    'Đại học Sư phạm Kỹ thuật': 'University of Technology and Education',
    'Kỹ thuật thực hành và Ứng dụng': 'Practical Technology and Applications',
    'Đại học CNTT & TT Việt - Hàn': 'Vietnam-Korea University of IT & C',
    'Công nghệ Thông tin và Kinh tế số': 'Information Technology and Digital Economy',
    'Khoa Y Dược': 'School of Medicine and Pharmacy',
    'Đào tạo Y bác sĩ chất lượng cao': 'High-quality medical doctor training',
    curriculum: 'Curriculum',
    course_code: 'Code',
    course_name: 'Course Name',
    credit: 'Cr',
    type: 'Type',
    reg_semester: 'Register Semester',
    select_courses: 'Select courses to register for next semester.',
    total_reg_credits: 'Total Registered Credits',
    est_tuition: 'Estimated Tuition',
    save_reg: 'Save Registration',
    already_reg: 'Registered',
    full_slot: 'Full',
    slot_count: 'Enrolled',
    pay_tuition: 'Pay Tuition',
    registered_courses: 'Registered Courses',
    total_amount: 'TOTAL',
    total_credits_fee: 'Total Credits',
    notice: 'Notice',
    payment_deadline_desc: 'Usually, when you register for credits in a month, the payment deadline will be the next month (e.g., register in August, pay in September).',
    tuition_payment: 'Semester Tuition Payment',
    note: 'Note',
    payment_warning: 'Usually 1 month after the semester starts, students must complete the tuition payment. Please pay on time to avoid affecting your academic results.',
    please_transfer: 'Please transfer the amount of',
    to_the_following_accounts: 'to one of the following university bank accounts',
    mb_bank: 'Military Commercial Joint Stock Bank (MB Bank)',
    vcb_bank: 'Joint Stock Commercial Bank for Foreign Trade of Vietnam (Vietcombank)',
    account_number: 'Account Number',
    account_holder: 'Account Holder',
    transfer_syntax: 'Transfer Syntax',
    student_info: 'Full Name - Student ID - Semester',
    close: 'Close',
    payment_note: '* Please provide accurate student information so the bank can process the payment correctly. Check the payment section on the website and contact the student support department if the system has not updated the payment status.',
    no_reg_courses: 'No registered courses',

    // Notifications & Header
    'Thông báo ({count})': 'Notifications ({count})',
    'Đánh dấu đã đọc tất cả': 'Mark all as read',
    'Không có thông báo nào': 'No notifications',
    'Chào mừng đến với UniMS': 'Welcome to UniMS',
    'Hệ thống quản lý đại học UniMS đã chính thức đi vào hoạt động.': 'UniMS university management system has officially launched.',
    'Điểm số mới': 'New Grades',
    'Bạn có điểm số mới được cập nhật.': 'You have new grades updated.',
    'Thông báo mới': 'New Notification',

    'Hệ thống Quản trị': 'Admin System',
    'Quyền điều hành đa trường học': 'Multi-university management access',
    'Phòng': 'Room',
    'TC': 'Cr',
    'Lịch trình ngày {date}': 'Schedule for {date}',
    'Không có sự kiện hoặc lịch học nào trong ngày.': 'No events or classes for the day.',
    'Thông báo từ Khoa / Trường': 'Department / University Notifications',

    // Grades & Subjects
    'Trung bình Hệ 10': 'Average Base 10',
    'Điểm cao nhất': 'Highest Score',
    'Điểm thấp nhất': 'Lowest Score',
    '-- Tất cả lớp --': '-- All Classes --',
    '-- Tất cả xếp loại --': '-- All Classifications --',
    'MÃ SINH VIÊN': 'STUDENT ID',
    'HỌ VÀ TÊN': 'FULL NAME',
    'LỚP': 'CLASS',
    'CC (20%)': 'ATT (20%)',
    'GK (30%)': 'MID (30%)',
    'CK (50%)': 'FIN (50%)',
    'HỆ 10': 'BASE 10',
    'HỆ 4': 'BASE 4',
    'ĐIỂM CHỮ': 'LETTER',
    'XẾP LOẠI': 'CLASSIFICATION',
    'Khá': 'Good',
    'Xuất sắc': 'Excellent',
    'Giỏi': 'Very Good',
    'Trung bình': 'Average',
    'Yếu': 'Weak',
    'Kém': 'Poor',
    'Bắt buộc': 'Compulsory',
    'Chính khóa': 'Main Course',
    'tín chỉ': 'credits',

    // Course Names
    'Nhập môn Lập trình': 'Intro to Programming',
    'Cấu trúc Dữ liệu & Giải thuật': 'Data Structures & Algorithms',
    'Cơ sở Dữ liệu': 'Database Systems',
    'Mạng Máy tính': 'Computer Networks',
    'Trí tuệ Nhân tạo': 'Artificial Intelligence',
    'Kinh tế vi mô': 'Microeconomics',
    'Kinh tế vĩ mô': 'Macroeconomics',
    'Kế toán tài chính': 'Financial Accounting',
    'Marketing cơ bản': 'Basic Marketing',
    'Tiếng Anh Giao tiếp': 'Communicative English',
    'Ngữ pháp Nâng cao': 'Advanced Grammar',
    'Văn hóa Anh Mỹ': 'American & British Culture',
    'Biên phiên dịch': 'Translation & Interpretation',
    'Toán cao cấp': 'Advanced Mathematics',

    // Departments & Basics
    'Công nghệ thông tin': 'Information Technology',
    'Kinh tế': 'Economics',
    'Ngoại ngữ': 'Foreign Languages',
    'Cơ khí': 'Mechanical',
    'Y dược': 'Medicine',
    'Kinh tế học': 'Economics',
    'Khoa học máy tính': 'Computer Science',
    'Trí tuệ nhân tạo': 'Artificial Intelligence',
    'Mạng máy tính': 'Computer Networks',
    'Kinh tế vĩ mô': 'Macroeconomics',
    'Ngôn ngữ Anh': 'English Language',
    'Chưa phân công': 'Unassigned',
    'Đại cương': 'General',
    'Toán cơ bản': 'Basic Mathematics',
    student_id: 'Student ID',
    student_name: 'Full Name',
    class: 'Class',
    classification: 'Classification',
    
    // Helpdesk
    'Phiếu mới': 'New Ticket',
    'Đang xử lý': 'In Progress',
    'Đã giải quyết': 'Resolved',
    'Đã đóng': 'Closed',
    '-- Trạng thái --': '-- Status --',
    '-- Mức độ --': '-- Severity --',
    '-- Danh mục --': '-- Category --',
    'Ngày tạo': 'Date Created',
    'UI/Giao diện': 'UI/Interface',
    'Dữ liệu': 'Data',
    'Hiệu suất': 'Performance',
    'Tính năng': 'Feature',
    'Tài khoản': 'Account',
    'Khác': 'Other',
    
    // Profile
    profile_title: 'Personal Profile',
    profile_subtitle: 'Manage your account information',
    change_avatar: 'Change Avatar',
    details_info: 'Detailed Information',
    full_name: 'Full Name',
    phone_number: 'Phone Number',
    dob: 'Date of Birth',
    address: 'Address',
    department: 'Department',
    cccd: 'ID Card',
    save_changes: 'Save Changes',
    profile_updated: 'Profile updated successfully!',
    search_opt_1: 'Student',
    search_opt_2: 'Course Registration',
    search_opt_3: 'View Transcripts',
    search_opt_4: 'Class Schedule',
    search_opt_5: 'Account Settings',
    academic_results: 'Academic Results',
    subject: 'Subject',
    assignment_grade: 'Assignment',
    midterm_grade: 'Midterm',
    final_grade: 'Final',
    no_grades_data: 'No grades data available',
    edit_info: 'Edit Info',
    view_detail: 'View Details',
    'Giảng viên': 'Lecturer',
    'Phó Giáo sư': 'Associate Professor',
    'Giáo sư': 'Professor',
    unassigned_teacher: 'Unassigned',
    select_teacher: 'Select teacher',
    'Trưởng khoa': 'Dean',
    'Phó khoa': 'Vice Dean',
    access_denied: 'Access Denied',
    student_access_only: 'Only students or administrators can access this page.',
    admin_registration_title: 'Registration Administration',
    admin_registration_desc: 'Manage and register courses on behalf of students',
    select_student_manage: 'Select a student to manage registration',
    select_student: 'Select student',
    select_class: 'Select class',
    continue_btn: 'Continue',
    highest_score: 'Highest Score',
    lowest_score: 'Lowest Score',
    total_grades_record: 'Total Grade Records',
    letter_grade_distribution: 'Letter Grade Distribution',
    attention_students: 'Requires Attention (≤ D)',
    attendance_grade_label: 'Attendance (20%)',
    midterm_grade_label: 'Midterm (30%)',
    final_grade_label: 'Final (50%)',
    'Xuất sắc': 'Excellent',
    'Giỏi': 'Very Good',
    'Khá': 'Good',
    'Trung bình khá': 'Above Average',
    'Trung bình': 'Average',
    'Trung bình yếu': 'Below Average',
    'Yếu': 'Poor',
    'Kém': 'Fail',
    '-- Tất cả lớp --': '-- All Classes --',
    '-- Tất cả xếp loại --': '-- All Classifications --',
    'CC (20%)': 'Assign (20%)',
    'GK (30%)': 'Mid (30%)',
    'CK (50%)': 'Final (50%)',
    'HỆ 10': '10-SCALE',
    'HỆ 4': '4-SCALE',
    'ĐIỂM CHỮ': 'LETTER',
    no_replies: 'No replies yet',
    enter_reply_placeholder: 'Enter your reply...',
    ai_suggest_reply: 'AI Suggest Reply',
    send_reply: 'Send Reply',
    ticket_details_title: 'Ticket Details',
    ai_thinking: 'Thinking...',
    ai_suggestion_error: 'Failed to get AI suggestion',
    new_ticket_noti_title: 'New Support Request',
    new_ticket_noti_body: 'Student/Teacher {name} just created a new ticket: {title}',

    // Dashboard Teacher
    teacher_stats_title: 'Department Stats - Assigned Courses',
    no_courses: 'No courses assigned',
    students_overview: 'Students & Classes Overview',
    assigned_classes: 'Assigned Classes',
    managed_students: 'Managed Students',

    // Toasts
    reg_success: 'Successfully registered {count} courses!',
    reg_failed: 'Cannot register. The course might be full or already registered.',
    signup_success_redirect: 'Account created successfully! Redirecting to login...',
    feature_updating: 'Feature is being updated!',
    please_select_course: 'Please select at least one course to register.',
    processing: 'Processing...',

    // Classes & Students & Teachers
    classes_title: 'Class Management',
    classes_subtitle: 'Organize and manage course classes',
    add_class: 'Add Class',
    search_placeholder: 'Search...',
    department: 'Department',
    all: 'All',
    semester: 'Semester',
    no_data: 'No data available',
    enrolled: 'Enrolled',
    class_code: 'Class Code',
    class_name: 'Class Name',
    teacher: 'Teacher',
    schedule: 'Schedule',
    room: 'Room',
    max_students: 'Max Students',
    credits: 'Credits',
    cancel: 'Cancel',
    save: 'Save',
    edit_class: 'Edit Class',
    edit_grade: 'Edit Grade',
    showing: 'Showing',
    of: 'of',
    entries: 'entries',
    
    // Chatbot
    chatbot_title: 'AI Assistant',
    chatbot_subtitle: 'Smart assistant to help answer your questions',
    type_message: 'Type a message...',
    send: 'Send',
    clear_history: 'Clear History',
    chatbot_welcome: 'Hello! I am UniMS AI assistant. I can help you look up information, answer questions about regulations, and much more. Ask me anything!',
    
    // Help Desk
    helpdesk_title: 'Support Center',
    helpdesk_subtitle: 'Report bugs and request support',
    ticket_id: 'Ticket ID',
    title: 'Title',
    description: 'Description',
    severity: 'Severity',
    reporter: 'Reporter',
    category: 'Category',
    reply: 'Reply',
    new_ticket: 'New Ticket',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
    new: 'New',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
    add_ticket: 'Create Ticket',
    
    // Workshop
    workshop_title: 'Admin Workshop',
    workshop_subtitle: 'System administration and maintenance tools',
    export_data: 'Export Data',
    import_data: 'Import Data',
    reset_data: 'Reset Data',
    system_info: 'System Info',
    activity_log: 'Activity Log',
    db_stats: 'Database Stats',
    school_settings: 'School Settings',
    danger_zone: 'Danger Zone',
    success: 'Success',
    delete: 'Delete',
    confirm: 'Confirm',
    confirm_delete: 'Are you sure you want to delete this?',
    update_class_success: 'Class updated successfully!',
    add_class_success: 'Class added successfully!',
    delete_class_success: 'Class deleted successfully!',
    update_student_success: 'Student updated successfully!',
    add_student_success: 'Student added successfully!',
    delete_student_success: 'Student deleted successfully!',
    update_teacher_success: 'Teacher updated successfully!',
    add_teacher_success: 'Teacher added successfully!',
    delete_teacher_success: 'Teacher deleted successfully!',
    students_title: 'Student Management',
    students_subtitle: 'Student profiles and information',
    add_student: 'Add Student',
    teachers_title: 'Teacher Management',
    teachers_subtitle: 'List and information of lecturers',
    add_teacher: 'Add Teacher',
    grades_title: 'Grades',
    grades_subtitle: 'Student learning results',
    settings_title: 'Settings',
    settings_subtitle: 'System Configuration',
    save_settings: 'Save Settings',
    info: 'Information',
    name: 'Full Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    role: 'Role',
    status_active: 'Active',
    status_inactive: 'Inactive',
    action: 'Action',
    edit: 'Edit',
    delete: 'Delete',
    add_new: 'Add New',
    actions: 'Actions',
    filter: 'Filter',
    previous: 'Previous',
    next: 'Next',
    error: 'Error',
    warning: 'Warning',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fairly Good',
    average_grade: 'Average',
    weak: 'Weak',
    poor: 'Poor',
    add_grade: 'Add Grade',
    midterm: 'Midterm',
    final_exam: 'Final Exam',
    assignment: 'Assignment',
    average: 'Average',
    edit_student: 'Edit Student',
    edit_teacher: 'Edit Teacher',
    pending_bugs: 'Pending Tickets',
    system_log: 'System Log',
    backup_restore: 'Backup & Restore',
    grade_distribution: 'Grade Distribution',
    department_stats: 'Department Statistics',
    total: 'Total',
    admin_reg_success: 'Registration updated successfully',
    unknown: 'Unknown',
    student: 'Student',
    admin_role: 'Administrator',
    teacher_role: 'Teacher',
    student_role: 'Student',
    user: 'User',
    no_permission: 'You do not have permission to access this page',
    import: 'Import',
    lecturer: 'Lecturer',
    assoc_prof: 'Associate Professor',
    professor: 'Professor'
  }
};

window.t = function(key, params = {}) {
  const lang = (typeof Database !== 'undefined' && Database.settings) ? (Database.settings.get().language || 'vi') : (localStorage.getItem('unims_settings') ? JSON.parse(localStorage.getItem('unims_settings')).language : 'vi');
  let text = translations[lang]?.[key] || translations['vi']?.[key] || key;
  
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
};

// Also keep global function t for backward compatibility
function t(key, params = {}) {
  return window.t(key, params);
}

const NAV_ITEMS = [
  { hash: '#/dashboard', color: '#3B82F6', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.4"/><rect x="14" y="3" width="7" height="11" rx="1.5" fill="currentColor"/><rect x="14" y="18" width="7" height="3" rx="1.5" fill="currentColor" opacity="0.4"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor"/></svg>', label: 'nav_dashboard', id: 'dashboard' },
  { hash: '#/students', color: '#10B981', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><path d="M12 3l8 4.5-8 4.5-8-4.5L12 3z" fill="currentColor"/><path d="M12 12l8-4.5v5.8a2 2 0 01-1.1 1.8l-5.9 3.2a2 2 0 01-2 0l-5.9-3.2a2 2 0 01-1.1-1.8V7.5L12 12z" fill="currentColor" opacity="0.4"/></svg>', label: 'nav_students', id: 'students' },
  { hash: '#/teachers', color: '#F59E0B', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><rect x="2" y="3" width="20" height="13" rx="2" fill="currentColor" opacity="0.4"/><path d="M8 21h8M12 16v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="9" r="3" fill="currentColor"/><path d="M7 16c0-2.2 2-4 5-4s5 1.8 5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>', label: 'nav_teachers', id: 'teachers' },
  { hash: '#/classes', color: '#8B5CF6', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" fill="currentColor" opacity="0.3"/><path d="M8 10h8M8 14h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16 4v16M8 4v16" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 4" opacity="0.5"/></svg>', label: 'nav_classes', id: 'classes' },
  { hash: '#/registration', color: '#EC4899', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><rect x="5" y="3" width="14" height="18" rx="2" fill="currentColor" opacity="0.3"/><path d="M9 9h6M9 13h6M9 17h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 2l5 5h-3a2 2 0 01-2-2V2z" fill="currentColor"/></svg>', label: 'nav_registration', id: 'registration' },
  { hash: '#/tuition', color: '#F43F5E', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><rect x="3" y="6" width="18" height="12" rx="2" fill="currentColor" opacity="0.3"/><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M3 10h18M3 14h18" stroke="currentColor" stroke-width="1" opacity="0.5"/><path d="M20 6h-2M20 18h-2" stroke="currentColor" stroke-width="2"/></svg>', label: 'nav_tuition', id: 'tuition' },
  { hash: '#/grades', color: '#0EA5E9', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6z" fill="currentColor" opacity="0.4"/><path d="M12 5l1.6 4.8h5.1l-4.1 3 1.6 4.8-4.2-3-4.2 3 1.6-4.8-4.1-3h5.1z" fill="currentColor"/></svg>', label: 'nav_grades', id: 'grades' },
  { divider: true },
  { hash: '#/chatbot', color: '#14B8A6', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" fill="currentColor" opacity="0.3"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><circle cx="15" cy="10" r="1.5" fill="currentColor"/><path d="M9 15h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>', label: 'nav_chatbot', id: 'chatbot' },
  { hash: '#/helpdesk', color: '#F97316', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/><path d="M12 2a10 10 0 00-10 10v4a2 2 0 002 2h2a2 2 0 002-2v-4a2 2 0 00-2-2H4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M12 2a10 10 0 0110 10v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4a2 2 0 012-2h2" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M15 22H9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>', label: 'nav_helpdesk', id: 'helpdesk' },
  { hash: '#/profile', color: '#6366F1', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><rect x="3" y="4" width="18" height="16" rx="2" fill="currentColor" opacity="0.3"/><circle cx="12" cy="10" r="3" fill="currentColor"/><path d="M7 17c0-2.2 2-4 5-4s5 1.8 5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>', label: 'nav_profile', id: 'profile' },
  { divider: true, id: 'admin_divider' },
  { hash: '#/workshop', color: '#EF4444', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><path d="M12 22a10 10 0 100-20 10 10 0 000 20z" fill="currentColor" opacity="0.2"/><path d="M12 16l-3 3-2-2 3-3V9l4-4 2 2-4 4v5z" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>', label: 'nav_workshop', id: 'workshop' },
];

const routes = {
  
  '#/dashboard': () => typeof DashboardView !== 'undefined' ? DashboardView.render() : console.log('DashboardView missing'),
  '#/students': () => typeof StudentsView !== 'undefined' ? StudentsView.render() : console.log('StudentsView missing'),
  '#/teachers': () => typeof TeachersView !== 'undefined' ? TeachersView.render() : console.log('TeachersView missing'),
  '#/classes': () => typeof ClassesView !== 'undefined' ? ClassesView.render() : console.log('ClassesView missing'),
  '#/registration': () => typeof RegistrationView !== 'undefined' ? RegistrationView.render() : console.log('RegistrationView missing'),
  '#/tuition': () => typeof TuitionView !== 'undefined' ? TuitionView.render() : console.log('TuitionView missing'),
  '#/grades': () => typeof GradesView !== 'undefined' ? GradesView.render() : console.log('GradesView missing'),
  '#/chatbot': () => typeof ChatbotView !== 'undefined' ? ChatbotView.render() : console.log('ChatbotView missing'),
  '#/helpdesk': () => typeof HelpdeskView !== 'undefined' ? HelpdeskView.render() : console.log('HelpdeskView missing'),
  '#/workshop': () => typeof WorkshopView !== 'undefined' ? WorkshopView.render() : console.log('WorkshopView missing'),
  '#/profile': () => typeof ProfileView !== 'undefined' ? ProfileView.render() : console.log('ProfileView missing'),
};

const App = {
  async init() {
    // 1. CHỜ giải mã dữ liệu offline hoàn tất trước khi làm việc khác
    if (typeof Database.initEncryption === 'function') {
      try {
        await Database.initEncryption();
      } catch (e) {
        console.error('Encryption init failed:', e);
      }
    }
    // Force reseed data to sync with the new university IDs
    if (!localStorage.getItem('unims_v2_seeded')) {
      if (typeof Database.resetAll === 'function') {
        Database.resetAll();
      }
      localStorage.setItem('unims_v2_seeded', 'true');
    }

    Database.seedData();
    
    if (!Auth.isLoggedIn()) {
      window.location.href = '/review/#login';
      return;
    }

    // Đã đăng nhập -> Kéo dữ liệu từ server (Sync Down)
    try {
      const res = await Auth.apiFetch('/api/sync/down/');
      if (res && res.ok) {
        const data = await res.json();
        if (data.classes && data.classes.length > 0) {
          localStorage.setItem('unims_classes', JSON.stringify(data.classes));
        }
        if (data.registrations && data.registrations.length > 0) {
          localStorage.setItem('unims_registrations', JSON.stringify(data.registrations));
        }
        if (data.grades && data.grades.length > 0) {
          localStorage.setItem('unims_grades', JSON.stringify(data.grades));
        }
      }
    } catch(err) {
      console.log("Offline mode: Skipping sync down");
    }

    this.setupUserProfile();
    this.renderSidebar();
    this.setupRouter();
    this.setupTheme();
    this.setupLanguage();
    this.setupGlobalSearch();
    this.setupMobileMenu();
    this.setupChatbotFab();
    this.setupNotifications();
    this.setupHelpdeskBadge();
    this.setupRealtimeClock();
  },

  setupUserProfile() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    // Display Name and Role
    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');
    const userAvatarEl = document.getElementById('user-avatar');

    if (userNameEl) userNameEl.textContent = user.name || user.username;
    
    if (userRoleEl) {
      let roleText = t('user') || 'Người dùng';
      if (user.role === 'admin') roleText = t('admin_role') || 'Quản trị viên';
      else if (user.role === 'teacher') roleText = t('teacher_role') || 'Giáo viên';
      else if (user.role === 'student') roleText = t('student_role') || 'Sinh viên';
      userRoleEl.textContent = roleText;
    }

    if (userAvatarEl && user.name) {
      if (user.avatar) {
        userAvatarEl.innerHTML = `<img src="${user.avatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        userAvatarEl.style.backgroundColor = 'transparent';
      } else {
        const parts = user.name.split(' ');
        const initials = parts.length > 1 
          ? parts[0][0] + parts[parts.length - 1][0]
          : parts[0][0];
        userAvatarEl.textContent = initials.toUpperCase();
        userAvatarEl.style.backgroundImage = 'none';
      }
    }

    // Display University in Header
    const uniDisplay = document.getElementById('header-university-display');
    const uniNameEl = document.getElementById('header-university-name');
    const uniDescEl = document.getElementById('header-university-desc');

    if (uniDisplay && user.universityId) {
      const uni = Database.UNIVERSITIES.find(u => u.id === user.universityId);
      if (uni) {
        uniDisplay.style.display = 'flex';
        if (uniNameEl) uniNameEl.textContent = t(uni.name);
        if (uniDescEl) uniDescEl.textContent = t(uni.desc);
        const uniLogoContainer = document.getElementById('header-university-logo');
        if (uniLogoContainer) {
          uniLogoContainer.innerHTML = `<span style="font-weight: 700; color: var(--primary-600); font-size: 0.75rem;">${uni.shortName}</span>`;
        }
      }
    } else if (uniDisplay && user.role === 'admin') {
      // Admin might have null universityId, they manage everything
      uniDisplay.style.display = 'flex';
      if (uniNameEl) uniNameEl.textContent = t('Hệ thống Quản trị');
      if (uniDescEl) uniDescEl.textContent = t('Quyền điều hành đa trường học');
    }

    // Logout Event
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      // Avoid attaching multiple listeners on re-init
      const newBtn = btnLogout.cloneNode(true);
      btnLogout.parentNode.replaceChild(newBtn, btnLogout);
      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Auth.logout();
        window.location.href = '/review/';
        
      });
    }
  },

  renderSidebar() {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;
    
    const user = Auth.getCurrentUser();
    let hasAddedDivider = false;

    nav.innerHTML = NAV_ITEMS.map(item => {
      if (item.divider) {
        // Only show workshop divider if admin
        if (item.id === 'admin_divider' && user?.role !== 'admin') return '';
        if (hasAddedDivider) return ''; // Prevent double dividers
        hasAddedDivider = true;
        return '<hr style="border-color: var(--sidebar-hover); margin: 0.5rem 1rem;">';
      }
      
      hasAddedDivider = false;
      // Filter by role access
      if (!Auth.canAccess(item.id)) return '';

      const iconColor = item.color || 'var(--primary-500)';
      const iconBg = item.bg || (item.color + '1A');
      const label = t(item.label);

      return `
        <a href="${item.hash}" class="nav-item" data-hash="${item.hash}" data-tooltip="${label}" data-tooltip-color="${iconColor}">
          <div class="nav-icon-wrapper" style="color: ${iconColor}; background: ${iconBg}; border-color: ${iconColor}33;">
            ${item.icon.startsWith('<') ? item.icon : `<i class="${item.icon}"></i>`}
          </div>
          <span class="nav-label">${label}</span>
        </a>
      `;
    }).join('');
    
    this.highlightActiveNav(window.location.hash || '#/dashboard');
    this.setupNavTooltips();
  },

  setupNavTooltips() {
    // Remove any existing tooltip
    const existing = document.getElementById('nav-global-tooltip');
    if (existing) existing.remove();

    // Create a single tooltip element on body (escapes overflow:hidden)
    const tip = document.createElement('div');
    tip.id = 'nav-global-tooltip';
    tip.className = 'nav-item-tooltip';
    document.body.appendChild(tip);

    let hideTimer = null;

    const show = (navEl) => {
      clearTimeout(hideTimer);
      const label = navEl.dataset.tooltip;
      const color = navEl.dataset.tooltipColor || '#3b82f6';
      if (!label) return;

      tip.textContent = label;
      tip.style.setProperty('--nav-tooltip-color', color);

      // Position: vertically centered next to the nav item, to its right
      const rect = navEl.getBoundingClientRect();
      tip.style.top = (rect.top + rect.height / 2) + 'px';
      tip.style.left = (rect.right + 12) + 'px';
      tip.style.transform = 'translateY(-50%) translateX(-4px)';

      // Force reflow so transition fires
      tip.classList.remove('visible');
      void tip.offsetWidth;
      tip.style.transform = 'translateY(-50%) translateX(0)';
      tip.classList.add('visible');
    };

    const hide = () => {
      hideTimer = setTimeout(() => {
        tip.classList.remove('visible');
      }, 80);
    };

    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    nav.addEventListener('mouseenter', (e) => {
      const navEl = e.target.closest('.nav-item');
      if (navEl) show(navEl);
    }, true);

    nav.addEventListener('mouseleave', (e) => {
      const navEl = e.target.closest('.nav-item');
      if (navEl) hide();
    }, true);

    nav.addEventListener('mousemove', (e) => {
      const navEl = e.target.closest('.nav-item');
      if (!navEl) { hide(); return; }
      // Keep tooltip position updated while moving within item
      const rect = navEl.getBoundingClientRect();
      tip.style.top = (rect.top + rect.height / 2) + 'px';
      tip.style.left = (rect.right + 12) + 'px';
    });
  },

  setupRouter() {
    // Only add listener once
    if (!this.routerInitialized) {
      window.addEventListener('hashchange', () => {
        const hash = window.location.hash || '#/dashboard';
        this.navigate(hash);
      });
      this.routerInitialized = true;
    }

    // Handle initial route
    const hash = window.location.hash || '#/dashboard';
    this.navigate(hash);
  },

  navigate(hash) {
    if (!Auth.isLoggedIn()) {
      window.location.href = '/review/#login';
      return;
    }

    if (Auth.isLoggedIn() && hash === '#/login') {
      window.location.hash = '#/dashboard';
      return;
    }

    if (routes[hash]) {
      // Permission check
      const routeId = hash.replace('#/', '');
      if (routeId !== 'login' && !Auth.canAccess(routeId)) {
        Utils.showToast(t('no_permission') || 'Bạn không có quyền truy cập trang này!', 'error');
        window.location.hash = '#/dashboard';
        return;
      }

      this.highlightActiveNav(hash);
      routes[hash]();

      // Hide chatbot FAB when on chatbot page
      const fab = document.getElementById('chatbot-fab');
      if (fab) fab.style.display = hash === '#/chatbot' ? 'none' : 'flex';
    } else {
      window.location.hash = '#/dashboard';
    }
  },

  highlightActiveNav(hash) {
    document.querySelectorAll('.nav-item').forEach(el => {
      if (el.dataset.hash === hash) {
        el.classList.add('active');
        el.style.backgroundColor = 'var(--sidebar-active-bg)';
        el.style.color = 'var(--sidebar-text-active)';
        el.style.borderRight = '3px solid var(--sidebar-active-border)';
      } else {
        el.classList.remove('active');
        el.style.backgroundColor = '';
        el.style.color = '';
        el.style.borderRight = '';
      }
    });
  },

  setupTheme() {
    const settings = Database.settings.get();
    const btnTheme = document.getElementById('btn-theme');
    
    if (settings.theme === 'dark') {
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
      if (btnTheme) btnTheme.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.setAttribute('data-theme', 'light');
      if (btnTheme) btnTheme.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    if (btnTheme) {
      const newBtn = btnTheme.cloneNode(true);
      btnTheme.parentNode.replaceChild(newBtn, btnTheme);
      newBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        Database.settings.save({ theme: isDark ? 'dark' : 'light' });
        newBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
      });
    }
  },

  setupLanguage() {
    const settings = Database.settings.get();
    const btnLang = document.getElementById('btn-language');
    
    const updateLangLabel = (lang, btn) => {
      if (btn) {
        const label = btn.querySelector('.lang-label');
        if (label) label.textContent = lang.toUpperCase();
      }
    };
    
    updateLangLabel(settings.language, btnLang);
    
    if (btnLang) {
      const newBtn = btnLang.cloneNode(true);
      btnLang.parentNode.replaceChild(newBtn, btnLang);
      newBtn.addEventListener('click', () => {
        const currentLang = Database.settings.get().language;
        const newLang = currentLang === 'vi' ? 'en' : 'vi';
        
        Database.settings.save({ language: newLang });
        updateLangLabel(newLang, newBtn);
        
        this.renderSidebar();
        this.setupUserProfile();
        const currentHash = window.location.hash || '#/dashboard';
        if (routes[currentHash]) routes[currentHash]();
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
          el.placeholder = t(el.dataset.i18nPlaceholder);
        });
        document.querySelectorAll('[data-i18n-value]').forEach(el => {
          el.value = t(el.dataset.i18nValue);
        });
        
        // Translate all static data-i18n elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
          el.textContent = t(el.dataset.i18n);
        });
      });
    }
    
    // Initial translation for static elements on first load
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-value]').forEach(el => {
      el.value = t(el.dataset.i18nValue);
    });
  },

  setupGlobalSearch() {
    const searchInput = document.getElementById('global-search');
    if (!searchInput) return;
    
    searchInput.placeholder = t('search_placeholder') || 'Tìm kiếm...';
    
    // Create dropdown wrapper
    let dropdown = document.getElementById('global-search-results');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.id = 'global-search-results';
      dropdown.style.cssText = 'position:absolute; top:100%; left:0; right:0; background:var(--surface); border:1px solid var(--border-color); border-radius:var(--radius-md); box-shadow:var(--shadow-lg); z-index:1000; display:none; max-height:300px; overflow-y:auto; margin-top:4px;';
      // Ensure parent is relative
      searchInput.parentNode.style.position = 'relative';
      searchInput.parentNode.appendChild(dropdown);
    }

    const routes = [
      { path: '#/dashboard', icon: 'fa-chart-pie', name: 'nav_dashboard', roles: ['admin', 'teacher', 'student'] },
      { path: '#/students', icon: 'fa-user-graduate', name: 'nav_students', roles: ['admin'] },
      { path: '#/teachers', icon: 'fa-chalkboard-teacher', name: 'nav_teachers', roles: ['admin'] },
      { path: '#/classes', icon: 'fa-layer-group', name: 'nav_classes', roles: ['admin', 'teacher'] },
      { path: '#/registration', icon: 'fa-edit', name: 'nav_registration', roles: ['admin', 'student'] },
      { path: '#/tuition', icon: 'fa-money-bill-wave', name: 'nav_tuition', roles: ['student'] },
      { path: '#/grades', icon: 'fa-star', name: 'nav_grades', roles: ['admin', 'teacher', 'student'] },
      { path: '#/profile', icon: 'fa-user-circle', name: 'nav_profile', roles: ['admin', 'teacher', 'student'] },
      { path: '#/helpdesk', icon: 'fa-headset', name: 'nav_helpdesk', roles: ['admin', 'teacher', 'student'] },
      { path: '#/chatbot', icon: 'fa-robot', name: 'nav_chatbot', roles: ['admin', 'teacher', 'student'] },
      { path: '#/workshop', icon: 'fa-tools', name: 'nav_workshop', roles: ['admin'] }
    ];

    let currentResults = [];
    let selectedIndex = -1;

    const renderResults = () => {
      if (currentResults.length === 0) {
        dropdown.innerHTML = `<div style="padding:12px; text-align:center; color:var(--text-secondary); font-size:0.85rem;">${t('no_data') || 'Không tìm thấy kết quả'}</div>`;
      } else {
        dropdown.innerHTML = currentResults.map((r, i) => `
          <div class="search-item ${i === selectedIndex ? 'selected' : ''}" data-path="${r.path}" style="padding:10px 12px; display:flex; align-items:center; gap:10px; cursor:pointer; font-size:0.9rem; color:var(--text-primary); border-bottom:1px solid var(--border-light); ${i === selectedIndex ? 'background:var(--primary-50);' : ''}">
            <i class="fas ${r.icon}" style="color:var(--primary-500); width:20px; text-align:center;"></i>
            <span>${t(r.name) || r.name}</span>
          </div>
        `).join('');
      }
      dropdown.style.display = 'block';
    };

    // Global click listener to close dropdown
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });

    // Event listeners
    dropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.search-item');
      if (item) {
        window.location.hash = item.dataset.path;
        dropdown.style.display = 'none';
        searchInput.value = '';
      }
    });

    searchInput.addEventListener('keydown', (e) => {
      if (dropdown.style.display !== 'block') return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, currentResults.length - 1);
        renderResults();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        renderResults();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < currentResults.length) {
          window.location.hash = currentResults[selectedIndex].path;
        } else if (currentResults.length > 0) {
          window.location.hash = currentResults[0].path; // Default to first result
        }
        dropdown.style.display = 'none';
        searchInput.value = '';
        searchInput.blur();
      } else if (e.key === 'Escape') {
        dropdown.style.display = 'none';
      }
    });

    searchInput.addEventListener('input', Utils.debounce((e) => {
      const query = e.target.value.trim().toLowerCase();
      if (!query) {
        dropdown.style.display = 'none';
        return;
      }
      
      const role = Auth.getCurrentUser()?.role || 'student';
      currentResults = routes.filter(r => {
        if (!r.roles.includes(role)) return false;
        const translatedName = (t(r.name) || r.name).toLowerCase();
        return translatedName.includes(query);
      });
      
      selectedIndex = -1;
      renderResults();
    }, 200));
    
    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim().length > 0) {
        dropdown.style.display = 'block';
      }
    });
  },

  setupMobileMenu() {
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    
    // Inject overlay if not exists
    let overlay = document.getElementById('sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sidebar-overlay';
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
    }
    
    if (toggleBtn && sidebar) {
      const newToggle = toggleBtn.cloneNode(true);
      toggleBtn.parentNode.replaceChild(newToggle, toggleBtn);
      
      newToggle.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
      });
    }
    
    if (overlay && sidebar) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      });
    }
    
    if (sidebarToggleBtn && sidebar) {
      const newSidebarToggleBtn = sidebarToggleBtn.cloneNode(true);
      sidebarToggleBtn.parentNode.replaceChild(newSidebarToggleBtn, sidebarToggleBtn);
      
      newSidebarToggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        
        // Only adjust margin on desktop
        if (window.innerWidth > 768) {
           document.getElementById('main-wrapper').style.marginLeft = 
             sidebar.classList.contains('collapsed') ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)';
        }
      });
    }

    // Auto close sidebar on route change on mobile
    window.addEventListener('hashchange', () => {
      if (window.innerWidth <= 768 && sidebar && overlay) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      }
    });
  },

  setupChatbotFab() {
    const fab = document.getElementById('chatbot-fab');
    if (fab) {
      const newFab = fab.cloneNode(true);
      fab.parentNode.replaceChild(newFab, fab);
      newFab.addEventListener('click', () => {
        window.location.hash = '#/chatbot';
      });
    }
  },

  setupNotifications() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    const btn = document.getElementById('btn-notifications');
    if (!btn) return;

    // Create dropdown container if not exists
    let dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.id = 'notification-dropdown';
      dropdown.className = 'notification-dropdown';
      btn.parentNode.style.position = 'relative'; // Ensure parent is relative
      btn.parentNode.appendChild(dropdown);
    }

    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
      if (dropdown.classList.contains('show')) {
        this.renderNotifications(dropdown, user.id);
      }
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !newBtn.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });

    this.updateNotificationBadge();
  },

  renderNotifications(container, userId) {
    const notifs = Database.notifications.getByUserId(userId);
    const unread = notifs.filter(n => !n.read).length;

    container.innerHTML = `
      <div class="notif-header">
        <span>${t('Thông báo ({count})', { count: unread })}</span>
        <button class="btn btn-icon btn-sm" id="btn-read-all" title="${t('Đánh dấu đã đọc tất cả')}">
          <i class="fas fa-check-double"></i>
        </button>
      </div>
      <div class="notif-body">
        ${notifs.length === 0 ? `<div style="padding: 1rem; text-align: center; color: var(--text-tertiary);">${t('Không có thông báo nào')}</div>` : ''}
        ${notifs.map(n => `
          <div class="notif-item ${!n.read ? 'unread' : ''}" data-id="${n.id}">
            <div class="notif-icon" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; flex-shrink: 0; background: var(--${n.type === 'error' ? 'danger' : n.type === 'warning' ? 'warning' : 'primary'}-100); color: var(--${n.type === 'error' ? 'danger' : n.type === 'warning' ? 'warning' : 'primary'}-600)">
              <i class="fas fa-${n.type === 'error' ? 'exclamation-circle' : n.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}" style="font-size: 1.25rem;"></i>
            </div>
            <div class="notif-content">
              <div class="notif-title">${t(n.title)}</div>
              <div class="notif-desc">${t(n.message)}</div>
              <div class="notif-time">${new Date(n.createdAt).toLocaleString(t('vi-VN'))}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('btn-read-all')?.addEventListener('click', () => {
      Database.notifications.markAllAsRead(userId);
      this.renderNotifications(container, userId);
      this.updateNotificationBadge();
    });

    container.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', () => {
        Database.notifications.markAsRead(item.dataset.id);
        this.renderNotifications(container, userId);
        this.updateNotificationBadge();
      });
    });
  },

  updateNotificationBadge() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    const badge = document.getElementById('notification-badge');
    if (badge) {
      const count = Database.notifications.getUnreadCount(user.id);
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = count > 0 ? 'flex' : 'none';
      if (count > 0) {
        badge.classList.add('pulse');
      } else {
        badge.classList.remove('pulse');
      }
    }
  },

  setupHelpdeskBadge() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    const btn = document.getElementById('btn-helpdesk-top');
    if (!btn) return;

    if (user.role === 'admin' || user.role === 'teacher') {
      btn.style.display = 'inline-flex';
      const badge = document.getElementById('helpdesk-badge');
      const bugStats = Database.bugs.countByStatus ? Database.bugs.countByStatus() : {};
      const pendingBugsCount = (bugStats['new'] || 0) + (bugStats['in-progress'] || 0);
      
      if (badge) {
        badge.textContent = pendingBugsCount > 99 ? '99+' : pendingBugsCount;
        badge.style.display = pendingBugsCount > 0 ? 'flex' : 'none';
        if (pendingBugsCount > 0) badge.classList.add('pulse');
      }

      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', () => {
        window.location.hash = '#/helpdesk';
      });
    } else {
      btn.style.display = 'none';
    }
  },

  setupRealtimeClock() {
    const clockTimeEl = document.getElementById('clock-time');
    const clockDateEl = document.getElementById('clock-date');
    if (!clockTimeEl || !clockDateEl) return;

    const updateClock = () => {
      const now = new Date();
      // Time format: HH:MM:SS
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      clockTimeEl.textContent = `${hours}:${minutes}:${seconds}`;

      // Date format: DD/MM/YYYY
      const date = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      clockDateEl.textContent = `${date}/${month}/${year}`;
    };

    // Update immediately and then every second
    updateClock();
    if (this.clockInterval) clearInterval(this.clockInterval);
    this.clockInterval = setInterval(updateClock, 1000);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());



