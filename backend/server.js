require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { generateToken, authenticateToken, requireRole } = require('./middleware/auth');
const { processChatMessage } = require('./services/geminiService');
const { sendOtpEmail, maskEmail } = require('./services/emailService');

const app = express();
app.use(cors());
app.use(express.json());

// Điều hướng trang gốc sang Giao diện Web App (Cổng 5173)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>SportAI - Chuyển Hướng Giao Diện</title>
      <meta http-equiv="refresh" content="0; url=http://localhost:5173" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #fff; text-align: center; }
        .card { background: #1e293b; padding: 40px; border-radius: 16px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-width: 450px; }
        h1 { color: #38bdf8; margin-top: 0; }
        a { display: inline-block; margin-top: 20px; background: #0284c7; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; }
        a:hover { background: #0369a1; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🏆 SportAI System</h1>
        <p>Máy chủ Backend API đang hoạt động bình thường trên cổng <strong>3000</strong>.</p>
        <p>Đang tự động chuyển hướng bạn sang <strong>Giao diện Web App (Cổng 5173)</strong>...</p>
        <a href="http://localhost:5173">Bấm vào đây nếu trình duyệt không tự chuyển</a>
      </div>
    </body>
    </html>
  `);
});

// Kết nối với CSDL SQLite (Lưu file vật lý database.db)
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Lỗi kết nối CSDL:', err.message);
  } else {
    console.log('✅ Đã kết nối thành công với CSDL SQLite.');
    initDb();
  }
});

// Khởi tạo các bảng dữ liệu (Table)
function initDb() {
  db.serialize(() => {
    // 1. Bảng Người Dùng & Phân Quyền (Users)
    db.run(`CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      fullName TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      email TEXT,
      phone TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Migration bổ sung cột email, phone cho Users nếu chưa có
    db.run("ALTER TABLE Users ADD COLUMN email TEXT", () => {});
    db.run("ALTER TABLE Users ADD COLUMN phone TEXT", () => {});
    db.run("UPDATE Users SET email = 'admin@sportai.vn', phone = '0988888888' WHERE username = 'admin' AND (email IS NULL OR email = '')");
    db.run("UPDATE Users SET email = 'khach1@sportai.vn', phone = '0901234567' WHERE username = 'khach1' AND (email IS NULL OR email = '')");
    db.run("UPDATE Users SET email = 'khach2@sportai.vn', phone = '0912345678' WHERE username = 'khach2' AND (email IS NULL OR email = '')");

    // Bảng Quản lý Mã Xác Thực OTP (Email OTP Verification)
    db.run(`CREATE TABLE IF NOT EXISTS OtpTokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      otp TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      used INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run("ALTER TABLE OtpTokens ADD COLUMN email TEXT", () => {});

    // 2. Bảng Thông Tin Sân Thể Thao (SanTheThao)
    db.run(`CREATE TABLE IF NOT EXISTS SanTheThao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenSan TEXT NOT NULL,
      loaiSan TEXT NOT NULL,
      giaTienGio INTEGER NOT NULL,
      hinhAnh TEXT,
      trangThai TEXT DEFAULT 'active'
    )`);

    // 3. Bảng Lịch Đặt Sân (LichDatSan)
    db.run(`CREATE TABLE IF NOT EXISTS LichDatSan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idSan INTEGER NOT NULL,
      idUser INTEGER,
      tenKhachHang TEXT NOT NULL,
      ngayDat TEXT NOT NULL,
      khungGio TEXT NOT NULL,
      gioBatDau TEXT NOT NULL DEFAULT '19:00',
      gioKetThuc TEXT NOT NULL DEFAULT '20:30',
      trangThai TEXT DEFAULT 'pending',
      tongTien INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(idSan) REFERENCES SanTheThao(id),
      FOREIGN KEY(idUser) REFERENCES Users(id)
    )`);

    // Tự động migration bổ sung cột gioBatDau, gioKetThuc cho CSDL SQLite hiện hành nếu chưa có
    db.run("ALTER TABLE LichDatSan ADD COLUMN gioBatDau TEXT", () => {});
    db.run("ALTER TABLE LichDatSan ADD COLUMN gioKetThuc TEXT", () => {});
    db.run(`
      UPDATE LichDatSan 
      SET gioBatDau = TRIM(SUBSTR(khungGio, 1, INSTR(khungGio, '-') - 1)),
          gioKetThuc = TRIM(SUBSTR(khungGio, INSTR(khungGio, '-') + 1))
      WHERE (gioBatDau IS NULL OR gioKetThuc IS NULL OR gioBatDau = '' OR gioKetThuc = '') AND INSTR(khungGio, '-') > 0
    `);

    // 4. Bảng Hóa Đơn & Doanh Thu (HoaDonDoanhThu)
    db.run(`CREATE TABLE IF NOT EXISTS HoaDonDoanhThu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idLichDat INTEGER NOT NULL,
      tongTien INTEGER NOT NULL,
      ngayThanhToan TEXT NOT NULL,
      phuongThuc TEXT DEFAULT 'Chuyển khoản QR',
      FOREIGN KEY(idLichDat) REFERENCES LichDatSan(id)
    )`);

    // 5. Bảng Lưu Trữ Lịch Sử Phiên Hội Thoại AI (ChatHistory - Chuẩn hóa khóa ngoại idUser)
    db.run(`CREATE TABLE IF NOT EXISTS ChatHistory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT NOT NULL,
      idUser INTEGER,
      role TEXT NOT NULL,
      message TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(idUser) REFERENCES Users(id)
    )`);

    // Migration đồng bộ tên cột idUser cho ChatHistory nếu trước đó đã tạo với tên userId
    db.run("ALTER TABLE ChatHistory ADD COLUMN idUser INTEGER", () => {});
    db.run("UPDATE ChatHistory SET idUser = userId WHERE idUser IS NULL", () => {});

    // 6. Ràng buộc Chống Trùng Lịch cấp CSDL (Hard Concurrency Protection / Partial Unique Index)
    db.run("DROP INDEX IF EXISTS idx_unique_active_booking", () => {
      db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_booking 
        ON LichDatSan(idSan, ngayDat, khungGio) 
        WHERE trangThai NOT IN ('rejected', 'cancelled', 'completed')
      `);
    });

    // Chèn dữ liệu mẫu cho Bảng Users nếu rỗng
    db.get("SELECT COUNT(*) AS count FROM Users", (err, row) => {
      if (row && row.count === 0) {
        console.log('⏳ Đang tạo dữ liệu mẫu cho Users...');
        const stmt = db.prepare("INSERT INTO Users (username, password_hash, fullName, role, phone, email) VALUES (?, ?, ?, ?, ?, ?)");
        stmt.run('admin', 'admin123', 'Quản Trị Viên Sân', 'admin', '0988888888', 'admin@sportai.vn');
        stmt.run('khach1', '123456', 'Nguyễn Văn A', 'customer', '0901234567', 'khach1@sportai.vn');
        stmt.run('khach2', '123456', 'Trần Văn B', 'customer', '0912345678', 'khach2@sportai.vn');
        stmt.finalize();
      }
    });

    // Chèn dữ liệu mẫu nếu bảng SanTheThao rỗng
    db.get("SELECT COUNT(*) AS count FROM SanTheThao", (err, row) => {
      if (row && row.count === 0) {
        console.log('⏳ Đang tạo dữ liệu mẫu cho Sân Thể Thao...');
        const stmt = db.prepare("INSERT INTO SanTheThao (tenSan, loaiSan, giaTienGio, hinhAnh, trangThai) VALUES (?, ?, ?, ?, ?)");
        stmt.run('Sân Trung Tâm A1', 'Sân 7 người', 250000, 'https://images.unsplash.com/photo-1518605368461-1ee7e53f1a9a?w=500&q=80', 'active');
        stmt.run('Sân Tập B2', 'Sân 5 người', 150000, 'https://images.unsplash.com/photo-1575361204481-48a209754f9a?w=500&q=80', 'active');
        stmt.run('Sân VIP C3', 'Sân 7 người', 300000, 'https://images.unsplash.com/photo-1508344928928-7165b67de128?w=500&q=80', 'active');
        stmt.finalize();
      }
    });

    // Chèn dữ liệu mẫu cho Lịch Đặt Sân và Hóa Đơn
    db.get("SELECT COUNT(*) AS count FROM LichDatSan", (err, row) => {
      if (row && row.count === 0) {
        console.log('⏳ Đang tạo dữ liệu mẫu cho Lịch Đặt Sân & Hóa Đơn Doanh Thu...');
        const stmt = db.prepare("INSERT INTO LichDatSan (idSan, idUser, tenKhachHang, ngayDat, khungGio, gioBatDau, gioKetThuc, trangThai, tongTien) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        const today = new Date().toISOString().split('T')[0];
        
        stmt.run(3, 2, 'Nguyễn Văn A', today, '19:00 - 20:30', '19:00', '20:30', 'pending', 300000);
        stmt.run(2, 3, 'FC Anh Em', today, '17:30 - 19:00', '17:30', '19:00', 'confirmed', 150000);
        stmt.run(1, null, 'Trần Văn B', today, '20:30 - 22:00', '20:30', '22:00', 'confirmed', 250000, function() {
          // Tạo hóa đơn tương ứng cho các đơn confirmed
          const stmtHd = db.prepare("INSERT INTO HoaDonDoanhThu (idLichDat, tongTien, ngayThanhToan, phuongThuc) VALUES (?, ?, ?, ?)");
          stmtHd.run(2, 150000, today + ' 17:00:00', 'Chuyển khoản QR');
          stmtHd.run(3, 250000, today + ' 20:00:00', 'Tiền mặt');
          stmtHd.finalize();
        });
        stmt.finalize();
      }
    });
  });
}

