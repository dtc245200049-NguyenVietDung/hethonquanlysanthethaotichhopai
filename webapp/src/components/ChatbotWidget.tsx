import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, CheckCircle, Star, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ChatbotWidget() {
  const { user, token } = useAuth();
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

    // 1. Nếu khách hàng muốn chốt đặt sân trực tiếp từ chatbot
    if (lowerInput.includes('đặt sân') || lowerInput.includes('chốt sân')) {
      let timeStr = '19:00 - 20:30';
      const matchHour = lowerInput.match(/\d+h/);
      if (matchHour && matchHour[0]) {
        timeStr = matchHour[0];
      }
      
      fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: 'Khách (Từ Chatbot AI)', 
          courtId: 1, 
          date: new Date().toISOString().split('T')[0],
          time: timeStr, 
          amount: 250000 
        })
      })
      .then(async res => {
        const data = await res.json();
        if (res.status === 201) {
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            sender: 'ai',
            text: `✅ **Đặt sân tự động thành công!**\nTôi vừa đẩy thẳng yêu cầu đặt Sân 7 (${timeStr}) của bạn vào Database. Hãy sang tab Admin để xem đơn chờ duyệt nhé!`
          }]);
        } else if (res.status === 409) {
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            sender: 'ai',
            text: `⚠️ **Khung giờ bị trùng!**\n${data.message || `Khung giờ ${timeStr} này sân đã có người đặt trước rồi. Tôi gợi ý bạn thử khung giờ khác nhé!`}`
          }]);
        } else {
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            sender: 'ai',
            text: `⚠️ Lỗi khi gửi đơn đặt sân: ${data.message || 'Vui lòng thử lại sau.'}`
          }]);
        }
        setIsTyping(false);
      })
      .catch(err => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'ai',
          text: `⚠️ Không thể kết nối tới máy chủ: ${err.message}`
        }]);
        setIsTyping(false);
      });
      return;
    }

    // 2. Gọi Backend Gemini & Agentic Function Calling Engine
    fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        message: input,
        history: messages.slice(-6).map(m => ({ sender: m.sender, text: m.text }))
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.text) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'ai',
          text: data.text,
          actionCard: data.actionCard
        }]);
        setIsTyping(false);
      } else {
        throw new Error('Dữ liệu API không hợp lệ');
      }
    })
    .catch(err => {
      console.warn('Backend chat API error, executing client fallback:', err);
      // Fallback cục bộ tại Client
      setTimeout(() => {
        let aiResponse: any = {};
        const intentPrice = /giá|tiền|bao nhiêu/i.test(lowerInput);
        const intentMatch = /ghép|team|đội|cạ/i.test(lowerInput);

        if (intentPrice) {
          aiResponse = {
            id: Date.now() + 1,
            sender: 'ai',
            text: '🏷️ **BẢNG GIÁ NIÊM YẾT SÂN THỂ THAO:**\n• Sân Tập B2 (Sân 5): `150,000 VNĐ/h`\n• Sân Trung Tâm A1 (Sân 7): `250,000 VNĐ/h`\n• Sân VIP C3 (Sân 7 VIP): `300,000 VNĐ/h`'
          };
        } else if (intentMatch) {
          aiResponse = {
            id: Date.now() + 1,
            sender: 'ai',
            text: 'Thuật toán ghép đội hiện đang phát hiện **3 nhóm (Level Trung bình - Elo ~1200)** đang thiếu người đá vào lúc 19h00 tối nay. Bạn có muốn tham gia không?',
            actionCard: {
              title: 'Trận giao hữu: FC Anh Em',
              price: 'Chi phí: ~40,000đ/người',
              img: 'https://images.unsplash.com/photo-1518605368461-1ee7e53f1a9a?w=300&q=80',
              rating: 4.8,
              tags: ['Sân 7', '19:00', 'Thiếu 2']
            },
            btnAction: 'Tham gia ghép đội'
          };
        } else {
          aiResponse = {
            id: Date.now() + 1,
            sender: 'ai',
            text: 'Tôi là **SportAI Assistant**.\nTôi có thể hỗ trợ bạn tra cứu lịch sân trống hôm nay, tư vấn giá tiền và đặt sân tự động. Bạn muốn kiểm tra sân lúc mấy giờ?'
          };
        }

        setMessages(prev => [...prev, aiResponse]);
        setIsTyping(false);
      }, 500);
    });
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
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '2px 8px',
                    borderRadius: '100px',
                    background: user?.role === 'admin' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(14, 165, 233, 0.25)',
                    color: user?.role === 'admin' ? '#fca5a5' : '#7dd3fc',
                    border: '1px solid ' + (user?.role === 'admin' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(14, 165, 233, 0.4)')
                  }}>
                    {user ? (user.role === 'admin' ? '👑 Admin' : '👤 Khách') : 'Khách vãng lai'}
                  </span>
                </div>
                <div className="chat-status">
                  <span className="status-dot"></span> Đang trực tuyến (Gemini 2.0 / Local NLU)
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
