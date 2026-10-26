# 📚 Tài Liệu Thiết Kế & Kiến Trúc Hệ Thống UniMS

Thư mục này lưu trữ toàn bộ hồ sơ thiết kế, biểu đồ kiến trúc, mô hình dữ liệu và quy trình nghiệp vụ của hệ thống Quản lý Đại học & Xét Tuyển Trực Tuyến UniMS.

---

## 📑 Danh Sách Tài Liệu & Biểu Đồ

| STT | Tài Liệu | Loại Biểu Đồ | Nội Dung Chi Tiết |
|---|---|---|---|
| 1 | [**DiagramGit.md**](./DiagramGit.md) | **Sequence Diagrams (UML)** | **10 kịch bản tuần tự chi tiết hệ thống**: Đăng ký, Đăng nhập, Xem điểm GPA, Quản lý lớp học, Xét nguyện vọng & OTP Gmail, Đổi mật khẩu bắt buộc/tự nguyện, Duyệt hồ sơ Admin, Tra cứu kết quả CCCD, Khung chương trình đào tạo 4 năm, Quản lý học phí VietQR. |
| 2 | [**ActivityDiagram.md**](./ActivityDiagram.md) | **Activity Diagrams (PlantUML)** | **Sơ đồ hoạt động theo thực thể**: Luồng xác thực `CustomUser`, Luồng sinh viên `Student & Registration`, Luồng giảng viên `Teacher & Attendance`, Luồng quản trị viên `Admin & System Lifecycle`, Luồng tuyển sinh `AdmissionApplication`. |
| 3 | [**Diagram.md**](./Diagram.md) | **Use Case Diagrams & Phân Tích** | **Báo cáo phân tích hệ thống theo luồng nghiệp vụ**: Actors (Thí sinh, Sinh viên, Giảng viên, Quản trị viên), Danh mục các Use Cases cốt lõi, Biểu đồ Use Case tổng quan và chi tiết. |
| 4 | [**Mermaid.md**](./Mermaid.md) | **ERD & System Architecture** | **Mô hình Thực thể Liên kết & Hạ tầng mạng**: Sơ đồ ERD chuẩn CSDL SQL Server (SSMS), Sơ đồ phân tầng mạng Dual-Port (Public Port 8000 & Local-Only Port 9000). |

---

## 🛠️ Hướng Dẫn Xem & Vẽ Lại Sơ Đồ

1. **Xem trực tiếp trên GitHub / IDE Markdown Preview**:
   - Tất cả biểu đồ Mermaid (`DiagramGit.md`, `Mermaid.md`) đều tự động render trực tiếp trên giao diện web của GitHub và các Markdown Viewer hiện đại.
2. **Chỉnh sửa / Xuất ảnh bằng Diagrams.net (Draw.io)**:
   - Mở [diagrams.net](https://app.diagrams.net/).
   - Chọn menu: **Arrange** -> **Insert** -> **Advanced** -> **Mermaid...** (hoặc **PlantUML...**).
   - Dán nội dung code biểu đồ tương ứng để xuất ra file PNG, SVG, PDF hoặc chèn vào báo cáo DOCX.
