import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

FILE_PATH = 'PHẦN 1, 2, 3 - TÀI LIỆU YÊU CẦU VÀ THIẾT KẾ HỆ THỐNG QUẢN LÝ SÂN THỂ THAO.md'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Section 2.1.1 (Quy trình hiện trạng As-Is & 3 Nguy cơ)
old_sec_2_1_1 = """#### 2.1.1. Luồng Đặt sân & Thu cọc thủ công hiện tại (As-Is Booking Flow)

1. **Tiếp nhận nhu cầu:** Khách hàng liên hệ qua Điện thoại/Zalo/Fanpage -> Quản lý kiểm tra sổ tay/Excel để tra cứu lịch trống.
2. **Xác nhận giữ chỗ:** Quản lý gửi số tài khoản cá nhân -> Khách hàng chuyển khoản 30-50% tiền cọc -> Khách hàng chụp hình bill gửi qua Zalo.
3. **Đối soát & Ghi nhận:** Quản lý kiểm tra biến động số dư trên App ngân hàng -> Mở sổ tay/Excel để điền tên khách hàng vào khung giờ tương ứng.

**Điểm yếu & Rủi ro phân tích được:**

- **Trùng lịch (Overbooking):** Khi 2 nhân viên cùng trực ca và nhận lịch chốt cùng 1 sân cho 2 khách hàng qua 2 kênh khác nhau (Zalo và Gọi điện).
- **Độ trễ cao:** Khách hàng mất trung bình 5-15 phút chờ phản hồi đối soát cọc, dễ dẫn đến việc khách chuyển sang đặt sân khác.
- **Tỷ lệ hủy muộn (No-show):** Mức cọc định mức không đủ bù đắp chi phí cơ hội khi khách hủy sát giờ, khung giờ đó trở thành giờ chết.
![Sơ đồ Quy trình Hiện trạng Thủ công (As-Is Process Flowchart)](docs/diagrams/rendered/11_activity_asis_process.png)

**_[Hình minh họa: Sơ đồ luồng công việc hiện tại (As-Is Process Flowchart) - Luồng Đặt sân và Đối soát cọc thủ công]_**"""

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
- **⚠️ Nguy cơ 3: Thất thoát Doanh thu Khung giờ Vàng do Hủy lịch (No-Show):** Khi khách hủy lịch muộn, quy trình thủ công không có bất kỳ cơ chế nào để tự động giảm giá hoặc phát thông báo Flash Sale kịp thời đến các nhóm người chơi khác nhằm bù lấp chỗ trống. Sân bóng trong khung giờ vàng bị bỏ hoang, gây tổn thất doanh thu nghiêm trọng không thể thu hồi."""

if old_sec_2_1_1 in content:
    content = content.replace(old_sec_2_1_1, new_sec_2_1_1)
    print("Updated Section 2.1.1 successfully")
else:
    print("Warning: Section 2.1.1 not found exactly")

# 2. Update Section 2.3 (Bổ sung NFR theo ISO 25010)
old_sec_2_3 = """#### 2.3.3. Ràng buộc Kỹ thuật & Vận hành (System Constraints)

- **CON-01:** Hệ thống phân tích hình ảnh bắt buộc phải tận dụng lại được hệ thống IP Camera hiện có tại cụm sân (chuẩn RTSP/ONVIF), không ép chủ sân thay mới toàn bộ phần cứng.
- **CON-02:** Hệ thống điều khiển thiết bị điện phải có công tắc cơ dự phòng (Bypass) để đảm bảo sân vẫn bật được đèn thủ công nếu gặp sự cố mất mạng Internet.
![Sơ đồ Tư duy Tổng hợp Yêu cầu Bài toán (Requirements Mindmap)](docs/diagrams/rendered/10_mindmap_requirements.png)

**_[Hình minh họa: Ma trận phân loại yêu cầu nghiệp vụ và mối tương quan giữa Nỗi đau - Yêu cầu bài toán]_**"""

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

**_Hình 2.2: Sơ đồ Tư duy Tổng hợp Yêu cầu Bài toán (Requirements Mindmap) - Phân loại đa chiều Nghiệp vụ (BR), Người dùng (UR), Phi chức năng (NFR) và Ràng buộc (CON)_**"""

if old_sec_2_3 in content:
    content = content.replace(old_sec_2_3, new_sec_2_3)
    print("Updated Section 2.3 successfully")
else:
    print("Warning: Section 2.3 not found exactly")

