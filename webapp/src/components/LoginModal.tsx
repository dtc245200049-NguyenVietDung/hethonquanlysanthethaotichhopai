import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X, Lock, ShieldAlert, User, KeyRound, CheckCircle, ArrowLeft, Mail, Inbox, Send, Sparkles } from 'lucide-react';

export default function LoginModal() {
  const navigate = useNavigate();
  const { isLoginModalOpen, closeLoginModal, login, register, sendOtp, forgotPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Forgot password form state (2-Step Verification with Email OTP)
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtpHint, setDemoOtpHint] = useState('');
  const [emailMasked, setEmailMasked] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isLoginModalOpen) return null;

  const resetMessages = () => {
    setError('');
    setSuccessMsg('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    const res = await login(loginUsername, loginPassword);
    setLoading(false);
    if (res.success) {
      if (res.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } else {
      setError(res.message || 'Tên đăng nhập hoặc mật khẩu không chính xác');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    
    if (regPassword !== regConfirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    const res = await register(regFullName, regUsername, regPassword, regEmail);
    setLoading(false);
    if (!res.success) {
      setError(res.message || 'Đăng ký tài khoản thất bại');
    }
  };

  // Bước 1: Gửi mã OTP xác thực qua Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!forgotUsername.trim() || !forgotEmail.trim()) {
      setError('Vui lòng nhập cả Tên tài khoản và Địa chỉ Email đã đăng ký.');
      return;
    }

    setLoading(true);
    const res = await sendOtp(forgotUsername.trim(), forgotEmail.trim());
    setLoading(false);

    if (res.success) {
      setOtpSent(true);
      setDemoOtpHint(res.demoOtp || '');
      setEmailMasked(res.emailMasked || forgotEmail);
      setSuccessMsg(res.message || 'Mã xác thực OTP đã được gửi đến hộp thư của bạn!');
    } else {
      setError(res.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại tài khoản và email.');
    }
  };

  // Bước 2: Xác thực OTP và Đặt lại mật khẩu
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!forgotOtp.trim()) {
      setError('Vui lòng nhập mã xác thực OTP 6 số đã được gửi tới hộp thư email.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setError('Mật khẩu mới xác nhận không khớp');
      return;
    }

    setLoading(true);
    const res = await forgotPassword(forgotUsername.trim(), forgotEmail.trim(), forgotOtp.trim(), forgotNewPassword);
    setLoading(false);
    if (res.success) {
      setSuccessMsg(res.message || 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.');
      setTimeout(() => {
        setMode('login');
        setLoginUsername(forgotUsername);
        setLoginPassword('');
        setOtpSent(false);
        setForgotOtp('');
        setDemoOtpHint('');
        resetMessages();
      }, 2000);
    } else {
      setError(res.message || 'Không thể đặt lại mật khẩu');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #181d2a, #0f131c)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '460px',
        padding: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(0, 242, 254, 0.15)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={closeLoginModal}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex',
            padding: '12px',
            borderRadius: '16px',
            background: mode === 'register' ? 'rgba(46, 213, 115, 0.1)' : 'rgba(0, 242, 254, 0.1)',
            color: mode === 'register' ? '#2ed573' : '#00f2fe',
            marginBottom: '10px'
          }}>
            {mode === 'login' && <Lock size={26} />}
            {mode === 'register' && <User size={26} />}
            {mode === 'forgot' && <KeyRound size={26} />}
          </div>
          <h2 style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 700, margin: '4px 0' }}>
            {mode === 'login' && <>Đăng Nhập <span className="text-gradient">SportAI</span></>}
            {mode === 'register' && <>Tạo Tài Khoản <span className="text-gradient">Mới</span></>}
            {mode === 'forgot' && <>Khôi Phục <span className="text-gradient">Mật Khẩu</span></>}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            {mode === 'login' && 'Hệ thống Quản lý & Đặt sân thể thao tích hợp Trợ lý AI'}
            {mode === 'register' && 'Đăng ký tài khoản thành viên để đặt sân và tích lũy ưu đãi'}
            {mode === 'forgot' && 'Xác thực 2 bước qua Hộp thư Email & OTP để đặt lại mật khẩu an toàn'}
          </p>
        </div>

        {/* Mode Switcher Tabs (Only between Login and Register) */}
        {mode !== 'forgot' && (
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <button
              type="button"
              onClick={() => { setMode('login'); resetMessages(); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                background: mode === 'login' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                color: mode === 'login' ? '#00f2fe' : '#94a3b8',
                fontWeight: mode === 'login' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); resetMessages(); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                background: mode === 'register' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                color: mode === 'register' ? '#00f2fe' : '#94a3b8',
                fontWeight: mode === 'register' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Đăng Ký Mới
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: '12px',
            padding: '10px 14px',
            color: '#fca5a5',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMsg && (
          <div style={{
            background: 'rgba(46, 213, 115, 0.15)',
            border: '1px solid #2ed573',
            borderRadius: '12px',
            padding: '10px 14px',
            color: '#2ed573',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* --- FORM 1: LOGIN --- */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
                Tên tài khoản (Username)
              </label>
              <input
                type="text"
                placeholder="Nhập tên tài khoản..."
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 500 }}>
                  Mật khẩu (Password)
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); resetMessages(); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Quên mật khẩu?
                </button>
              </div>
              <input
                type="password"
                placeholder="Nhập mật khẩu..."
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                fontWeight: 700,
                marginTop: '12px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Đang xác thực...' : 'Đăng Nhập Ngay'}
            </button>
          </form>
        )}

        {/* --- FORM 2: REGISTER --- */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
                Họ và tên người dùng
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Hoàng Hữu Đạt"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
                Tên đăng nhập (Username)
              </label>
              <input
                type="text"
                placeholder="Tối thiểu 3 ký tự (chữ hoặc số)"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
                Địa chỉ Email (Nhận mã OTP khôi phục)
              </label>
              <input
                type="email"
                placeholder="Ví dụ: dat.hoang@gmail.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
                Mật khẩu (Password)
              </label>
              <input
                type="password"
                placeholder="Tối thiểu 4 ký tự"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
                Nhập lại mật khẩu
              </label>
              <input
                type="password"
                placeholder="Xác nhận lại mật khẩu..."
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Đang tạo tài khoản...' : 'Đăng Ký Tài Khoản'}
            </button>
          </form>
        )}

        {/* --- FORM 3: FORGOT PASSWORD (2-STEP VERIFICATION WITH EMAIL OTP) --- */}
        {mode === 'forgot' && (
          <div>
            {!otpSent ? (
              /* BƯỚC 1: XÁC THỰC DANH TÍNH & GỬI OTP QUA EMAIL */
              <form onSubmit={handleSendOtp}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
                    Tên tài khoản (Username)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: admin hoặc khach1..."
                    value={forgotUsername}
                    onChange={(e) => setForgotUsername(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 500 }}>
                      Địa chỉ Email đã đăng ký
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      (Admin: <code>admin@sportai.vn</code> | khach1: <code>khach1@sportai.vn</code>)
                    </span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      placeholder="Nhập email để nhận mã OTP xác thực..."
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 40px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '0.95rem',
                        outline: 'none'
                      }}
                    />
                    <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Send size={16} /> {loading ? 'Đang gửi mã OTP...' : 'Gửi Mã Xác Thực OTP Qua Email'}
                </button>
              </form>
            ) : (
              /* BƯỚC 2: NHẬP MÃ OTP TỪ EMAIL & ĐẶT MẬT KHẨU MỚI */
              <form onSubmit={handleForgotSubmit}>
                {/* Banner OTP Verification */}
                <div style={{
                  background: 'rgba(0, 242, 254, 0.08)',
                  border: '1px solid rgba(0, 242, 254, 0.25)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  fontSize: '0.85rem',
                  color: '#cbd5e1'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Inbox size={16} style={{ color: '#00f2fe' }} />
                    <span>Mã OTP đã gửi đến: <strong style={{ color: '#00f2fe' }}>{emailMasked}</strong></span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                    Vui lòng kiểm tra Hộp thư đến (hoặc thư mục Spam / Rác).
                  </p>
                  {demoOtpHint && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '6px' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Mã Demo kiểm thử: <strong style={{ color: '#2ed573', fontSize: '0.9rem' }}>{demoOtpHint}</strong></span>
                      <button
                        type="button"
                        onClick={() => setForgotOtp(demoOtpHint)}
                        style={{
                          background: 'rgba(46, 213, 115, 0.2)',
                          border: '1px solid rgba(46, 213, 115, 0.4)',
                          color: '#2ed573',
                          borderRadius: '6px',
                          padding: '3px 10px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Sparkles size={12} /> Tự điền OTP
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
                    Mã xác thực OTP (6 chữ số từ email)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Ví dụ: 123456"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(0, 242, 254, 0.4)',
                      borderRadius: '12px',
                      color: '#00f2fe',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      letterSpacing: '4px',
                      textAlign: 'center',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    placeholder="Tối thiểu 4 ký tự..."
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu mới..."
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginBottom: '10px'
                  }}
                >
                  {loading ? 'Đang xác thực & cập nhật...' : '🔒 Xác Nhận Đặt Lại Mật Khẩu'}
                </button>

                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setForgotOtp(''); resetMessages(); }}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    padding: '6px',
                    marginBottom: '6px',
                    textDecoration: 'underline'
                  }}
                >
                  Gửi lại mã OTP / Đổi địa chỉ Email khác
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => { setMode('login'); setOtpSent(false); resetMessages(); }}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                padding: '8px'
              }}
            >
              <ArrowLeft size={16} /> Quay lại Đăng Nhập
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
