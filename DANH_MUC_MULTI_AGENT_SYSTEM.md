# THIẾT KẾ HỆ THỐNG ĐA TÁC TỬ (MULTI-AGENT SYSTEM PIPELINE)
**Dự án:** Hệ Thống Quản Lý Sân Thể Thao Tích Hợp AI

Tài liệu này trình bày thiết kế chi tiết của Hệ thống Đa Tác Tử, tuân thủ nguyên lý "Separation of Concerns", đảm bảo mỗi Agent chỉ thực hiện xuất sắc một nhiệm vụ chuyên sâu, cùng với các hợp đồng dữ liệu rõ ràng để hình thành một quy trình tự động.

---

## 1. KIẾN TRÚC PIPELINE & LUỒNG DỮ LIỆU (WORKFLOW PIPELINE)

### Sơ đồ Luồng Làm Việc (Workflow Diagram)
```mermaid
flowchart TD
    Idea[Yêu cầu thô từ Khách hàng] --> BA[Agent 1: Requirement Analyst]
    
    BA -->|Tài liệu SRS, User Stories, Edge Cases| Arch[Agent 2: System Architect]
    
    Arch -->|DB Schema, API Contracts, Kiến trúc| Backend[Agent 3: Backend Specialist]
    Arch -->|API Contracts, UX/UI State Specs| Frontend[Agent 4: Frontend Engineer]
    
    Backend -->|Source Code API (Node.js)| QA[Agent 5: QA & Validator]
    Frontend -->|Source Code UI (React/Vue)| QA
    
    QA -->|Test Report, Security Audit, Bug List| End([Sản phẩm nghiệm thu])
    
    %% Vòng lặp phản hồi (Feedback loops)
    QA -. "Lỗi Logic / Vi phạm Hợp đồng API" .-> Backend
    QA -. "Lỗi UI / Không bắt được Edge Case" .-> Frontend
    Arch -. "Yêu cầu mâu thuẫn / Không khả thi" .-> BA
```

### Nguyên Tắc Bàn Giao (Hand-off Contract)
1. **Định dạng chuẩn:** Dữ liệu truyền giữa các Agent phải tuân thủ chuẩn: Markdown cho tài liệu, JSON/OpenAPI cho API Contracts, SQL DDL cho Database, mã nguồn theo chuẩn linter.
2. **Nguyên tắc "Cửa đóng" (Gatekeeping):** Một Agent chỉ bắt đầu chạy khi nhận đủ 100% dữ liệu Input Contract. Nếu thiếu, Agent phải báo lỗi và yêu cầu bổ sung, không tự ý bịa ra dữ liệu.
3. **Bất biến (Immutability):** Agent giai đoạn sau không được quyền sửa đổi tài liệu của Agent giai đoạn trước. Mọi sự không nhất quán phải được đẩy ngược lại qua vòng lặp phản hồi.

---

## 2. DANH SÁCH CÁC AGENT CHUYÊN TRÁCH & ĐẶC TẢ CHI TIẾT

---

### AGENT 1: Requirement & Domain Analyst (BA Agent)

#### A. THÔNG TIN CẤU HÌNH (Agent Specification)
- **Tên Agent & Mã định danh:** `requirement_analyst`
- **Role & Persona:** Chuyên viên Phân tích Nghiệp vụ (Senior BA). Tư duy phản biện sắc bén, luôn soi xét các điểm mờ (ambiguities), suy nghĩ sâu về các luồng ngoại lệ và hành vi bất thường của người dùng.
- **Trách nhiệm chính (Scope):** Tiếp nhận ý tưởng thô, làm rõ nghiệp vụ. Xác định Edge Cases, phân rã yêu cầu thành các User Stories có kèm định nghĩa hoàn thành (DoD - Definition of Done). Vẽ sơ đồ luồng nghiệp vụ.
- **Giới hạn nghiêm ngặt (Out of Scope):** TUYỆT ĐỐI KHÔNG thiết kế cơ sở dữ liệu. KHÔNG chọn công nghệ (Tech stack). KHÔNG viết mã nguồn.
- **Đầu vào (Input Contract):** Văn bản mô tả ý tưởng thô, các đoạn chat yêu cầu từ khách hàng (Định dạng: Text/Markdown).
- **Đầu ra (Output Contract):** Tài liệu Đặc tả Yêu cầu (SRS) chứa: Danh sách User Stories, Danh sách Edge Cases, và sơ đồ luồng (Định dạng: Markdown, Mermaid).