# 3. Update Section 3.2 & 3.3 (Use Case Diagrams)
old_sec_3_2_3_3 = """### 3.2. BIỂU ĐỒ USE CASE TỔNG QUÁT (GENERAL USE CASE DIAGRAM)

![Hình 3.1: Sơ đồ tổng quan Use Case hệ thống quản lý sân thể thao tích hợp AI](docs/diagrams/rendered/06_usecase_general.png)

**_Hình 3.1: Sơ đồ tổng quan Use Case hệ thống quản lý sân thể thao tích hợp AI_**

### 3.3. BIỂU ĐỒ USE CASE PHÂN RÃ (DECOMPOSED USE CASE DIAGRAMS)

#### 3.3.1. Phân rã Gói chức năng: Trợ lý AI Hỏi Đáp Khách hàng (Customer AI Module)

Mô tả chi tiết các kịch bản tương tác văn bản của Khách hàng với AI Trợ lý trên giao diện Web.

![Hình 3.2: Biểu đồ Use Case phân rã gói chức năng Trợ lý AI Hỏi Đáp dành cho Khách hàng](docs/diagrams/rendered/07_usecase_customer_ai.png)

**_Hình 3.2: Biểu đồ Use Case phân rã gói chức năng Trợ lý AI Hỏi Đáp dành cho Khách hàng_**

#### 3.3.2. Phân rã Gói chức năng: Quản trị & Báo cáo Thông minh AI (Admin AI Analytics Module)

Mô tả chi tiết các tác vụ của Chủ sân khi sử dụng AI để truy xuất dữ liệu kinh doanh và đề xuất chương trình khuyến mãi.

**_Hình 3.3: Biểu đồ Use Case phân rã gói chức năng Quản trị & Báo cáo Thông minh AI_**

![Hình 3.3: Biểu đồ Use Case phân rã gói chức năng Quản trị & Báo cáo Thông minh AI](docs/diagrams/rendered/09_usecase_admin_ai.png)

#### 3.3.3. Phân rã Gói chức năng: Đặt sân & Thanh toán trực tuyến (Core Booking Module)

Mô tả luồng nghiệp vụ cốt lõi từ lúc tra cứu sơ đồ sân đến khi hoàn tất thanh toán.

![Hình 3.4: Biểu đồ Use Case phân rã gói chức năng Đặt sân và Dịch vụ trực tuyến](docs/diagrams/rendered/08_usecase_online_booking.png)

**_Hình 3.4: Biểu đồ Use Case phân rã gói chức năng Đặt sân và Dịch vụ trực tuyến_**"""

