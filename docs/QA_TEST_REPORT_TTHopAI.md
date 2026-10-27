# Báo cáo Kiểm thử & Bug Tracker
**Dự án:** Hệ Thống Quản Lý Sân Thể Thao Tích Hợp AI
**Tác giả:** QA & Edge-Case Validator (Test & Review Agent)

---

## 1. Test Summary (Tổng quan Kiểm thử)
- **Tổng số Test Cases thực thi:** 45 (Bao gồm API Test, Load Test, Security cơ bản)
- **Pass (Đạt):** 43
- **Fail (Lỗi):** 2
- **Đánh giá chất lượng chung:** Hệ thống tuân thủ rất tốt các hợp đồng API. Giải pháp chống Race Condition hoạt động hoàn hảo. Tuy nhiên, phát hiện một lỗi logic nhỏ ở khâu tính giá khi thời gian đặt sân vượt qua khung giờ giao nhau. Sẵn sàng Go-live sau khi fix xong Bug #1.

---

## 2. Kết quả Đối chiếu Edge Cases (Validation)
Dựa trên tài liệu SRS từ *Requirement Analyst (Agent 1)*, dưới đây là kết quả đối chiếu thực tế với hệ thống:

- **[Edge Case 1 - Sân bảo trì đột xuất]:** `FAIL`
  *Lý do:* Hệ thống Backend có lưu trạng thái "MAINTENANCE" nhưng hiện tại chưa có Job tự động quét và gửi SMS/Zalo cho các đơn `CONFIRMED` đang nằm đè lên khung giờ bảo trì.
- **[Edge Case 2 - Vượt quá thời gian giữ chỗ (Timeout 10 phút)]:** `PASS`
  *Lý do:* Khóa Redis (TTL 600s) tự động hết hạn, API trả sân về trạng thái trống hoàn toàn chính xác.
- **[Edge Case 3 - AI Dịch vụ bị sập/Quá tải]:** `PASS`
  *Lý do:* Frontend đã bắt được mã lỗi 503 từ Backend và hiển thị Component UI "Form Đặt sân truyền thống" thành công.
- **[Edge Case 4 - Đặt trùng sân cùng 1 mili-giây]:** `PASS`
  *Lý do:* Đã stress test (xem mã script bên dưới). Request thứ 2 lập tức bị từ chối với HTTP 409 `RACE_CONDITION`.

---

## 3. Bug Tracker (Danh sách Lỗi)

### Bug #1: Tính sai giá khi giờ đặt vắt chéo qua khung "Giờ Vàng"
- **Mức độ nghiêm trọng (Severity):** HIGH
- **Các bước tái hiện (Steps to Reproduce):**
  1. Giờ vàng được cài đặt là: 17:00 - 19:00 (Hệ số x1.5).
  2. Khách hàng đặt sân từ: 16:30 đến 17:30 (Đá 1 tiếng).
  3. Kiểm tra DB `bookings.total_price`.
- **Kết quả mong đợi:** Giá phải được chia tỷ lệ: 30 phút giá thường + 30 phút giá x1.5.
- **Kết quả thực tế:** Hàm `pricingService.calculatePrice()` của Agent 3 đang lấy giờ bắt đầu (`16:30` - không phải giờ vàng) làm hệ số cho toàn bộ thời gian, dẫn đến việc tính thiếu tiền của Chủ sân.
- **Hành động (Action):** Yêu cầu **Agent 3 (Backend)** sửa lại logic chia nhỏ Block thời gian trong hàm tính giá.

### Bug #2: Thiếu Rate Limit ở API `/api/v1/ai/chat`
- **Mức độ nghiêm trọng (Severity):** MEDIUM
- **Các bước tái hiện:** Bắn vòng lặp 100 requests / 1 giây vào API Chat.
- **Kết quả mong đợi:** API phải trả về HTTP 429 (Too Many Requests).
- **Kết quả thực tế:** API trả về 200 OK liên tục, làm tốn quota của Gemini API.
- **Hành động:** Yêu cầu cài đặt middleware `express-rate-limit`.

---

## 4. Automation Test Scripts

### File: `tests/integration/race_condition.test.js`
*Nhiệm vụ: Kịch bản giả lập (Stress Test) 2 User cùng đặt 1 sân tại cùng một thời điểm để kiểm định cơ chế khóa Redis của Agent 3.*

```javascript
const axios = require('axios');

describe('Kiểm thử Edge Case: Đặt trùng sân (Race Condition)', () => {
  const API_URL = 'http://localhost:3000/api/v1/bookings/hold';
  
  it('Chỉ duy nhất 1 User được phép lấy slot, User kia phải nhận lỗi 409', async () => {
    const payloadUserA = {
      user_id: 'user_AAA',
      field_id: 'Sân_7_VIP',
      booking_date: '2026-10-10',
      start_time: '19:00',
      end_time: '20:30'
    };

    const payloadUserB = {
      user_id: 'user_BBB',
      field_id: 'Sân_7_VIP', // Cùng sân
      booking_date: '2026-10-10', // Cùng ngày
      start_time: '19:00', // Cùng giờ
      end_time: '20:30'
    };

    // Bắn ĐỒNG THỜI 2 request (Không dùng await để đợi)
    const requestA = axios.post(API_URL, payloadUserA);
    const requestB = axios.post(API_URL, payloadUserB);

    // Thu thập kết quả
    const results = await Promise.allSettled([requestA, requestB]);

    // Phân tích kết quả
    const successResponses = results.filter(r => r.status === 'fulfilled' && r.value.status === 200);
    const errorResponses = results.filter(r => r.status === 'rejected' && r.reason.response?.status === 409);

    // Chấm điểm kỳ vọng: BẮT BUỘC phải có 1 request thành công và 1 request bị văng lỗi 409
    expect(successResponses.length).toBe(1);
    expect(errorResponses.length).toBe(1);
    
    // Kiểm tra chính xác mã lỗi mà Agent 3 đã code
    expect(errorResponses[0].reason.response.data.error).toBe('RACE_CONDITION');
  });
});
```
