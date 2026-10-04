import React, { useState, useEffect } from 'react';
import ChatbotWidget from './ChatbotWidget';
import { Users, Sparkles } from 'lucide-react';

export default function CustomerView() {
  const [courts, setCourts] = useState<any[]>([]);
  const [isFlashSale, setIsFlashSale] = useState(false);

  const fetchCourts = () => {
    fetch('http://localhost:3000/api/courts')
      .then(res => res.json())
      .then(data => {
        setCourts(data.courts || []);
        setIsFlashSale(data.isFlashSale || false);
      })
      .catch(err => console.error("API Error:", err));
  };

  useEffect(() => {
    fetchCourts();
    const interval = setInterval(fetchCourts, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleBook = (court: any) => {
    fetch('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Khách ngoài trang chủ', courtId: court.id, time: 'Tùy chọn', amount: court.giaTien })
    }).then(() => {
      alert(`🎉 Đã đẩy yêu cầu đặt ${court.tenSan} của bạn vào Database để Admin duyệt! Vui lòng sang tab Admin để xem thành quả.`);
    });
  };

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      {/* Dynamic Flash Sale Banner */}
      {isFlashSale && (
        <div style={{ background: 'linear-gradient(90deg, #ff0844, #ffb199)', padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#fff', fontSize: '1.1rem', animation: 'pulse-glow 2s infinite' }}>
          ⚡ MƯA VOUCHER ĐANG DIỄN RA: TẤT CẢ SÂN ĐỒNG GIẢM GIÁ 50% TRONG 2 TIẾNG! ⚡
        </div>
      )}
      <div className="hero fade-in">
        <div className="hero-badge">
          <Sparkles size={16} /> Powered by SportAI 2.0
        </div>
        <h1>Đặt sân thể thao <br/><span className="text-gradient">Nhanh chóng & Thông minh</span></h1>
        <p>Hệ thống hỗ trợ ghép đội và quản lý lịch tự động bằng trí tuệ nhân tạo. Đừng mất thời gian gọi điện, hãy để Trợ lý ảo AI lo!</p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>Xem bảng giá ngay</button>
          <button className="btn btn-outline" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>Tìm nhóm ghép đội</button>
        </div>
      </div>

      <div className="courts-section">
        <h2 className="section-title">Các sân đang <span className="text-gradient">Thịnh hành</span></h2>
        <div className="courts-grid">
          {courts.map(court => (
            <div key={court.id} className="court-card">
              <div className="court-img-wrapper">
                <img src={court.hinhAnh} alt={court.tenSan} className="court-img" />
                <div className="court-img-overlay"></div>
              </div>
              <div className="court-info">
                <div className="court-header">
                  <h3>{court.tenSan}</h3>
                  <span className="court-type">{court.loaiSan}</span>
                </div>
                <div className="court-price">
                  {isFlashSale ? (
                    <>
                      <span style={{ textDecoration: 'line-through', fontSize: '0.9rem', color: 'var(--text-muted)', marginRight: '8px' }}>{court.giaTienGoc}</span>
                      <span style={{ color: '#ff4757', fontWeight: 'bold', fontSize: '1.2rem' }}>{court.giaTien}</span>
                    </>
                  ) : (
                    court.giaTien
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleBook(court)}>Đặt sân</button>
                  <button className="btn btn-outline" style={{ width: '48px', padding: 0 }}><Users size={18} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RAG Chatbot Integration for User */}
      <ChatbotWidget />
    </div>
  );
}