new_sec_3_2_3_3 = """### 3.2. BIỂU ĐỒ USE CASE TỔNG QUÁT (GENERAL USE CASE DIAGRAM)

Biểu đồ Use Case Tổng quát của hệ thống SportAI được thiết kế tuân thủ tuyệt đối các nguyên lý mô hình hóa hướng đối tượng UML 2.5:
1. **Phân quyền Tác nhân (Actors):**
   - **Khách hàng (Customer - Primary Actor):** Tương tác với các Use Case phục vụ đặt chỗ, thanh toán và hỗ trợ người dùng (`UC01` đến `UC05`).
   - **Chủ sân / Quản trị (Admin - Primary Actor):** Tương tác với các Use Case quản trị vận hành, thiết lập bảng giá, trích xuất báo cáo doanh thu và kích hoạt khuyến mãi (`UC01`, `UC06`, `UC07`, `UC08`).
   - **Hệ thống AI Engine (Gemini 1.5/2.0 - Secondary Actor):** Đóng vai trò hệ thống phụ bên ngoài cung cấp dịch vụ xử lý ngôn ngữ tự nhiên và Function Calling. Theo chuẩn UML, quan hệ giữa Tác nhân và Use Case **bắt buộc là quan hệ kết hợp (Association - đường nét liền)**, tuyệt đối không dùng quan hệ phụ thuộc `<<include>>` hay `<<extend>>`.
2. **Trừu tượng hóa Mức Nghiệp vụ (Business Abstraction):**
   Tên gọi của toàn bộ 8 Use Case được đặt hoàn toàn ở góc độ mục tiêu người dùng (*What the system does*), không bị rò rỉ mã lỗi kỹ thuật hay giải pháp triển khai (*How it is implemented*):
   - `UC01: Đăng ký & Đăng nhập tài khoản`
   - `UC02: Tra cứu lịch & Đặt sân trực tuyến`
   - `UC03: Đặt dịch vụ thể thao đi kèm` (Thuộc phạm vi mở rộng Phase 2)
   - `UC04: Thanh toán đơn đặt sân`
   - `UC05: Hỏi đáp & Tư vấn qua Trợ lý AI`
   - `UC06: Quản lý sân, lịch đặt & bảng giá`
   - `UC07: Báo cáo & Phân tích hoạt động kinh doanh`
   - `UC08: Đề xuất & Thiết lập chương trình khuyến mãi`

![Hình 3.1: Sơ đồ tổng quan Use Case hệ thống quản lý sân thể thao tích hợp AI](docs/diagrams/rendered/06_usecase_general.png)

**_Hình 3.1: Sơ đồ tổng quan Use Case hệ thống quản lý sân thể thao tích hợp AI (Chuẩn UML 2.5)_**

---

### 3.3. BIỂU ĐỒ USE CASE PHÂN RÃ (DECOMPOSED USE CASE DIAGRAMS)

#### 3.3.1. Phân rã Gói chức năng: Trợ lý AI Hỏi Đáp Khách hàng (Customer AI Module - UC05)

Gói chức năng UC05 mô tả chi tiết các kịch bản tương tác văn bản của Khách hàng với Chatbot AI:
- **Chuyên biệt hóa nghiệp vụ (Generalization):** Use Case gốc `UC05` được chuyên biệt hóa thành 4 trường hợp sử dụng cụ thể: `UC05.1` (Tra cứu sân trống theo ngày & giờ), `UC05.2` (Gợi ý khung giờ phù hợp ngân sách), `UC05.3` (Tra cứu bảng giá & tiện ích sân), và `UC05.4` (Tư vấn thuê HLV & dụng cụ).
- **Loại bỏ hàm nội bộ (Functional Decomposition Elimination):** Khắc phục lỗi coi thao tác đọc CSDL là use case; việc truy vấn CSDL được ẩn trong tầng Backend Service chứ không xuất hiện thành Use Case riêng biệt.
- **Xử lý Ngoại lệ (Exception Handling via `<<extend>>`):** 
  - `UC05.E1 (Phản hồi dự phòng khi AI quá tải)` mở rộng từ `UC05` khi phát sinh lỗi timeout >8s hoặc mất kết nối Gemini API, tự động suy biến sang Rule Engine.
  - `UC05.E2 (Hướng dẫn khi yêu cầu ngoài phạm vi)` mở rộng từ `UC05` khi khách hàng đặt câu hỏi không liên quan đến thể thao.
  - *Quy chuẩn chiều mũi tên:* Theo chuẩn UML, mũi tên `<<extend>>` trỏ từ Use Case mở rộng về Use Case cơ sở (`UC05.E1 ..> UC05`).

![Hình 3.2: Biểu đồ Use Case phân rã gói chức năng Trợ lý AI Hỏi Đáp dành cho Khách hàng](docs/diagrams/rendered/07_usecase_customer_ai.png)

**_Hình 3.2: Biểu đồ Use Case phân rã gói chức năng Trợ lý AI Hỏi Đáp dành cho Khách hàng_**

---

#### 3.3.2. Phân rã Gói chức năng: Quản trị & Báo cáo Thông minh AI (Admin AI Analytics Module - UC07 & UC08)

Mô tả các tác vụ thông minh hỗ trợ Chủ sân ra quyết định quản trị kinh doanh:
- **Chuyên biệt hóa phân tích:** `UC07` chuyên biệt hóa thành `UC07.1` (Tra cứu báo cáo tổng hợp doanh thu), `UC07.2` (Phân tích phản hồi khách hàng), và `UC08.1` (Đề xuất chương trình ưu đãi khung giờ vắng).
- **Chuẩn hóa chiều mũi tên `<<extend>>`:** Khi Admin phê duyệt gợi ý của AI, hành vi kích hoạt Flash Sale `UC08.2` là một bước phát sinh mở rộng, do đó mũi tên `<<extend>>` hướng từ `UC08.2` quay về `UC08.1` (`UC08.2 ..> UC08.1 : <<extend>>`).
- **Rào chắn bảo mật RBAC (`UC07.E1`):** Mở rộng từ `UC07` để xử lý ngoại lệ từ chối truy cập và ghi log kiểm toán khi người dùng không có vai trò `admin`.
- **Chính sách Chống Ảo giác (Anti-Hallucination):** Toàn bộ số liệu tài chính bắt buộc tính toán trên dữ liệu hóa đơn thực (`HoaDonDoanhThu` INNER JOIN `LichDatSan` với `trangThai = 'confirmed'`), loại bỏ hàm đọc DB thô ra khỏi biểu đồ.

![Hình 3.3: Biểu đồ Use Case phân rã gói chức năng Quản trị & Báo cáo Thông minh AI](docs/diagrams/rendered/09_usecase_admin_ai.png)

**_Hình 3.3: Biểu đồ Use Case phân rã gói chức năng Quản trị & Báo cáo Thông minh AI_**

---

#### 3.3.3. Phân rã Gói chức năng: Đặt sân & Thanh toán trực tuyến (Core Booking Module - UC02 & UC04)

Khắc phục triệt để lỗi lạm dụng `<<include>>` như một luồng công việc (Flowchart) từng màn hình:
- **Tách rời hai mục tiêu nghiệp vụ độc lập:** `UC02` (Tra cứu lịch & Đặt sân trực tuyến) và `UC04` (Thanh toán đơn đặt sân trực tuyến) là hai mục tiêu người dùng rõ rệt mà khách hàng trực tiếp tham gia.
- **Bắt buộc bao gồm (Include):** `UC02` bắt buộc bao gồm bước kiểm tra chỗ trống và khóa lịch giữ chỗ `UC04_1`, đồng thời yêu cầu thanh toán `UC04`. `UC04` bắt buộc bao gồm bước lập hóa đơn điện tử `UC04_3`.
- **Mở rộng tùy chọn (Extend đúng chiều):** Khách hàng có thể tùy chọn thuê thêm dụng cụ/HLV `UC03` mở rộng từ `UC02` (`UC03 ..> UC02 : <<extend>>`). Xử lý ngoại lệ hết hạn thanh toán `UC04.E1` mở rộng từ `UC04` (`UC04.E1 ..> UC04 : <<extend>>`) để giải phóng lịch đặt sau 15 phút.

![Hình 3.4: Biểu đồ Use Case phân rã gói chức năng Đặt sân và Dịch vụ trực tuyến](docs/diagrams/rendered/08_usecase_online_booking.png)

**_Hình 3.4: Biểu đồ Use Case phân rã gói chức năng Đặt sân và Dịch vụ trực tuyến (Chuẩn UML 2.5)_**"""