// ================= GLOBAL STATE =================
let isFlashSale = false;

// ================= API ENDPOINTS =================

// 1. API: Lấy danh sách toàn bộ sân
app.get('/api/courts', (req, res) => {
  db.all("SELECT * FROM SanTheThao WHERE trangThai = 'active'", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Format hiển thị cho Frontend
    const formattedRows = rows.map(r => {
      const formattedPrice = r.giaTienGio.toLocaleString('vi-VN') + 'đ/h';
      if (isFlashSale) {
        const halfPrice = Math.round(r.giaTienGio / 2);
        return {
          ...r,
          giaTienGoc: formattedPrice,
          giaTien: '🔥 ' + halfPrice.toLocaleString('vi-VN') + 'đ/h',
          giaTienGioHienTai: halfPrice
        };
      }
      return {
        ...r,
        giaTien: formattedPrice,
        giaTienGioHienTai: r.giaTienGio
      };
    });
    
    res.json({ courts: formattedRows, isFlashSale });
  });
});

// 2. API: Kiểm tra sân có đang bị trùng lịch hay không
app.get('/api/check-availability', (req, res) => {
  const { courtId, date, time } = req.query;
  const finalDate = date || new Date().toISOString().split('T')[0];
  const finalTime = time || '19:00 - 20:30';
  const finalCourtId = courtId || 1;

  const checkSql = `
    SELECT id, tenKhachHang, trangThai FROM LichDatSan 
    WHERE idSan = ? AND ngayDat = ? AND khungGio = ? AND trangThai NOT IN ('rejected', 'cancelled', 'completed')
    LIMIT 1
  `;
  db.get(checkSql, [finalCourtId, finalDate, finalTime], (err, existing) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (existing) {
      return res.json({
        available: false,
        message: `Sân này lúc ${finalTime} ngày ${finalDate} đã được giữ chỗ!`,
        booking: existing
      });
    }
    res.json({
      available: true,
      message: `Sân này lúc ${finalTime} ngày ${finalDate} đang còn trống!`
    });
  });
});

