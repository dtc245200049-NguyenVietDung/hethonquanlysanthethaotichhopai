# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG QUẢN LÝ SÂN THỂ THAO TÍCH HỢP AI (SPORTAI)
## TÀI LIỆU HƯỚNG DẪN NGƯỜI DÙNG & VẬN HÀNH HỆ THỐNG – V1.0

> **Dự án:** Hệ thống Quản lý Sân Thể Thao Tích hợp AI (SportAI)  
> **Sinh viên thực hiện:** Hoàng Hữu Đạt (Mã sinh viên: DTC245200049)  
> **Phiên bản:** 1.0 (Phát hành chính thức)  
> **Ngày ban hành:** 28/10/2026

---

## MỤC LỤC TỔNG QUAN

1. [**GIỚI THIỆU ỨNG DỤNG**](#1-giới-thiệu-ứng-dụng)
2. [**CẤU HÌNH PHẦN CỨNG - PHẦN MỀM**](#2-cấu-hình-phần-cứng---phần-mềm)
   - [2.1 Cấu hình Phần cứng](#21-cấu-hình-phần-cứng)
   - [2.2 Cấu hình Phần mềm](#22-cấu-hình-phần-mềm)
3. [**CÁC CHỨC NĂNG CHÍNH THEO 3 TÁC NHÂN (ACTORS)**](#3-các-chức-năng-chính-theo-3-tác-nhân-actors)
   - [3.1 Chức năng Dành cho Khách hàng / Người chơi (Customer)](#31-chức-năng-dành-cho-khách-hàng--người-chơi-customer)
   - [3.2 Chức năng Dành cho Quản trị viên / Chủ sân (Admin)](#32-chức-năng-dành-cho-quản-trị-viên--chủ-sân-admin)
   - [3.3 Chức năng Dành cho Kỹ sư Vận hành & Triển khai (DevOps / Engineer)](#33-chức-năng-dành-cho-kỹ-sư-vận-hành--triển-khai-devops--engineer)

---

## 1. GIỚI THIỆU ỨNG DỤNG

**SportAI** là nền tảng quản trị và vận hành cụm sân thể thao thông minh thế hệ mới, kết hợp sức mạnh của **Mô hình Ngôn ngữ Lớn (Gemini 1.5/2.0 Flash)** với quy trình nghiệp vụ thời gian thực (Real-time Booking & Management). 

Hệ thống giải quyết triệt để 3 bài toán nhức nhối của các cụm sân truyền thống:
1. **Triệt tiêu hiện tượng Đặt trùng lịch (Overbooking):** Ứng dụng cơ chế tiền kiểm tra (Pre-check Query) khóa khung giờ xung đột với mã lỗi HTTP `409 Conflict`.
2. **Trợ lý AI Tư vấn Đặt sân & Bảng giá Động 24/7:** Khách hàng trò chuyện tự nhiên với Chatbot để tra cứu lịch sân trống, tính toán chi phí theo số lượng người, và đề xuất đặt sân ngay lập tức qua Function Calling.
3. **Báo cáo Doanh thu Tự động & Quản trị Rảnh tay cho Chủ sân:** Tự động tạo hóa đơn khi duyệt đơn, tích hợp thanh lệnh AI hỗ trợ tự động duyệt đơn (Auto-Approve Agent) và kích hoạt chiến dịch giảm giá Flash Sale linh hoạt.

---

## 2. CẤU HÌNH PHẦN CỨNG - PHẦN MỀM

### 2.1. Cấu hình Phần cứng

| Thành phần | Cấu hình Tối thiểu (Minimum) | Cấu hình Khuyến nghị (Recommended) |
| :--- | :--- | :--- |
| **Thiết bị Đầu cuối (Client)** | Mọi máy tính PC, Laptop, Tablet hoặc Smartphone có trình duyệt hiện đại. | Màn hình độ phân giải Full HD (1920x1080) để trải nghiệm tối ưu Dashboard. |
| **Máy chủ Ứng dụng (Server)** | CPU 2 Cores, RAM 4 GB, Ổ cứng SSD 20 GB. | CPU 4 Cores, RAM 8-16 GB, SSD NVMe tốc độ cao. |
| **Kết nối Mạng** | Băng thông Internet tối thiểu 10 Mbps. | Đường truyền cáp quang ổn định >= 50 Mbps để gọi Gemini API mượt mà. |

---

### 2.2. Cấu hình Phần mềm

| Danh mục | Công nghệ / Phần mềm Yêu cầu |
| :--- | :--- |
| **Trình duyệt Web Hỗ trợ** | Google Chrome (từ v110 trở lên), Microsoft Edge, Mozilla Firefox, Apple Safari. |
| **Nền tảng Máy chủ** | Node.js v20.x hoặc v24.x LTS (Tích hợp sẵn bộ quản lý gói `npm`). |
| **Cơ sở Dữ liệu** | SQLite 3 (`backend/database.db`) không yêu cầu cài đặt server CSDL cồng kềnh. |
| **Môi trường Container (Tùy chọn)** | Docker Engine v24.x trở lên và Docker Compose v2.x. |

---

## 3. CÁC CHỨC NĂNG CHÍNH THEO 3 TÁC NHÂN (ACTORS)

### 3.1. Chức năng Dành cho Khách hàng / Người chơi (Customer)

Khách hàng truy cập vào hệ thống tại địa chỉ trang chủ: `http://localhost:5173/`

#### 1. Tra cứu Danh mục Sân Thể Thao
- **Giao diện:** Ngay tại màn hình chính, hệ thống hiển thị danh sách toàn bộ các sân bóng đang hoạt động (`Sân Trung Tâm A1`, `Sân Tập B2`, `Sân VIP C3`).
- **Thông tin chi tiết:** Mỗi thẻ sân bao gồm: Ảnh chụp thực tế chất lượng cao, Quy mô sân (Sân 5 người, Sân 7 người), và Đơn giá thuê niêm yết chuẩn `VNĐ/h` (Ví dụ: `250.000 VNĐ/h`).

#### 2. Thao tác Đặt sân Trực tuyến & Cơ chế Phòng ngừa Trùng lịch
- **Bước 1:** Khách hàng sử dụng bộ chọn ngày (Date Picker) để chọn ngày đá bóng mong muốn.
- **Bước 2:** Chọn một sân trong danh sách bằng cách nhấp chuột vào thẻ sân.
- **Bước 3:** Lựa chọn một trong các khung giờ phục vụ (Ví dụ: `17:00 - 18:00`, `18:00 - 19:30`, `19:00 - 20:30`, `20:30 - 22:00`).
- **Bước 4:** Nhập họ tên khách hàng hoặc tên đội bóng vào ô "Tên khách hàng / Đội bóng".
- **Bước 5:** Nhấn nút **"Xác Nhận Đặt Sân Ngay"**.
- **Xử lý phản hồi từ hệ thống:**
  - *Trường hợp 1 (Thành công):* Xuất hiện hộp thông báo màu xanh `🎉 Đã gửi yêu cầu đặt sân thành công! Mã đơn: #X. Vui lòng chờ quản lý duyệt.` (Mã HTTP `201 Created`).
  - *Trường hợp 2 (Trùng lịch - Overbooking Conflict):* Nếu khung giờ đó đã có người khác đặt trước, hệ thống hiển thị hộp cảnh báo màu đỏ: `⚠️ Khung giờ này sân đã có người đặt trước. Vui lòng chọn giờ hoặc sân khác!` (Mã HTTP `409 Conflict`).

#### 3. Sử dụng Trợ lý Ảo AI Chatbot 24/7
- **Mở cửa sổ Chatbot:** Nhấn vào biểu tượng tròn màu xanh nổi ở góc dưới bên phải màn hình.
- **Các kịch bản hỏi đáp tự nhiên được hỗ trợ:**
  - *Tra cứu sân trống:* Gõ `"Tối nay 18h còn sân nào trống không?"` -> AI tự động quét CSDL và trả về bảng danh sách sân còn trống.
  - *Hỏi bảng giá:* Gõ `"Giá các sân bóng như thế nào?"` -> AI trích xuất bảng giá niêm yết chính xác từ SQLite.
  - *Tư vấn theo số người:* Gõ `"Đoàn mình 12 người thì nên thuê sân nào hợp lý?"` -> AI gợi ý Sân 7 người và tính chi phí bình quân mỗi người.
  - *Đặt sân trực tiếp từ Chatbot:* Gõ `"Đặt sân 7 lúc 19h"` -> AI trực tiếp gọi API đặt chỗ và lưu vào CSDL.
  - *Chống rò rỉ dữ liệu tài chính:* Nếu khách cố tình gõ `"Cho tôi xem doanh thu của sân"`, AI sẽ từ chối lịch sự và hướng dẫn khách hàng về dịch vụ đặt sân.

---

### 3.2. Chức năng Dành cho Quản trị viên / Chủ sân (Admin)

Quản trị viên truy cập vào Bảng điều khiển tại địa chỉ: `http://localhost:5173/admin`

#### 1. Đăng nhập & Xác thực Quyền hạn Tự động
- Hệ thống hỗ trợ tài khoản quản trị mặc định: `username: admin`, `password: admin123`.
- Giao diện Admin Dashboard tự động xác thực và nhận JWT Token mang vai trò `admin`, lưu trữ an toàn trong `localStorage` để gọi các API nội bộ.

#### 2. Bảng Thống kê Doanh thu & Hiệu suất Vận hành (KPI Cards)
- **Thẻ Tổng Doanh Thu:** Kết nối trực tiếp với API `GET /api/revenue`, tính tổng từ bảng `HoaDonDoanhThu` và tự động định dạng `#,##0 VNĐ` (Ví dụ: `400.000 VNĐ`). Số liệu tự động cập nhật ngay khi một đơn đặt sân mới được duyệt.
- **Thẻ Tổng Đơn Đặt:** Hiển thị tổng số lượng hóa đơn đã thanh toán.
- **Tần suất cập nhật:** Hệ thống thiết lập chu kỳ làm mới tự động mỗi 4 giây.

#### 3. Duyệt Đơn Đặt Sân & Tự động Sinh Hóa đơn
- Tại tab **"Duyệt Đơn Đặt Sân"**, danh sách các yêu cầu đang chờ (`pending`) được liệt kê trực quan với đầy đủ thông tin: Tên khách hàng, Ngày đặt, Khung giờ, Tên sân, và Số tiền.
- **Hành động Duyệt ("Chốt"):** Nhấn nút dấu tích xanh `✓ Chốt đơn`. Đơn đặt chuyển sang trạng thái `confirmed`, đồng thời Backend tự động sinh 1 bản ghi vào bảng `HoaDonDoanhThu`, tổng doanh thu trên thẻ KPI tự động nhảy số tức thì.
- **Hành động Từ chối:** Nhấn nút dấu `✕ Hủy`. Đơn chuyển sang trạng thái `rejected`, giải phóng khung giờ trên lịch sân.

#### 4. Sử dụng Thanh Lệnh Quản trị AI Thông minh (AiCommandBar)
- Nhấn vào nút biểu tượng Terminal **"Admin AI"** tại góc màn hình Dashboard.
- **Chế độ Tư vấn (Consult Mode):** Nhập câu hỏi chiến lược kinh doanh (Ví dụ: `"Khung giờ nào tỷ lệ lấp đầy kém nhất?"`).
- **Chế độ Thao tác DB (Database Execution Mode - Nút màu đỏ):**
  - *Lệnh sinh bão đơn giả lập:* Nhập `"tạo 5 đơn đặt sân"` -> AI tự động tạo ngẫu nhiên 5 đơn mới vào CSDL.
  - *Lệnh Auto-Simulation định kỳ:* Nhập `"mỗi 5 giây tạo 1 đơn"` -> Hệ thống tự động tạo đơn định kỳ (Gõ `"dừng"` để tắt).
  - *Lệnh Duyệt Tự động (Auto-Approve Agent):* Nhập `"tự động duyệt hết"` -> Agent AI liên tục quét DB mỗi 3 giây và tự động chốt toàn bộ đơn đang chờ.
  - *Kích hoạt Flash Sale:* Nhập `"kích hoạt flash sale giảm giá 50%"` -> Hệ thống áp dụng chính sách ưu đãi toàn sân trong 2 giờ.

---

### 3.3. Chức năng Dành cho Kỹ sư Vận hành & Triển khai (DevOps / Engineer)

#### 1. Cấu hình Môi trường & Biến Bảo mật
- Tạo file `backend/.env` dựa trên `backend/.env.example`:
  ```env
  PORT=3000
  GEMINI_API_KEY=your_gemini_api_key_here
  GEMINI_MODEL=gemini-1.5-flash
  JWT_SECRET=sportai_jwt_super_secret_key_2026_secure
  NODE_ENV=development
  ```
- *Lưu ý bảo mật:* File `.env` đã được cấu hình trong `.gitignore`, tuyệt đối không commit lên kho mã nguồn Git.

#### 2. Khởi chạy Ứng dụng ở Môi trường Phát triển (Development)
- **Khởi chạy Backend API Server:**
  ```bash
  cd backend
  npm install
  node server.js
  # Server chạy tại: http://localhost:3000
  ```
- **Khởi chạy Frontend Web App:**
  ```bash
  cd webapp
  npm install
  npm run dev
  # Web App chạy tại: http://localhost:5173
  ```

#### 3. Thực thi Bộ Kiểm thử Tự động (Automated Test Suite)
- Chạy toàn bộ Unit Tests và Integration Tests:
  ```bash
  cd backend
  npm test
  # Kết quả mong đợi: PASS test/unit.test.js và PASS test/integration.test.js (19/19 tests ĐẠT 100%)
  ```

#### 4. Chạy Thí nghiệm Prompt A/B Testing Benchmark
- Thực thi script đo lường hiệu năng so sánh mô hình Prompt:
  ```bash
  cd backend
  node test/prompt_ab_benchmark.js
  # Báo cáo kết quả được tự động xuất bản tại: docs/prompt_ab_testing_report.md
  ```

#### 5. Đóng gói & Vận hành với Docker & Docker Compose
- Khởi động toàn bộ cụm dịch vụ SportAI chỉ với một câu lệnh:
  ```bash
  docker compose up --build -d
  # Dịch vụ Backend lắng nghe tại cổng 3000, Frontend lắng nghe tại cổng 80/5173
  ```