if old_sec_3_2_3_3 in content:
    content = content.replace(old_sec_3_2_3_3, new_sec_3_2_3_3)
    print("Updated Section 3.2 & 3.3 successfully")
else:
    print("Warning: Section 3.2 & 3.3 not found exactly")

# 4. Update Section 3.5 (Mermaid ERD & 5 Tables Dictionary)
old_sec_3_5 = """### 3.5. BẢNG MÔ TẢ ĐƠN VỊ THỰC THỂ CƠ BẢN PHỤC VỤ TRUY VẤN AI (DATA CONTEXT DÙNG CHO AI - ĐỒNG BỘ 1:1 SQLITE)

Căn cứ theo kiến trúc CSDL SQLite đã triển khai thực tế tại `backend/server.js` (4 bảng chuẩn hóa, kiểu số `INTEGER` cho giá trị tiền tệ VNĐ và khóa ngoại ràng buộc toàn vẹn), toàn bộ thực thể phục vụ AI Function Calling và phân quyền RBAC được chuẩn hóa 1:1 như sau:

```mermaid
erDiagram
    Users ||--o{ LichDatSan : "places"
    SanTheThao ||--o{ LichDatSan : "booked_in"
    LichDatSan ||--o| HoaDonDoanhThu : "generates"

    Users {
        INTEGER id PK "Auto Increment"
        TEXT username "Unique, Not Null"
        TEXT password_hash "Not Null"
        TEXT fullName "Not Null"
        TEXT role "Default: 'customer', Enum: ['customer', 'admin']"
        DATETIME createdAt "Default: CURRENT_TIMESTAMP"
    }

    SanTheThao {
        INTEGER id PK "Auto Increment"
        TEXT tenSan "Not Null"
        TEXT loaiSan "Not Null, e.g. Sân 5, Sân 7"
        INTEGER giaTienGio "Not Null, Đơn vị: VNĐ"
        TEXT hinhAnh "URL ảnh đại diện sân"
        TEXT trangThai "Default: 'active'"
    }

    LichDatSan {
        INTEGER id PK "Auto Increment"
        INTEGER idSan FK "References SanTheThao(id)"
        INTEGER idUser FK "References Users(id), Nullable"
        TEXT tenKhachHang "Not Null"
        TEXT ngayDat "Not Null, Chuẩn: YYYY-MM-DD"
        TEXT khungGio "Not Null, e.g. 17:30 - 19:00"
        TEXT trangThai "Default: 'pending', ['pending','confirmed','rejected','cancelled']"
        INTEGER tongTien "Not Null, Đơn vị: VNĐ"
        DATETIME createdAt "Default: CURRENT_TIMESTAMP"
    }

    HoaDonDoanhThu {
        INTEGER id PK "Auto Increment"
        INTEGER idLichDat FK "References LichDatSan(id), Unique"
        INTEGER tongTien "Not Null, Đơn vị: VNĐ"
        TEXT ngayThanhToan "Not Null, YYYY-MM-DD HH:mm:ss"
        TEXT phuongThuc "Default: 'Chuyển khoản QR'"
    }
```

| **Tên Bảng (Table)** | **Các Trường Dữ Liệu Thực Tế (Attributes)** | **Kiểu & Ràng Buộc** | **Vai Trò Phục Vụ AI & RBAC Guardrails** |
| :--- | :--- | :--- | :--- |
| **Users** | `id`, `username`, `password_hash`, `fullName`, `role`, `createdAt` | PK: `id`, UNIQUE: `username`, Enum: `role` ('customer', 'admin') | Xác thực JWT Token và phân quyền RBAC 2 lớp: Chặn Customer truy cập báo cáo doanh thu (`403 Forbidden`). |
| **SanTheThao** | `id`, `tenSan`, `loaiSan`, `giaTienGio`, `hinhAnh`, `trangThai` | PK: `id`, `giaTienGio` kiểu `INTEGER` (VNĐ) | Cung cấp danh mục sân, loại sân và đơn giá chuẩn xác phục vụ tool `get_available_courts` và `recommend_booking_options`. |
| **LichDatSan** | `id`, `idSan`, `idUser`, `tenKhachHang`, `ngayDat`, `khungGio`, `trangThai`, `tongTien`, `createdAt` | PK: `id`, FK: `idSan` -> `SanTheThao`, FK: `idUser` -> `Users` | Quản lý tình trạng đặt chỗ, thực thi thuật toán chống trùng lịch (Overbooking Pre-check) và lưu đơn từ Chatbot. |
| **HoaDonDoanhThu** | `id`, `idLichDat`, `tongTien`, `ngayThanhToan`, `phuongThuc` | PK: `id`, FK: `idLichDat` -> `LichDatSan` | Tự động sinh khi đơn cọc được duyệt ('confirmed'). Cung cấp dữ liệu SQL SUM/COUNT cho tool `generate_revenue_report` (Admin-only). |"""

