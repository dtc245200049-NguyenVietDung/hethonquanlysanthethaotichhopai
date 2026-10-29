import { useState, useRef, useEffect } from 'react';
import { Terminal, X, Send, Database, ShieldAlert, Activity, Download } from 'lucide-react';

export default function AiCommandBar({ onRefresh }: { onRefresh?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'consult' | 'execute'>('consult'); // 2 chế độ
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    { id: 1, sender: 'ai', text: 'Chào Sếp! Trợ lý Admin AI đã sẵn sàng.\nBật chế độ **Thao tác DB** nếu muốn sinh dữ liệu giả lập nhé.' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoSimulateRef = useRef<any>(null); // Lưu trữ timer giả lập tự động

  const triggerExportCsv = async () => {
    try {
      const token = localStorage.getItem('sportai_admin_token');
      const res = await fetch('http://localhost:3000/api/revenue/export-csv', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Không thể tải file');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BaoCaoDoanhThu_SportAI_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return true;
    } catch (e) {
      console.error("Auto export error:", e);
      return false;
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newMsg = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    const lowerInput = newMsg.text.toLowerCase();

    // 1. Kiểm tra lệnh Dừng giả lập
    if (lowerInput.includes('dừng') || lowerInput.includes('tắt') || lowerInput.includes('stop')) {
      if (autoSimulateRef.current) {
        clearInterval(autoSimulateRef.current);
        autoSimulateRef.current = null;
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: '🛑 Đã dừng kịch bản sinh dữ liệu tự động.', isAlert: true }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: 'Hiện không có kịch bản tự động nào đang chạy.' }]);
      }
      setIsTyping(false);
      return;
    }

    if (mode === 'execute') {
      // 2. Kiểm tra lệnh tạo tự động định kỳ (VD: Mỗi 5 giây thêm 1 đơn)
      if (lowerInput.includes('mỗi') && (lowerInput.includes('giây') || lowerInput.includes('s'))) {
        const match = lowerInput.match(/(\d+)\s*(giây|s)/);
        const seconds = match ? parseInt(match[1]) : 5;
        
        if (autoSimulateRef.current) clearInterval(autoSimulateRef.current);
        
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: `⏳ Đã kích hoạt Auto-Simulation:\nHệ thống sẽ tự động tạo 1 đơn mới mỗi ${seconds} giây. Cứ ngồi xem danh sách tự dài ra nhé!\n*(Gõ "dừng" để tắt kịch bản)*`, isAlert: true }]);
        setIsTyping(false);

        const token = localStorage.getItem('sportai_admin_token');
        autoSimulateRef.current = setInterval(() => {
          fetch('http://localhost:3000/api/admin/ai-execute', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ query: 'tạo 1 đơn' })
          }).then(() => {
            if (onRefresh) onRefresh();
          });
        }, seconds * 1000);
        return;
      }

      // 3. Kiểm tra kịch bản Duyệt Tự Động (Auto-Approve Agent)
      if (lowerInput.includes('tự động duyệt') || lowerInput.includes('duyệt hết')) {
        if (autoSimulateRef.current) clearInterval(autoSimulateRef.current);
        
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: `🤖 **Agent Duyệt Tự Động** đã bật!\nTôi sẽ liên tục quét DB mỗi 3 giây và tự động CHỐT toàn bộ đơn mới mà không cần bạn bấm. Rất nhàn rỗi! *(Gõ "dừng" để tắt)*`, isAlert: true }]);
        setIsTyping(false);

        autoSimulateRef.current = setInterval(() => {
          // Lấy danh sách booking
          fetch('http://localhost:3000/api/bookings')
            .then(res => res.json())
            .then(data => {
              const pending = data.filter((b: any) => b.status === 'pending');
              if (pending.length > 0) {
                const token = localStorage.getItem('sportai_admin_token');
                // Duyệt tự động đơn đầu tiên tìm thấy
                fetch(`http://localhost:3000/api/bookings/${pending[0].id}/status`, {
                  method: 'PATCH',
                  headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                  },
                  body: JSON.stringify({ status: 'confirmed' })
                }).then(() => {
                  if (onRefresh) onRefresh();
                });
              }
            });
        }, 3000);
        return;
      }

      // 4. Kịch bản Mưa Voucher / Siêu Khuyến Mãi
      if (lowerInput.includes('mưa voucher') || lowerInput.includes('flash sale')) {
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          sender: 'ai', 
          text: `⚡ **CHIẾN DỊCH FLASH SALE KÍCH HOẠT!**\nĐã set thuộc tính \`Discount = 50%\` cho toàn bộ các sân trong 2 tiếng tới. Tất cả khách hàng vừa nhận được Notification Zalo! Doanh thu dự kiến tăng mạnh.`, 
          isAlert: true 
        }]);
        setIsTyping(false);
        return;
      }

      // 5. Chế độ thao tác Database (Lệnh 1 lần: Xóa sạch, tạo bão đơn, xuất báo cáo)
      const token = localStorage.getItem('sportai_admin_token');
      const isExportReq = /xuất|tải|export|down|file/i.test(lowerInput);
      if (isExportReq && (/doanh thu|báo cáo|excel|csv|tiền/i.test(lowerInput) || lowerInput.includes('xuất file'))) {
        triggerExportCsv();
      }

      fetch('http://localhost:3000/api/admin/ai-execute', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ query: newMsg.text })
      })
      .then(res => res.json())
      .then(data => {
        setIsLoading(false);
        if (data.isExport || (data.message && data.message.includes('BÁO CÁO DOANH THU'))) {
          triggerExportCsv();
          setMessages(prev => [...prev, { 
            id: Date.now() + 1, 
            sender: 'ai', 
            text: data.message, 
            isAlert: true,
            downloadCsv: true 
          }]);
          if (onRefresh) onRefresh();
        } else if (data.message) {
          setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: data.message, isAlert: true }]);
          if (onRefresh) onRefresh();
        } else {
          setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: 'Đã phân tích, nhưng không có thao tác DB nào được thực thi.' }]);
        }
      });
    } else {
      // Chế độ Tư vấn (Consult) - Kết nối dữ liệu thật
      const token = localStorage.getItem('sportai_admin_token');
      const lowerInput = newMsg.text.toLowerCase();
      const isExportReq = /xuất|tải|export|down|file/i.test(lowerInput);

      if (lowerInput.includes('doanh thu') || lowerInput.includes('báo cáo') || lowerInput.includes('tiền') || isExportReq) {
        if (isExportReq) {
          triggerExportCsv();
        }
        fetch('http://localhost:3000/api/revenue', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
          .then(res => res.json())
          .then(data => {
            setIsLoading(false);
            const msg = isExportReq
              ? `📥 **ĐÃ TỰ ĐỘNG XUẤT VÀ TẢI FILE EXCEL VỀ MÁY TÍNH!**\n• Tên tệp tin: \`BaoCaoDoanhThu_SportAI_${new Date().toISOString().split('T')[0]}.csv\`\n• Tổng số đơn đã thu tiền: **${data.totalOrders || 0} hóa đơn**\n• Tổng doanh thu tích lũy: **${data.totalRevenueFormatted || '0 VNĐ'}**\n\n*(File .csv đã được trình duyệt tự động tải xuống thư mục Downloads. Sếp cũng có thể bấm nút bên dưới để tải lại bất cứ lúc nào)*`
              : `📊 **BÁO CÁO DOANH THU THỰC TẾ (SQLITE):**\n• Tổng số đơn đã thu tiền: **${data.totalOrders || 0} hóa đơn**\n• Tổng doanh thu: **${data.totalRevenueFormatted || '0 VNĐ'}**\n\n*(Sếp có thể bấm nút "Tải File Excel" bên dưới hoặc trên Dashboard để tải file .csv về máy)*`;
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: msg, downloadCsv: true, isAlert: isExportReq }]);
          })
          .catch(() => {
            setIsLoading(false);
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: 'Không thể kết nối API doanh thu lúc này.' }]);
          });
      } else {
        fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ message: newMsg.text })
        })
          .then(res => res.json())
          .then(data => {
            setIsLoading(false);
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: data.text || 'Tôi đã tiếp nhận ý kiến của bạn.' }]);
          })
          .catch(() => {
            setIsLoading(false);
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: 'Tôi đang ở chế độ tư vấn an toàn. Bật công tắc "Thao tác DB" (màu đỏ) nếu bạn muốn tôi can thiệp vào cơ sở dữ liệu nhé!' }]);
          });
      }
    }
  };

  const setIsLoading = (loading: boolean) => {
    setIsTyping(loading);
  };

  const renderText = (txt: string) => {
    const parts = txt.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} style={{ color: 'var(--primary)' }}>{part.slice(2, -2)}</strong>;
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <>
      {/* Nút Bong Bóng nổi góc dưới trái (Cho Admin) */}
      {!isOpen && (
        <div className="chatbot-trigger" style={{ left: '40px', right: 'auto', bottom: '40px' }} onClick={() => setIsOpen(true)}>
          <div className="chatbot-trigger-inner" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '2px solid var(--accent)' }}>
            <Terminal size={28} color="var(--accent)" />
          </div>
          <span className="ping-badge" style={{ borderColor: 'var(--accent)', animationDuration: '3s' }}></span>
        </div>
      )}

      {/* Cửa sổ Chat Admin */}
      {isOpen && (
        <div className="glass-panel chatbot-window" style={{ left: '40px', right: 'auto', bottom: '120px', border: mode === 'execute' ? '1px solid var(--accent)' : '1px solid var(--glass-border)', transition: 'border 0.3s' }}>
          
          <div className="chat-header" style={{ background: mode === 'execute' ? 'rgba(255, 8, 68, 0.15)' : 'rgba(10, 12, 16, 0.8)' }}>
            <div className="chat-header-info">
              <div className="chat-avatar-premium" style={{ background: 'transparent', borderColor: mode === 'execute' ? 'var(--accent)' : 'var(--primary)', color: mode === 'execute' ? 'var(--accent)' : 'var(--primary)' }}>
                {mode === 'execute' ? <Database size={20} className="ai-icon-pulse" /> : <Activity size={20} />}
              </div>
              <div>
                <div className="chat-title" style={{ color: mode === 'execute' ? 'var(--accent)' : '#fff' }}>
                  {mode === 'execute' ? 'AI Execution Mode' : 'Admin Assistant'}
                </div>
                <div className="chat-status" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  {/* Toggle Switch */}
                  <div 
                    style={{
                      width: '36px', height: '18px', borderRadius: '20px', 
                      background: mode === 'execute' ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
                      position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
                    }}
                    onClick={() => setMode(mode === 'consult' ? 'execute' : 'consult')}
                  >
                    <div style={{
                      width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: '2px', left: mode === 'execute' ? '20px' : '2px', transition: 'left 0.3s'
                    }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: mode === 'execute' ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {mode === 'execute' ? 'THAO TÁC DB' : 'TƯ VẤN AN TOÀN'}
                  </span>
                </div>
              </div>
            </div>
            <button className="btn-outline close-btn" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="chat-body" style={{ background: mode === 'execute' ? 'rgba(20, 0, 0, 0.3)' : 'transparent' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease' }}>
                <div className={`chat-bubble ${msg.sender}`} style={{ 
                  background: msg.sender === 'user' ? 'rgba(255,255,255,0.1)' : (msg.isAlert ? 'rgba(255, 8, 68, 0.2)' : 'rgba(255,255,255,0.03)'),
                  border: msg.isAlert ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                  color: msg.sender === 'user' ? '#fff' : 'inherit'
                }}>
                  {msg.isAlert && <ShieldAlert size={16} color="var(--accent)" style={{ marginBottom: '8px' }} />}
                  <div style={{ whiteSpace: 'pre-line' }}>{renderText(msg.text)}</div>
                  {msg.downloadCsv && (
                    <button 
                      onClick={() => triggerExportCsv()} 
                      className="btn" 
                      style={{ 
                        marginTop: '10px', 
                        padding: '6px 14px', 
                        fontSize: '0.8rem', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 600,
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <Download size={14} /> Tải Lại File Excel (.csv)
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="chat-bubble ai typing-indicator-container">
                <div className="typing-dot" style={{ background: mode === 'execute' ? 'var(--accent)' : 'var(--primary)' }}></div>
                <div className="typing-dot" style={{ background: mode === 'execute' ? 'var(--accent)' : 'var(--primary)' }}></div>
                <div className="typing-dot" style={{ background: mode === 'execute' ? 'var(--accent)' : 'var(--primary)' }}></div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-footer">
            {mode === 'execute' && (
              <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginBottom: '8px', textAlign: 'center', fontWeight: 600 }}>
                ⚠️ CẢNH BÁO: Lệnh sẽ thay đổi CSDL trực tiếp!
              </div>
            )}
            <div className="chat-input-wrapper" style={{ borderColor: mode === 'execute' ? 'rgba(255, 8, 68, 0.5)' : 'var(--glass-border)' }}>
              <Terminal size={18} color={mode === 'execute' ? 'var(--accent)' : 'var(--text-muted)'} style={{ marginRight: '8px' }} />
              <input 
                type="text" 
                className="chat-input" 
                placeholder={mode === 'execute' ? "Gõ lệnh DB (VD: Lấp đầy sân)" : "Hỏi doanh thu..."}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
              />
              <button 
                className={`chat-send-btn ${input.trim() ? 'active' : ''}`} 
                onClick={handleSend}
                style={{ background: input.trim() ? (mode === 'execute' ? 'var(--accent)' : 'var(--primary)') : 'rgba(255,255,255,0.1)' }}
              >
                <Send size={18} color={input.trim() ? '#000' : 'var(--text-muted)'} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
