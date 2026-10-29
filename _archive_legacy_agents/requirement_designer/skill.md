# Software Requirement & UML Design Skill

## Purpose
Phân tích tài liệu yêu cầu nghiệp vụ, chuẩn hóa quy trình và thiết kế các biểu đồ UML chính xác theo tiêu chuẩn. Loại bỏ hoàn toàn hiện tượng ảo giác (hallucination) của AI và đảm bảo tính nhất quán (traceability) xuyên suốt tài liệu.

## Input
- Tài liệu yêu cầu nghiệp vụ thô (Raw requirements).
- Các phiên bản cũ của tài liệu thiết kế (As-Is documents, diagrams).
- Phản hồi từ các bên liên quan và chuyên gia (Stakeholder & Critic feedbacks).

## Process
1. **Đọc hiểu & Trích xuất (Comprehension):**
   - Phân tích các Pain Points (điểm nghẽn) và Requirement Goals (Yêu cầu bài toán).
   - Nhận diện toàn bộ Actor (tác nhân), Entity (thực thể), System Constraint (ràng buộc hệ thống).
2. **Kiểm tra Tính nhất quán (Consistency Checking):**
   - Rà soát sự mâu thuẫn giữa yêu cầu nghiệp vụ (Business Requirements) và giải pháp thiết kế (System Design). 
   - VD: Nếu phần khảo sát có đề cập đến IoT/Phần cứng, thiết kế kiến trúc và Class Diagram phải phản ánh được điều đó.
3. **Thiết kế Biểu đồ (UML Design):**
   - **Use Case Diagram:** 
     - Tuân thủ nghiêm ngặt quan hệ `<<include>>`, `<<extend>>`, và `Generalization`. 
     - Actor (Tác nhân) CHỈ tương tác với Use Case bằng đường Association. KHÔNG dùng mũi tên `<<include>>` từ Use Case trỏ ngược vào Actor.
   - **Activity Diagram:** 
     - Bắt buộc sử dụng phân làn (Swimlanes/Partitions) cho các quy trình hệ thống có nhiều tác nhân (VD: Khách hàng, Web Frontend, API, Database, AI Engine).
     - Sử dụng chuẩn Decision Node (Hình thoi) cho các điểm rẽ nhánh logic.
   - **Sequence Diagram:** 
     - Định nghĩa rõ các Object/Lifelines tham gia.
     - Phân biệt rõ thông điệp đồng bộ (synchronous) và bất đồng bộ (asynchronous).
   - **Class Diagram:** 
     - Phân tích toàn diện các Entity trong hệ thống (Tài khoản, Sân, Khung Giờ, Đặt Sân, Thanh Toán...).
     - Phải có thuộc tính (Attributes) và kiểu dữ liệu cơ bản.
     - Xác định rõ quan hệ: Association, Aggregation, Composition, Generalization và cấp số bội (Multiplicity: `1..1`, `1..*`, `0..*`).
4. **Viết Đặc tả (Specification):**
   - Viết đặc tả Use Case chi tiết: Pre-condition, Main Flow, Alternative Flows, Post-condition.
5. **Kiểm duyệt chéo (Self-Critique):**
   - Tự rà soát lại kết quả đầu ra dựa trên Input trước khi trả về.

## Output
- Nội dung văn bản mô tả kiến trúc, quy trình chuẩn xác.
- Mã nguồn PlantUML/Mermaid của các biểu đồ UML có thể biên dịch được.

## Constraints
- **TUYỆT ĐỐI KHÔNG** tạo ra các yêu cầu hoặc chức năng không được đề cập trong Input (No Hallucination).
- **TUYỆT ĐỐI TUÂN THỦ** các nguyên tắc vẽ UML chuẩn quốc tế (OMG UML).
- Bắt buộc duy trì sự liên kết logic từ Yêu cầu -> Use Case -> Class -> Activity.