new_sec_3_5 = """### 3.5. BẢNG MÔ TẢ ĐƠN VỊ THỰC THỂ CƠ BẢN PHỤC VỤ TRUY VẤN AI (DATA CONTEXT DÙNG CHO AI - ĐỒNG BỘ 1:1 SQLITE)

Căn cứ theo kiến trúc CSDL SQLite đã triển khai thực tế tại `backend/database.db` và mã nguồn `backend/server.js` (5 bảng chuẩn hóa, kiểu số `INTEGER` cho giá trị tiền tệ VNĐ, khóa ngoại thống nhất `idUser` và cơ chế Partial Unique Index chống Overbooking), toàn bộ thực thể phục vụ AI Function Calling và phân quyền RBAC được chuẩn hóa 1:1 như sau:

```mermaid
erDiagram
    Users ||--o{ LichDatSan : "places / creates"
    Users ||--o{ ChatHistory : "interacts_in"
    SanTheThao ||--o{ LichDatSan : "is_booked_in"
    LichDatSan ||--o| HoaDonDoanhThu : "confirms_into"

    Users {
        INTEGER id PK "Khóa chính tự tăng"
        TEXT username "Tên đăng nhập duy nhất"
        TEXT password_hash "Mật khẩu xác thực"
        TEXT fullName "Họ và tên người dùng"
        TEXT role "Vai trò ('customer', 'admin')"
        DATETIME createdAt "Thời điểm khởi tạo"
    }

    SanTheThao {
        INTEGER id PK "Khóa chính tự tăng"
        TEXT tenSan "Tên sân thể thao"
        TEXT loaiSan "Quy mô sân (Sân 5 người, Sân 7 người)"
        INTEGER giaTienGio "Giá thuê theo giờ (VNĐ)"
        TEXT hinhAnh "Đường dẫn hình ảnh thực tế sân"
        TEXT trangThai "Trạng thái hoạt động ('active', 'maintenance')"
    }

    LichDatSan {
        INTEGER id PK "Khóa chính tự tăng"
        INTEGER idSan FK "Khóa ngoại tham chiếu SanTheThao(id)"
        INTEGER idUser FK "Khóa ngoại tham chiếu Users(id) (Nullable)"
        TEXT tenKhachHang "Họ tên khách hàng đặt sân"
        TEXT ngayDat "Ngày đặt theo chuẩn YYYY-MM-DD"
        TEXT khungGio "Khung giờ đặt dạng nhãn (Ví dụ: 17:30 - 19:00)"
        TEXT gioBatDau "Giờ bắt đầu HH:mm (Hỗ trợ truy vấn giao khoảng)"
        TEXT gioKetThuc "Giờ kết thúc HH:mm (Hỗ trợ truy vấn giao khoảng)"
        TEXT trangThai "Trạng thái ('pending', 'confirmed', 'rejected', 'cancelled')"
        INTEGER tongTien "Tổng tiền đơn đặt (VNĐ)"
        DATETIME createdAt "Thời điểm gửi đơn"
    }

    HoaDonDoanhThu {
        INTEGER id PK "Khóa chính tự tăng"
        INTEGER idLichDat FK "Khóa ngoại duy nhất tham chiếu LichDatSan(id)"
        INTEGER tongTien "Số tiền thực thu (VNĐ)"
        TEXT ngayThanhToan "Thời điểm thanh toán thành công (YYYY-MM-DD HH:mm:ss)"
        TEXT phuongThuc "Phương thức thanh toán ('Chuyển khoản QR', 'Tiền mặt')"
    }

    ChatHistory {
        INTEGER id PK "Khóa chính tự tăng"
        TEXT sessionId "Mã phiên làm việc của người dùng / khách"
        INTEGER idUser FK "Khóa ngoại tham chiếu Users(id) (Nullable)"
        TEXT role "Vai trò ('user', 'model', 'system')"
        TEXT message "Nội dung tin nhắn hỏi đáp AI"
        DATETIME createdAt "Thời điểm gửi tin nhắn"
    }
```

| **Tên Bảng (Table)** | **Các Trường Dữ Liệu Thực Tế (Attributes)** | **Kiểu & Ràng Buộc** | **Vai Trò Phục Vụ AI & RBAC Guardrails** |
| :--- | :--- | :--- | :--- |
| **Users** | `id`, `username`, `password_hash`, `fullName`, `role`, `createdAt` | PK: `id`, UNIQUE: `username`, Enum: `role` ('customer', 'admin') | Xác thực JWT Token và phân quyền RBAC 2 lớp: Chặn Customer truy cập báo cáo doanh thu (`403 Forbidden`). |
| **SanTheThao** | `id`, `tenSan`, `loaiSan`, `giaTienGio`, `hinhAnh`, `trangThai` | PK: `id`, `giaTienGio` kiểu `INTEGER` (VNĐ) | Cung cấp danh mục sân, loại sân và đơn giá chuẩn xác phục vụ tool `get_available_courts` và `recommend_booking_options`. |
| **LichDatSan** | `id`, `idSan`, `idUser`, `tenKhachHang`, `ngayDat`, `khungGio`, `gioBatDau`, `gioKetThuc`, `trangThai`, `tongTien`, `createdAt` | PK: `id`, FK: `idSan` -> `SanTheThao`, FK: `idUser` -> `Users`, Partial Unique Index | Quản lý tình trạng đặt chỗ, thực thi khóa chống trùng lịch (Double-Check Locking & Index `idx_unique_active_booking`) và thuật toán giao khoảng thời gian (`gioBatDau < endTime AND gioKetThuc > startTime`). |
| **HoaDonDoanhThu** | `id`, `idLichDat`, `tongTien`, `ngayThanhToan`, `phuongThuc` | PK: `id`, FK: `idLichDat` -> `LichDatSan` (UNIQUE) | Tự động sinh khi đơn cọc được duyệt ('confirmed'). Cung cấp dữ liệu SQL SUM/COUNT cho tool `generate_revenue_report` (Admin-only). |
| **ChatHistory** | `id`, `sessionId`, `idUser`, `role`, `message`, `createdAt` | PK: `id`, FK: `idUser` -> `Users` (Nullable) | Lưu trữ phiên hội thoại đa lượt (Multi-turn), khắc phục nhược điểm Stateless của Chatbot, hỗ trợ AI ghi nhớ ngữ cảnh và cung cấp nhật ký kiểm toán cho Admin. |"""

