# Mã nguồn Frontend & UI Components
**Dự án:** Hệ Thống Quản Lý Sân Thể Thao Tích Hợp AI
**Tác giả:** Frontend & UX Engineer (Frontend Agent)

---

## 1. Danh sách UI State & Xử lý UX (Trải nghiệm Người dùng)
Để đảm bảo trải nghiệm mượt mà và chuyên nghiệp, toàn bộ các luồng giao tiếp với API đều được quản lý qua 4 trạng thái (UI States) chuẩn mực:

1. **Loading State (Đang tải):**
   - Khi đang chờ AI trả lời: Hiển thị hiệu ứng `TypingIndicator` (3 dấu chấm nhấp nháy).
   - Khi bấm "Thanh toán & Đặt sân": Disable nút bấm (ngăn click 2 lần) và hiện Spinner quay, báo hiệu hệ thống đang khóa slot.
2. **Error State (Lỗi):**
   - Bắt chính xác lỗi **409 (Race Condition)**: Hiển thị Toast Message/Alert màu Đỏ: *"Rất tiếc, sân bạn chọn vừa có người đặt xong. Vui lòng chọn giờ khác!"*
   - Lỗi **400 (Thiếu thông tin)**: Hiển thị text nhắc nhở màu Cam nhẹ nhàng từ AI để yêu cầu nhập thêm ngày/giờ.
3. **Empty State (Trống):**
   - Nếu AI truy vấn DB không còn sân trống nào: Hiển thị Illustration (hình ảnh buồn) kèm dòng chữ: *"Rất tiếc, ngày này đã kín lịch. Bạn tham khảo ngày mai nhé!"*
4. **Success State (Thành công):**
   - AI trả về kết quả: Render một thẻ `BookingCard` UI rất đẹp (Glassmorphism) thay vì chỉ là text nhàm chán, hiển thị rõ số tiền.
   - Gọi API Hold thành công: Chuyển hướng mượt mà (Redirect) sang trang VNPay.

---

## 2. Source Code Giao diện (React.js)

### File: `frontend/src/components/chat/AiChatWidget.jsx`
*Nhiệm vụ: Giao diện khung Chat với AI, hiển thị 4 trạng thái và render thẻ BookingCard.*

```jsx
import React, { useState } from 'react';
import axios from 'axios';
import BookingCard from '../booking/BookingCard';
import './AiChatWidget.css'; // Styled with modern Glassmorphism

const AiChatWidget = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [inputStr, setInputStr] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputStr.trim()) return;

    // 1. Cập nhật UI ngay lập tức cho câu chat của User
    const userMsg = { sender: 'USER', text: inputStr };
    setMessages((prev) => [...prev, userMsg]);
    setInputStr('');
    
    // 2. Kích hoạt Loading State
    setIsLoading(true);

    try {
      // 3. Gọi API Agent 3 (Backend)
      const response = await axios.post('/api/v1/ai/chat', {
        user_id: userId,
        message: inputStr
      });

      const data = response.data;
      
      // 4. Success State: Lưu tin nhắn AI và Render Custom Card
      const aiMsg = { 
        sender: 'AI', 
        text: data.reply_message,
        intent: data.intent,
        extractedData: data.extracted_data,
        suggestedFields: data.suggested_fields
      };
      
      setMessages((prev) => [...prev, aiMsg]);

    } catch (error) {
      // 5. Error State
      const errMsg = error.response?.data?.reply_message || 'Hệ thống đang bận, bạn thử lại sau nhé.';
      setMessages((prev) => [...prev, { sender: 'AI', text: errMsg, isError: true }]);
    } finally {
      // Tắt Loading State
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-history">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-bubble ${msg.sender.toLowerCase()}`}>
            <p className={msg.isError ? 'text-red' : ''}>{msg.text}</p>
            
            {/* Render Custom UI: Nếu AI trả về Intent BOOKING và có danh sách sân */}
            {msg.intent === 'BOOKING' && msg.suggestedFields?.length > 0 && (
              <div className="suggestion-cards-wrapper">
                {msg.suggestedFields.map(field => (
                   <BookingCard 
                      key={field.field_id} 
                      field={field} 
                      bookingData={msg.extractedData} 
                      userId={userId} 
                   />
                ))}
              </div>
            )}
            
            {/* Empty State: Bắt được ý định nhưng không có sân */}
            {msg.intent === 'BOOKING' && msg.suggestedFields?.length === 0 && (
              <div className="empty-state">
                <img src="/assets/sad-calendar.svg" alt="No slots" />
                <p>Khung giờ này đã kín sân.</p>
              </div>
            )}
          </div>
        ))}
        
        {/* Loading State: Skeleton / Typing Indicator */}
        {isLoading && (
          <div className="typing-indicator">
            <span>.</span><span>.</span><span>.</span>
          </div>
        )}
      </div>

      <div className="chat-input-area">
        <input 
          type="text" 
          value={inputStr} 
          onChange={(e) => setInputStr(e.target.value)}
          placeholder="Ví dụ: Đặt sân 7 tối nay lúc 19h..."
          disabled={isLoading}
        />
        <button onClick={handleSendMessage} disabled={isLoading}>Gửi</button>
      </div>
    </div>
  );
};

export default AiChatWidget;
```

### File: `frontend/src/components/booking/BookingCard.jsx`
*Nhiệm vụ: Hiển thị nút Đặt Sân, bắt sự kiện gọi API `/hold`, bắt lỗi Race Condition.*

```jsx
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify'; // Thư viện hiển thị thông báo đẹp

const BookingCard = ({ field, bookingData, userId }) => {
  const [isHolding, setIsHolding] = useState(false);

  const handleHoldAndPay = async () => {
    setIsHolding(true); // Disable button, show spinner

    try {
      const payload = {
        user_id: userId,
        field_id: field.field_id,
        booking_date: bookingData.booking_date,
        start_time: bookingData.start_time,
        end_time: bookingData.end_time
      };

      // Giao tiếp với API Backend
      const response = await axios.post('/api/v1/bookings/hold', payload);
      
      // Success State
      toast.success("Giữ sân thành công! Đang chuyển hướng thanh toán...");
      
      // Chuyển hướng sang VNPay
      window.location.href = response.data.payment_url;

    } catch (error) {
      // Error State & UX Handling
      if (error.response?.status === 409) {
        // Race Condition - Lỗi trùng sân
        toast.error("⚠️ Sân này vừa được đặt trước đó vài giây. Bạn vui lòng chọn sân khác nhé!");
      } else if (error.response?.status === 400) {
        toast.warning(error.response.data.message);
      } else {
        toast.error("Lỗi kết nối. Vui lòng thử lại!");
      }
    } finally {
      setIsHolding(false);
    }
  };

  return (
    <div className="booking-card glass-panel">
      <h4>{field.name}</h4>
      <div className="booking-details">
        <span>🕒 {bookingData.start_time} - {bookingData.end_time}</span>
        <span>📅 {bookingData.booking_date}</span>
      </div>
      <div className="price-tag">
        {field.calculated_price.toLocaleString('vi-VN')} đ
      </div>
      
      <button 
        className={`btn-pay ${isHolding ? 'loading' : ''}`}
        onClick={handleHoldAndPay}
        disabled={isHolding}
      >
        {isHolding ? 'Đang khóa sân...' : 'Thanh Toán Ngay'}
      </button>
    </div>
  );
};

export default BookingCard;
```