// 3. API: Khách hàng tự đặt sân (Có cơ chế chống trùng lịch Overbooking 409 Conflict)
app.post('/api/bookings', (req, res) => {
  const { name, courtId, date, time, amount } = req.body;
  const finalDate = date || new Date().toISOString().split('T')[0];
  const finalTime = time || '19:00 - 20:30';
  const finalCourtId = courtId || 1;
  const finalName = name || 'Khách vãng lai';

  // Chuyển đổi amount sang dạng số nguyên (INTEGER VNĐ)
  let finalAmount = 250000;
  if (typeof amount === 'number') {
    finalAmount = amount;
  } else if (typeof amount === 'string') {
    const parsed = parseInt(amount.replace(/[^\d]/g, ''));
    if (!isNaN(parsed) && parsed > 0) finalAmount = parsed;
  }

  // 1. Chống trùng lịch (Overbooking Protection):
  // Kiểm tra xem sân này trong ngày và khung giờ này đã có đơn đặt trước (pending hoặc confirmed) chưa
  const checkSql = `
    SELECT id, tenKhachHang, trangThai FROM LichDatSan 
    WHERE idSan = ? AND ngayDat = ? AND khungGio = ? AND trangThai NOT IN ('rejected', 'cancelled', 'completed')
    LIMIT 1
  `;
  db.get(checkSql, [finalCourtId, finalDate, finalTime], (err, existing) => {
    if (err) return res.status(500).json({ success: false, error: 'DATABASE_ERROR', message: err.message });
    
    if (existing) {
      return res.status(409).json({ 
        success: false, 
        error: 'OVERBOOKING_CONFLICT',
        message: `⚠️ TRÙNG LỊCH: Sân này vào ngày ${finalDate} khung giờ ${finalTime} đã có người đặt trước (Trạng thái: ${existing.trangThai}). Vui lòng chọn khung giờ hoặc sân khác!` 
      });
    }

    // 2. Không trùng lịch -> Lưu vào CSDL với gioBatDau, gioKetThuc và bắt lỗi Race Condition
    let sTime = '19:00';
    let eTime = '20:30';
    if (finalTime.includes('-')) {
      const parts = finalTime.split('-');
      if (parts.length >= 2) {
        sTime = parts[0].trim();
        eTime = parts[1].trim();
      }
    }

    const stmt = db.prepare(`
      INSERT INTO LichDatSan (idSan, idUser, tenKhachHang, ngayDat, khungGio, gioBatDau, gioKetThuc, trangThai, tongTien) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `);
    stmt.run(finalCourtId, null, finalName, finalDate, finalTime, sTime, eTime, finalAmount, function(err) {
      if (err) {
        // Kiểm tra vi phạm Unique Index (Race condition khi 2 request đến cùng 1 tích tắc)
        if (err.message && err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ 
            success: false, 
            error: 'OVERBOOKING_CONFLICT',
            message: `⚠️ TRÙNG LỊCH (DB LOCK): Sân này vào ngày ${finalDate} khung giờ ${finalTime} vừa có người khác nhanh tay giữ chỗ. Vui lòng chọn khung giờ hoặc sân khác!` 
          });
        }
        return res.status(500).json({ success: false, error: 'INSERT_ERROR', message: err.message });
      }
      res.status(201).json({ 
        success: true, 
        message: '🎉 Đã gửi yêu cầu đặt sân thành công!',
        bookingId: this.lastID 
      });
    });
  });
});

