# Tài liệu Kiến trúc Hệ thống
**Dự án:** Hệ Thống Quản Lý Sân Thể Thao Tích Hợp AI
**Tác giả:** System Architect & Data Modeler (Architect Agent)

---

## 1. Database Schema (ERD & DDL)

**Mô tả tổng quan:**
Cơ sở dữ liệu được thiết kế theo chuẩn 3NF. Trung tâm của hệ thống là bảng `bookings` (lưu trữ trạng thái đặt sân, cơ chế khóa tạm thời). Tính năng Định giá động (Dynamic Pricing) được tách thành bảng `pricing_rules` độc lập để dễ cấu hình mà không làm phình bảng `fields`.

```sql
-- DDL Syntax chuẩn (PostgreSQL / MySQL)

CREATE TABLE users (
    id UUID PRIMARY KEY,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'CUSTOMER', -- 'CUSTOMER', 'OWNER', 'ADMIN'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fields (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50), -- 'SAN_5', 'SAN_7', 'SAN_11'
    base_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' -- 'ACTIVE', 'MAINTENANCE'
);

-- Cấu hình giá động (Giờ vàng, cuối tuần)
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY,
    field_id UUID REFERENCES fields(id),
    day_of_week INT, -- 0 (Chủ nhật) đến 6 (Thứ bảy)
    start_time TIME,
    end_time TIME,
    multiplier DECIMAL(3, 2) NOT NULL, -- Hệ số nhân (VD: 1.5)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    field_id UUID REFERENCES fields(id),
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'HOLDING', -- 'HOLDING', 'CONFIRMED', 'CANCELLED'
    locked_until TIMESTAMP, -- Hạn chót thanh toán (TTL 10 phút)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo Index để tối ưu truy vấn tìm sân trống và chống trùng lịch
CREATE INDEX idx_booking_time ON bookings (field_id, booking_date, start_time, end_time);

CREATE TABLE ai_chat_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    context_data JSONB, -- Lưu lại các slot, lịch sử trích xuất để duy trì mạch chat
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. API Contracts (REST/OpenAPI Specs)

### [POST] `/api/v1/ai/chat`
- **Mục đích:** Gửi tin nhắn thô của khách hàng để AI bóc tách Intent (ý định) và trả về thông tin cấu trúc.
- **Request Payload:**
  ```json
  {
    "user_id": "uuid-1234",
    "message": "Cho anh đặt sân 7 lúc 19h tối mai em nhé"
  }
  ```
- **Response (Thành công - 200 OK):**
  ```json
  {
    "intent": "BOOKING",
    "extracted_data": {
      "field_type": "SAN_7",
      "booking_date": "2026-10-05",
      "start_time": "19:00",
      "end_time": "20:30"
    },
    "suggested_fields": [
      { "field_id": "f-111", "name": "Sân 7A", "calculated_price": 750000 }
    ],
    "reply_message": "Dạ em tìm thấy Sân 7A trống lúc 19h tối mai. Tổng giá (đã gồm phụ thu giờ vàng) là 750k. Anh chốt sân này không ạ?"
  }
  ```
- **Response (Lỗi thiếu thông tin - 400 Bad Request):**
  ```json
  { "error": "MISSING_INFO", "reply_message": "Dạ anh muốn đá ngày nào ạ?" }
  ```

### [POST] `/api/v1/bookings/hold`
- **Mục đích:** Khóa sân tạm thời (Hold slot) trong 10 phút để khách chuyển qua cổng thanh toán.
- **Request Payload:**
  ```json
  {
    "user_id": "uuid-1234",
    "field_id": "f-111",
    "booking_date": "2026-10-05",
    "start_time": "19:00",
    "end_time": "20:30"
  }
  ```
- **Response (Thành công - 200 OK):**
  ```json
  {
    "booking_id": "b-999",
    "status": "HOLDING",
    "locked_until": "2026-10-04T13:10:00Z",
    "payment_url": "https://vnpay.vn/pay?id=..."
  }
  ```
- **Response (Lỗi trùng sân - 409 Conflict):**
  ```json
  { "error": "RACE_CONDITION", "message": "Sân này vừa được khách khác đặt trước đó vài giây. Vui lòng chọn sân khác!" }
  ```

### [POST] `/api/v1/payments/webhook`
- **Mục đích:** Endpoint dành riêng cho VNPay/Momo gọi về để xác nhận thanh toán thành công, chuyển đơn sang `CONFIRMED`.
- **Response (Thành công - 200 OK):** `{ "status": "success" }`

---

## 3. Kiến trúc Thư mục Đề xuất (Phần Backend)

```text
backend/
├── src/
│   ├── config/          # Cấu hình DB, Biến môi trường, API Keys (Gemini/VNPay)
│   ├── controllers/     # Giao tiếp HTTP (BookingController, AiController)
│   ├── middlewares/     # Auth JWT, Rate Limiter, Error Handler
│   ├── models/          # Định nghĩa Schema (Sequelize/Mongoose)
│   ├── routes/          # Khai báo các endpoint
│   ├── services/        # Logic lõi cực kỳ quan trọng
│   │   ├── ai.service.js        # Giao tiếp LLM, Prompting
│   │   ├── booking.service.js   # Logic giữ sân, chống trùng
│   │   └── pricing.service.js   # Thuật toán tính Dynamic Pricing
│   └── utils/           # Format date, Logger
├── package.json
└── server.js
```

---

## 4. Giải pháp Xử lý Đồng thời (Concurrency) & Bảo mật

**1. Chống Race Condition (Xung đột đặt sân đồng thời):**
- **Vấn đề:** 2 người cùng gọi API `/hold` vào một tích tắc cho cùng 1 sân.
- **Giải pháp Architect đề xuất:** Sử dụng **Redis Distributed Lock**.
  - Khi API được gọi, tạo một Redis key định dạng: `lock:field_{field_id}_{date}_{time}` với cơ chế `SETNX` (Set if Not Exists).
  - Request nào set key thành công sẽ được phép đi tiếp ghi vào DB bảng `bookings`.
  - Request thất bại sẽ lập tức nhận lỗi `409 Conflict`.
- **Dọn dẹp (TTL):** Set thời gian tồn tại (Expiration) cho key này là 10 phút. Nếu quá hạn 10 phút mà webhook thanh toán chưa gọi về, Redis tự xóa key, sân sẽ tự động "trống" trở lại.

**2. Bảo vệ Tính vẹn toàn của Giá (Price Freezing):**
- **Tuyệt đối không tin tưởng UI:** Frontend không bao giờ được phép gửi `calculated_price` lên API `/hold` (rủi ro hacker sửa giá thành 1đ).
- Backend (Agent 3) phải tự động dùng `pricing.service.js` tính toán lại giá tại thời điểm người dùng click "Đặt sân", ghi vào DB và dùng giá đó để sinh URL thanh toán VNPay có kèm chữ ký số (Checksum/Hash).

**3. Bảo mật hệ thống:**
- Mọi API (ngoại trừ Webhook) yêu cầu token JWT (Bearer Token) ở Headers.
- **Rate Limiting:** Chặn spam API `/api/v1/ai/chat` (tối đa 15 request/phút/user) để tránh đối thủ cào dữ liệu và làm cạn kiệt tài khoản Gemini API.
