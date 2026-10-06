# Sơ đồ Hoạt động (Activity Diagrams) cho các Thực thể Hệ thống (UniMS)

Tài liệu này cung cấp các **UML Activity Diagram** (sử dụng cú pháp PlantUML Activity Beta) mô phỏng chi tiết hành trình xử lý nghiệp vụ của từng Entity cốt lõi trong cơ sở dữ liệu.

---

### 1. Entity: CustomUser (Luồng Xác thực - Auth Flow)
Bao gồm các chức năng cốt lõi liên quan đến bảng `CustomUser` như Đăng ký (Register), Đăng nhập (Login), và Quản lý Phiên (Session).

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
  :Truy cập trang Đăng ký;
  :Nhập thông tin cá nhân (Mã số, Tên, Email);
  :Lưu bản ghi mới vào bảng **CustomUser**;
else (Rồi)
endif

repeat :Nhập Username & Password;
  :Truy vấn đối chiếu trong bảng **CustomUser**;
backward:Hệ thống báo lỗi sai thông tin;
repeat while (Xác thực thành công?) is (Sai) not (Đúng)

:Khởi tạo phiên làm việc;
:Lưu chuỗi **Session Token** vào Database;
:Kiểm tra Role (Admin, Teacher, Student);
:Chuyển hướng (Redirect) tới Dashboard tương ứng;
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

### 4. Entity: Admin, GradeEditConfig & AuditLog (Luồng Quản trị viên)
Hành trình của Admin quản trị toàn bộ các tác vụ liên quan đến Cấu hình hệ thống, Log bảo mật, và Dữ liệu hàng loạt.

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
:Truy cập Admin Dashboard;
fork
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
  :Giám sát Hệ thống;
  :Truy vấn bảng **AuditLog**;
  :Xem chi tiết lịch sử gọi API (Method, IP);
  :Xuất dữ liệu thô ra file Excel (Export);
end fork
stop
@enduml
```