// 3. API: Lấy danh sách Lịch đặt sân (Cho Admin)
app.get('/api/bookings', (req, res) => {
  const query = `
    SELECT LichDatSan.id, LichDatSan.tenKhachHang AS name, SanTheThao.tenSan AS court, 
           LichDatSan.ngayDat AS date, LichDatSan.khungGio AS time, 
           LichDatSan.trangThai AS status, LichDatSan.tongTien AS amountNum,
           SanTheThao.loaiSan
    FROM LichDatSan
    JOIN SanTheThao ON LichDatSan.idSan = SanTheThao.id
    ORDER BY LichDatSan.id DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = rows.map(r => ({
      ...r,
      amount: (r.amountNum || 0).toLocaleString('vi-VN') + 'đ'
    }));
    res.json(formatted);
  });
});

// 4. API: Cập nhật trạng thái duyệt sân (Approve / Reject / Complete - Trả sân & Làm trống)
app.patch('/api/bookings/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const validStatuses = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'INVALID_STATUS', message: 'Trạng thái không hợp lệ. Chỉ chấp nhận pending, confirmed, rejected, cancelled, completed.' });
  }

  db.run("UPDATE LichDatSan SET trangThai = ? WHERE id = ?", [status, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    // Nếu trạng thái là 'confirmed', tự động đồng bộ sang bảng HoaDonDoanhThu
    if (status === 'confirmed') {
      db.get("SELECT * FROM LichDatSan WHERE id = ?", [id], (err, booking) => {
        if (!err && booking) {
          const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
          db.run(
            "INSERT INTO HoaDonDoanhThu (idLichDat, tongTien, ngayThanhToan, phuongThuc) VALUES (?, ?, ?, ?)",
            [booking.id, booking.tongTien, nowStr, 'Chuyển khoản QR']
          );
        }
      });
    }

    const message = status === 'completed'
      ? '🏁 Đã xác nhận khách trả sân và giải phóng làm trống sân thành công!'
      : (status === 'confirmed' ? '✅ Đã phê duyệt đơn đặt sân thành công!' : (status === 'rejected' ? '❌ Đã từ chối đơn đặt sân!' : 'Đã cập nhật trạng thái đơn.'));
    
    res.json({ message, status, changes: this.changes });
  });
});

// ================= AUTHENTICATION & RBAC ENDPOINTS =================

// Đăng nhập hệ thống (Sinh JWT Token)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Vui lòng nhập tài khoản và mật khẩu.' });
  }

  db.get("SELECT * FROM Users WHERE username = ?", [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user || user.password_hash !== password) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    const token = generateToken(user);
    res.json({
      message: 'Đăng nhập thành công',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      }
    });
  });
});

// Đăng ký tài khoản mới (Mặc định vai trò Customer)
app.post('/api/auth/register', (req, res) => {
  const { username, password, fullName, email, phone } = req.body;
  if (!username || !password || !fullName) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Vui lòng điền đầy đủ họ tên, tên đăng nhập và mật khẩu.' });
  }

  if (username.length < 3 || password.length < 4) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Tên đăng nhập tối thiểu 3 ký tự, mật khẩu tối thiểu 4 ký tự.' });
  }

  const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : `${username.trim().toLowerCase()}@sportai.vn`;
  const cleanPhone = phone ? phone.trim() : '0901234567';

  db.get("SELECT id FROM Users WHERE username = ?", [username], (err, existing) => {
    if (err) return res.status(500).json({ error: err.message });
    if (existing) {
      return res.status(409).json({ error: 'USER_EXISTS', message: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.' });
    }

    const role = 'customer'; // Mặc định khách hàng
    db.run(
      "INSERT INTO Users (username, password_hash, fullName, role, phone, email) VALUES (?, ?, ?, ?, ?, ?)",
      [username, password, fullName, role, cleanPhone, cleanEmail],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const newUser = { id: this.lastID, username, fullName, role, phone: cleanPhone, email: cleanEmail };
        const token = generateToken(newUser);
        res.status(201).json({
          message: 'Tạo tài khoản thành công',
          token,
          user: newUser
        });
      }
    );
  });
});

// Gửi mã xác thực OTP qua Email (Chống lỗ hổng Broken Authentication / Insecure Password Reset)
app.post('/api/auth/send-otp', (req, res) => {
  const { username, email } = req.body;
  if (!username || !email) {
    return res.status(400).json({ 
      error: 'BAD_REQUEST', 
      message: 'Vui lòng cung cấp cả Tên đăng nhập và Địa chỉ Email đã đăng ký.' 
    });
  }

  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  db.get("SELECT id, username, fullName, email, phone FROM Users WHERE username = ?", [cleanUsername], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) {
      return res.status(404).json({ 
        error: 'USER_NOT_FOUND', 
        message: 'Không tìm thấy tài khoản với tên đăng nhập này trong hệ thống.' 
      });
    }

    const userEmail = (user.email || '').toLowerCase().trim();
    if (!userEmail || userEmail !== cleanEmail) {
      return res.status(400).json({ 
        error: 'EMAIL_MISMATCH', 
        message: 'Địa chỉ Email không trùng khớp với hồ sơ đăng ký của tài khoản này!' 
      });
    }

    // Sinh mã OTP 6 chữ số ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // Hết hạn sau 5 phút

    db.run(
      "INSERT INTO OtpTokens (username, email, phone, otp, expiresAt, used) VALUES (?, ?, ?, ?, ?, 0)",
      [cleanUsername, cleanEmail, user.phone || '', otp, expiresAt],
      async function(insertErr) {
        if (insertErr) return res.status(500).json({ error: insertErr.message });

        const maskedEmail = maskEmail(cleanEmail);

        // Gửi Email thật hoặc giả lập
        await sendOtpEmail(cleanEmail, user.fullName, otp);

        res.json({
          success: true,
          message: `Mã xác thực OTP đã được gửi đến hộp thư ${maskedEmail}. Vui lòng kiểm tra Hộp thư đến (hoặc thư mục Spam).`,
          emailMasked: maskedEmail,
          demoOtp: otp,
          expiresInSeconds: 300
        });
      }
    );
  });
});

// Khôi phục / Đặt lại mật khẩu (Bảo mật 2 lớp: Email + OTP Verification)
app.post('/api/auth/forgot-password', (req, res) => {
  const { username, email, otp, newPassword } = req.body;
  if (!username || !newPassword) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Vui lòng nhập tên tài khoản và mật khẩu mới.' });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Mật khẩu mới tối thiểu 4 ký tự.' });
  }

  const cleanUsername = username.trim();

  // Kiểm tra tài khoản
  db.get("SELECT id, username, fullName, email FROM Users WHERE username = ?", [cleanUsername], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Không tìm thấy tài khoản với tên đăng nhập này.' });
    }

    if (!email || !otp) {
      return res.status(400).json({ 
        error: 'OTP_REQUIRED', 
        message: 'Vui lòng cung cấp Địa chỉ Email và Mã xác thực OTP 6 số để xác thực quyền sở hữu tài khoản.' 
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();
    const now = Date.now();

    const checkOtpSql = `
      SELECT id, otp, expiresAt, used FROM OtpTokens
      WHERE username = ? AND LOWER(email) = ? AND otp = ? AND used = 0 AND expiresAt > ?
      ORDER BY id DESC LIMIT 1
    `;
    db.get(checkOtpSql, [cleanUsername, cleanEmail, cleanOtp, now], (err, validOtp) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!validOtp) {
        return res.status(400).json({ 
          error: 'INVALID_OTP', 
          message: 'Mã xác thực OTP không chính xác, đã sử dụng hoặc đã hết hạn (quá 5 phút)!' 
        });
      }

      db.run("UPDATE Users SET password_hash = ? WHERE id = ?", [newPassword, user.id], function(updateErr) {
        if (updateErr) return res.status(500).json({ error: updateErr.message });

        db.run("UPDATE OtpTokens SET used = 1 WHERE id = ?", [validOtp.id], () => {});

        console.log(`🔐 [AUTH SECURITY] Người dùng ${cleanUsername} đã đặt lại mật khẩu thành công qua xác thực Email OTP.`);
        res.json({ 
          success: true, 
          message: '🎉 Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới.' 
        });
      });
    });
  });
});

// Lấy thông tin tài khoản hiện tại từ Token
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ================= AI CHATBOT AGENTIC ENDPOINT =================

// API: Xử lý Hội thoại Chatbot AI (Tích hợp Gemini API, Function Calling & Bảng ChatHistory)
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message, history, sessionId } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Nội dung tin nhắn không được để trống.' });
    }

    const finalSessionId = sessionId || `sess_${req.user ? req.user.id : 'anon'}_${new Date().toISOString().split('T')[0]}`;
    const userId = req.user ? req.user.id : null;

    // 1. Lưu tin nhắn người dùng vào CSDL ChatHistory (dùng idUser đồng bộ)
    db.run(
      "INSERT INTO ChatHistory (sessionId, idUser, role, message) VALUES (?, ?, 'user', ?)",
      [finalSessionId, userId, message.trim()]
    );

    const result = await processChatMessage(message.trim(), history || [], req.user, db);

    // 2. Lưu phản hồi của AI vào CSDL ChatHistory
    if (result && result.reply) {
      db.run(
        "INSERT INTO ChatHistory (sessionId, idUser, role, message) VALUES (?, ?, 'model', ?)",
        [finalSessionId, userId, result.reply]
      );
    }

    res.json({ ...result, sessionId: finalSessionId });
  } catch (error) {
    console.error('Lỗi API Chat:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
});

// 5. API: Lấy danh sách Hóa đơn Doanh thu (CHỈ DÀNH CHO ADMIN - RBAC GUARDRAIL)
app.get('/api/revenue', authenticateToken, requireRole('admin'), (req, res) => {
  const query = `
    SELECT HoaDonDoanhThu.id, HoaDonDoanhThu.idLichDat, HoaDonDoanhThu.tongTien,
           HoaDonDoanhThu.ngayThanhToan, HoaDonDoanhThu.phuongThuc,
           SanTheThao.tenSan, LichDatSan.tenKhachHang
    FROM HoaDonDoanhThu
    JOIN LichDatSan ON HoaDonDoanhThu.idLichDat = LichDatSan.id
    JOIN SanTheThao ON LichDatSan.idSan = SanTheThao.id
    ORDER BY HoaDonDoanhThu.id DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Tính tổng doanh thu
    const total = rows.reduce((sum, item) => sum + item.tongTien, 0);
    res.json({
      totalRevenue: total,
      totalRevenueFormatted: total.toLocaleString('vi-VN') + ' VNĐ',
      totalOrders: rows.length,
      invoices: rows
    });
  });
});

