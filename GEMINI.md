# QUY TẮC PHÁT TRIỂN DỰ ÁN & ĐIỀU HƯỚNG AI AGENT (PROJECT DIRECTIVES)

> **CHỈ THỊ TỐI THƯỢNG:** 
> AI Agent hoạt động trong dự án này phải **TUYỆT ĐỐI TUÂN THỦ** 2 nguồn thông tin duy nhất dưới đây và bỏ qua toàn bộ các tài liệu/prompt phân tán cũ để tập trung đạt điểm tối đa (10/10):

---

## 1. NGUỒN KIM CHỈ NAM BẮT BUỘC (SOLE SOURCE OF TRUTH)

### 1. File Skill chuẩn của dự án:
- Đường dẫn: [`.agents/skills/sport-ai-chatbot/SKILL.md`](file:///d:/Git/hethonquanlysanthethaotichhopai/.agents/skills/sport-ai-chatbot/SKILL.md)
- Bao gồm toàn bộ quy chuẩn kỹ thuật:
  - Agentic Workflow & Function Calling (Gemini API 1.5/2.0).
  - Khai báo 4 Tools chuẩn: `get_available_courts`, `get_court_details_and_pricing`, `recommend_booking_options`, `generate_revenue_report`.
  - Phân quyền RBAC 2 lớp (Customer vs Admin) & Rào chắn an toàn (Guardrails, Zero Trust).
  - System Instruction chuẩn hóa thời gian UTC+7.
  - Template Engine cho Báo cáo Doanh thu (Excel Zebra Striping/Border/Formula SUM, Word Insights) và Tài liệu Kỹ thuật (SRS/SDD Zero-Placeholder, Mermaid Diagram-as-Code).
  - Cơ chế Self-Correction QA Checklist chống Bịa đặt Số liệu (Anti-Hallucination).
  - Cơ chế Kiểm toán & Đồng bộ hóa Tuyệt đối giữa Code và Sơ đồ (Strict Code-Diagram Synchronization & Auditing, Bi-directional Traceability 1:1).

### 2. Hai Bảng Tiêu Chí Chấm Thi (Chấm đồ án / Cuối kỳ):
- **Bảng 1 (Software Factory & SDLC trọng số 4.0đ):**
  - CLO1: Quyển báo cáo (3.0đ) - Phân tích đúng nghiệp vụ, chức năng đầy đủ, kiến trúc/CSDL hợp lý.
  - CLO2, CLO3: Hoàn thiện hệ thống và chức năng AI (2.0đ) - Nghiệp vụ chính, đăng nhập, phân quyền, kết nối API.
  - CLO3, CLO4, CLO5: **Thiết kế Agent AI cho SDLC (4.0đ - Trọng tâm)** - Context engineering, factory, unit test, integration test, guardrails, security.
  - CLO1, CLO5: Đóng gói, vận hành & theo dõi (1.0đ) - Docker, CI/CD, logging/monitoring.
- **Bảng 2 (Thực nghiệm & Vấn đáp bảo vệ):**
  - Tiêu chí 1: Lý giải vị trí AI (tại sao dùng AI thay vì logic thuần).
  - Tiêu chí 2: Nghiệp vụ chính xác, kết nối API và prompt tối ưu.
  - Tiêu chí 3: Kiểm thử đúng/sai/biên, so sánh các phiên bản prompt (A/B testing), xử lý lỗi AI, bảo mật API key.
  - Tiêu chí 4: Giao diện dễ dùng, README/Git chỉn chu, demo trực tiếp mượt mà.
  - Tiêu chí 5: Minh chứng AI trong SDLC, tư duy phản biện, kiểm chứng sửa lỗi do AI sinh ra.

---

## 2. QUY TẮC BẢO MẬT & GIT POLICY (NGHIÊM NGẶT)

- **TUYỆT ĐỐI KHÔNG COMMIT HOẶC PUSH** 2 ảnh tiêu chí chấm thi (`1792988520882_*.jpg`, `1792994225697_*.jpg`) lên GitHub.
- Các quy tắc chặn đã được ghi nhận trong file [.gitignore](file:///d:/Git/hethonquanlysanthethaotichhopai/.gitignore). Không bao giờ chỉnh sửa để gỡ bỏ các dòng này.
- Tuyệt đối không commit API Key (Gemini API Key, Database Credentials, JWT Secret) lên Git. Mọi biến môi trường phải đặt trong `.env`.

---

## 3. VÔ HIỆU HÓA CÁC FILE QUY TẮC CŨ (DEPRECATION NOTICE)

- Mọi file prompt, config, tài liệu nháp nằm rải rác trước đây (như trong thư mục `_archive_legacy_agents/` hoặc các file txt nháp) **ĐÃ BỊ VÔ HIỆU HÓA HOÀN TOÀN**.
- AI Agent **KHÔNG THAM CHIẾU**, không để các file này gây nhiễu luồng tư duy hoặc làm loãng kiến trúc dự án.