if old_sec_3_5 in content:
    content = content.replace(old_sec_3_5, new_sec_3_5)
    print("Updated Section 3.5 successfully")
else:
    print("Warning: Section 3.5 not found exactly")

# 5. Insert Section 3.9 (State Machine) & Section 3.10 (Deployment Architecture) after Section 3.8
sec_3_8_end_marker = "![Hình 3.8: Biểu đồ lớp phân tích BCE](docs/diagrams/rendered/02_bce_class_diagram.png)"

new_sec_3_9_3_10 = """![Hình 3.8: Biểu đồ lớp phân tích BCE](docs/diagrams/rendered/02_bce_class_diagram.png)

---

### 3.9. SƠ ĐỒ TRẠNG THÁI VÒNG ĐỜI ĐƠN ĐẶT SÂN (BOOKING STATE MACHINE DIAGRAM)

Nhằm đảm bảo tính toàn vẹn dữ liệu và loại trừ tuyệt đối rủi ro tranh chấp đồng thời (Concurrency / Race Condition), vòng đời của một đơn đặt sân trong bảng `LichDatSan` được quản lý chặt chẽ theo biểu đồ trạng thái máy (State Machine):

1. **Khởi tạo (`[*] -> pending`):** Khi người dùng gửi yêu cầu đặt sân (`POST /api/bookings`), hệ thống thực hiện kiểm tra tiền điều kiện (Pre-check) và lưu đơn với trạng thái `pending`. Khung giờ được khóa giữ chỗ tạm thời trong 15 phút.
2. **Xác nhận (`pending -> confirmed`):** Khi Admin duyệt đơn trên Dashboard hoặc khách hàng quét mã QR thanh toán cọc thành công, đơn chuyển sang `confirmed`. Hệ thống tự động kích hoạt:
   - Kích hoạt chỉ mục duy nhất `idx_unique_active_booking` khóa cứng khung giờ trên CSDL.
   - Tự động thực thi `INSERT INTO HoaDonDoanhThu` để ghi nhận doanh thu thực tế.
3. **Từ chối (`pending -> rejected`):** Nếu phát hiện trùng sự kiện hoặc sân cần bảo trì đột xuất, Admin từ chối đơn. Đơn chuyển sang `rejected` và kết thúc.
4. **Hủy đơn (`pending / confirmed -> cancelled`):** 
   - Đơn `pending` tự động chuyển sang `cancelled` nếu quá hạn thanh toán 15 phút.
   - Đơn `confirmed` chuyển sang `cancelled` khi khách hàng báo hủy trước giờ thi đấu. Ngay khi chuyển sang `cancelled`, chỉ mục duy nhất một phần SQLite tự động giải phóng ràng buộc (`WHERE trangThai NOT IN ('rejected', 'cancelled')`), cho phép khách hàng khác đặt lại khung giờ này ngay lập tức.
5. **Hoàn tất (`confirmed -> completed`):** Kết thúc trận đấu, khách thanh toán nốt tiền giờ còn lại, nhân viên gạch sổ hoàn tất ca thi đấu.

![Hình 3.9: Sơ đồ Trạng thái Vòng đời Đơn Đặt Sân (Booking State Machine)](docs/diagrams/rendered/12_state_booking_lifecycle.png)

**_Hình 3.9: Sơ đồ Trạng thái Vòng đời Đơn Đặt Sân (Booking State Machine) - Đồng bộ 100% logic CSDL SQLite_**

---

### 3.10. SƠ ĐỒ KIẾN TRÚC TRIỂN KHAI HỆ THỐNG (DEPLOYMENT ARCHITECTURE)

Hệ thống SportAI được thiết kế theo kiến trúc Microservices đóng gói hoàn chỉnh bằng Docker Container, đảm bảo khả năng triển khai độc lập, tính sẵn sàng cao và dễ dàng vận hành trên mọi hạ tầng Cloud hoặc máy chủ cục bộ:

1. **Tầng Thiết bị Người dùng (Client Tier):** Trình duyệt web trên Desktop và Mobile tương tác với ứng dụng React SPA (Single Page Application) được tối ưu hóa bằng Vite và Tailwind CSS.
2. **Tầng Máy chủ Triển khai (Docker Host Infrastructure):**
   - **Container Frontend (`sportai-frontend` - Port 5173):** Đóng gói Nginx / Vite Web Server phục vụ các thành phần giao diện: `CustomerView`, `AdminDashboard`, `ChatbotWidget`.
   - **Container Backend (`sportai-backend` - Port 3000):** Đóng gói môi trường Node.js / Express REST API Server gồm: Auth Middleware (JWT & RBAC Guardrail), Booking Engine (Double-Check Locking), AI Tool Dispatcher (Agentic Loop điều phối công cụ), và SQLite Driver.
   - **Volume Mount Bền vững (`/app/database.db`):** File CSDL SQLite được ánh xạ ra ổ cứng máy chủ thông qua Docker Volume, đảm bảo 100% dữ liệu tài khoản, lịch đặt, hóa đơn và lịch sử hội thoại không bị mất khi restart hoặc rebuild container.
3. **Tầng Dịch vụ Đám mây Ngoại vi (External Cloud Services):**
   - **Google Cloud Generative AI:** Kết nối qua giao thức HTTPS REST an toàn tới mô hình `gemini-2.0-flash` / `gemini-1.5-flash` để thực thi Agentic Function Calling. Khóa `GEMINI_API_KEY` được bảo mật tuyệt đối trong file `.env` trên máy chủ.
   - **Hệ thống Thanh toán Ngân hàng (VietQR / Napas 24/7):** Hỗ trợ khách hàng quét mã QR động để đối soát và thanh toán tiền cọc tức thì.

![Hình 3.10: Sơ đồ Kiến trúc Triển khai Hệ thống (Deployment Architecture)](docs/diagrams/rendered/13_deployment_architecture.png)

**_Hình 3.10: Sơ đồ Kiến trúc Triển khai Hệ thống (Deployment Architecture) - Đóng gói Docker Container & Kết nối AI Cloud_**"""