// 5.1. API: Xuất Báo cáo Doanh thu dạng file Excel/CSV chuẩn UTF-8 (CHỈ DÀNH CHO ADMIN - RBAC GUARDRAIL)
app.get('/api/revenue/export-csv', authenticateToken, requireRole('admin'), (req, res) => {
  const query = `
    SELECT HoaDonDoanhThu.id AS maHoaDon, 
           LichDatSan.tenKhachHang, 
           SanTheThao.tenSan, 
           SanTheThao.loaiSan,
           LichDatSan.ngayDat, 
           LichDatSan.khungGio, 
           HoaDonDoanhThu.tongTien, 
           HoaDonDoanhThu.phuongThuc, 
           HoaDonDoanhThu.ngayThanhToan
    FROM HoaDonDoanhThu
    JOIN LichDatSan ON HoaDonDoanhThu.idLichDat = LichDatSan.id
    JOIN SanTheThao ON LichDatSan.idSan = SanTheThao.id
    ORDER BY HoaDonDoanhThu.id DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const total = rows.reduce((sum, r) => sum + r.tongTien, 0);
    const today = new Date().toISOString().split('T')[0];

    // UTF-8 BOM (\uFEFF) giúp Microsoft Excel hiển thị tiếng Việt có dấu chuẩn 100% không bị lỗi font
    let csv = '\uFEFF';
    csv += 'BÁO CÁO DOANH THU TÀI CHÍNH - HỆ THỐNG QUẢN LÝ SÂN THỂ THAO SPORTAI\r\n';
    csv += `Ngày xuất báo cáo:;${today};;Người lập báo cáo:;Quản trị viên (Admin)\r\n`;
    csv += `Tổng doanh thu thực tế:;${total.toLocaleString('vi-VN')} VNĐ;;Tổng số đơn thành công:;${rows.length} đơn\r\n\r\n`;
    csv += 'Mã Hóa Đơn;Tên Khách Hàng;Sân Thi Đấu;Loại Sân;Ngày Đặt;Khung Giờ;Số Tiền (VNĐ);Phương Thức;Thời Điểm Thanh Toán\r\n';

    rows.forEach(r => {
      csv += `${r.maHoaDon};"${r.tenKhachHang}";"${r.tenSan}";"${r.loaiSan}";${r.ngayDat};"${r.khungGio}";${r.tongTien};"${r.phuongThuc}";"${r.ngayThanhToan}"\r\n`;
    });

    csv += `\r\n;;;;;TỔNG CỘNG DOANH THU:;${total};;\r\n`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="BaoCaoDoanhThu_SportAI_${today}.csv"`);
    res.status(200).send(csv);
  });
});

