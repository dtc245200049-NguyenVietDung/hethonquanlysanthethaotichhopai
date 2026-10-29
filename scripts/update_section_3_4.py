import io
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

FILE_PATH = 'PHẦN 1, 2, 3 - TÀI LIỆU YÊU CẦU VÀ THIẾT KẾ HỆ THỐNG QUẢN LÝ SÂN THỂ THAO.md'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    text = f.read()

pos1 = text.find('### 3.4. ĐẶC TẢ CHI TIẾT')
pos2 = text.find('### 3.5. BẢNG MÔ TẢ ĐƠN VỊ THỰC THỂ')

new_sec_3_4 = """### 3.4. ĐẶC TẢ CHI TIẾT CÁC USE CASE TƯƠNG TÁC AI TRỌNG TÂM

#### 3.4.1. Đặc tả Use Case UC05.1 & UC05.2: Trợ lý AI Tra cứu Sân trống & Tư vấn Khung giờ theo Ngân sách

- **Tên Use Case:** Tra cứu sân trống và tư vấn khung giờ theo ngân sách qua AI.
- **Mã Use Case:** UC05.1 & UC05.2
- **Mô tả:** Khách hàng trò chuyện tự nhiên với Chatbot AI (tích hợp Gemini 1.5/2.0 Function Calling) để tìm kiếm sân thể thao còn trống, nhận gợi ý khung giờ phù hợp với khả năng tài chính và liên kết xem chi tiết để đặt sân.
- **Tác nhân (Actor):** Khách hàng (User), Gemini AI Engine (Google Generative AI), Backend API (`aiToolDispatcher.js`), CSDL SQLite (`database.db`).
- **Tiền điều kiện (Pre-condition):** Khách hàng đang truy cập Web App; CSDL SQLite và bảng `SanTheThao`, `LichDatSan` đang hoạt động ổn định.

**Dòng sự kiện chính (Main Flow - Luồng Function Calling 2-Pass):**

| **Bước** | **Tác nhân** | **Hành động & Xử lý Kỹ thuật** |
| :---: | :--- | :--- |
| 1 | Khách hàng | Nhập tin nhắn vào widget Chatbot (Ví dụ: *"Chiều nay 17h30 đến 19h00 còn sân 5 người nào giá dưới 200k không?"*). |
| 2 | Web Frontend | Gửi request `POST /api/chat` kèm `message`, `sessionId`, và mảng lịch sử trò chuyện gần nhất. |
| 3 | Backend API | Nạp ngữ cảnh người dùng, tự động lưu tin nhắn của khách vào bảng `ChatHistory (role='user')`, sau đó gọi Gemini API với bộ công cụ `tools: [get_available_courts, recommend_booking_options, get_court_details_and_pricing]`. |
| 4 | Gemini AI (Pass 1) | Phân tích ngữ nghĩa tự nhiên, quyết định kích hoạt Tool và trả về lệnh gọi hàm: `name: 'get_available_courts', args: { ngayDat: '2026-10-28', gioBatDau: '17:30', gioKetThuc: '19:00', loaiSan: 'Sân 5 người' }`. |
| 5 | Tool Dispatcher | Backend thực thi hàm `get_available_courts()`: Truy vấn SQL tìm các sân `SanTheThao` không bị trùng trong `LichDatSan` theo thuật toán giao thoa khoảng thời gian (`gioBatDau < '19:00' AND gioKetThuc > '17:30' AND trangThai NOT IN ('rejected', 'cancelled')`). |
| 6 | Gemini AI (Pass 2) | Backend gửi kết quả JSON thô của Tool về lại cho Gemini API. Model tổng hợp dữ liệu, định dạng văn bản tự nhiên, kẻ bảng so sánh giá và đính kèm link/thẻ đặt sân nhanh. |
| 7 | Backend & Client | Backend tự động lưu phản hồi của AI vào bảng `ChatHistory (role='model')` và trả JSON về trình duyệt để hiển thị bong bóng tin nhắn cho khách hàng. |

**Dòng sự kiện ngoại lệ (Alternative & Exception Flows):**

- **4a. Không tìm thấy sân thỏa mãn tiêu chí:** Tool trả về danh sách rỗng $\\rightarrow$ Gemini AI tự động kích hoạt gợi ý thay thế: *"Rất tiếc khung giờ 17h30 - 19h00 các sân dưới 200k đã kín chỗ. Tuy nhiên, khung giờ 16h00 - 17h30 hoặc sau 20h00 còn Sân B2 với giá 150.000 VNĐ. Bạn có muốn tham khảo không?"*
- **3a. Gemini API Timeout (>8 giây) hoặc lỗi mạng:** Hệ thống kích hoạt kịch bản ngoại lệ `UC05.E1`, tự động chuyển đổi sang Fallback Rule Engine nội bộ: bóc tách từ khóa ngày/giờ bằng Regex, truy vấn trực tiếp CSDL SQLite và trả về bảng sân trống tiêu chuẩn mà không làm sập giao diện web.
- **3b. Khách hỏi ngoài phạm vi thể thao:** Kích hoạt kịch bản ngoại lệ `UC05.E2` (Prompt Guardrail): AI lịch sự từ chối: *"Tôi là Trợ lý Thể thao chuyên biệt cho hệ thống SportAI. Tôi chỉ có thể hỗ trợ bạn tra cứu lịch sân, bảng giá và chính sách đặt sân."*

---

#### 3.4.2. Đặc tả Use Case UC07.1: Xuất Báo cáo Doanh thu & Phân tích Kinh doanh Nhanh qua AI

- **Tên Use Case:** Xuất Báo cáo Doanh thu & Phân tích Kinh doanh Nhanh qua AI.
- **Mã Use Case:** UC07.1
- **Mô tả:** Cho phép Chủ sân / Quản lý nhập câu lệnh ngôn ngữ tự nhiên để truy xuất doanh thu thực tế, tỷ lệ lấp đầy sân và phân tích tăng trưởng tài chính mà không cần thao tác xuất file Excel thủ công.
- **Tác nhân (Actor):** Chủ sân / Quản lý (Admin), Gemini AI Engine, Tool Dispatcher (`generate_revenue_report`), CSDL SQLite.
- **Tiền điều kiện (Pre-condition):** Người dùng đã đăng nhập tài khoản có `role === 'admin'` và có JWT Token hợp lệ trong Header.

**Dòng sự kiện chính (Main Flow):**

| **Bước** | **Tác nhân** | **Hành động & Xử lý Kỹ thuật** |
| :---: | :--- | :--- |
| 1 | Admin | Nhập lệnh vào thanh AI Command Bar trên Dashboard (Ví dụ: *"Báo cáo tổng doanh thu tháng này và so sánh sân nào thu nhiều tiền nhất?"*). |
| 2 | Backend API | Kiểm tra xác thực JWT Token và rào chắn phân quyền RBAC cấp 1 (`req.user.role === 'admin'`). Nếu hợp lệ, chuyển tiếp prompt tới Gemini API với bộ công cụ quản trị (bao gồm `generate_revenue_report`). |
| 3 | Gemini AI (Pass 1) | Phát hiện ý định báo cáo tài chính, gọi tool `generate_revenue_report` với tham số `startDate`, `endDate`. |
| 4 | Tool Dispatcher | **Rào chắn RBAC cấp 2 & Chống ảo giác (Anti-Hallucination):** Thẩm định lại quyền Admin. Thực thi câu lệnh SQL chỉ tính trên các đơn đã chốt (`trangThai = 'confirmed'`):<br>`SELECT s.tenSan, SUM(h.tongTien) as doanhThu, COUNT(h.id) as soDon FROM HoaDonDoanhThu h INNER JOIN LichDatSan l ON h.idLichDat = l.id INNER JOIN SanTheThao s ON l.idSan = s.id WHERE l.trangThai = 'confirmed' GROUP BY s.id`. |
| 5 | Gemini AI (Pass 2) | Nhận dữ liệu kế toán thực, tổng hợp thành bảng báo cáo tài chính chuyên nghiệp với định dạng tiền tệ chuẩn `#,##0 VNĐ`, tính tỷ lệ đóng góp % của từng sân và đưa ra 2 nhận xét chiến lược. |
| 6 | Web Frontend | Hiển thị kết quả trong modal AI Insights với bảng số liệu và đề xuất hành động. |

**Dòng sự kiện ngoại lệ (Alternative & Exception Flows):**

- **2a. Người dùng không phải là Admin (RBAC Violation):** Kích hoạt ngoại lệ `UC07.E1`: Backend chặn đứng yêu cầu ngay tại Gateway, trả về mã lỗi HTTP `403 Forbidden` và không gửi bất kỳ dữ liệu tài chính nào cho AI Model.
- **4a. Chưa phát sinh đơn đặt nào trong khoảng thời gian:** Tool trả về tổng doanh thu 0 VNĐ $\\rightarrow$ AI phản hồi trung thực: *"Trong khoảng thời gian yêu cầu, hệ thống chưa ghi nhận hóa đơn thanh toán nào hợp lệ."* (Không tự bịa đặt số liệu).

---

#### 3.4.3. Đặc tả Use Case UC08.1: Đề xuất & Kích hoạt Chương trình Khuyến mãi Khung giờ Vắng (Off-peak AI Suggestion)

- **Tên Use Case:** Đề xuất và Kích hoạt Chương trình Khuyến mãi Khung giờ Vắng.
- **Mã Use Case:** UC08.1 & UC08.2
- **Mô tả:** AI phân tích tỷ lệ lấp đầy (Occupancy Rate) trong các khung giờ vắng khách (08:00 - 16:00 ngày tuần) và tự động đưa ra phương án Flash Sale. Khi Admin nhấn phê duyệt, hệ thống tự động kích hoạt giảm giá trên toàn hệ thống web.
- **Tác nhân (Actor):** Chủ sân / Quản lý (Admin), Gemini AI Engine, Backend API (`POST /api/admin/ai-execute`), CSDL SQLite.

**Dòng sự kiện chính (Main Flow):**

| **Bước** | **Tác nhân** | **Hành động & Xử lý Kỹ thuật** |
| :---: | :--- | :--- |
| 1 | Admin | Nhập lệnh trên Dashboard: *"Phân tích tỷ lệ lấp đầy tuần này và gợi ý khuyến mãi giờ vắng"*. |
| 2 | Backend API | Gọi AI Engine phân tích tỷ lệ sử dụng sân dựa trên số lượng đơn `confirmed` trong tuần. |
| 3 | AI Engine | Phát hiện tỷ lệ lấp đầy khung giờ 08:00 - 14:00 chỉ đạt 18% $\\rightarrow$ Đưa ra đề xuất: *"Gợi ý kích hoạt chương trình Flash Sale giảm giá 50% tiền sân trong khung giờ 08:00 - 14:00 từ Thứ 2 đến Thứ 6 để thu hút sinh viên và người làm tự do"*. Đính kèm nút bấm hành động `[Kích hoạt Flash Sale 50%]`. |
| 4 | Admin | Xem xét đề xuất của AI và nhấn nút `[Kích hoạt Flash Sale 50%]`. |
| 5 | Web & Backend | Giao diện gửi request `POST /api/admin/ai-execute` với action `DISCOUNT_50`. Backend cập nhật bảng giá áp dụng cho khung giờ vắng và thông báo thành công cho Admin. |

---

"""

if pos1 != -1 and pos2 != -1:
    text = text[:pos1] + new_sec_3_4 + text[pos2:]
    with open(FILE_PATH, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f"Updated Section 3.4 successfully! New file size: {len(text):,} chars")
else:
    print(f"Error finding markers: pos1={pos1}, pos2={pos2}")

