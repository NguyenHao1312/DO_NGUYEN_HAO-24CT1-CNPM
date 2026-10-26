# Sơ đồ Hoạt động (Activity Diagrams) cho các Thực thể Hệ thống (UniMS)

Tài liệu này cung cấp các **UML Activity Diagram** (sử dụng cú pháp PlantUML Activity Beta) mô phỏng chi tiết hành trình xử lý nghiệp vụ của từng Entity cốt lõi trong cơ sở dữ liệu.

---

### 1. Entity: CustomUser (Luồng Xác thực - Auth Flow & Đổi Mật Khẩu)
Bao gồm các chức năng cốt lõi liên quan đến bảng `CustomUser` như Đăng ký (Register), Đăng nhập (Login), Kiểm tra cờ Đổi mật khẩu bắt buộc (`must_change_password`), Đổi mật khẩu tự nguyện, và Quản lý Phiên (Session).

```plantuml
@startuml
skinparam activity {
  BackgroundColor #555555
  FontColor White
  BorderColor Black
}
skinparam activityDiamond {
  BackgroundColor #555555
  FontColor White
  BorderColor Black
}
start
if (Đã có tài khoản?) then (Chưa)
  :Truy cập trang Xét tuyển (/admission/);
  :Xác thực OTP qua Gmail;
  :Hệ thống tự động cấp tài khoản và lưu vào **CustomUser**;
else (Rồi)
endif

repeat :Nhập Username (Mã SV/Tài khoản) & Password;
  :Truy vấn đối chiếu trong bảng **CustomUser**;
backward:Hệ thống báo lỗi sai thông tin;
repeat while (Xác thực thành công?) is (Sai) not (Đúng)

if (must_change_password == True?) then (Tài khoản mới cấp)
  :Hiển thị Popup bắt buộc: "Hãy đổi lại mật khẩu để tránh mất thông tin";
  repeat :Nhập mật khẩu mới (tối thiểu 6 ký tự);
    :Gửi API đổi mật khẩu;
  backward:Báo lỗi mật khẩu không hợp lệ;
  repeat while (Cập nhật thành công?) is (Không) not (Thành công)
  :Mã hóa mật khẩu mới (make_password);
  :Lưu vào **CustomUser** (SSMS) & đặt must_change_password = False;
else (Bình thường)
endif

:Khởi tạo phiên làm việc;
:Lưu chuỗi **Session Token** vào Database;
:Kiểm tra Role (Admin, Teacher, Student);
:Chuyển hướng (Redirect) tới Dashboard tương ứng;

if (Người dùng có nhu cầu đổi mật khẩu?) then (Có)
  :Mở Profile cá nhân;
  :Nhập mật khẩu cũ & mật khẩu mới;
  :Lưu mật khẩu mới vào **CustomUser**;
else (Không)
endif

stop
@enduml
```

---

### 2. Entity: Student & Registration (Luồng Sinh viên)
Hành trình tương tác của Sinh viên với các bảng dữ liệu `Student`, `Semester`, `CourseClass`, `Registration`, và `Grade`.

```plantuml
@startuml
skinparam activity {
  BackgroundColor #555555
  FontColor White
  BorderColor Black
}
skinparam activityDiamond {
  BackgroundColor #555555
  FontColor White
  BorderColor Black
}
start
:Truy cập Student Dashboard;
fork
  :Mở Module "Học kỳ";
  :Truy vấn bảng **Semester**;
  :Truy vấn bảng **CourseClass** theo Học kỳ;
  :Hiển thị danh sách lớp;
fork again
  :Mở Module "Kết quả học tập";
  :Truy vấn bảng **Grade** (Điểm số);
  if (Grade.is_fully_locked == True?) then (Đã khóa vĩnh viễn)
    :Hiển thị Điểm chính thức;
    :Vô hiệu hóa tính năng khiếu nại;
  else (Chưa khóa)
    :Hiển thị Điểm tạm tính;
  endif
fork again
  :Mở Module "Đồng bộ (Sync)";
  if (Trạng thái kết nối mạng?) then (Offline)
    :Đọc dữ liệu từ bộ đệm LocalStorage;
  else (Online)
    :Đẩy (Push) dữ liệu offline lên Database;
    :Kéo (Pull) dữ liệu mới nhất từ Server về;
  endif
end fork
stop
@enduml
```

---

### 3. Entity: Teacher & Attendance (Luồng Giảng viên)
Hành trình của Giảng viên thao tác với các bảng `Teacher`, `CourseClass`, và đặc biệt là ghi nhận `Attendance` (Điểm danh).

