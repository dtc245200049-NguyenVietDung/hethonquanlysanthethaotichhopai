import React, { useState, useEffect } from 'react';
import ChatbotWidget from './ChatbotWidget';
import { Users, Sparkles, Calendar, Clock, X, CheckCircle, AlertTriangle, Table, DollarSign, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CustomerView() {
  const { user } = useAuth();
  const [courts, setCourts] = useState<any[]>([]);
  const [isFlashSale, setIsFlashSale] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<any | null>(null);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('Nguyễn Văn A');
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('19:00 - 20:30');
  const [bookingStatus, setBookingStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [matchSuccessMessage, setMatchSuccessMessage] = useState('');

  // Update customerName when user logs in
  useEffect(() => {
    if (user && user.fullName) {
      setCustomerName(user.fullName);
    }
  }, [user]);

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

  const handleOpenBookingModal = (court: any) => {
    setSelectedCourt(court);
    setBookingStatus({ type: null, message: '' });
  };

  const handleScrollToCourts = () => {
    const el = document.getElementById('courts-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourt) return;

    try {
      const res = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerName || 'Khách vãng lai',
          courtId: selectedCourt.id,
          date: bookingDate,
          time: bookingTime,
          amount: selectedCourt.giaTienGioHienTai || selectedCourt.giaTienGio || 250000
        })
      });

      const data = await res.json();

      if (res.status === 201) {
        setBookingStatus({
          type: 'success',
          message: `🎉 Đặt thành công ${selectedCourt.tenSan} vào lúc ${bookingTime} ngày ${bookingDate}! Đơn đang chờ Admin duyệt.`
        });
        setTimeout(() => {
          setSelectedCourt(null);
        }, 2500);
      } else if (res.status === 409) {
        setBookingStatus({
          type: 'error',
          message: data.message || `⚠️ TRÙNG LỊCH (409 Conflict): Khung giờ ${bookingTime} ngày ${bookingDate} đã có người đặt trước. Vui lòng chọn giờ khác!`
        });
      } else {
        setBookingStatus({
          type: 'error',
          message: data.message || 'Lỗi khi đặt sân, vui lòng thử lại!'
        });
      }
    } catch (err: any) {
      setBookingStatus({
        type: 'error',
        message: 'Không thể kết nối đến máy chủ: ' + err.message
      });
    }
  };

  const handleJoinTeam = (teamName: string) => {
    setMatchSuccessMessage(`🎉 Bạn đã đăng ký tham gia đội "${teamName}" thành công! Hệ thống đã gửi thông báo đến Trưởng nhóm.`);
    setTimeout(() => {
      setMatchSuccessMessage('');
      setIsMatchModalOpen(false);
    }, 2500);
  };

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      {/* Dynamic Flash Sale Banner */}
      {isFlashSale && (
        <div style={{ background: 'linear-gradient(90deg, #ff0844, #ffb199)', padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#fff', fontSize: '1.1rem', animation: 'pulse-glow 2s infinite' }}>
          ⚡ MƯA VOUCHER ĐANG DIỄN RA: TẤT CẢ SÂN ĐỒNG GIẢM GIÁ 50% TRONG 2 TIẾNG! ⚡
        </div>
      )}

      {/* Hero Section */}
      <div className="hero fade-in">
        <div className="hero-badge">
          <Sparkles size={16} /> Powered by SportAI 2.0 (Gemini LLM)
        </div>
        <h1>Đặt sân thể thao <br/><span className="text-gradient">Nhanh chóng & Thông minh</span></h1>
        <p>Hệ thống chống trùng lịch tự động cấp CSDL và trợ lý ảo tư vấn 24/7. Không còn nỗi lo overbooking!</p>
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsPricingModalOpen(true)}
            className="btn btn-primary"
            style={{ padding: '14px 28px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Table size={18} /> Xem bảng giá ngay
          </button>
          
          <button
            onClick={() => setIsMatchModalOpen(true)}
            className="btn btn-outline"
            style={{ padding: '14px 28px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Users size={18} /> Tìm nhóm ghép đội
          </button>

          <button
            onClick={handleScrollToCourts}
            className="btn btn-outline"
            style={{ padding: '14px 24px', fontSize: '1.05rem' }}
          >
            Danh sách sân trống ↓
          </button>
        </div>
      </div>

      {/* Courts Section */}
      <div className="courts-section" id="courts-section">
        <h2 className="section-title">Các sân đang <span className="text-gradient">Thịnh hành</span></h2>
        <div className="courts-grid">
          {courts.map(court => {
            const features = court.tenSan?.includes('VIP') || court.id === 3
              ? ['Khán đài VIP', 'Phòng thay đồ riêng', 'Nước uống miễn phí']
              : court.loaiSan?.includes('5') || court.id === 2
                ? ['Cỏ nhân tạo FIFA', 'Khung giờ linh hoạt', 'Bóng thi đấu có sẵn']
                : ['Cỏ nhân tạo Pro', 'Dàn đèn LED 400W', 'Wifi & Bãi đỗ xe'];

            return (
              <div key={court.id} className="court-card">
                <div className="court-card-body">
                  <div className="court-status-row">
                    <span className="court-status-pill">
                      <span className="status-dot"></span>
                      Sẵn sàng nhận lịch
                    </span>
                    <span className="court-type">{court.loaiSan}</span>
                  </div>

                  <div className="court-header" style={{ marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '6px 0 2px 0' }}>{court.tenSan}</h3>
                  </div>

                  <div className="court-features">
                    {features.map((f, idx) => (
                      <span key={idx} className="feature-tag">{f}</span>
                    ))}
                  </div>

                  <div className="court-price" style={{ margin: '8px 0 16px 0' }}>
                    {isFlashSale ? (
                      <>
                        <span style={{ textDecoration: 'line-through', fontSize: '0.9rem', color: 'var(--text-muted)', marginRight: '8px' }}>{court.giaTienGoc}</span>
                        <span style={{ color: '#ff4757', fontWeight: 'bold', fontSize: '1.3rem' }}>{court.giaTien}</span>
                      </>
                    ) : (
                      court.giaTien
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleOpenBookingModal(court)}>
                      Đặt sân
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ width: '48px', padding: 0 }}
                      title="Tìm nhóm ghép tại sân này"
                      onClick={() => setIsMatchModalOpen(true)}
                    >
                      <Users size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- MODAL 1: BẢNG GIÁ CHI TIẾT (PRICING MATRIX MODAL) --- */}
      {isPricingModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            background: 'var(--bg-panel-solid, #12141c)',
            borderRadius: '24px',
            padding: '32px',
            maxWidth: '620px',
            width: '100%',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <DollarSign className="text-gradient" size={26} />
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                  Bảng Giá Sân & Biểu Phí Dịch Vụ
                </h3>
              </div>
              <button 
                onClick={() => setIsPricingModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
              Bảng giá áp dụng theo từng loại sân và khung giờ. Hệ thống tự động kích hoạt Flash Sale giảm 50% trong khung giờ vắng.
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#cbd5e1' }}>Tên Sân</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#cbd5e1' }}>Quy Mô</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#cbd5e1' }}>Đơn Giá / Giờ</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#cbd5e1' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {courts.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '14px 12px', fontWeight: 600, color: '#fff' }}>{c.tenSan}</td>
                    <td style={{ padding: '14px 12px', color: '#94a3b8' }}>{c.loaiSan}</td>
                    <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 700, color: '#00f2fe' }}>
                      {c.giaTien}
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          setIsPricingModalOpen(false);
                          handleOpenBookingModal(c);
                        }}
                        className="btn btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                      >
                        Đặt Ngay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ background: 'rgba(0, 242, 254, 0.08)', border: '1px solid rgba(0, 242, 254, 0.2)', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={20} color="#00f2fe" />
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                <strong>Chính sách đặt cọc:</strong> Khách đặt cọc 30% - 50% tổng tiền giờ. Hệ thống tự động đối soát và chống trùng lịch qua mã lỗi HTTP 409.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: TÌM NHÓM GHÉP ĐỘI (MATCHMAKING MODAL) --- */}
      {isMatchModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            background: 'var(--bg-panel-solid, #12141c)',
            borderRadius: '24px',
            padding: '32px',
            maxWidth: '560px',
            width: '100%',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users className="text-gradient" size={26} />
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                  Hàng Chờ Ghép Đội Thông Minh (AI Match)
                </h3>
              </div>
              <button 
                onClick={() => setIsMatchModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
              Bạn đang lẻ người hoặc thiếu cầu thủ? Hãy chọn tham gia các đội dưới đây để ghép trận ngay hôm nay:
            </p>

            {matchSuccessMessage && (
              <div style={{
                background: 'rgba(46, 213, 115, 0.15)',
                border: '1px solid #2ed573',
                color: '#2ed573',
                padding: '12px 16px',
                borderRadius: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.9rem'
              }}>
                <CheckCircle size={18} />
                <span>{matchSuccessMessage}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', marginBottom: '4px' }}>⚽ FC Anh Em</div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Cần: <strong>Thiếu 2 người</strong> • Sân 7 Trung Tâm A1</div>
                  <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: '2px' }}>Khung giờ: 19:00 - 20:30 • Trình độ: Khá</div>
                </div>
                <button
                  onClick={() => handleJoinTeam('FC Anh Em')}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Tham Gia
                </button>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', marginBottom: '4px' }}>⚽ Nhóm Sinh Viên</div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Cần: <strong>Thiếu 3 người</strong> • Sân 5 Tập B2</div>
                  <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: '2px' }}>Khung giờ: 17:30 - 19:00 • Trình độ: Trung bình</div>
                </div>
                <button
                  onClick={() => handleJoinTeam('Nhóm Sinh Viên')}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Tham Gia
                </button>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', marginBottom: '4px' }}>⚽ FC Công Nghệ</div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Cần: <strong>Thiếu 1 Thủ môn</strong> • Sân VIP C3</div>
                  <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: '2px' }}>Khung giờ: 20:30 - 22:00 • Trình độ: Phong trào</div>
                </div>
                <button
                  onClick={() => handleJoinTeam('FC Công Nghệ')}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Tham Gia
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsMatchModalOpen(false)}
              className="btn btn-outline"
              style={{ width: '100%', padding: '12px' }}
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 3: ĐẶT LỊCH SÂN (BOOKING MODAL WITH OVERBOOKING CONFLICT CHECK) --- */}
      {selectedCourt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            background: 'var(--bg-panel-solid, #12141c)',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '480px',
            width: '100%',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                Đặt Lịch: <span className="text-gradient">{selectedCourt.tenSan}</span>
              </h3>
              <button 
                onClick={() => setSelectedCourt(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            {bookingStatus.message && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                marginBottom: '20px',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: bookingStatus.type === 'success' ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 71, 87, 0.15)',
                border: `1px solid ${bookingStatus.type === 'success' ? '#2ed573' : '#ff4757'}`,
                color: bookingStatus.type === 'success' ? '#2ed573' : '#ff4757'
              }}>
                {bookingStatus.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                <span>{bookingStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#cbd5e1' }}>Họ và tên người đặt:</label>
                <input 
                  type="text" 
                  value={customerName} 
                  onChange={e => setCustomerName(e.target.value)} 
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#cbd5e1' }}>
                  <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Ngày đặt sân:
                </label>
                <input 
                  type="date" 
                  value={bookingDate} 
                  onChange={e => setBookingDate(e.target.value)} 
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#cbd5e1' }}>
                  <Clock size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Khung giờ thi đấu:
                </label>
                <select 
                  value={bookingTime} 
                  onChange={e => setBookingTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#1a1f2c',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                >
                  <option value="16:00 - 17:30">16:00 - 17:30 (Khung giờ vắng)</option>
                  <option value="17:30 - 19:00">17:30 - 19:00 (Cao điểm)</option>
                  <option value="18:00 - 19:30">18:00 - 19:30 (Giờ vàng)</option>
                  <option value="19:00 - 20:30">19:00 - 20:30 (Giờ vàng)</option>
                  <option value="20:30 - 22:00">20:30 - 22:00 (Buổi tối)</option>
                </select>
              </div>

              <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Đơn giá:</span>
                <span style={{ fontWeight: 700, color: '#00f2fe', fontSize: '1.2rem' }}>
                  {selectedCourt.giaTien}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSelectedCourt(null)}>Hủy bỏ</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Xác Nhận Đặt Sân</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RAG Chatbot Integration for User */}
      <ChatbotWidget />
    </div>
  );
}
