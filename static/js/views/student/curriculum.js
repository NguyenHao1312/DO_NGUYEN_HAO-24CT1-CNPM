// static/js/views/student/curriculum.js
/**
 * UniMS Curriculum Framework Controller
 * Hiển thị Khung chương trình đào tạo chuẩn 4 năm (8 học kỳ) theo từng chuyên ngành
 * Cho phép tất cả sinh viên (cũ & mới) tra cứu lộ trình học, số tín chỉ và môn tiên quyết.
 */

const CURRICULUM_DATA = {
  'Công nghệ Thông tin': {
    code: 'IT',
    faculty: 'Khoa Công nghệ Thông tin',
    totalCredits: 140,
    degree: 'Kỹ sư / Cử nhân Công nghệ Thông tin',
    semesters: [
      {
        year: 1,
        sem: 1,
        title: 'Học kỳ 1 (Năm 1) — Nhập môn & Khoa học Cơ bản',
        courses: [
          { code: 'MATH101', name: 'Đại số tuyến tính & Hình học giải tích', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
          { code: 'MATH102', name: 'Giải tích 1', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
          { code: 'PHIL101', name: 'Triết học Mác - Lênin', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
          { code: 'ENGL101', name: 'Tiếng Anh học thuật 1', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
          { code: 'IT101',   name: 'Nhập môn Công nghệ Thông tin & Kỹ năng số', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
        ]
      },
      {
        year: 1,
        sem: 2,
        title: 'Học kỳ 2 (Năm 1) — Nền tảng Lập trình & Cơ sở Tự nhiên',
        courses: [
          { code: 'MATH103', name: 'Giải tích 2', credits: 3, type: 'Bắt buộc', prereq: 'MATH102' },
          { code: 'PHYS101', name: 'Vật lý đại cương (Điện - Từ & Quang học)', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
          { code: 'PHIL102', name: 'Kinh tế chính trị Mác - Lênin', credits: 2, type: 'Bắt buộc', prereq: 'PHIL101' },
          { code: 'PROG101', name: 'Cơ sở lập trình C/C++', credits: 4, type: 'Bắt buộc', prereq: 'IT101' },
          { code: 'MATH104', name: 'Toán rời rạc & Lý thuyết đồ thị', credits: 3, type: 'Bắt buộc', prereq: 'MATH101' },
          { code: 'ENGL102', name: 'Tiếng Anh học thuật 2', credits: 3, type: 'Bắt buộc', prereq: 'ENGL101' },
        ]
      },
      {
        year: 2,
        sem: 1,
        title: 'Học kỳ 3 (Năm 2) — Cấu trúc dữ liệu & Kiến trúc máy tính',
        courses: [
          { code: 'CS201',   name: 'Cấu trúc dữ liệu & Giải thuật', credits: 4, type: 'Bắt buộc', prereq: 'PROG101' },
          { code: 'CS202',   name: 'Kiến trúc máy tính & Hợp ngữ', credits: 3, type: 'Bắt buộc', prereq: 'PHYS101' },
          { code: 'MATH201', name: 'Xác suất thống kê & Ứng dụng', credits: 3, type: 'Bắt buộc', prereq: 'MATH103' },
          { code: 'PHIL201', name: 'Chủ nghĩa xã hội khoa học', credits: 2, type: 'Bắt buộc', prereq: 'PHIL102' },
          { code: 'PROG201', name: 'Lập trình hướng đối tượng (Java / C#)', credits: 4, type: 'Bắt buộc', prereq: 'PROG101' },
          { code: 'ENGL201', name: 'Tiếng Anh chuyên ngành CNTT', credits: 3, type: 'Bắt buộc', prereq: 'ENGL102' },
        ]
      },
      {
        year: 2,
        sem: 2,
        title: 'Học kỳ 4 (Năm 2) — Cơ sở dữ liệu & Hệ điều hành',
        courses: [
          { code: 'DB201',   name: 'Hệ quản trị Cơ sở dữ liệu & SQL', credits: 4, type: 'Bắt buộc', prereq: 'CS201' },
          { code: 'OS201',   name: 'Hệ điều hành & Lập trình hệ thống', credits: 3, type: 'Bắt buộc', prereq: 'CS202' },
          { code: 'NET201',  name: 'Mạng máy tính & Truyền thông dữ liệu', credits: 3, type: 'Bắt buộc', prereq: 'CS202' },
          { code: 'PHIL202', name: 'Tư tưởng Hồ Chí Minh', credits: 2, type: 'Bắt buộc', prereq: 'PHIL201' },
          { code: 'WEB201',  name: 'Phát triển ứng dụng Web Frontend (HTML5/CSS3/JS)', credits: 3, type: 'Tự chọn', prereq: 'PROG201' },
          { code: 'UIUX201', name: 'Thiết kế giao diện người dùng UI/UX', credits: 2, type: 'Tự chọn', prereq: 'Không' },
        ]
      },
      {
        year: 3,
        sem: 1,
        title: 'Học kỳ 5 (Năm 3) — Kỹ thuật phần mềm & Trí tuệ nhân tạo',
        courses: [
          { code: 'SE301',   name: 'Kỹ thuật Phần mềm & Phân tích hệ thống', credits: 3, type: 'Bắt buộc', prereq: 'DB201' },
          { code: 'AI301',   name: 'Nhập môn Trí tuệ Nhân tạo (AI)', credits: 3, type: 'Bắt buộc', prereq: 'CS201, MATH201' },
          { code: 'SEC301',  name: 'An toàn thông tin & Mật mã học', credits: 3, type: 'Bắt buộc', prereq: 'NET201' },
          { code: 'WEB301',  name: 'Công nghệ Web nâng cao & RESTful API (Backend)', credits: 3, type: 'Tự chọn', prereq: 'WEB201, DB201' },
          { code: 'PHIL301', name: 'Lịch sử Đảng Cộng sản Việt Nam', credits: 2, type: 'Bắt buộc', prereq: 'PHIL202' },
          { code: 'MOB301',  name: 'Lập trình ứng dụng Di động (Flutter / Android)', credits: 3, type: 'Tự chọn', prereq: 'PROG201' },
        ]
      },
      {
        year: 3,
        sem: 2,
        title: 'Học kỳ 6 (Năm 3) — Điện toán đám mây & Thực tập Doanh nghiệp 1',
        courses: [
          { code: 'CLOUD301',name: 'Điện toán Đám mây & Kiến trúc Microservices', credits: 3, type: 'Bắt buộc', prereq: 'NET201, OS201' },
          { code: 'ML301',   name: 'Học máy & Khai phá dữ liệu (Machine Learning)', credits: 3, type: 'Tự chọn', prereq: 'AI301' },
          { code: 'PM301',   name: 'Quản trị dự án CNTT & Phương pháp Agile/Scrum', credits: 3, type: 'Bắt buộc', prereq: 'SE301' },
          { code: 'DEVOPS301',name: 'Quy trình CI/CD & Thực hành DevOps (Docker, K8s)', credits: 3, type: 'Tự chọn', prereq: 'CLOUD301' },
          { code: 'INT301',  name: 'Thực tập chuyên ngành tại Doanh nghiệp', credits: 3, type: 'Bắt buộc', prereq: 'Tích lũy >= 80 TC' },
        ]
      },
      {
        year: 4,
        sem: 1,
        title: 'Học kỳ 7 (Năm 4) — Đồ án Chuyên ngành & Công nghệ Mới',
        courses: [
          { code: 'PROJ401', name: 'Đồ án Chuyên ngành Công nghệ Thông tin', credits: 3, type: 'Bắt buộc', prereq: 'SE301, DB201' },
          { code: 'BIGDATA401', name: 'Xử lý Dữ liệu lớn (Big Data Analytics)', credits: 3, type: 'Tự chọn', prereq: 'DB201, CS201' },
          { code: 'IOT401',  name: 'Internet vạn vật (IoT) & Hệ thống nhúng', credits: 3, type: 'Tự chọn', prereq: 'NET201, OS201' },
          { code: 'LAW401',  name: 'Pháp luật đại cương & Đạo đức nghề nghiệp CNTT', credits: 2, type: 'Bắt buộc', prereq: 'Không' },
          { code: 'SEC401',  name: 'Bảo mật Ứng dụng & Kiểm thử xâm nhập', credits: 3, type: 'Tự chọn', prereq: 'SEC301' },
        ]
      },
      {
        year: 4,
        sem: 2,
        title: 'Học kỳ 8 (Năm 4) — Thực tập Tốt nghiệp & Khóa luận Cử nhân',
        courses: [
          { code: 'CAP401',  name: 'Thực tập Tốt nghiệp tại Doanh nghiệp công nghệ', credits: 5, type: 'Bắt buộc', prereq: 'Tích lũy >= 110 TC' },
          { code: 'THESIS401', name: 'Khóa luận Tốt nghiệp Đại học / Đồ án Capstone', credits: 7, type: 'Bắt buộc', prereq: 'Tích lũy >= 120 TC, GPA >= 2.5' },
        ]
      }
    ]
  },

  'Kỹ thuật Điều khiển & Tự động hóa': {
    code: 'AUTO',
    faculty: 'Khoa Điện - Tự động hóa',
    totalCredits: 145,
    degree: 'Kỹ sư Điều khiển & Tự động hóa',
    semesters: [
      {
        year: 1,
        sem: 1,
        title: 'Học kỳ 1 (Năm 1) — Cơ sở Toán lý & Nhập môn Kỹ thuật',
        courses: [
          { code: 'MATH101', name: 'Đại số tuyến tính', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
          { code: 'MATH102', name: 'Giải tích 1', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
          { code: 'PHYS101', name: 'Vật lý đại cương 1 (Cơ - Nhiệt)', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
          { code: 'PHIL101', name: 'Triết học Mác - Lênin', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
          { code: 'AUTO101', name: 'Nhập môn Kỹ thuật Điều khiển', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
        ]
      },
      {
        year: 1,
        sem: 2,
        title: 'Học kỳ 2 (Năm 1) — Vật lý Kỹ thuật & Lập trình C',
        courses: [
          { code: 'MATH103', name: 'Giải tích 2', credits: 3, type: 'Bắt buộc', prereq: 'MATH102' },
          { code: 'PHYS102', name: 'Vật lý đại cương 2 (Điện - Từ)', credits: 3, type: 'Bắt buộc', prereq: 'PHYS101' },
          { code: 'PROG101', name: 'Kỹ thuật lập trình C cho hệ nhúng', credits: 3, type: 'Bắt buộc', prereq: 'AUTO101' },
          { code: 'DRAW101', name: 'Vẽ kỹ thuật & AutoCad 2D/3D', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
          { code: 'ENGL101', name: 'Tiếng Anh học thuật 1', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
        ]
      },
      {
        year: 2,
        sem: 1,
        title: 'Học kỳ 3 (Năm 2) — Mạch điện & Kỹ thuật điện tử',
        courses: [
          { code: 'ELEC201', name: 'Lý thuyết Mạch điện 1', credits: 3, type: 'Bắt buộc', prereq: 'PHYS102' },
          { code: 'ELEC202', name: 'Kỹ thuật Điện tử tương tự', credits: 3, type: 'Bắt buộc', prereq: 'PHYS102' },
          { code: 'MATH202', name: 'Toán chuyên ngành Tự động hóa', credits: 3, type: 'Bắt buộc', prereq: 'MATH103' },
          { code: 'PHIL102', name: 'Kinh tế chính trị Mác - Lênin', credits: 2, type: 'Bắt buộc', prereq: 'PHIL101' },
          { code: 'ENGL102', name: 'Tiếng Anh học thuật 2', credits: 3, type: 'Bắt buộc', prereq: 'ENGL101' },
        ]
      },
      {
        year: 2,
        sem: 2,
        title: 'Học kỳ 4 (Năm 2) — Lý thuyết điều khiển & Điện tử số',
        courses: [
          { code: 'CTRL201', name: 'Lý thuyết Điều khiển tự động 1 (Tuyến tính)', credits: 4, type: 'Bắt buộc', prereq: 'MATH202' },
          { code: 'DIGI201', name: 'Kỹ thuật Điện tử số', credits: 3, type: 'Bắt buộc', prereq: 'ELEC202' },
          { code: 'ELEC203', name: 'Khí cụ điện & Đo lường cảm biến', credits: 3, type: 'Bắt buộc', prereq: 'ELEC201' },
          { code: 'PHIL201', name: 'Chủ nghĩa xã hội khoa học', credits: 2, type: 'Bắt buộc', prereq: 'PHIL102' },
          { code: 'SIM201',  name: 'Mô phỏng Matlab/Simulink trong điều khiển', credits: 3, type: 'Bắt buộc', prereq: 'MATH202' },
        ]
      },
      {
        year: 3,
        sem: 1,
        title: 'Học kỳ 5 (Năm 3) — Vi điều khiển & Điều khiển công nghiệp',
        courses: [
          { code: 'MCU301',  name: 'Hệ thống Vi điều khiển (ARM / STM32)', credits: 4, type: 'Bắt buộc', prereq: 'DIGI201, PROG101' },
          { code: 'PLC301',  name: 'Điều khiển lập trình PLC cơ bản & nâng cao', credits: 4, type: 'Bắt buộc', prereq: 'ELEC203' },
          { code: 'CTRL301', name: 'Lý thuyết Điều khiển tự động 2 (Phi tuyến / Rời rạc)', credits: 3, type: 'Bắt buộc', prereq: 'CTRL201' },
          { code: 'POWER301',name: 'Điện tử công suất & Truyền động điện', credits: 3, type: 'Bắt buộc', prereq: 'ELEC202' },
          { code: 'PHIL202', name: 'Tư tưởng Hồ Chí Minh', credits: 2, type: 'Bắt buộc', prereq: 'PHIL201' },
        ]
      },
      {
        year: 3,
        sem: 2,
        title: 'Học kỳ 6 (Năm 3) — SCADA & Robot công nghiệp',
        courses: [
          { code: 'SCADA301',name: 'Hệ thống giám sát SCADA & Mạng truyền thông công nghiệp', credits: 4, type: 'Bắt buộc', prereq: 'PLC301' },
          { code: 'ROBOT301',name: 'Kỹ thuật Robot Công nghiệp & Cánh tay máy', credits: 3, type: 'Bắt buộc', prereq: 'CTRL301' },
          { code: 'AICTRL301',name: 'Hệ mờ & Mạng nơ-ron ứng dụng trong điều khiển', credits: 3, type: 'Tự chọn', prereq: 'CTRL301' },
          { code: 'INT302',  name: 'Thực tập Kỹ thuật tại Nhà máy / KCN', credits: 3, type: 'Bắt buộc', prereq: 'Tích lũy >= 85 TC' },
        ]
      },
      {
        year: 4,
        sem: 1,
        title: 'Học kỳ 7 (Năm 4) — Đồ án Tự động hóa & Nhà máy thông minh',
        courses: [
          { code: 'PROJ402', name: 'Đồ án Hệ thống Tự động hóa công nghiệp', credits: 3, type: 'Bắt buộc', prereq: 'PLC301, SCADA301' },
          { code: 'SMART401',name: 'Tự động hóa tòa nhà (BMS) & Nhà máy thông minh (IIoT)', credits: 3, type: 'Tự chọn', prereq: 'SCADA301' },
          { code: 'PHIL301', name: 'Lịch sử Đảng Cộng sản Việt Nam', credits: 2, type: 'Bắt buộc', prereq: 'PHIL202' },
          { code: 'SAFETY401', name: 'An toàn lao động & Tiêu chuẩn công nghiệp', credits: 2, type: 'Bắt buộc', prereq: 'Không' },
        ]
      },
      {
        year: 4,
        sem: 2,
        title: 'Học kỳ 8 (Năm 4) — Thực tập Tốt nghiệp & Đồ án Kỹ sư',
        courses: [
          { code: 'CAP402',  name: 'Thực tập Tốt nghiệp Kỹ sư tại Doanh nghiệp', credits: 5, type: 'Bắt buộc', prereq: 'Tích lũy >= 115 TC' },
          { code: 'THESIS402', name: 'Đồ án Tốt nghiệp Kỹ sư Tự động hóa', credits: 8, type: 'Bắt buộc', prereq: 'Tích lũy >= 125 TC' },
        ]
      }
    ]
  },

  'Quản trị Kinh doanh': {
    code: 'BA',
    faculty: 'Khoa Quản trị Kinh doanh',
    totalCredits: 132,
    degree: 'Cử nhân Quản trị Kinh doanh',
    semesters: [
      {
        year: 1,
        sem: 1,
        title: 'Học kỳ 1 (Năm 1) — Kinh tế đại cương & Nhập môn Quản trị',
        courses: [
          { code: 'ECON101', name: 'Kinh tế vi mô', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
          { code: 'MATH105', name: 'Toán cao cấp cho các nhà kinh tế', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
          { code: 'PHIL101', name: 'Triết học Mác - Lênin', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
          { code: 'MGT101',  name: 'Nhập môn Quản trị học', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
          { code: 'ENGL101', name: 'Tiếng Anh thương mại 1', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
        ]
      },
      {
        year: 1,
        sem: 2,
        title: 'Học kỳ 2 (Năm 1) — Kinh tế vĩ mô & Marketing căn bản',
        courses: [
          { code: 'ECON102', name: 'Kinh tế vĩ mô', credits: 3, type: 'Bắt buộc', prereq: 'ECON101' },
          { code: 'MKT101',  name: 'Nguyên lý Marketing', credits: 3, type: 'Bắt buộc', prereq: 'MGT101' },
          { code: 'ACC101',  name: 'Nguyên lý Kế toán', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
          { code: 'PHIL102', name: 'Kinh tế chính trị Mác - Lênin', credits: 2, type: 'Bắt buộc', prereq: 'PHIL101' },
          { code: 'STAT101', name: 'Thống kê ứng dụng trong kinh doanh', credits: 3, type: 'Bắt buộc', prereq: 'MATH105' },
          { code: 'ENGL102', name: 'Tiếng Anh thương mại 2', credits: 3, type: 'Bắt buộc', prereq: 'ENGL101' },
        ]
      },
      {
        year: 2,
        sem: 1,
        title: 'Học kỳ 3 (Năm 2) — Tài chính & Quản trị Nhân sự',
        courses: [
          { code: 'FIN201',  name: 'Tài chính Doanh nghiệp', credits: 3, type: 'Bắt buộc', prereq: 'ACC101' },
          { code: 'HRM201',  name: 'Quản trị Nguồn nhân lực', credits: 3, type: 'Bắt buộc', prereq: 'MGT101' },
          { code: 'OB201',   name: 'Hành vi Tổ chức (Organizational Behavior)', credits: 3, type: 'Bắt buộc', prereq: 'MGT101' },
          { code: 'LAW201',  name: 'Luật Kinh tế & Thương mại', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
          { code: 'PHIL201', name: 'Chủ nghĩa xã hội khoa học', credits: 2, type: 'Bắt buộc', prereq: 'PHIL102' },
        ]
      },
      {
        year: 2,
        sem: 2,
        title: 'Học kỳ 4 (Năm 2) — Vận hành chuỗi cung ứng & Nghiên cứu thị trường',
        courses: [
          { code: 'SCM201',  name: 'Quản trị Chuỗi cung ứng & Logistics', credits: 3, type: 'Bắt buộc', prereq: 'MGT101' },
          { code: 'RES201',  name: 'Phương pháp Nghiên cứu Kinh doanh', credits: 3, type: 'Bắt buộc', prereq: 'STAT101' },
          { code: 'DIGI202', name: 'Thương mại Điện tử & Kinh doanh số', credits: 3, type: 'Tự chọn', prereq: 'MKT101' },
          { code: 'PHIL202', name: 'Tư tưởng Hồ Chí Minh', credits: 2, type: 'Bắt buộc', prereq: 'PHIL201' },
          { code: 'COMM201', name: 'Kỹ năng Giao tiếp & Đàm phán kinh doanh', credits: 3, type: 'Bắt buộc', prereq: 'MGT101' },
        ]
      },
      {
        year: 3,
        sem: 1,
        title: 'Học kỳ 5 (Năm 3) — Quản trị Chiến lược & Đổi mới sáng tạo',
        courses: [
          { code: 'STRAT301',name: 'Quản trị Chiến lược Doanh nghiệp', credits: 3, type: 'Bắt buộc', prereq: 'FIN201, MKT101' },
          { code: 'ENT301',  name: 'Khởi sự Doanh nghiệp & Đổi mới sáng tạo', credits: 3, type: 'Bắt buộc', prereq: 'MGT101' },
          { code: 'INTBUS301', name: 'Kinh doanh Quốc tế', credits: 3, type: 'Bắt buộc', prereq: 'ECON102' },
          { code: 'CRM301',  name: 'Quản trị Quan hệ Khách hàng (CRM)', credits: 3, type: 'Tự chọn', prereq: 'MKT101' },
          { code: 'PHIL301', name: 'Lịch sử Đảng Cộng sản Việt Nam', credits: 2, type: 'Bắt buộc', prereq: 'PHIL202' },
        ]
      },
      {
        year: 3,
        sem: 2,
        title: 'Học kỳ 6 (Năm 3) — Quản trị Rủi ro & Thực tập Dự án',
        courses: [
          { code: 'RISK301', name: 'Quản trị Rủi ro Doanh nghiệp', credits: 3, type: 'Bắt buộc', prereq: 'FIN201' },
          { code: 'BRAND301',name: 'Quản trị Thương hiệu & Truyền thông tích hợp', credits: 3, type: 'Tự chọn', prereq: 'MKT101' },
          { code: 'LEAD301', name: 'Nghệ thuật Lãnh đạo trong Kỷ nguyên số', credits: 3, type: 'Tự chọn', prereq: 'OB201' },
          { code: 'INT303',  name: 'Thực tập nghiệp vụ Quản trị Doanh nghiệp', credits: 3, type: 'Bắt buộc', prereq: 'Tích lũy >= 75 TC' },
        ]
      },
      {
        year: 4,
        sem: 1,
        title: 'Học kỳ 7 (Năm 4) — Đồ án Kế hoạch Kinh doanh & Chuyên đề',
        courses: [
          { code: 'PLAN401', name: 'Đồ án Lập Kế hoạch Kinh doanh (Business Plan)', credits: 3, type: 'Bắt buộc', prereq: 'STRAT301, FIN201' },
          { code: 'CORP401', name: 'Quản trị Công ty & Văn hóa Doanh nghiệp', credits: 3, type: 'Bắt buộc', prereq: 'MGT101' },
          { code: 'TAX401',  name: 'Thuế và Hoạch định Thuế Doanh nghiệp', credits: 3, type: 'Tự chọn', prereq: 'ACC101' },
        ]
      },
      {
        year: 4,
        sem: 2,
        title: 'Học kỳ 8 (Năm 4) — Thực tập Tốt nghiệp & Khóa luận Cử nhân',
        courses: [
          { code: 'CAP403',  name: 'Thực tập Tốt nghiệp tại Doanh nghiệp / Tập đoàn', credits: 5, type: 'Bắt buộc', prereq: 'Tích lũy >= 105 TC' },
          { code: 'THESIS403', name: 'Khóa luận Tốt nghiệp Cử nhân Quản trị Kinh doanh', credits: 7, type: 'Bắt buộc', prereq: 'Tích lũy >= 115 TC' },
        ]
      }
    ]
  },

  'Ngôn ngữ Anh': {
    code: 'ENG',
    faculty: 'Khoa Tiếng Anh Chuyên ngành',
    totalCredits: 130,
    degree: 'Cử nhân Ngôn ngữ Anh',
    semesters: [
      {
        year: 1,
        sem: 1,
        title: 'Học kỳ 1 (Năm 1) — Ngữ âm & Kỹ năng Cơ bản',
        courses: [
          { code: 'PHON101', name: 'Ngữ âm & Âm vị học tiếng Anh (Phonetics)', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
          { code: 'SKILL101', name: 'Nghe - Nói tiếng Anh học thuật 1', credits: 4, type: 'Bắt buộc', prereq: 'Không' },
          { code: 'SKILL102', name: 'Đọc - Viết tiếng Anh học thuật 1', credits: 4, type: 'Bắt buộc', prereq: 'Không' },
          { code: 'PHIL101', name: 'Triết học Mác - Lênin', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
          { code: 'IT102',   name: 'Tin học ứng dụng văn phòng', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
        ]
      },
      {
        year: 1,
        sem: 2,
        title: 'Học kỳ 2 (Năm 1) — Ngữ pháp & Kỹ năng Nâng cao',
        courses: [
          { code: 'GRAM101', name: 'Ngữ pháp tiếng Anh nâng cao (Advanced Grammar)', credits: 3, type: 'Bắt buộc', prereq: 'PHON101' },
          { code: 'SKILL103', name: 'Nghe - Nói tiếng Anh học thuật 2', credits: 4, type: 'Bắt buộc', prereq: 'SKILL101' },
          { code: 'SKILL104', name: 'Đọc - Viết tiếng Anh học thuật 2', credits: 4, type: 'Bắt buộc', prereq: 'SKILL102' },
          { code: 'PHIL102', name: 'Kinh tế chính trị Mác - Lênin', credits: 2, type: 'Bắt buộc', prereq: 'PHIL101' },
          { code: 'COMM102', name: 'Kỹ năng Thuyết trình & Diễn thuyết công chúng', credits: 3, type: 'Bắt buộc', prereq: 'SKILL101' },
        ]
      },
      {
        year: 2,
        sem: 1,
        title: 'Học kỳ 3 (Năm 2) — Dẫn luận Ngôn ngữ học & Giao tiếp Liên văn hóa',
        courses: [
          { code: 'LING201', name: 'Dẫn luận Ngôn ngữ học (Introduction to Linguistics)', credits: 3, type: 'Bắt buộc', prereq: 'GRAM101' },
          { code: 'CULT201', name: 'Giao tiếp Liên văn hóa (Intercultural Communication)', credits: 3, type: 'Bắt buộc', prereq: 'SKILL103' },
          { code: 'TRANS201',name: 'Lý thuyết Dịch thuật & Thực hành biên dịch cơ bản', credits: 4, type: 'Bắt buộc', prereq: 'SKILL104' },
          { code: 'PHIL201', name: 'Chủ nghĩa xã hội khoa học', credits: 2, type: 'Bắt buộc', prereq: 'PHIL102' },
          { code: 'LANG2_1', name: 'Ngoại ngữ 2 (Tiếng Trung / Tiếng Nhật / Tiếng Hàn 1)', credits: 3, type: 'Bắt buộc', prereq: 'Không' },
        ]
      },
      {
        year: 2,
        sem: 2,
        title: 'Học kỳ 4 (Năm 2) — Biên phiên dịch & Văn hóa các nước nói tiếng Anh',
        courses: [
          { code: 'TRANS202',name: 'Kỹ năng Phiên dịch nối tiếp (Consecutive Interpreting)', credits: 4, type: 'Bắt buộc', prereq: 'TRANS201' },
          { code: 'BRIT201', name: 'Đất nước & Văn hóa Vương quốc Anh và Hoa Kỳ', credits: 3, type: 'Bắt buộc', prereq: 'CULT201' },
          { code: 'LIT201',  name: 'Văn học Anh - Mỹ đại cương', credits: 3, type: 'Bắt buộc', prereq: 'SKILL104' },
          { code: 'PHIL202', name: 'Tư tưởng Hồ Chí Minh', credits: 2, type: 'Bắt buộc', prereq: 'PHIL201' },
          { code: 'LANG2_2', name: 'Ngoại ngữ 2 (Tiếng Trung / Tiếng Nhật / Tiếng Hàn 2)', credits: 3, type: 'Bắt buộc', prereq: 'LANG2_1' },
        ]
      },
      {
        year: 3,
        sem: 1,
        title: 'Học kỳ 5 (Năm 3) — Tiếng Anh Thương mại & Du lịch',
        courses: [
          { code: 'ENG_BUS301', name: 'Tiếng Anh Thương mại & Hợp đồng quốc tế', credits: 4, type: 'Bắt buộc', prereq: 'TRANS201' },
          { code: 'ENG_TOUR301', name: 'Tiếng Anh Du lịch & Khách sạn quốc tế', credits: 3, type: 'Tự chọn', prereq: 'TRANS202' },
          { code: 'MEDIA301', name: 'Tiếng Anh Truyền thông & Báo chí quốc tế', credits: 3, type: 'Tự chọn', prereq: 'SKILL104' },
          { code: 'PHIL301', name: 'Lịch sử Đảng Cộng sản Việt Nam', credits: 2, type: 'Bắt buộc', prereq: 'PHIL202' },
          { code: 'LANG2_3', name: 'Ngoại ngữ 2 (Tiếng Trung / Tiếng Nhật / Tiếng Hàn 3)', credits: 3, type: 'Bắt buộc', prereq: 'LANG2_2' },
        ]
      },
      {
        year: 3,
        sem: 2,
        title: 'Học kỳ 6 (Năm 3) — Phương pháp Giảng dạy (TESOL) & Thực tập 1',
        courses: [
          { code: 'TESOL301',name: 'Phương pháp Giảng dạy tiếng Anh (ELT Methodology)', credits: 4, type: 'Tự chọn', prereq: 'LING201' },
          { code: 'RES302',  name: 'Phương pháp Nghiên cứu Ngôn ngữ học ứng dụng', credits: 3, type: 'Bắt buộc', prereq: 'LING201' },
          { code: 'INT304',  name: 'Thực tập Biên phiên dịch tại Doanh nghiệp / Tổ chức', credits: 3, type: 'Bắt buộc', prereq: 'Tích lũy >= 75 TC' },
        ]
      },
      {
        year: 4,
        sem: 1,
        title: 'Học kỳ 7 (Năm 4) — Đồ án Chuyên ngành & Dịch chuyên sâu',
        courses: [
          { code: 'PROJ403', name: 'Đồ án Nghiên cứu Ứng dụng Ngôn ngữ Anh', credits: 3, type: 'Bắt buộc', prereq: 'RES302' },
          { code: 'ADV_TRANS401', name: 'Dịch thuật Chuyên ngành Kinh tế - Tài chính - Kỹ thuật', credits: 3, type: 'Bắt buộc', prereq: 'ENG_BUS301' },
          { code: 'ETHIC401',name: 'Đạo đức Nghề nghiệp Biên Phiên dịch', credits: 2, type: 'Bắt buộc', prereq: 'Không' },
        ]
      },
      {
        year: 4,
        sem: 2,
        title: 'Học kỳ 8 (Năm 4) — Thực tập Tốt nghiệp & Khóa luận Cử nhân',
        courses: [
          { code: 'CAP404',  name: 'Thực tập Tốt nghiệp tại Doanh nghiệp Đa quốc gia', credits: 5, type: 'Bắt buộc', prereq: 'Tích lũy >= 105 TC' },
          { code: 'THESIS404', name: 'Khóa luận Tốt nghiệp Cử nhân Ngôn ngữ Anh', credits: 7, type: 'Bắt buộc', prereq: 'Tích lũy >= 115 TC' },
        ]
      }
    ]
  }
};

const CurriculumView = {
  currentMajor: 'Công nghệ Thông tin',
  currentYearFilter: 'all',
  searchQuery: '',

  render() {
    const container = document.getElementById('main-content');
    const user = Auth.getCurrentUser();
    if (!user) return;

    // Tự động gán ngành mặc định theo tài khoản của sinh viên
    if (user.department && CURRICULUM_DATA[user.department]) {
      this.currentMajor = user.department;
    } else if (user.department) {
      // Tìm ngành gần khớp nhất
      const match = Object.keys(CURRICULUM_DATA).find(k => k.toLowerCase().includes(user.department.toLowerCase()));
      if (match) this.currentMajor = match;
    }

    container.innerHTML = this.getHTML(user);
    this.attachEvents();

    container.classList.add('fade-in');
    setTimeout(() => container.classList.remove('fade-in'), 300);
  },

  getHTML(user) {
    const majorData = CURRICULUM_DATA[this.currentMajor] || CURRICULUM_DATA['Công nghệ Thông tin'];
    const majorKeys = Object.keys(CURRICULUM_DATA);

    // Tính tổng số tín chỉ theo bộ lọc hoặc toàn khoá
    let allCourses = [];
    majorData.semesters.forEach(s => {
      s.courses.forEach(c => allCourses.push({ ...c, year: s.year, sem: s.sem, semTitle: s.title }));
    });

    const totalCredits = allCourses.reduce((sum, c) => sum + c.credits, 0);
    const requiredCredits = allCourses.filter(c => c.type === 'Bắt buộc').reduce((sum, c) => sum + c.credits, 0);
    const electiveCredits = totalCredits - requiredCredits;

    // Lọc theo năm học
    let displayedSemesters = majorData.semesters;
    if (this.currentYearFilter !== 'all') {
      const targetYear = parseInt(this.currentYearFilter);
      displayedSemesters = majorData.semesters.filter(s => s.year === targetYear);
    }

    // Lọc theo từ khoá tìm kiếm
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      displayedSemesters = displayedSemesters.map(s => {
        const filteredCourses = s.courses.filter(c => 
          c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (c.prereq && c.prereq.toLowerCase().includes(q))
        );
        return { ...s, courses: filteredCourses };
      }).filter(s => s.courses.length > 0);
    }

    return `
      <div class="app-content-container fade-in">
        <!-- HEADER -->
        <div class="page-header" style="margin-bottom: var(--space-4);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div>
              <h1 class="page-title" style="font-size: 1.8rem; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-book-bookmark" style="color: #8b5cf6;"></i> Khung Chương Trình Đào Tạo 4 Năm
              </h1>
              <p class="page-subtitle" style="font-size: 0.95rem; color: var(--text-secondary);">
                Lộ trình chi tiết 8 học kỳ (từ HK1 Năm 1 đến HK2 Năm 4) — Tiêu chuẩn đào tạo Đại học chính quy
              </p>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="badge" style="background: rgba(139, 92, 246, 0.12); color: #7c3aed; font-weight: 700; padding: 6px 14px; border-radius: 8px; font-size: 0.9rem;">
                <i class="fas fa-graduation-cap"></i> ${majorData.degree}
              </span>
            </div>
          </div>
        </div>

        <!-- STATS OVERVIEW CARDS -->
        <div class="grid-row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-4); margin-bottom: var(--space-6);">
          <div class="card" style="padding: 16px; border-left: 4px solid #8b5cf6; display: flex; align-items: center; gap: 14px;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(139, 92, 246, 0.15); color: #7c3aed; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              <i class="fas fa-layer-group"></i>
            </div>
            <div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Tổng số tín chỉ</div>
              <div style="font-size: 1.45rem; font-weight: 800; color: var(--text-primary);">${totalCredits} tín chỉ</div>
            </div>
          </div>

          <div class="card" style="padding: 16px; border-left: 4px solid #10b981; display: flex; align-items: center; gap: 14px;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); color: #059669; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              <i class="fas fa-check-double"></i>
            </div>
            <div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Học phần Bắt buộc</div>
              <div style="font-size: 1.45rem; font-weight: 800; color: #059669;">${requiredCredits} tín chỉ</div>
            </div>
          </div>

          <div class="card" style="padding: 16px; border-left: 4px solid #f59e0b; display: flex; align-items: center; gap: 14px;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(245, 158, 11, 0.15); color: #d97706; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              <i class="fas fa-sliders"></i>
            </div>
            <div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Học phần Tự chọn</div>
              <div style="font-size: 1.45rem; font-weight: 800; color: #d97706;">${electiveCredits} tín chỉ</div>
            </div>
          </div>

          <div class="card" style="padding: 16px; border-left: 4px solid #3b82f6; display: flex; align-items: center; gap: 14px;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(59, 130, 246, 0.15); color: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              <i class="fas fa-calendar-check"></i>
            </div>
            <div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Thời gian đào tạo</div>
              <div style="font-size: 1.45rem; font-weight: 800; color: #2563eb;">4 Năm (8 Học kỳ)</div>
            </div>
          </div>
        </div>

        <!-- CONTROLS TOOLBAR (DROPDOWN CHỌN NGÀNH + TABS NĂM HỌC + TÌM KIẾM) -->
        <div class="card" style="padding: 16px 20px; margin-bottom: var(--space-6); background: var(--bg-surface); border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            
            <!-- DROPDOWN CHỌN NGÀNH -->
            <div style="display: flex; align-items: center; gap: 10px; min-width: 320px;">
              <label for="select-curriculum-major" style="font-weight: 700; font-size: 0.9rem; color: var(--text-primary); white-space: nowrap;">
                <i class="fas fa-diagram-project" style="color: #8b5cf6;"></i> Ngành đào tạo:
              </label>
              <select id="select-curriculum-major" class="form-control" style="font-weight: 600; padding: 8px 14px; border-radius: 8px; border: 1.5px solid var(--primary-500); background: var(--bg-primary); color: var(--text-primary); cursor: pointer;">
                ${majorKeys.map(k => `
                  <option value="${k}" ${k === this.currentMajor ? 'selected' : ''}>
                    ${k} (${CURRICULUM_DATA[k].code})
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- TABS LỌC NĂM HỌC -->
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button class="btn btn-sm ${this.currentYearFilter === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="CurriculumView.setYearFilter('all')" style="border-radius: 6px; font-weight: 600;">
                Tất cả 4 năm
              </button>
              <button class="btn btn-sm ${this.currentYearFilter === '1' ? 'btn-primary' : 'btn-secondary'}" onclick="CurriculumView.setYearFilter('1')" style="border-radius: 6px; font-weight: 600;">
                Năm 1 (HK1-2)
              </button>
              <button class="btn btn-sm ${this.currentYearFilter === '2' ? 'btn-primary' : 'btn-secondary'}" onclick="CurriculumView.setYearFilter('2')" style="border-radius: 6px; font-weight: 600;">
                Năm 2 (HK3-4)
              </button>
              <button class="btn btn-sm ${this.currentYearFilter === '3' ? 'btn-primary' : 'btn-secondary'}" onclick="CurriculumView.setYearFilter('3')" style="border-radius: 6px; font-weight: 600;">
                Năm 3 (HK5-6)
              </button>
              <button class="btn btn-sm ${this.currentYearFilter === '4' ? 'btn-primary' : 'btn-secondary'}" onclick="CurriculumView.setYearFilter('4')" style="border-radius: 6px; font-weight: 600;">
                Năm 4 (HK7-8)
              </button>
            </div>

            <!-- TÌM KIẾM MÔN HỌC -->
            <div style="position: relative; min-width: 240px;">
              <input type="text" id="curriculum-search" class="form-control" placeholder="Tìm môn học, mã môn..." value="${this.searchQuery}" style="padding-left: 36px; border-radius: 8px; font-size: 0.88rem;">
              <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); font-size: 0.85rem;"></i>
            </div>

          </div>
        </div>

        <!-- LIST OF SEMESTERS -->
        <div id="curriculum-semesters-container">
          ${displayedSemesters.length === 0 ? `
            <div class="card" style="text-align: center; padding: 40px; color: var(--text-secondary);">
              <i class="fas fa-search-minus" style="font-size: 2.5rem; margin-bottom: 12px; color: #94a3b8;"></i>
              <p>Không tìm thấy môn học nào khớp với từ khoá "${this.searchQuery}".</p>
            </div>
          ` : displayedSemesters.map(s => {
            const semTotalCredits = s.courses.reduce((sum, c) => sum + c.credits, 0);
            return `
              <div class="card" style="padding: 0; margin-bottom: var(--space-6); overflow: hidden; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
                
                <!-- SEMESTER HEADER -->
                <div style="background: var(--bg-secondary); padding: 14px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="badge" style="background: #8b5cf6; color: white; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 0.8rem;">
                      NĂM ${s.year}
                    </span>
                    <h3 style="margin: 0; font-size: 1.08rem; color: var(--text-primary); font-weight: 700;">
                      ${s.title}
                    </h3>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 0.88rem; color: var(--text-secondary);">
                      Tổng số: <strong style="color: var(--primary-600);">${s.courses.length} học phần</strong>
                    </span>
                    <span class="badge" style="background: rgba(16, 185, 129, 0.12); color: #059669; font-weight: 700; padding: 3px 10px; border-radius: 6px; font-size: 0.85rem;">
                      ${semTotalCredits} Tín chỉ
                    </span>
                  </div>
                </div>

                <!-- TABLE OF COURSES -->
                <div style="overflow-x: auto;">
                  <table class="table" style="width: 100%; border-collapse: collapse; margin: 0;">
                    <thead style="background: var(--bg-surface); border-bottom: 1px solid var(--border-color);">
                      <tr>
                        <th style="padding: 12px 16px; text-align: left; width: 14%; font-size: 0.78rem; text-transform: uppercase; color: var(--text-secondary);">Mã Học Phần</th>
                        <th style="padding: 12px 16px; text-align: left; width: 44%; font-size: 0.78rem; text-transform: uppercase; color: var(--text-secondary);">Tên Môn Học / Học Phần</th>
                        <th style="padding: 12px 16px; text-align: center; width: 12%; font-size: 0.78rem; text-transform: uppercase; color: var(--text-secondary);">Số Tín Chỉ</th>
                        <th style="padding: 12px 16px; text-align: center; width: 14%; font-size: 0.78rem; text-transform: uppercase; color: var(--text-secondary);">Phân Loại</th>
                        <th style="padding: 12px 16px; text-align: left; width: 16%; font-size: 0.78rem; text-transform: uppercase; color: var(--text-secondary);">Môn Tiên Quyết</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${s.courses.map(c => {
                        const isRequired = c.type === 'Bắt buộc';
                        return `
                          <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 12px 16px; font-family: monospace; font-weight: 700; color: #2563eb;">
                              ${c.code}
                            </td>
                            <td style="padding: 12px 16px; font-weight: 600; color: var(--text-primary);">
                              ${c.name}
                            </td>
                            <td style="padding: 12px 16px; text-align: center; font-weight: 700; color: var(--primary-600);">
                              ${c.credits} TC
                            </td>
                            <td style="padding: 12px 16px; text-align: center;">
                              <span class="badge" style="background: ${isRequired ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)'}; color: ${isRequired ? '#2563eb' : '#d97706'}; font-weight: 600; padding: 2px 8px; border-radius: 4px; font-size: 0.78rem;">
                                ${c.type}
                              </span>
                            </td>
                            <td style="padding: 12px 16px; color: ${c.prereq === 'Không' ? 'var(--text-tertiary)' : '#dc2626'}; font-size: 0.85rem; font-family: ${c.prereq === 'Không' ? 'inherit' : 'monospace'}; font-weight: ${c.prereq === 'Không' ? 'normal' : '600'};">
                              ${c.prereq}
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>

              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;
  },

  attachEvents() {
    // Dropdown chọn ngành
    const majorSelect = document.getElementById('select-curriculum-major');
    if (majorSelect) {
      majorSelect.addEventListener('change', (e) => {
        this.currentMajor = e.target.value;
        this.render();
      });
    }

    // Input tìm kiếm môn học
    const searchInput = document.getElementById('curriculum-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        this.render();
      });
    }
  },

  setYearFilter(year) {
    this.currentYearFilter = year;
    this.render();
  }
};
