import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Settings, Activity, DollarSign, Check, X, Zap, Clock, AlertTriangle, Download, Flag } from 'lucide-react';
import AiCommandBar from './AiCommandBar';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [revenueStats, setRevenueStats] = useState({ totalRevenueFormatted: '0 VNĐ', totalOrders: 0 });
  const [activeTab, setActiveTab] = useState('duyet'); // 'duyet', 'match', 'settings'
  const [showAllBookings, setShowAllBookings] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [flashSaleActive, setFlashSaleActive] = useState(false);
  const [weatherAlertActive, setWeatherAlertActive] = useState(true);
  const [adminNotice, setAdminNotice] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const getAdminToken = async () => {
    let token = localStorage.getItem('sportai_admin_token');
    if (!token) {
      try {
        const res = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('sportai_admin_token', data.token);
          token = data.token;
        }
      } catch (err) {
        console.error("Admin Login Error:", err);
      }
    }
    return token;
  };

  const fetchRevenue = async () => {
    const token = await getAdminToken();
    fetch('http://localhost:3000/api/revenue', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.totalRevenueFormatted) {
          setRevenueStats({
            totalRevenueFormatted: data.totalRevenueFormatted,
            totalOrders: data.totalOrders
          });
        }
      })
      .catch(err => console.error("Revenue API Error:", err));
  };

  const fetchBookings = () => {
    fetch('http://localhost:3000/api/bookings')
      .then(res => res.json())
      .then(data => setBookings(data))
      .catch(err => console.error("API Error:", err));
  };

  useEffect(() => {
    fetchBookings();
    fetchRevenue();
    const interval = setInterval(() => {
      fetchBookings();
      fetchRevenue();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const [matchQueue, setMatchQueue] = useState([
    { id: 1, team: 'Nhóm Lẻ (3 người)', level: 'Trung bình', target: 'Sân 5', time: '19:00 Hôm nay' },
    { id: 2, team: 'FC Sinh Viên (Thiếu 2)', level: 'Khá', target: 'Sân 7', time: '20:00 Hôm nay' },
  ]);

  const handleApprove = async (id: string) => {
    const token = await getAdminToken();
    fetch(`http://localhost:3000/api/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ status: 'confirmed' })
    }).then(() => {
      fetchBookings();
      fetchRevenue();
    });
  };

  const handleReject = async (id: string) => {
    const token = await getAdminToken();
    fetch(`http://localhost:3000/api/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ status: 'rejected' })
    }).then(() => fetchBookings());
  };

  const handleComplete = async (id: string) => {
    const token = await getAdminToken();
    fetch(`http://localhost:3000/api/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ status: 'completed' })
    }).then(() => {
      fetchBookings();
      setAdminNotice('🏁 Đã xác nhận khách trả sân và giải phóng làm trống sân thành công! Sân đã sẵn sàng.');
    });
  };

  const handleExportRevenue = async () => {
    setIsExporting(true);
    try {
      const token = await getAdminToken();
      const res = await fetch('http://localhost:3000/api/revenue/export-csv', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Không có quyền hoặc lỗi máy chủ');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BaoCaoDoanhThu_SportAI_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setAdminNotice('📊 Đã xuất file Báo cáo Doanh thu Excel (.csv) thành công!');
      setTimeout(() => setAdminNotice(''), 4000);
    } catch (err) {
      console.error(err);
      alert('Không thể xuất file báo cáo. Vui lòng kiểm tra quyền Admin.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleAutoMatch = (id: number, teamName: string) => {
    // Xóa khỏi hàng chờ
    setMatchQueue(prev => prev.filter(q => q.id !== id));
    // Chèn tự động vào Database như một đơn đặt sân Đã chốt
    fetch('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: teamName + ' (Đã ghép AI)', courtId: 1, time: '19:00 - 20:30', amount: 'Chia đều (Đã chốt)' })
    }).then(() => fetchBookings());
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="glass-panel sidebar" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderTopRightRadius: '24px', borderBottomRightRadius: '24px', margin: '20px 0 20px 20px' }}>
        <div className="logo text-gradient" style={{ marginBottom: '20px' }}>
          <Activity size={32} /> Admin AI
        </div>
        
        <div className="nav-links">
          <a href="#" className={`nav-link ${activeTab === 'duyet' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('duyet'); }}><LayoutDashboard size={20} /> Duyệt Đặt Sân</a>
          <a href="#" className={`nav-link ${activeTab === 'match' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('match'); }}><Users size={20} /> Ghép Đội (Match)</a>
          <a href="#" className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('settings'); }}><Settings size={20} /> Cài đặt</a>
        </div>
        
        <div style={{ marginTop: 'auto' }}>
          <Link to="/" className="btn btn-outline" style={{ width: '100%' }}>Trở về Trang Khách</Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header / AI Command Bar */}
        <header style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
          <AiCommandBar onRefresh={fetchBookings} />
        </header>

        {/* --- TAB: DUYỆT ĐẶT SÂN --- */}
        {activeTab === 'duyet' && (
          <>
            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="glass-panel stat-card">
                <div className="stat-icon blue"><Activity /></div>
                <div className="stat-value text-gradient">85%</div>
                <div className="stat-label">Tỷ lệ lấp đầy tối nay</div>
              </div>
              
              <div className="glass-panel stat-card" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="stat-icon red"><DollarSign /></div>
                  <button 
                    onClick={handleExportRevenue} 
                    disabled={isExporting}
                    className="btn btn-outline" 
                    style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}
                    title="Tải file báo cáo doanh thu Excel/CSV"
                  >
                    <Download size={13} /> {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
                  </button>
                </div>
                <div className="stat-value">{revenueStats.totalRevenueFormatted}</div>
                <div className="stat-label">Tổng doanh thu ({revenueStats.totalOrders} hóa đơn)</div>
              </div>
              
              <div className="glass-panel stat-card">
                <div className="stat-icon green"><Zap /></div>
                <div className="stat-value">{bookings.filter(b => b.status === 'pending').length}</div>
                <div className="stat-label">Yêu cầu chờ duyệt</div>
              </div>
              
              <div className="glass-panel stat-card">
                <div className="stat-icon purple"><Users /></div>
                <div className="stat-value">{matchQueue.length}</div>
                <div className="stat-label">Nhóm đang chờ ghép</div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              {/* Booking Management Panel */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    {showAllBookings ? 'Toàn Bộ Lịch Đặt Sân (Tất cả)' : 'Yêu cầu Đặt Sân Chờ Duyệt (Pending)'}
                  </h3>
                  <button 
                    onClick={() => setShowAllBookings(prev => !prev)} 
                    className="btn btn-outline" 
                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                  >
                    {showAllBookings ? 'Chỉ xem Chờ Duyệt' : 'Xem tất cả lịch'}
                  </button>
                </div>

                {adminNotice && (
                  <div style={{
                    background: 'rgba(46, 213, 115, 0.15)',
                    border: '1px solid #2ed573',
                    color: '#2ed573',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    marginBottom: '16px',
                    fontSize: '0.85rem'
                  }}>
                    {adminNotice}
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {bookings
                    .filter(b => showAllBookings ? true : b.status === 'pending')
                    .map(booking => (
                    <div key={booking.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '4px' }}>{booking.name} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>#{booking.id}</span></div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}><Clock size={14} style={{ display: 'inline', marginRight: '4px' }}/>{booking.date ? `${booking.date} • ` : ''}{booking.time} • {booking.court}</div>
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--primary)', marginRight: '20px' }}>{booking.amount}</div>
                      
                      {booking.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleApprove(booking.id)} className="btn btn-primary" style={{ padding: '8px', borderRadius: '8px' }} title="Duyệt (Đã nhận cọc)"><Check size={18} /></button>
                          <button onClick={() => handleReject(booking.id)} className="btn btn-outline" style={{ padding: '8px', borderRadius: '8px', color: 'var(--accent)' }} title="Từ chối"><X size={18} /></button>
                        </div>
                      ) : booking.status === 'confirmed' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: '#2ed573', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={16}/> Đang dùng
                          </span>
                          <button 
                            onClick={() => handleComplete(booking.id)} 
                            className="btn btn-outline" 
                            style={{ 
                              padding: '5px 12px', 
                              fontSize: '0.78rem', 
                              borderRadius: '8px',
                              borderColor: '#38bdf8',
                              color: '#38bdf8',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              cursor: 'pointer'
                            }} 
                            title="Xác nhận khách đã dùng xong sân, trả sân và làm trống sân"
                          >
                            <Flag size={13} /> Trả Sân (Làm Trống)
                          </button>
                        </div>
                      ) : booking.status === 'completed' ? (
                        <span style={{ color: '#c084fc', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          🏁 Đã hoàn thành (Sân trống)
                        </span>
                      ) : (
                        <span style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <X size={16}/> Đã từ chối
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Matchmaking & Alerts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={20} color="var(--primary)" /> AI Matchmaking
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {matchQueue.map(q => (
                      <div key={q.id} style={{ padding: '12px', background: 'rgba(79, 172, 254, 0.05)', borderRadius: '12px', border: '1px solid rgba(79, 172, 254, 0.2)' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{q.team}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Trình độ: {q.level} • {q.time}</div>
                        <button className="btn btn-primary" style={{ width: '100%', padding: '6px', fontSize: '0.85rem' }} onClick={() => handleAutoMatch(q.id, q.team)}>
                          Auto-Match Ngay
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '20px', background: 'linear-gradient(145deg, rgba(255, 8, 68, 0.1), rgba(15, 18, 25, 0.8))', border: '1px solid rgba(255, 8, 68, 0.3)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} /> Cảnh báo Hệ thống
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    Dự báo thời tiết lúc 19:00 có <strong>mưa dông</strong>. Có 2 sân ngoài trời đang được đặt. Gợi ý gửi tin nhắn Zalo nhắc khách mang đồ mưa hoặc chuyển sang sân mái che.
                  </p>
                  <button 
                    onClick={() => {
                      setAdminNotice('📱 Đã gửi tin nhắn Zalo/SMS cảnh báo thời tiết tự động đến 2 khách đặt sân ngoài trời!');
                      setTimeout(() => setAdminNotice(''), 4000);
                    }}
                    className="btn btn-accent" 
                    style={{ marginTop: '12px', width: '100%', fontSize: '0.85rem', padding: '8px' }}
                  >
                    Gửi tin SMS/Zalo hàng loạt
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* --- TAB: GHÉP ĐỘI --- */}
        {activeTab === 'match' && (
          <div className="fade-in">
            <div className="glass-panel" style={{ padding: '30px' }}>
              <h2 style={{ marginBottom: '15px' }}><Users size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '10px' }}/> Trung tâm Ghép Đội AI</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
                Hệ thống đang sử dụng thuật toán tính Elo tự động để tìm kiếm các đội có trình độ tương đương và đang trống lịch.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {matchQueue.map(q => (
                  <div key={q.id} style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{q.team}</h3>
                    <div style={{ marginBottom: '6px', color: 'var(--text-muted)' }}>Mục tiêu: <strong style={{ color: '#fff' }}>{q.target}</strong></div>
                    <div style={{ marginBottom: '6px', color: 'var(--text-muted)' }}>Thời gian: <strong style={{ color: '#fff' }}>{q.time}</strong></div>
                    <div style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>Đánh giá Elo: <strong style={{ color: 'var(--primary)' }}>{q.level}</strong></div>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleAutoMatch(q.id, q.team)}>
                      <Zap size={16} /> Bắt cặp & Chốt Sân
                    </button>
                  </div>
                ))}
                
                {matchQueue.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
                    Không còn đội nào trong hàng chờ ghép.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: CÀI ĐẶT --- */}
        {activeTab === 'settings' && (
          <div className="fade-in">
            <div className="glass-panel" style={{ padding: '30px', maxWidth: '600px', margin: '0 auto' }}>
              <h2 style={{ marginBottom: '25px' }}><Settings size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '10px' }}/> Cài đặt Trợ lý AI</h2>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Tự động duyệt đơn (Auto-Approve)</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>AI tự động chuyển trạng thái đơn chờ thành Đã chốt</div>
                </div>
                <div 
                  onClick={() => {
                    setAutoApprove(prev => !prev);
                    setAdminNotice(autoApprove ? 'ℹ️ Đã tắt chế độ Tự động duyệt đơn.' : '⚡ Đã kích hoạt chế độ Tự động duyệt đơn AI!');
                    setTimeout(() => setAdminNotice(''), 3000);
                  }}
                  style={{ width: '50px', height: '26px', background: autoApprove ? 'var(--primary)' : 'rgba(255,255,255,0.2)', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}
                >
                  <div style={{ width: '22px', height: '22px', background: '#fff', borderRadius: '50%', position: 'absolute', right: autoApprove ? '2px' : '26px', top: '2px', transition: 'all 0.3s' }}></div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Chiến dịch Flash Sale (Giảm 50%)</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>Tự động áp dụng banner giảm 50% tiền sân</div>
                </div>
                <div 
                  onClick={() => {
                    setFlashSaleActive(prev => !prev);
                    setAdminNotice(flashSaleActive ? 'ℹ️ Đã đóng chiến dịch Flash Sale.' : '🎉 ĐÃ KÍCH HOẠT FLASH SALE 50% TOÀN HỆ THỐNG!');
                    setTimeout(() => setAdminNotice(''), 3000);
                  }}
                  style={{ width: '50px', height: '26px', background: flashSaleActive ? 'var(--accent)' : 'rgba(255,255,255,0.2)', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}
                >
                  <div style={{ width: '22px', height: '22px', background: '#fff', borderRadius: '50%', position: 'absolute', right: flashSaleActive ? '2px' : '26px', top: '2px', transition: 'all 0.3s' }}></div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Cảnh báo Thời tiết (NLP)</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>Đọc bản tin thời tiết và đề xuất gửi SMS cho khách</div>
                </div>
                <div 
                  onClick={() => {
                    setWeatherAlertActive(prev => !prev);
                    setAdminNotice(weatherAlertActive ? 'ℹ️ Đã tắt cảnh báo thời tiết tự động.' : '🌦️ Đã kích hoạt radar cảnh báo thời tiết AI!');
                    setTimeout(() => setAdminNotice(''), 3000);
                  }}
                  style={{ width: '50px', height: '26px', background: weatherAlertActive ? 'var(--primary)' : 'rgba(255,255,255,0.2)', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}
                >
                  <div style={{ width: '22px', height: '22px', background: '#fff', borderRadius: '50%', position: 'absolute', right: weatherAlertActive ? '2px' : '26px', top: '2px', transition: 'all 0.3s' }}></div>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  fetchBookings();
                  fetchRevenue();
                  setAdminNotice('🔄 Đã làm mới và đồng bộ lại toàn bộ dữ liệu CSDL SQLite!');
                  setTimeout(() => setAdminNotice(''), 3000);
                }}
                className="btn btn-outline" 
                style={{ width: '100%', marginTop: '20px', color: 'var(--accent)' }}
              >
                Đồng bộ & Làm mới Dữ liệu CSDL
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
