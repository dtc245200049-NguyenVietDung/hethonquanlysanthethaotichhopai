import io
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

FILE_PATH = 'PHẦN 1, 2, 3 - TÀI LIỆU YÊU CẦU VÀ THIẾT KẾ HỆ THỐNG QUẢN LÝ SÂN THỂ THAO.md'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    text = f.read()

pos1 = text.find('### 3.6. THIẾT KẾ SƠ ĐỒ TUẦN TỰ')
pos2 = text.find('### 3.9. SƠ ĐỒ TRẠNG THÁI')

new_sec_3_6_3_8 = """### 3.6. THIẾT KẾ SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAM DESIGN)

#### 3.6.1. Sơ đồ tuần tự: Khách hàng hỏi đáp AI để tra cứu sân trống và chính sách (UC05.1 & UC05.2)

Sơ đồ mô tả chi tiết luồng tương tác thời gian thực giữa Khách hàng, Giao diện Web Client, API Gateway, Mô hình ngôn ngữ Gemini 1.5/2.0 Flash, Bộ điều phối công cụ `aiToolDispatcher.js` và CSDL SQLite:

1. **Gửi tin nhắn & Lưu phiên:** Khách hàng nhập tin nhắn $\\rightarrow$ Giao diện Web gửi request `POST /api/chat` $\\rightarrow$ API Gateway nạp thông tin người dùng và tự động lưu lượt hỏi vào bảng `ChatHistory (role='user')`.
2. **Vòng lặp Lượt 1 (Pass 1 - Model Function Call Decision):** Backend gửi Prompt, bộ lọc công cụ (`tools: [get_available_courts, ...]`) và lịch sử 10 tin nhắn gần nhất tới Gemini API. Gemini phân tích và quyết định gọi tool `get_available_courts(ngayDat, gioBatDau, gioKetThuc, loaiSan)`.
3. **Thực thi Công cụ CSDL (Tool Execution & Overlap Query):** `aiToolDispatcher` tiếp nhận tham số, thực thi câu lệnh SQL với thuật toán giao thoa khoảng thời gian (`gioBatDau < endTime AND gioKetThuc > startTime`) loại trừ các đơn bị hủy, lấy danh sách các sân `SanTheThao` còn trống thực tế.
4. **Vòng lặp Lượt 2 (Pass 2 - Natural Response Synthesis):** Kết quả JSON thô được gửi ngược lại cho Gemini API để sinh câu trả lời tự nhiên dạng bảng kèm đường dẫn xem chi tiết.
5. **Lưu lịch sử & Hiển thị:** Phản hồi của AI được lưu vào `ChatHistory (role='model')` trước khi trả về hiển thị trên cửa sổ Chatbot của khách hàng.

![Hình 3.6.1: Sơ đồ tuần tự Khách hàng hỏi đáp AI tra cứu sân trống](docs/diagrams/rendered/04_sequence_customer_chat.png)

**_Hình 3.6.1: Sơ đồ tuần tự Khách hàng hỏi đáp AI tra cứu sân trống thời gian thực (Đồng bộ ChatHistory & Function Calling)_**

---

#### 3.6.2. Sơ đồ tuần tự: Chủ sân (Admin) trích xuất báo cáo & phân tích phản hồi qua AI (UC07.1)

Sơ đồ mô tả quy trình thực thi báo cáo doanh thu tài chính với rào chắn bảo mật phân quyền 2 lớp (RBAC Guardrail) và nguyên tắc chống ảo giác (Anti-Hallucination):

1. **Yêu cầu & Thẩm định Quyền cấp 1:** Admin nhập lệnh trên Dashboard $\\rightarrow$ Gửi `POST /api/chat` kèm JWT Token trong Authorization Header $\\rightarrow$ API Gateway giải mã token và kiểm tra `role === 'admin'`. Nếu là Customer, request bị từ chối ngay lập tức với mã lỗi HTTP `403 Forbidden`.
2. **Kích hoạt Báo cáo (Gemini Pass 1):** Yêu cầu được gửi tới Gemini API với bộ công cụ quản trị. Gemini nhận diện ý định kế toán và kích hoạt tool `generate_revenue_report(startDate, endDate)`.
3. **Rào chắn RBAC cấp 2 & Kế toán Doanh thu Thực:** `aiToolDispatcher` kiểm tra lại ngữ cảnh bảo mật. Sau đó, hệ thống thực hiện phép kết `INNER JOIN` giữa bảng `HoaDonDoanhThu` và `LichDatSan` với điều kiện nghiêm ngặt `trangThai = 'confirmed'`. Dữ liệu doanh thu không bao giờ tính toán trên các đơn `pending` hoặc `rejected`.
4. **Tổng hợp Báo cáo (Gemini Pass 2):** Gemini API nhận số liệu kế toán thực, định dạng tiền tệ chuẩn `#,##0 VNĐ`, tính tỷ lệ đóng góp của từng sân và đưa ra phân tích xu hướng kinh doanh.
5. **Hiển thị & Nhật ký:** Kết quả trả về giao diện Admin Dashboard và được ghi nhận đầy đủ vào nhật ký kiểm toán hệ thống.

![Hình 3.6.2: Sơ đồ tuần tự Chủ sân trích xuất báo cáo doanh thu AI](docs/diagrams/rendered/05_sequence_admin_revenue.png)

**_Hình 3.6.2: Sơ đồ tuần tự Chủ sân trích xuất báo cáo doanh thu qua AI (Rào chắn RBAC 2 lớp & Anti-Hallucination)_**

---

### 3.7. SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM DESIGN)

#### 3.7.1. Sơ đồ hoạt động luồng xử lý câu hỏi Chatbot AI tổng quát (Agentic Workflow)

Biểu đồ mô tả tiến trình xử lý thông minh 2 vòng lặp (2-Pass Agentic Loop) của hệ thống SportAI:
- **Tiếp nhận & Kiểm tra An toàn:** Nhận request từ Client $\\rightarrow$ Phân quyền RBAC $\\rightarrow$ Lưu câu hỏi vào `ChatHistory` $\\rightarrow$ Nạp lịch sử hội thoại vào ngữ cảnh.
- **Phân nhánh Quyết định của Model (Decision Branch):**
  - *Nhánh không gọi Tool:* Nếu câu hỏi là xã giao thông thường, Gemini sinh câu trả lời trực tiếp $\\rightarrow$ Trả kết quả cho Client.
  - *Nhánh có Tool Call:* Gemini phát tín hiệu gọi hàm $\\rightarrow$ Backend kiểm tra rào chắn an toàn (Verify Args & RBAC) $\\rightarrow$ Thực thi truy vấn CSDL SQLite $\\rightarrow$ Gửi payload kết quả trở lại cho Gemini (Pass 2) để tổng hợp câu trả lời tự nhiên.
- **Cơ chế An toàn Giới hạn Thời gian (Timeout & Graceful Degradation):** Nếu tiến trình kết nối Gemini API vượt quá 8.0 giây hoặc phát sinh lỗi mạng, hệ thống tự động suy biến sang Fallback Rule Engine nội bộ để trả lời danh sách sân khả dụng dựa trên quy tắc cố định, đảm bảo tính sẵn sàng 99.9%.

![Hình 3.7.1: Sơ đồ hoạt động luồng xử lý câu hỏi Chatbot AI](docs/diagrams/rendered/03_activity_ai_workflow.png)

**_Hình 3.7.1: Sơ đồ hoạt động luồng xử lý câu hỏi Chatbot AI (Agentic Workflow 2-Pass, 8s Timeout & Fallback Engine)_**

---

### 3.8. BIỂU ĐỒ LỚP PHÂN TÍCH (ANALYSIS CLASS DIAGRAM)

Biểu đồ lớp phân tích được thiết kế theo kiến trúc chuẩn Boundary - Control - Entity (BCE), đảm bảo nguyên lý đơn nhiệm (Single Responsibility Principle) và phân tách rõ ràng giữa giao diện, nghiệp vụ và dữ liệu:
- **Lớp Biên (Boundary Classes):** Đóng gói toàn bộ các thành phần hiển thị và tiếp nhận sự kiện từ người dùng: `CustomerView`, `AdminDashboard`, `ChatbotWidget`, `AiCommandBar`.
- **Lớp Điều khiển (Control Classes):** Chịu trách nhiệm điều phối luồng nghiệp vụ và bảo mật: `AuthController` (Xác thực JWT & RBAC), `BookingController` (Khóa giữ chỗ & Double-Check Locking), `AiChatController` (Quản lý phiên chat), `GeminiService` (Kết nối Google API), và `AiToolDispatcher` (Thực thi các công cụ CSDL).
- **Lớp Thực thể (Entity Classes):** Ánh xạ chính xác 1:1 với 5 bảng trong CSDL SQLite:
  - `User`: Quản lý tài khoản và vai trò (`customer`, `admin`).
  - `SanTheThao`: Quản lý quy mô và đơn giá sân theo giờ (`giaTienGio` kiểu `INTEGER`).
  - `LichDatSan`: Quản lý lịch đặt, khung giờ, giờ bắt đầu/kết thúc (`gioBatDau`, `gioKetThuc`) và trạng thái đặt chỗ.
  - `HoaDonDoanhThu`: Quản lý hóa đơn kế toán doanh thu thực tế liên kết 1:1 với lịch đặt đã duyệt.
  - `ChatHistory`: Quản lý nhật ký đối thoại đa lượt giữa người dùng và AI Chatbot.

![Hình 3.8: Biểu đồ lớp phân tích BCE](docs/diagrams/rendered/02_bce_class_diagram.png)

**_Hình 3.8: Biểu đồ Lớp Phân tích BCE (Boundary - Control - Entity) - Đồng bộ 100% Kiến trúc 5 Thực thể CSDL_**

---

"""

if pos1 != -1 and pos2 != -1:
    text = text[:pos1] + new_sec_3_6_3_8 + text[pos2:]
    with open(FILE_PATH, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f"Updated Sections 3.6 to 3.8 successfully! New file size: {len(text):,} chars")
else:
    print(f"Error finding markers: pos1={pos1}, pos2={pos2}")