```plantuml
@startuml
skinparam activity {
  BackgroundColor #555555
  FontColor White
  BorderColor Black
}
skinparam activityDiamond {
  BackgroundColor #555555
  FontColor White
  BorderColor Black
}
start
:Truy cập Teacher Dashboard;
:Lựa chọn Học kỳ (Bảng **Semester**);
:Hiển thị danh sách Lớp học phần (Bảng **CourseClass**);
:Chọn một Lớp để Điểm danh;
:Truy vấn danh sách Sinh viên (Bảng **Registration**);

repeat :Duyệt qua từng Sinh viên;
  if (Tình trạng đi học?) then (Có mặt / Trễ)
    :Đánh dấu Present / Late;
  else (Vắng mặt)
    if (Có phép?) then (Có)
      :Đánh dấu Excused;
    else (Không)
      :Đánh dấu Absent;
    endif
  endif
  :Ghi nhận bản ghi mới vào bảng **Attendance**;
repeat while (Còn sinh viên chưa điểm danh?) is (Còn) not (Hết)

:Hệ thống tự động tính toán Điểm chuyên cần;
:Cập nhật vào bảng **Grade** (cột assignment);
stop
@enduml
```

---

### 4. Entity: Admin, GradeEditConfig, AuditLog & Admission Management (Luồng Quản trị viên)
Hành trình của Admin quản trị toàn bộ các tác vụ liên quan đến Xét duyệt nguyện vọng, Cấu hình hệ thống, Log bảo mật, và Dữ liệu hàng loạt.

```plantuml
@startuml
skinparam activity {
  BackgroundColor #555555
  FontColor White
  BorderColor Black
}
skinparam activityDiamond {
  BackgroundColor #555555
  FontColor White
  BorderColor Black
}
start
:Truy cập Admin Dashboard (Port 9000);
:Khởi động bộ đếm phiên 10 phút (Monotonic 600s - Không reset khi F5/forced reload);
fork
  :Xét tuyển Nguyện vọng;
  :Truy vấn bảng **AdmissionApplication**;
  :Lọc danh sách theo trạng thái (submitted, passed, rejected);
  if (Thao tác trên hồ sơ?) then (Duyệt thủ công)
    :Tự động sinh Mã SV ({code}0..n);
    :Sinh Mật khẩu ngẫu nhiên 8 ký tự;
    :Tạo bản ghi mới trong **CustomUser** & **Student**;
    :Cập nhật trạng thái **AdmissionApplication.status = passed**;
    :Gửi email kích hoạt tài khoản;
  else (Từ chối)
    :Cập nhật status = rejected;
  endif
fork again
  :Quản lý Học phí & Đối soát VietQR;
  :Nhập Mã SV vào thanh công cụ đối soát nhanh;
  :Bấm "Duyệt Đã Thanh Toán";
  :Cập nhật **Student.tuition_debt = False** trong SSMS;
  :Gỡ bỏ cấm xem điểm và ĐKHP cho sinh viên;
fork again
  :Dọn dẹp An toàn Tài khoản Ma (Ghost Accounts);
  :Quét phát hiện tài khoản mồ côi hoặc không hoạt động (0 môn, 0 điểm);
  :Hiển thị danh sách kiểm toán an toàn;
  :Xác nhận dọn dẹp và ghi log kiểm toán WORM;
fork again
  :Quản lý Người dùng;
  :Truy vấn bảng **CustomUser**;
  :Khóa / Mở khóa tài khoản;
  :Xóa Session Token để ép Đăng xuất;
fork again
  :Sao chép Lớp học phần;
  :Chọn Semester nguồn & đích;
  :Clone hàng loạt bản ghi **CourseClass**;
fork again
  :Cấu hình Khóa điểm;
  :Ghi nhận vào bảng **GradeEditConfig**;
  :Thiết lập khung giờ/ngày được phép sửa điểm;
fork again
  :Giám sát Hệ thống & Kiểm toán WORM;
  :Truy vấn bảng **AuditLog**;
  :Xem chi tiết lịch sử gọi API (Method, IP);
  :Xuất dữ liệu thô ra file Excel (Export);
end fork
if (Hết thời hạn phiên 10 phút?) then (Hết hạn)
  :Tự động thu hồi token;
  :Chuyển hướng về /admin/login/?error=session_expired;
else (Đang thao tác)
endif
stop
@enduml
```

---

