/**
 * Authentication & RBAC Middleware
 * Quản lý xác thực JWT & Phân quyền vai trò (Admin vs Customer)
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sportai_jwt_super_secret_key_2026_secure';

// 1. Tạo JWT Token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// 2. Middleware xác thực Token (Tùy chọn: Nếu không có token coi như Khách - Customer)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    // Mặc định gán vai trò Khách vãng lai (customer)
    req.user = { id: null, username: 'guest', fullName: 'Khách Vãng Lai', role: 'customer' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
      });
    }
    req.user = decoded;
    next();
  });
}

// 3. Middleware yêu cầu Quyền hạn bắt buộc (RBAC Guardrail)
function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Yêu cầu bị từ chối: Chức năng này yêu cầu quyền [${requiredRole}], bạn hiện là [${req.user ? req.user.role : 'chưa xác định'}].`
      });
    }
    next();
  };
}

module.exports = {
  generateToken,
  authenticateToken,
  requireRole,
  JWT_SECRET
};
