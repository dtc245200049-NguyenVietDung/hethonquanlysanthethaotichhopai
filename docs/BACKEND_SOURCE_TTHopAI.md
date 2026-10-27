# Mã nguồn Backend
**Dự án:** Hệ Thống Quản Lý Sân Thể Thao Tích Hợp AI
**Tác giả:** Core Backend/Logic Specialist (Backend Agent)

---

## 1. Báo cáo Tuân thủ Hợp đồng (Contract Compliance)
- **Xác nhận Tuân thủ API Contract:** Đã hiện thực hóa chính xác endpoint `[POST] /api/v1/bookings/hold` và `[POST] /api/v1/ai/chat` theo đúng spec JSON Request/Response và các HTTP Status Codes (200, 400, 409) do Architect Agent yêu cầu.
- **Xử lý Race Condition (Xung đột đồng thời):** Cài đặt thành công giải pháp **Distributed Lock (Khóa phân tán)** sử dụng Redis `SETNX`. Nếu 2 user gọi tạo đơn cùng 1 mili-giây, request thứ 2 sẽ lập tức bị từ chối với mã lỗi `409 Conflict`.
- **Transaction DB:** Đã bọc logic tạo booking vào Database Transaction để đảm bảo tính nguyên tử (Atomicity), tránh rác dữ liệu nếu có lỗi xảy ra giữa chừng.

---

## 2. Source Code Cốt Lõi (Core Logic)

### File: `backend/src/services/booking.service.js`
*Nhiệm vụ: Xử lý khóa Redis chống trùng lịch và ghi vào Database.*

```javascript
const redisClient = require('../config/redis');
const db = require('../models'); // Sequelize instance
const { v4: uuidv4 } = require('uuid');
const pricingService = require('./pricing.service');

class BookingService {
  /**
   * Giữ sân tạm thời (Hold Slot) trong 10 phút
   */
  async holdBooking(userId, fieldId, bookingDate, startTime, endTime) {
    // 1. Tạo Lock Key duy nhất cho Sân + Ngày + Giờ
    const lockKey = `lock:field_${fieldId}_${bookingDate}_${startTime}`;
    const TTL_SECONDS = 600; // 10 phút

    // 2. Thử lấy Lock bằng Redis SETNX (Khóa phân tán chống Race Condition)
    // Trả về "OK" nếu thành công, "null" nếu key đã tồn tại (có người đang giữ)
    const lockAcquired = await redisClient.set(lockKey, 'LOCKED', 'NX', 'EX', TTL_SECONDS);

    if (!lockAcquired) {
      const error = new Error('RACE_CONDITION');
      error.statusCode = 409;
      throw error;
    }

    // 3. Nếu lấy Lock thành công -> Tiến hành tính toán và lưu DB trong Transaction
    const transaction = await db.sequelize.transaction();
    try {
      // 3.1. Tính lại giá từ Backend (Bảo vệ giá, bỏ qua giá từ UI)
      const calculatedPrice = await pricingService.calculatePrice(fieldId, bookingDate, startTime, endTime);

      // 3.2. Lưu vào bảng bookings
      const bookingId = uuidv4();
      const lockedUntil = new Date(Date.now() + TTL_SECONDS * 1000);

      const booking = await db.Booking.create({
        id: bookingId,
        user_id: userId,
        field_id: fieldId,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        total_price: calculatedPrice,
        status: 'HOLDING',
        locked_until: lockedUntil
      }, { transaction });

      // 3.3. Sinh URL thanh toán (Giả lập VNPay)
      const paymentUrl = `https://vnpay.vn/pay?id=${bookingId}&amount=${calculatedPrice}&checksum=...`;

      await transaction.commit();

      return {
        booking_id: bookingId,
        status: 'HOLDING',
        locked_until: lockedUntil,
        payment_url: paymentUrl
      };

    } catch (error) {
      await transaction.rollback();
      // Nếu ghi DB lỗi, phải tự động nhả Lock trên Redis ngay lập tức
      await redisClient.del(lockKey);
      throw error;
    }
  }
}

module.exports = new BookingService();
```

### File: `backend/src/controllers/booking.controller.js`
*Nhiệm vụ: Giao tiếp HTTP, Validate Input, tuân thủ API Contract.*

```javascript
const bookingService = require('../services/booking.service');

class BookingController {
  
  // [POST] /api/v1/bookings/hold
  async holdSlot(req, res, next) {
    try {
      const { user_id, field_id, booking_date, start_time, end_time } = req.body;

      // Basic Validation
      if (!user_id || !field_id || !booking_date || !start_time || !end_time) {
        return res.status(400).json({
          error: 'MISSING_INFO',
          message: 'Vui lòng cung cấp đầy đủ thông tin đặt sân'
        });
      }

      // Gọi service logic
      const result = await bookingService.holdBooking(
        user_id, field_id, booking_date, start_time, end_time
      );

      // 200 OK: Đúng theo hợp đồng
      return res.status(200).json(result);

    } catch (error) {
      if (error.statusCode === 409 && error.message === 'RACE_CONDITION') {
        // 409 Conflict: Đúng theo hợp đồng của Architect
        return res.status(409).json({
          error: 'RACE_CONDITION',
          message: 'Sân này vừa được khách khác đặt trước đó vài giây. Vui lòng chọn sân khác!'
        });
      }
      next(error); // Chuyển cho Global Error Handler (500)
    }
  }
}

module.exports = new BookingController();
```

### File: `backend/src/controllers/ai.controller.js`
*Nhiệm vụ: Xử lý luồng Chat AI theo API Contract.*

```javascript
const aiService = require('../services/ai.service');

class AiController {
  
  // [POST] /api/v1/ai/chat
  async processChat(req, res, next) {
    try {
      const { user_id, message } = req.body;

      if (!message || message.trim() === '') {
        return res.status(400).json({
          error: 'MISSING_INFO',
          reply_message: 'Bạn hãy nhắn tin nhu cầu đặt sân nhé!'
        });
      }

      // Đẩy vào LLM để bóc tách Intent
      const result = await aiService.analyzeIntentAndSearch(user_id, message);

      if (result.intent === 'INCOMPLETE') {
        return res.status(400).json({
           error: 'MISSING_INFO',
           reply_message: result.reply_message
        });
      }

      return res.status(200).json(result);

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AiController();
```
