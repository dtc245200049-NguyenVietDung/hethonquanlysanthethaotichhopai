import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Trophy, LogOut, LogIn, Home, LayoutDashboard } from 'lucide-react';
import CustomerView from './components/CustomerView';
import AdminDashboard from './components/AdminDashboard';
import LoginModal from './components/LoginModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

function Nav() {
  const { user, logout, openLoginModal } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <nav className="top-nav" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 32px',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand Logo */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Trophy className="text-gradient" size={28} />
        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
          Sport<span className="text-gradient">AI</span>
        </span>
      </Link>

      {/* Main Navigation Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link
          to="/"
          style={{
            textDecoration: 'none',
            color: !isAdminPath ? '#00f2fe' : '#94a3b8',
            fontWeight: 600,
            fontSize: '0.95rem',
            padding: '8px 16px',
            borderRadius: '100px',
            background: !isAdminPath ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Home size={16} /> Trang Chủ
        </Link>

        {/* Chỉ xuất hiện khi đăng nhập bằng tài khoản Admin */}
        {user?.role === 'admin' && (
          <Link
            to="/admin"
            style={{
              textDecoration: 'none',
              color: isAdminPath ? '#00f2fe' : '#cbd5e1',
              fontWeight: 700,
              fontSize: '0.95rem',
              padding: '8px 18px',
              borderRadius: '100px',
              background: isAdminPath ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: '1px solid ' + (isAdminPath ? 'rgba(0, 242, 254, 0.4)' : 'rgba(255, 255, 255, 0.1)'),
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LayoutDashboard size={16} /> Quản Trị Admin
          </Link>
        )}
      </div>

      {/* User Authentication & Role Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Role Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '100px',
              background: user.role === 'admin'
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(244, 63, 94, 0.1))'
                : 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(56, 189, 248, 0.1))',
              border: user.role === 'admin'
                ? '1px solid rgba(239, 68, 68, 0.4)'
                : '1px solid rgba(14, 165, 233, 0.4)'
            }}>
              <span style={{ fontSize: '1rem' }}>{user.role === 'admin' ? '👑' : '👤'}</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                  {user.fullName}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: user.role === 'admin' ? '#f87171' : '#38bdf8'
                }}>
                  {user.role === 'admin' ? 'Quyền: ADMIN' : 'Quyền: CUSTOMER'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                padding: '8px 14px',
                borderRadius: '100px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              <LogOut size={14} /> Đăng Xuất
            </button>
          </div>
        ) : (
          <button
            onClick={openLoginModal}
            className="btn btn-primary"
            style={{
              padding: '8px 20px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LogIn size={16} /> 🔑 Đăng Nhập
          </button>
        )}
      </div>
    </nav>
  );
}

// RBAC Protected Route for /admin - Tự động chuyển hướng về Trang Chủ nếu không phải Admin
function AdminProtectedRoute() {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <AdminDashboard />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Nav />
          <LoginModal />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<CustomerView />} />
              <Route path="/admin/*" element={<AdminProtectedRoute />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
