import io
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

FILE_PATH = 'PHẦN 1, 2, 3 - TÀI LIỆU YÊU CẦU VÀ THIẾT KẾ HỆ THỐNG QUẢN LÝ SÂN THỂ THAO.md'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace Section 2.1.1
pos1 = text.find('#### 2.1.1. Luồng Đặt sân')
pos2 = text.find('#### 2.1.2. Luồng Khai thác')

if pos1 != -1 and pos2 != -1:
    new_sec_2_1_1 = """#### 2.1.1. Luồng Đặt sân & Thu cọc thủ công hiện tại (As-Is Booking Flow)

Quy trình vận hành truyền thống tại các cụm sân thể thao hiện nay diễn ra hoàn toàn qua các thao tác thủ công, phân tán giữa sổ sách viết tay, file Excel và các ứng dụng nhắn tin (Zalo, Facebook Fanpage, Gọi điện thoại trực tiếp). Tiến trình cụ thể bao gồm các bước sau:

1. **Tiếp nhận nhu cầu & Tra cứu:** Khách hàng chủ động gọi điện thoại hoặc nhắn tin qua Zalo/Fanpage để hỏi tình trạng sân vào ngày và khung giờ mong muốn $\\rightarrow$ Nhân viên trực ca lật sổ tay ghi chép hoặc mở file Excel để kiểm tra lịch trống.
2. **Xử lý khi hết sân (Vòng lặp điều hướng):** 
   - Nếu khung giờ yêu cầu đã kín chỗ, nhân viên thông báo hết sân và đề xuất các khung giờ/ngày khác còn trống.
   - *Quyết định của khách hàng:* Nếu khách đồng ý chọn khung giờ mới, quy trình lặp lại việc kiểm tra lịch; nếu khách không đồng ý, giao dịch đặt sân chấm dứt tại đây.
3. **Báo giá & Chuyển khoản tiền cọc:** Nếu còn sân trống, nhân viên cung cấp đơn giá và gửi số tài khoản ngân hàng cá nhân của chủ sân/nhân viên, yêu cầu khách chuyển khoản cọc từ 30% đến 50% tổng giá trị tiền giờ $\\rightarrow$ Khách hàng thực hiện chuyển tiền qua Internet Banking và chụp lại màn hình biên lai giao dịch (Bill) gửi qua Zalo.
4. **Đối soát & Khóa lịch thủ công:** Nhân viên trực ca mở App ngân hàng cá nhân để kiểm tra biến động số dư $\\rightarrow$ Khi xác nhận đã nhận được tiền, nhân viên dùng bút ghi tên khách, số điện thoại và khung giờ vào sổ tay $\\rightarrow$ Nhắn tin phản hồi xác nhận chốt sân cho khách.
5. **Diễn biến ngày thi đấu & Xử lý sự cố hủy lịch (No-Show):**
   - *Trường hợp bình thường:* Khách đến sân đúng giờ, nhận sân thi đấu $\\rightarrow$ Kết thúc trận, khách thanh toán nốt số tiền còn lại bằng tiền mặt hoặc quét mã QR cá nhân $\\rightarrow$ Nhân viên gạch sổ hoàn tất ca.
   - *Trường hợp phát sinh sự cố (Khách hủy lịch / Không đến - No-Show):* Do thời tiết xấu (mưa gió) hoặc thiếu người chơi, khách báo hủy sát giờ hoặc tự ý bỏ trận mà không báo trước $\\rightarrow$ Nhân viên phải xử lý tranh chấp đòi lại tiền cọc của khách hoặc tịch thu cọc theo quy định nội bộ.

![Sơ đồ Quy trình Hiện trạng Thủ công (As-Is Process Flowchart)](docs/diagrams/rendered/11_activity_asis_process.png)

**_Hình 2.1: Sơ đồ luồng công việc hiện tại (As-Is Process Flowchart) - Phân tích Điểm nghẽn Trùng lịch, Đối soát cọc và Thiệt hại do Hủy lịch (No-Show)_**

**Phân tích 3 Nguy cơ & Rủi ro Cốt lõi của Quy trình Hiện trạng:**

- **⚠️ Nguy cơ 1: Trùng lịch (Overbooking):** Xuất phát từ việc nhiều nhân viên trực ca cùng sử dụng chung một cuốn sổ tay hoặc file Excel không được đồng bộ theo thời gian thực (Real-time). Khi có 2 khách hàng cùng liên hệ chốt 1 sân tại cùng một thời điểm qua 2 kênh khác nhau (ví dụ: một người gọi điện thoại, một người nhắn Zalo), cả 2 nhân viên đều nhận cọc, dẫn đến tranh chấp gay gắt khi hai đội bóng cùng xuất hiện tại sân vào giờ thi đấu.
- **⚠️ Nguy cơ 2: Độ trễ Đối soát cao (5 - 15 phút):** Nhân viên phải kiểm tra thủ công từng giao dịch biến động số dư ngân hàng cá nhân, đối chiếu mã nội dung chuyển khoản với tên khách. Quy trình này dễ bị kẻ gian lợi dụng làm giả ảnh chụp màn hình biên lai chuyển tiền (Fake Bill) và gây chậm trễ, khiến khách hàng sốt ruột và có thể bỏ sang đặt sân đối thủ.
- **⚠️ Nguy cơ 3: Thất thoát Doanh thu Khung giờ Vàng do Hủy lịch (No-Show):** Khi khách hủy lịch muộn, quy trình thủ công không có bất kỳ cơ chế nào để tự động giảm giá hoặc phát thông báo Flash Sale kịp thời đến các nhóm người chơi khác nhằm bù lấp chỗ trống. Sân bóng trong khung giờ vàng bị bỏ hoang, gây tổn thất doanh thu nghiêm trọng không thể thu hồi.

"""
    text = text[:pos1] + new_sec_2_1_1 + text[pos2:]
    print("Updated Section 2.1.1 successfully via slice")
