# BẢNG MA TRẬN TRUY VẾT HAI CHIỀU (BI-DIRECTIONAL TRACEABILITY MATRIX)
## HỆ THỐNG QUẢN LÝ SÂN THỂ THAO TÍCH HỢP TRỢ LÝ AI (SPORTAI)

> **Mục đích:** Đảm bảo tính kiểm toán và truy vết 1:1 tuyệt đối giữa Yêu cầu Nghiệp vụ (Requirements) ↔ Use Case Thiết kế ↔ Sơ đồ Kiến trúc ↔ Endpoint API Backend ↔ Cấu trúc CSDL SQLite.
> Tuân thủ định hướng đồ án đạt điểm tối đa (10/10) theo chuẩn công nghiệp và tiêu chí chấm thi.

---

### 1. Ma Trận Truy Vết Tổng Thể (Comprehensive Traceability Matrix)

| Mã Yêu Cầu (Req ID) | Tên Nghiệp Vụ / Mục Tiêu | Mã Use Case | Endpoint REST API | Hàm Xử Lý / Tool AI | Bảng & Ràng Buộc CSDL | Tệp Sơ Đồ Thiết Kế (.puml / .png) |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **BR-01 / UR-02** | Tra cứu lịch & Đặt sân trực tuyến | `UC02` | `GET /api/courts`<br>`GET /api/bookings` | `get_available_courts()` | `SanTheThao`<br>`LichDatSan` | [`08_usecase_online_booking.puml`](08_usecase_online_booking.puml)<br>[`08_usecase_online_booking.png`](rendered/08_usecase_online_booking.png) |
| **NFR-05 / CON-02** | Khóa chống trùng lịch Concurrency (409) | `UC04_1` | `POST /api/bookings` | Double-Check Locking<br>`sqlite3 SQLITE_CONSTRAINT` | Index: `idx_unique_active_booking`<br>Cols: `gioBatDau`, `gioKetThuc` | [`01_erd_database.puml`](01_erd_database.puml)<br>[`12_state_booking_lifecycle.puml`](12_state_booking_lifecycle.puml) |
| **BR-04** | Thanh toán cọc & Lập hóa đơn doanh thu | `UC04` | `POST /api/bookings` | Tự động tạo hóa đơn khi duyệt cọc | `HoaDonDoanhThu`<br>`LichDatSan (confirmed)` | [`08_usecase_online_booking.puml`](08_usecase_online_booking.puml)<br>[`12_state_booking_lifecycle.puml`](12_state_booking_lifecycle.puml) |
| **UR-01 / NFR-01** | Trợ lý AI tư vấn sân & gợi ý khung giờ | `UC05.1`<br>`UC05.2` | `POST /api/chat` | `get_available_courts`<br>`recommend_booking_options` | `SanTheThao`<br>`LichDatSan`<br>`ChatHistory` | [`04_sequence_customer_chat.puml`](04_sequence_customer_chat.puml)<br>[`07_usecase_customer_ai.puml`](07_usecase_customer_ai.puml) |
| **NFR-06** | Xử lý suy biến an toàn khi AI lỗi / timeout | `UC05.E1` | `POST /api/chat` | 8s Timeout Guard<br>`fallbackRuleEngine()` | CSDL SQLite nội bộ | [`03_activity_ai_workflow.puml`](03_activity_ai_workflow.puml)<br>[`07_usecase_customer_ai.puml`](07_usecase_customer_ai.puml) |
| **UR-01 / BR-02** | Báo cáo doanh thu tài chính Admin | `UC07.1` | `POST /api/chat` | `generate_revenue_report()` | `HoaDonDoanhThu` INNER JOIN `LichDatSan` | [`05_sequence_admin_revenue.puml`](05_sequence_admin_revenue.puml)<br>[`09_usecase_admin_ai.puml`](09_usecase_admin_ai.puml) |
| **NFR-03 / NFR-04** | Rào chắn phân quyền RBAC 2 lớp | `UC07.E1` | `POST /api/chat` | Route Auth MW + Tool Guardrail `role === 'admin'` | `Users.role` | [`05_sequence_admin_revenue.puml`](05_sequence_admin_revenue.puml)<br>[`09_usecase_admin_ai.puml`](09_usecase_admin_ai.puml) |
| **BR-03** | Đề xuất & Kích hoạt Flash Sale giờ vắng | `UC08.1`<br>`UC08.2` | `POST /api/admin/ai-execute` | AI Flash Sale 50% Simulation | `SanTheThao.giaTienGio` | [`09_usecase_admin_ai.puml`](09_usecase_admin_ai.puml)<br>[`06_usecase_general.puml`](06_usecase_general.puml) |
| **CLO5** | Đóng gói Docker & Triển khai Container | N/A | Ports: `3000`, `5173` | Docker Compose<br>Persistent Volume Mount | `/app/database.db` | [`13_deployment_architecture.puml`](13_deployment_architecture.puml)<br>[`13_deployment_architecture.png`](rendered/13_deployment_architecture.png) |