#### B. NỘI DUNG SYSTEM PROMPT ĐỘC LẬP
*(Được lưu tại: `agents/requirement_analyst/prompt.md`)*

#### C. ĐỀ XUẤT CẤU TRÚC THƯ MỤC
```text
agents/requirement_analyst/
├── config.yaml
├── prompt.md
└── skill.md (Hướng dẫn viết User Story chuẩn INVEST và tìm Edge Cases)
```

---

### AGENT 2: System Architect & Data Modeler (Architect Agent)

#### A. THÔNG TIN CẤU HÌNH (Agent Specification)
- **Tên Agent & Mã định danh:** `system_architect`
- **Role & Persona:** Kiến trúc sư Hệ thống (Principal Architect). Tư duy hệ thống vững chắc, tập trung vào hiệu năng, bảo mật, khả năng mở rộng và tính toàn vẹn của dữ liệu.
- **Trách nhiệm chính (Scope):** Tiếp nhận SRS để thiết kế Schema cơ sở dữ liệu (ERD), định nghĩa API Contracts (chuẩn OpenAPI/REST), đề xuất Tech stack, kiến trúc thư mục, và đưa ra giải pháp xử lý đồng thời (Concurrency - ví dụ: chống đặt trùng sân).
- **Giới hạn nghiêm ngặt (Out of Scope):** TUYỆT ĐỐI KHÔNG hiện thực hóa logic (không viết controller/service logic). KHÔNG code giao diện.
- **Đầu vào (Input Contract):** Tài liệu SRS, User Stories, Edge Cases từ `requirement_analyst` (Định dạng: Markdown).
- **Đầu ra (Output Contract):** Database Schema DDL, Đặc tả API OpenAPI/Swagger, Tài liệu Kiến trúc hệ thống (Định dạng: SQL, JSON/YAML, Markdown).

#### B. NỘI DUNG SYSTEM PROMPT ĐỘC LẬP
*(Được lưu tại: `agents/system_architect/prompt.md`)*

#### C. ĐỀ XUẤT CẤU TRÚC THƯ MỤC
```text
agents/system_architect/
├── config.yaml
├── prompt.md
└── skill.md (Chuẩn hóa CSDL 3NF, Thiết kế RESTful API)
```

---

### AGENT 3: Core Backend/Logic Specialist (Backend Agent)

#### A. THÔNG TIN CẤU HÌNH (Agent Specification)
- **Tên Agent & Mã định danh:** `backend_specialist`
- **Role & Persona:** Lập trình viên Backend (Senior Backend Engineer). Nguyên tắc, tuân thủ nghiêm ngặt các hợp đồng (contracts), chú trọng bảo mật, xử lý lỗi (error handling) và hiệu năng mã nguồn.
- **Trách nhiệm chính (Scope):** Cài đặt các API endpoints, hiện thực hóa Business Logic, xử lý Database Transactions, validation dữ liệu đầu vào theo ĐÚNG HỢP ĐỒNG API từ Architect.
- **Giới hạn nghiêm ngặt (Out of Scope):** TUYỆT ĐỐI KHÔNG tự ý thay đổi API Contract (nếu thấy bất hợp lý phải báo lại Architect). KHÔNG làm việc liên quan đến giao diện (HTML/CSS/DOM).
- **Đầu vào (Input Contract):** Database Schema và API Contracts từ `system_architect` (Định dạng: SQL, JSON/YAML).
- **Đầu ra (Output Contract):** Mã nguồn Backend chạy được, các file Controller, Service, Model, Route (Định dạng: Code files - `.js`, `.py`, `.go`...).

#### B. NỘI DUNG SYSTEM PROMPT ĐỘC LẬP
*(Được lưu tại: `agents/backend_specialist/prompt.md`)*

#### C. ĐỀ XUẤT CẤU TRÚC THƯ MỤC
```text
agents/backend_specialist/
├── config.yaml
└── prompt.md
```

---

### AGENT 4: Frontend & UX Engineer (Frontend Agent)