// 6. API: Admin AI Command - Tự động sinh/xóa dữ liệu theo lệnh (CHỈ DÀNH CHO ADMIN)
app.post('/api/admin/ai-execute', authenticateToken, requireRole('admin'), (req, res) => {
  const { query } = req.body;
  const lowerQuery = query.toLowerCase();
  const today = new Date().toISOString().split('T')[0];

  // NLU Engine (Nhận diện Ý định dựa trên Regex mở rộng)
  const isCreate = /tạo|thêm|lấp|lập|đầy|sinh|bơm|nhét|tăng/i.test(lowerQuery);
  const isDelete = /xóa|hủy|clear|dọn|reset|làm trống|del|phá/i.test(lowerQuery);

  if (isCreate) {
    // Lệnh: Tạo thêm đơn đặt sân
    const names = ['Lê Hải C', 'Phạm D', 'Nhóm IT', 'FC Kế Toán', 'Ngô E', 'Trần F', 'Startup FC', 'Hội Anh Em'];
    const courts = [1, 2, 3];
    const times = ['16:00 - 17:30', '17:30 - 19:00', '18:00 - 19:30', '19:00 - 20:30', '20:30 - 22:00'];
    
    let count = 2; // Mặc định
    if (/lấp đầy|lập đầy|nhiều|kín|bão/i.test(lowerQuery)) count = 10;
    if (/\d+/.test(lowerQuery)) {
      const match = lowerQuery.match(/\d+/);
      if (match) count = parseInt(match[0]);
    }

    // Nâng cấp: Trích xuất Tên khách hàng nếu có ("tên là Nguyễn Việt Dũng")
    let extractedName = null;
    const validNameMatch = query.match(/tên(?: là)?\s+([^,\.\?]+)/i);
    if (validNameMatch && validNameMatch[1]) {
      extractedName = validNameMatch[1].trim();
      extractedName = extractedName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      if (!/\d+/.test(lowerQuery)) {
        count = 1;
      }
    }

    let inserted = 0;
    const stmt = db.prepare("INSERT INTO LichDatSan (idSan, idUser, tenKhachHang, ngayDat, khungGio, gioBatDau, gioKetThuc, trangThai, tongTien) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)");
    
    for (let i = 0; i < count; i++) {
      const name = extractedName || names[Math.floor(Math.random() * names.length)];
      const courtId = courts[Math.floor(Math.random() * courts.length)];
      const time = times[Math.floor(Math.random() * times.length)];
      const [sTime, eTime] = time.includes('-') ? time.split('-').map(t => t.trim()) : ['17:30', '19:00'];
      stmt.run(courtId, null, name, today, time, sTime, eTime, 250000, () => {
        inserted++;
        if (inserted === count) {
          stmt.finalize();
          if (extractedName) {
            res.json({ success: true, message: `✅ Đã tạo thành công ${count} yêu cầu đặt sân đích danh cho khách: **${extractedName}**!` });
          } else {
            res.json({ success: true, message: `✅ Đã dùng AI sinh ngẫu nhiên ${count} yêu cầu đặt sân mới vào DB!` });
          }
        }
      });
    }
  } else if (/doanh thu|báo cáo|tiền|hóa đơn|kế toán|revenue/i.test(lowerQuery)) {
    const isExport = /xuất|tải|export|down|file/i.test(lowerQuery);
    // Lệnh: Truy vấn và Báo cáo Doanh thu tài chính thực tế
    const revQuery = `
      SELECT SUM(tongTien) AS totalRevenue, COUNT(*) AS totalOrders 
      FROM HoaDonDoanhThu
    `;
    db.get(revQuery, [], (err, row) => {
      const total = row ? (row.totalRevenue || 0) : 0;
      const count = row ? (row.totalOrders || 0) : 0;
      const today = new Date().toISOString().split('T')[0];
      res.json({
        success: true,
        isExport: isExport,
        message: isExport
          ? `📥 **ĐÃ TỰ ĐỘNG XUẤT VÀ TẢI FILE BÁO CÁO DOANH THU EXCEL!**\n• Tên tệp tin: \`BaoCaoDoanhThu_SportAI_${today}.csv\`\n• Tổng số đơn đã thu tiền: **${count} hóa đơn**\n• Tổng doanh thu tích lũy: **${total.toLocaleString('vi-VN')} VNĐ**\n\n*(File .csv đã được trình duyệt tự động tải xuống. Sếp cũng có thể bấm nút bên dưới để tải lại bất cứ lúc nào)*`
          : `📊 **BÁO CÁO DOANH THU THỰC TẾ (SQLITE):**\n• Tổng số đơn đã thu tiền: **${count} hóa đơn**\n• Tổng doanh thu tích lũy: **${total.toLocaleString('vi-VN')} VNĐ**\n\n*(Sếp có thể bấm nút "Xuất Excel" trên Dashboard để tải file .csv chi tiết về máy)*`
      });
    });
  } else if (/voucher|flash|sale|khuyến mãi/i.test(lowerQuery)) {
    // Lệnh kích hoạt Flash Sale toàn hệ thống
    isFlashSale = true;
    setTimeout(() => { isFlashSale = false; }, 60000 * 120); // Tự tắt sau 2 tiếng
    res.json({ success: true, message: `⚡ CHIẾN DỊCH FLASH SALE: Đã giảm giá 50% toàn bộ sân. Giao diện khách hàng sẽ được cập nhật ngay lập tức!` });
  } else if (/trả sân|làm trống|dùng xong|hoàn thành|xong sân|check-?out|giải phóng/i.test(lowerQuery)) {
    // Lệnh: Khách dùng sân xong -> Hoàn thành ca và Làm trống sân
    let courtIdMatch = lowerQuery.match(/sân\s*(\d+)/i) || lowerQuery.match(/#(\d+)/);
    if (courtIdMatch) {
      const targetId = parseInt(courtIdMatch[1]);
      db.run(
        "UPDATE LichDatSan SET trangThai = 'completed' WHERE (idSan = ? OR id = ?) AND trangThai = 'confirmed'", 
        [targetId, targetId], 
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          if (this.changes > 0) {
            res.json({ 
              success: true, 
              message: `🏁 **ĐÃ HOÀN THÀNH & LÀM TRỐNG SÂN!**\nĐã xác nhận khách hoàn thành ca thi đấu tại Sân/Đơn #${targetId}. Sân hiện đã được **LÀM TRỐNG** và sẵn sàng đón lượt khách mới!` 
            });
          } else {
            res.json({ 
              success: true, 
              message: `ℹ️ Không tìm thấy ca đặt nào đang hoạt động (confirmed) tại Sân #${targetId} để làm trống.` 
            });
          }
        }
      );
    } else {
      // Làm trống toàn bộ các sân đang có ca thi đấu (confirmed)
      db.run("UPDATE LichDatSan SET trangThai = 'completed' WHERE trangThai = 'confirmed'", function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ 
          success: true, 
          message: `🏁 **ĐÃ LÀM TRỐNG TOÀN BỘ CỤM SÂN!**\nĐã chuyển ${this.changes} ca thi đấu sang trạng thái [Đã Hoàn Thành - Sân Trống]. Toàn bộ các sân hiện đã sẵn sàng phục vụ lượt khách tiếp theo!` 
        });
      });
    }
  } else if (isDelete) {
    if (/tất cả|sạch|toàn bộ|hoàn toàn|reset|hết/i.test(lowerQuery)) {
      // Lệnh: Khôi phục cài đặt gốc / Xóa sạch DB
      db.run("DELETE FROM HoaDonDoanhThu", () => {
        db.run("DELETE FROM LichDatSan", function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true, message: `🔥 HỆ THỐNG: Đã xóa toàn bộ ${this.changes} dữ liệu đặt sân và hóa đơn. Database trống hoàn toàn!` });
        });
      });
    } else {
      // Lệnh: Xóa các đơn chờ
      db.run("DELETE FROM LichDatSan WHERE trangThai = 'pending'", function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: `🗑️ AI đã dọn dẹp ${this.changes} đơn đặt sân đang chờ duyệt.` });
      });
    }
  } else {
    res.json({ 
      success: true, 
      message: 'Xin lỗi, tôi chưa hiểu rõ ý định của bạn. Thử dùng các từ khóa gợi ý như: "tạo 2 đơn", "báo cáo doanh thu", "xóa sạch", "reset", "lấp đầy"...'
    });
  }
});

// Khởi chạy Server Backend nếu chạy trực tiếp
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Backend Server đang chạy tại: http://localhost:${PORT}`);
  });
}

module.exports = { app, db };