if sec_3_8_end_marker in content:
    content = content.replace(sec_3_8_end_marker, new_sec_3_9_3_10)
    print("Inserted Section 3.9 & 3.10 successfully")
else:
    print("Warning: Section 3.8 end marker not found")

# 6. Update Section 4.1 (Remove hallucinated tables SanBong, DanhGiaPhanHoi)
old_sec_4_1 = """### 4.1. CƠ SỞ DỮ LIỆU TÍCH HỢP CHO AI HOẠT ĐỘNG

Dưới đây là mô hình sơ đồ quan hệ thực thể (ERD) rút gọn tập trung vào các bảng dữ liệu cốt lõi mà Trợ lý AI truy xuất để phục vụ tính năng Hỏi Đáp cho Khách hàng và Chủ sân:

![Hình 4.1: Sơ đồ quan hệ thực thể CSDL (ERD)](docs/diagrams/rendered/01_erd_database.png)

**Bảng tổng hợp vai trò dữ liệu phục vụ AI Chatbot:**

| **Tên Bảng (Table)** | **Trường dữ liệu chính (Attributes)**                      | **Vai trò phục vụ AI Hỏi Đáp**                                                                           |
| -------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| SanBong              | San_ID, TenSan, LoaiSan, GiaTienGio                        | Giúp AI tư vấn chọn loại sân, tra cứu bảng giá và gợi ý sân phù hợp với ngân sách khách hàng.            |
| LichDatSan           | Lich_ID, User_ID, San_ID, GioBatDau, GioKetThuc, TrangThai | Giúp AI kiểm tra khung giờ trống thời gian thực, tư vấn thời gian đặt sân khả dụng cho người chơi.       |
| HoaDonDoanhThu       | HD_ID, TongTien, NgayThanhToan, San_ID                     | Giúp AI trích xuất báo cáo doanh thu nhanh, thống kê sân có doanh thu cao/thấp theo yêu cầu của Chủ sân. |
| DanhGiaPhanHoi       | PhanHoi_ID, User_ID, SoSao, NoiDungText, NgayTao           | Giúp AI tổng hợp ý kiến phản hồi, phân tích cảm xúc khách hàng (tiêu cực/tích cực) cho Admin.            |"""