---

### 2. Danh Mục Đối Chiếu Sơ Đồ Kiến Trúc (Diagram Inventory 13/13)

| STT | Mã File | Tên Sơ Đồ | Chuẩn Mô Hình | Trạng Thái Rà Soát |
| :---: | :--- | :--- | :--- | :---: |
| 1 | `01_erd_database` | Sơ đồ Thực thể Quan hệ CSDL (ERD) | IDEF1X / Chen | ✅ Đủ 5 bảng, Khóa ngoại `idUser`, Partial Unique Index |
| 2 | `02_bce_class_diagram` | Biểu đồ Lớp Phân tích (BCE Class Diagram) | UML 2.5 Class | ✅ 5 Boundary, 4 Control, 5 Entity đồng bộ 100% |
| 3 | `03_activity_ai_workflow` | Sơ đồ Hoạt động AI Agentic Workflow | UML 2.5 Activity | ✅ Luồng 2-pass Function Calling, 8s timeout, Fallback engine |
| 4 | `04_sequence_customer_chat` | Sơ đồ Tuần tự: Khách Chat Trợ lý AI | UML 2.5 Sequence | ✅ Ghi `ChatHistory`, gọi tool `get_available_courts` |
| 5 | `05_sequence_admin_revenue` | Sơ đồ Tuần tự: Admin Báo cáo Doanh thu | UML 2.5 Sequence | ✅ Rào chắn RBAC 2 lớp, tool `generate_revenue_report` |
| 6 | `06_usecase_general` | Sơ đồ Tổng quan Use Case Hệ thống | UML 2.5 Use Case | ✅ 8 UC nghiệp vụ thuần túy, Association nét liền với AI |
| 7 | `07_usecase_customer_ai` | Gói Use Case: AI Trợ lý Khách hàng | UML 2.5 Use Case | ✅ Xóa `UC_FetchData`, thêm `<<extend>>` xử lý ngoại lệ |
| 8 | `08_usecase_online_booking` | Gói Use Case: Đặt sân & Dịch vụ Trực tuyến | UML 2.5 Use Case | ✅ Đảo đúng chiều `<<extend>>`, xóa chuỗi flowchart `<<include>>` |
| 9 | `09_usecase_admin_ai` | Gói Use Case: Quản trị & Báo cáo AI | UML 2.5 Use Case | ✅ Đảo đúng chiều `<<extend>>`, xóa `UC_QueryBizData`, thêm RBAC |
| 10 | `10_mindmap_requirements` | Sơ đồ Tư duy Yêu cầu Bài toán (Mindmap) | Mindmap | ✅ Bổ sung đầy đủ nhóm NFR theo ISO 25010 (Latency, Security, Uptime) |
| 11 | `11_activity_asis_process` | Sơ đồ Quy trình Hiện trạng Thủ công (As-Is) | UML 2.5 Activity | ✅ Vòng lặp đổi giờ, nhánh Hủy/No-Show, 3 nguy cơ cốt lõi |
| 12 | `12_state_booking_lifecycle` | Sơ đồ Trạng thái Vòng đời Đơn Đặt Sân | UML 2.5 State | ✅ Khớp 100% cột `trangThai` và Index SQLite |
| 13 | `13_deployment_architecture` | Sơ đồ Kiến trúc Triển khai (Deployment) | UML 2.5 Deployment | ✅ Đóng gói Docker, Volume mount SQLite, Gemini AI Cloud |