### 5. Entity: AdmissionApplication (Luồng Xét Nguyện Vọng Trực Tuyến & Cấp Mã Tự Động)
Hành trình của Thí sinh tương tác với thực thể `AdmissionApplication`, xác thực Gmail OTP, đối soát điểm chuẩn và tự động sinh bản ghi `Student` trong SSMS.

```plantuml
@startuml
skinparam activity {
  BackgroundColor #555555
  FontColor White
  BorderColor Black
}
skinparam activityDiamond {
  BackgroundColor #555555
  FontColor White
  BorderColor Black
}
start
:Thí sinh mở trang Xét tuyển Trực tuyến (/admission/);

if (Mục đích?) then (Nộp hồ sơ xét tuyển)
  :Nhập số CCCD (12 chữ số) và bấm nút "Kiểm tra";
  :Hệ thống kiểm tra riêng CCCD (check_mode: cccd_only, không bắt lỗi ô email trống);
  if (CCCD đã có trong hệ thống?) then (Đã có mã/tài khoản)
    :Hiển thị cảnh báo CCCD đã tồn tại trong hệ thống;
  else (Hợp lệ)
    :Hiển thị huy hiệu xác minh CCCD thành công;
  endif

  :Điền tiếp Họ tên, Gmail thật (@gmail.com), SĐT, chọn Trường (10011..10021), Ngành, Điểm thi;
  :Bấm "Nộp Hồ Sơ & Nhận Mã OTP Xác Thực";
  :Hệ thống kiểm tra chống trùng lặp toàn diện (check_mode: all);
  if (Trùng lặp hoặc người dùng mặc kệ cảnh báo CCCD?) then (Bị trùng)
    :Modal cảnh báo trùng lặp lần 2 & Chặn nộp hồ sơ;
    stop
  else (Hợp lệ 1:1)
  endif

  :Hệ thống so sánh Điểm thi với Điểm chuẩn ngành TRƯỚC;
  if (Điểm thi < Điểm chuẩn?) then (Dưới điểm chuẩn)
    :Hiển thị Modal BÁO RỚT ĐIỂM CHUẨN (chỉ rõ số điểm còn thiếu: ví dụ thiếu -2.50đ);
    :Dừng lại tại Bước 1, TUYỆT ĐỐI KHÔNG GỬI OTP;
    stop
  else (Đạt điểm chuẩn)
    :Hiển thị Modal CHÚC MỪNG TRÚNG TUYỂN;
    :Thí sinh bấm xác nhận "Tiếp Tục Nhận Mã OTP";
    :Tạo bản ghi **AdmissionApplication** (status = 'approved', is_otp_verified = False);
    :Sinh mã OTP ngẫu nhiên 6 chữ số (thời hạn 10 phút);
    :Gọi SMTP Gmail gửi mã OTP về hòm thư thí sinh (kèm fallback);
    :Chuyển sang Bước 2: Giao diện nhập OTP tinh gọn Clean UI;

    repeat :Thí sinh nhập mã OTP 6 số và nhấn Enter;
      :Hệ thống đối chiếu OTP và kiểm tra thời hạn 10 phút;
    backward:Báo lỗi sai OTP hoặc OTP đã hết hạn (cho phép gửi lại mã);
    repeat while (OTP trùng khớp?) is (Sai) not (Đúng)

    :Cập nhật **AdmissionApplication.is_otp_verified = True**;
    :Sinh Mã SV theo cú pháp: {university_code}0..n (khóa hàng atomic);
    :Sinh Mật khẩu alphanumeric 8 ký tự an toàn;
    :Tạo bản ghi trong **CustomUser** (must_change_password=True);
    :Tạo bản ghi trong **Student** (tuition_debt=True);
    :Cập nhật **status = 'credentials_sent'**;
    :Gửi email chúc mừng trúng tuyển kèm Mã SV & Mật khẩu;
    :Hiển thị thiệp chúc mừng chính thức cho tân sinh viên;
  endif

else (Tra cứu theo số CCCD)
  :Nhập số CCCD (12 chữ số);
  :Truy vấn bảng **AdmissionApplication** theo CCCD;
  if (Tìm thấy hồ sơ?) then (Có)
    :Hiển thị thông tin xét tuyển, trường, ngành, điểm thi và kết quả;
    if (Trạng thái == passed?) then (Trúng tuyển)
      :Hiển thị Mã số Sinh viên đã được cấp;
    endif
  else (Không)
    :Báo không tìm thấy hồ sơ tương ứng;
  endif
endif

stop
@enduml
```