new_sec_4_1 = """### 4.1. CƠ SỞ DỮ LIỆU TÍCH HỢP CHO AI HOẠT ĐỘNG (CHUẨN HÓA 100% THEO CODE THỰC TẾ)

Dưới đây là mô hình sơ đồ quan hệ thực thể (ERD) thể hiện đầy đủ cấu trúc 5 bảng CSDL thực tế trong tệp SQLite `backend/database.db` mà Trợ lý AI và hệ thống Web App cùng truy xuất:

![Hình 4.1: Sơ đồ quan hệ thực thể CSDL (ERD)](docs/diagrams/rendered/01_erd_database.png)

**_Hình 4.1: Sơ đồ Thực thể Quan hệ CSDL (ERD) - 5 Bảng Chuẩn hóa, Khóa chống trùng lịch Concurrency & Overlap Interval_**

**Bảng Tổng hợp Từ điển Dữ liệu và Vai trò phục vụ AI Function Calling:**

| **Tên Bảng (Table)** | **Các Cột Dữ Liệu Thực Tế (Attributes)** | **Ràng Buộc & Khóa** | **Vai Trò Phục Vụ AI Chatbot & Rào Chắn RBAC** |
| :--- | :--- | :--- | :--- |
| **Users** | `id`, `username`, `password_hash`, `fullName`, `role`, `createdAt` | PK: `id`<br>UK: `username`<br>Enum: `role` ('customer', 'admin') | Cung cấp định danh và vai trò người dùng. Rào chắn RBAC 2 lớp: Chặn Customer gọi tool tài chính của Admin. |
| **SanTheThao** | `id`, `tenSan`, `loaiSan`, `giaTienGio`, `hinhAnh`, `trangThai` | PK: `id`<br>Tiền tệ: `INTEGER` (VNĐ)<br>Enum: `trangThai` ('active', 'inactive') | Cung cấp danh mục sân, cấu hình sân 5/7 người và giá tiền/giờ chuẩn xác cho tool `get_available_courts` và `get_court_details_and_pricing`. |
| **LichDatSan** | `id`, `idSan`, `idUser`, `tenKhachHang`, `ngayDat`, `khungGio`, `gioBatDau`, `gioKetThuc`, `trangThai`, `tongTien`, `createdAt` | PK: `id`<br>FK: `idSan` -> `SanTheThao`<br>FK: `idUser` -> `Users`<br>Index: `idx_unique_active_booking` | Quản lý lịch đặt, hỗ trợ AI kiểm tra sân trống theo khoảng thời gian (`gioBatDau < endTime AND gioKetThuc > startTime`) và chặn trùng lịch cấp CSDL. |
| **HoaDonDoanhThu** | `id`, `idLichDat`, `tongTien`, `ngayThanhToan`, `phuongThuc` | PK: `id`<br>FK, UK: `idLichDat` -> `LichDatSan`<br>Tiền tệ: `INTEGER` (VNĐ) | Ghi nhận doanh thu thực tế khi đơn đặt được duyệt ('confirmed'). Cung cấp số liệu chính xác tuyệt đối cho tool `generate_revenue_report` (Chống bịa đặt số liệu - Anti-Hallucination). |
| **ChatHistory** | `id`, `sessionId`, `idUser`, `role`, `message`, `createdAt` | PK: `id`<br>FK: `idUser` -> `Users` (Nullable)<br>Enum: `role` ('user', 'model', 'system') | Lưu trữ toàn bộ lịch sử hỏi đáp đa lượt (Multi-turn), tự động gắn kết ngữ cảnh ngày/giờ cho Chatbot và phục vụ kiểm toán hệ thống. |"""

if old_sec_4_1 in content:
    content = content.replace(old_sec_4_1, new_sec_4_1)
    print("Updated Section 4.1 successfully")
else:
    print("Warning: Section 4.1 not found exactly")

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Finished updating report. Final file size: {len(content):,} characters")

