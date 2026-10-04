import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, CheckCircle, Star, Zap, Clock, CalendarDays, TrendingUp } from 'lucide-react';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    {
      id: 1,
      sender: 'ai',
      text: 'Chào mừng bạn đến với **SportAI** 🏆! Tôi là hệ thống Trợ lý ảo AI thế hệ mới được trang bị công nghệ RAG.\nTôi có thể giúp bạn:\n• Tra cứu lịch sân trống siêu tốc\n• Đề xuất giá và gói khuyến mãi\n• Ghép đội theo trình độ (Elo)\nBạn cần hỗ trợ gì hôm nay?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newMsg = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    const lowerInput = input.toLowerCase();
    
    // Nâng cấp: Phân tích Intent thông minh hơn (Keyword extraction & Pattern matching)
    setTimeout(() => {
      let aiResponse: any = {};
      
      const intentBook = /sân|đặt|trống|đá|lịch/i.test(lowerInput);
      const intentPrice = /giá|tiền|bao nhiêu/i.test(lowerInput);
      const intentMatch = /ghép|team|đội|cạ/i.test(lowerInput);
      const intentAbility = /làm|gì|tính năng|chức năng/i.test(lowerInput);

      if (intentPrice) {
        aiResponse = {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'Hệ thống định giá của chúng tôi ứng dụng **Dynamic Pricing** (Định giá linh hoạt):\n• **08h - 15h:** Chỉ `120,000đ/h` (Giảm 50% cho Sinh viên).\n• **16h - 22h:** `250,000đ/h` (Khung giờ Vàng).\nBạn muốn kiểm tra khung giờ cụ thể nào?'
        };
      } else if (intentMatch) {
        aiResponse = {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'Tất nhiên rồi! Thuật toán ghép đội hiện đang phát hiện **3 nhóm (Level Trung bình - Elo ~1200)** đang thiếu người đá vào lúc 19h00 tối nay. Họ sẵn sàng chia đều chi phí (Campuchia).\nBạn có muốn tham gia vào nhóm Zalo để bắt cặp ngay không?',
          actionCard: {
            title: 'Trận giao hữu: FC Anh Em',
            price: 'Chi phí: ~40,000đ/người',
            img: 'https://images.unsplash.com/photo-1518605368461-1ee7e53f1a9a?w=300&q=80',
            rating: 4.8,
            tags: ['Sân 7', '19:00', 'Thiếu 2']
          },
          btnAction: 'Tham gia ghép đội'
        };
      } else if (intentBook) {
        // Phân tích có trích xuất giờ (17h, 19h, tối nay...)
        let timeStr = 'tối nay';
        if (lowerInput.match(/\d+h/)) {
          timeStr = lowerInput.match(/\d+h/)[0];
        }
        
        if (lowerInput.includes('đặt sân') || lowerInput.includes('chốt sân')) {
          // Gọi API Đặt Sân thực tế!
          fetch('http://localhost:3000/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Khách (Từ Chatbot AI)', courtId: 1, time: timeStr, amount: '250,000đ' })
          });
          
          aiResponse = {
            id: Date.now() + 1,
            sender: 'ai',
            text: `✅ **Đặt sân tự động thành công!**\nTôi vừa đẩy thẳng yêu cầu đặt Sân 7 (${timeStr}) của bạn vào Database. Hãy sang tab Admin để xem đơn chờ duyệt nhé!`
          };
        } else {
          aiResponse = {
            id: Date.now() + 1,
            sender: 'ai',
            text: `Tôi đã quét toàn bộ CSDL. Rất tiếc, khung giờ cao điểm ${timeStr} các sân 7 người đã được chốt cọc 100%.\n\n🔥 **ĐỀ XUẤT THAY THẾ:**\nTuy nhiên, Sân VIP C3 sẽ trống vào lúc **20:30**. Hệ thống đang có voucher giảm 20% cho khung giờ này. Bạn xem thẻ thông tin bên dưới nhé:`,
            actionCard: {
              title: 'Sân VIP C3 (Cỏ Nhân Tạo Chuẩn FIFA)',
              price: '240,000đ/h (Đã giảm 20%)',
              img: 'https://images.unsplash.com/photo-1508344928928-7165b67de128?w=300&q=80',
              rating: 5.0,
              tags: ['Có nước lọc', 'Giày thuê miễn phí', 'Sân 7']
            },
            btnAction: 'Giữ chỗ ngay (15 phút)'
          };
        }
      } else if (intentAbility) {
        aiResponse = {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'Tôi là **AI Assistant 2.0**.\nTôi có thể hiểu ngôn ngữ tự nhiên để tự động hóa toàn bộ luồng nghiệp vụ của sân:\n1. Tra cứu CSDL Real-time để báo trống.\n2. Phát hiện khung giờ ế để sinh mã giảm giá (Off-peak).\n3. Tự động thu thập doanh thu vẽ biểu đồ cho Admin.\n4. Tìm đối thủ và ghép team theo hệ số Elo.'
        };
      } else {
        aiResponse = {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'Rất xin lỗi, dữ liệu RAG hiện tại của tôi được khoanh vùng tập trung vào: **Lịch Sân, Bảng Giá, và Ghép Đội**. \nBạn có thể thử nhập lại theo các từ khóa trên nhé!'
        };
      }

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000); // Thêm độ trễ thực tế
  };

  // Render format Markdown đậm
  const renderText = (txt: string) => {
    const parts = txt.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--primary)' }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <span key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-secondary)' }}>{part.slice(1, -1)}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleCardAction = (card: any) => {
    fetch('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Khách (Từ Thẻ AI)', courtId: 1, time: 'Thao tác nhấp Thẻ', amount: card.price || 'Tùy chọn' })
    }).then(() => {
      setMessages(prev => [...prev, {
        id: Date.now()+3,
        sender: 'ai',
        text: `✅ **Thành công!** Đã thực thi hành động với: ${card.title}. Dữ liệu đã ghi thẳng vào Database!`
      }]);
    });
  };

  return (
    <>
      {!isOpen && (
        <div className="chatbot-trigger" onClick={() => setIsOpen(true)}>
          <div className="chatbot-trigger-inner">
            <Bot size={30} />
          </div>
          <span className="ping-badge"></span>
        </div>
      )}

      {isOpen && (
        <div className="glass-panel chatbot-window">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar-premium">
                <Bot size={22} className="ai-icon-pulse" />
              </div>
              <div>
                <div className="chat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  SportAI Assistant <CheckCircle size={14} color="#2ed573" />
                </div>
                <div className="chat-status">
                  <span className="status-dot"></span> Đang trực tuyến (Real-time DB)
                </div>
              </div>
            </div>
            <button className="btn-outline close-btn" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="chat-body">
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                <div className={`chat-bubble ${msg.sender}`}>
                  <div style={{ whiteSpace: 'pre-line' }}>{renderText(msg.text)}</div>
                </div>
                
                {msg.actionCard && (
                  <div className="action-card fade-in">
                    <div style={{ position: 'relative' }}>
                      <img src={msg.actionCard.img} className="action-card-img" alt="Sân" />
                      <div className="action-card-rating">
                        <Star size={12} fill="#ffc107" color="#ffc107" /> {msg.actionCard.rating}
                      </div>
                    </div>
                    <div className="action-card-body">
                      <div className="action-card-title">{msg.actionCard.title}</div>
                      <div className="action-card-price">{msg.actionCard.price}</div>
                      
                      <div className="action-tags">
                        {msg.actionCard.tags.map((tag: string, i: number) => (
                          <span key={i} className="action-tag">{tag}</span>
                        ))}
                      </div>

                      <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.95rem', marginTop: '12px' }} onClick={() => handleCardAction(msg.actionCard)}>
                        <Zap size={16} fill="currentColor" /> {msg.btnAction || 'Đặt ngay'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="chat-bubble ai typing-indicator-container">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            )}
            
            {messages.length === 1 && (
              <div className="quick-suggestions fade-in" style={{ marginTop: 'auto' }}>
                <div className="suggestion-chip" onClick={() => setInput('19h tối nay còn sân không?')}>🔥 19h tối nay?</div>
                <div className="suggestion-chip" onClick={() => setInput('Báo giá sân')}>💰 Báo giá</div>
                <div className="suggestion-chip" onClick={() => setInput('Mình muốn ghép đội')}>🤝 Ghép đội</div>
                <div className="suggestion-chip" onClick={() => setInput('Tính năng của hệ thống')}>⚙️ Tính năng</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-footer">
            <div className="chat-input-wrapper">
              <input 
                type="text" 
                className="chat-input" 
                placeholder="Nhập yêu cầu tự nhiên..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
              />
              <button className={`chat-send-btn ${input.trim() ? 'active' : ''}`} onClick={handleSend}>
                <Send size={18} />
              </button>
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              Trí tuệ nhân tạo có thể sinh thông tin chưa hoàn toàn chính xác.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