else:
    print(f"Error finding markers: pos1={pos1}, pos2={pos2}")

# Replace Section 2.3.3 & Add NFR
pos3 = text.find('#### 2.3.3. Ràng buộc Kỹ thuật')
pos4 = text.find('## PHẦN 3: THIẾT KẾ')

if pos3 != -1 and pos4 != -1:
    new_sec_2_3 = """#### 2.3.3. Yêu cầu Phi Chức Năng (Non-Functional Requirements - NFR theo chuẩn ISO 25010)

Để đảm bảo hệ thống vận hành ổn định, an toàn và mang lại trải nghiệm tối ưu cho người dùng, các chỉ tiêu phi chức năng được chuẩn hóa nghiêm ngặt như sau:

- **⚡ Hiệu năng & Độ trễ (Performance & Latency):**
  - **NFR-01 (Chatbot Response Latency):** Thời gian phản hồi trung bình của Trợ lý AI Hỏi Đáp phải dưới 2.0 giây trong điều kiện mạng bình thường. Backend thiết lập cơ chế giới hạn thời gian chờ (Timeout) tối đa 8.0 giây đối với Gemini API.
  - **NFR-02 (API Response Time):** Thời gian phản hồi của các REST API tra cứu danh mục sân (`GET /api/courts`) và kiểm tra lịch trống phải đạt dưới 1.0 giây với 95th percentile.
- **🔒 Bảo mật & An toàn Dữ liệu (Security & RBAC):**
  - **NFR-03 (Phân quyền RBAC 2 lớp):** Kiểm soát phân quyền truy cập nghiêm ngặt giữa Customer và Admin. Token JWT được thẩm định tại tầng Route Middleware, đồng thời AI Tool Dispatcher kiểm tra rào chắn `role === 'admin'` trước khi thực thi các tác vụ tài chính nhạy cảm (`generate_revenue_report`).
  - **NFR-04 (Bảo vệ Bí mật & Zero-Trust Secrets):** Khóa `GEMINI_API_KEY` và chuỗi kết nối CSDL tuyệt đối không được trả về phía trình duyệt Client, chỉ được nạp từ biến môi trường máy chủ `.env`.
- **🔄 Tính Sẵn sàng & Chịu tải Đồng thời (Reliability & Concurrency):**
  - **NFR-05 (Chống Race Condition & Trùng lịch 409):** Khóa cứng tình trạng trùng lịch tại cấp CSDL SQLite thông qua Partial Unique Index `idx_unique_active_booking ON LichDatSan(idSan, ngayDat, khungGio) WHERE trangThai NOT IN ('rejected', 'cancelled')`. Mọi xung đột đồng thời tại cùng 1 tích tắc đều được chặn đứng và trả về mã lỗi HTTP `409 Conflict`.
  - **NFR-06 (Tính sẵn sàng & Suy biến An toàn - Graceful Degradation):** Cam kết độ sẵn sàng hệ thống đạt 99.9%. Khi mất kết nối Internet tới Gemini Cloud hoặc thiếu API Key, hệ thống tự động suy biến sang Fallback Rule Engine nội bộ để duy trì tính năng tra cứu cơ bản cho người dùng mà không làm gián đoạn ứng dụng.

#### 2.3.4. Ràng buộc Kỹ thuật & Vận hành (System Constraints)

- **CON-01:** Hệ thống phân tích hình ảnh bắt buộc phải tận dụng lại được hệ thống IP Camera hiện có tại cụm sân (chuẩn RTSP/ONVIF), không ép chủ sân thay mới toàn bộ phần cứng.
- **CON-02:** Hệ thống điều khiển thiết bị điện phải có công tắc cơ dự phòng (Bypass) để đảm bảo sân vẫn bật được đèn thủ công nếu gặp sự cố mất mạng Internet.

![Sơ đồ Tư duy Tổng hợp Yêu cầu Bài toán (Requirements Mindmap)](docs/diagrams/rendered/10_mindmap_requirements.png)

**_Hình 2.2: Sơ đồ Tư duy Tổng hợp Yêu cầu Bài toán (Requirements Mindmap) - Phân loại đa chiều Nghiệp vụ (BR), Người dùng (UR), Phi chức năng (NFR) và Ràng buộc (CON)_**

"""
    text = text[:pos3] + new_sec_2_3 + text[pos4:]
    print("Updated Section 2.3 successfully via slice")
else:
    print(f"Error finding markers: pos3={pos3}, pos4={pos4}")

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(text)

print(f"Done! Final length: {len(text):,} characters")

