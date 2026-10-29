import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: 'admin' | 'customer';
  email?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; user?: User; message?: string }>;
  register: (fullName: string, username: string, password: string, email?: string) => Promise<{ success: boolean; user?: User; message?: string }>;
  sendOtp: (username: string, email: string) => Promise<{ success: boolean; message?: string; demoOtp?: string; emailMasked?: string }>;
  forgotPassword: (username: string, email: string, otp: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('sportai_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('sportai_token');
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    if (user && token) {
      localStorage.setItem('sportai_user', JSON.stringify(user));
      localStorage.setItem('sportai_token', token);
      localStorage.setItem('sportai_admin_token', token); // For backward compatibility
    } else {
      localStorage.removeItem('sportai_user');
      localStorage.removeItem('sportai_token');
      localStorage.removeItem('sportai_admin_token');
    }
  }, [user, token]);

  const login = async (username: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.token && data.user) {
        setUser(data.user);
        setToken(data.token);
        setIsLoginModalOpen(false);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Tài khoản hoặc mật khẩu không đúng' };
      }
    } catch (err: any) {
      return { success: false, message: 'Lỗi kết nối máy chủ: ' + err.message };
    }
  };

  const register = async (fullName: string, username: string, password: string, email?: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, username, password, email: email || `${username}@sportai.vn` })
      });
      const data = await res.json();
      if (res.ok && data.token && data.user) {
        setUser(data.user);
        setToken(data.token);
        setIsLoginModalOpen(false);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Đăng ký không thành công' };
      }
    } catch (err: any) {
      return { success: false, message: 'Lỗi kết nối máy chủ: ' + err.message };
    }
  };

  const sendOtp = async (username: string, email: string): Promise<{ success: boolean; message?: string; demoOtp?: string; emailMasked?: string }> => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message,
          demoOtp: data.demoOtp,
          emailMasked: data.emailMasked
        };
      } else {
        return { success: false, message: data.message || 'Không thể gửi mã xác thực OTP' };
      }
    } catch (err: any) {
      return { success: false, message: 'Lỗi kết nối máy chủ: ' + err.message };
    }
  };

  const forgotPassword = async (username: string, email: string, otp: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, otp, newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Không thể đặt lại mật khẩu' };
      }
    } catch (err: any) {
      return { success: false, message: 'Lỗi kết nối máy chủ: ' + err.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        sendOtp,
        forgotPassword,
        logout,
        isLoginModalOpen,
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => setIsLoginModalOpen(false)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