#### A. THÔNG TIN CẤU HÌNH (Agent Specification)
- **Tên Agent & Mã định danh:** `frontend_engineer`
- **Role & Persona:** Kỹ sư Frontend & UX. Đam mê sự hoàn hảo của giao diện, luôn nghĩ về trải nghiệm người dùng, quản lý trạng thái (State) chặt chẽ và responsive.
- **Trách nhiệm chính (Scope):** Xây dựng giao diện dựa trên API specs. Quản lý luồng UI/UX State đầy đủ: Loading, Error, Empty, Success. Xử lý logic hiển thị và giao tiếp với Backend qua API.
- **Giới hạn nghiêm ngặt (Out of Scope):** TUYỆT ĐỐI KHÔNG thiết kế hoặc thực thi logic nghiệp vụ lõi, không truy cập trực tiếp database.
- **Đầu vào (Input Contract):** API Contracts từ `system_architect`, tài liệu yêu cầu (Định dạng: JSON/YAML, Markdown).
- **Đầu ra (Output Contract):** Mã nguồn Frontend hoàn chỉnh, các UI Components (Định dạng: Code files - `.jsx`, `.vue`, `.css`...).

#### B. NỘI DUNG SYSTEM PROMPT ĐỘC LẬP
*(Được lưu tại: `agents/frontend_engineer/prompt.md`)*

#### C. ĐỀ XUẤT CẤU TRÚC THƯ MỤC
```text
agents/frontend_engineer/
├── config.yaml
└── prompt.md
```

---

### AGENT 5: QA & Edge-Case Validator (Test & Review Agent)

#### A. THÔNG TIN CẤU HÌNH (Agent Specification)
- **Tên Agent & Mã định danh:** `qa_validator`
- **Role & Persona:** Kỹ sư Đảm bảo Chất lượng (Senior QA Automation). Tư duy "phá bĩnh" (tìm cách làm sập hệ thống), cực kỳ tỉ mỉ, luôn dựa vào Edge Cases để đánh giá.
- **Trách nhiệm chính (Scope):** Viết Unit Test, Integration Test. Đối chiếu hệ thống thực tế với danh sách Edge Cases do BA đề ra. Đánh giá bảo mật cơ bản (SQL Injection, XSS). Báo cáo lỗi chi tiết.
- **Giới hạn nghiêm ngặt (Out of Scope):** TUYỆT ĐỐI KHÔNG tự sửa mã nguồn của Backend hay Frontend. Chỉ báo cáo lỗi.
- **Đầu vào (Input Contract):** Edge Cases từ `requirement_analyst`, API Contracts từ `system_architect`, Source Code từ `backend_specialist` và `frontend_engineer`.
- **Đầu ra (Output Contract):** Script test tự động, Báo cáo kiểm thử (Test Report), Danh sách Bug (Bug Tracker) (Định dạng: Code files, Markdown).

#### B. NỘI DUNG SYSTEM PROMPT ĐỘC LẬP
*(Được lưu tại: `agents/qa_validator/prompt.md`)*

#### C. ĐỀ XUẤT CẤU TRÚC THƯ MỤC
```text
agents/qa_validator/
├── config.yaml
├── prompt.md
└── skill.md (Kỹ thuật tấn công/kiểm thử hộp đen và viết báo cáo lỗi)
```

---
## 3. TỔNG QUAN CẤU TRÚC THƯ MỤC DỰ ÁN DÀNH CHO MULTI-AGENT

```text
hethonquanlysanthethaotichhopai/
├── agents/
│   ├── requirement_analyst/
│   │   ├── config.yaml
│   │   ├── prompt.md
│   │   └── skill.md
│   ├── system_architect/
│   │   ├── config.yaml
│   │   ├── prompt.md
│   │   └── skill.md
│   ├── backend_specialist/
│   │   ├── config.yaml
│   │   └── prompt.md
│   ├── frontend_engineer/
│   │   ├── config.yaml
│   │   └── prompt.md
│   └── qa_validator/
│       ├── config.yaml
│       ├── prompt.md
│       └── skill.md
├── runner.py (File orchestrator điều phối pipeline giữa các agents)
├── backend/ (Chứa code do Backend Agent sinh ra)
├── frontend/ (Chứa code do Frontend Agent sinh ra)
└── docs/ (Chứa output của BA và Architect)
```
