const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());

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
    // 1. Bảng Thông tin Sân
    db.run(`CREATE TABLE IF NOT EXISTS SanTheThao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenSan TEXT NOT NULL,
      loaiSan TEXT NOT NULL,
      giaTien TEXT NOT NULL,
      hinhAnh TEXT
    )`);

    // 2. Bảng Lịch Đặt Sân
    db.run(`CREATE TABLE IF NOT EXISTS LichDatSan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenKhachHang TEXT NOT NULL,
      idSan INTEGER,
      khungGio TEXT NOT NULL,
      trangThai TEXT DEFAULT 'pending',
      tongTien TEXT,
      FOREIGN KEY(idSan) REFERENCES SanTheThao(id)
    )`);

    // Chèn dữ liệu mẫu nếu bảng SanTheThao rỗng
    db.get("SELECT COUNT(*) AS count FROM SanTheThao", (err, row) => {
      if (row.count === 0) {
        console.log('⏳ Đang tạo dữ liệu mẫu cho Sân Thể Thao...');
        const stmt = db.prepare("INSERT INTO SanTheThao (tenSan, loaiSan, giaTien, hinhAnh) VALUES (?, ?, ?, ?)");
        stmt.run('Sân Trung Tâm A1', 'Sân 7 người', '250,000đ/h', 'https://images.unsplash.com/photo-1518605368461-1ee7e53f1a9a?w=500&q=80');
        stmt.run('Sân Tập B2', 'Sân 5 người', '150,000đ/h', 'https://images.unsplash.com/photo-1575361204481-48a209754f9a?w=500&q=80');
        stmt.run('Sân VIP C3', 'Sân 7 người', '300,000đ/h', 'https://images.unsplash.com/photo-1508344928928-7165b67de128?w=500&q=80');
        stmt.finalize();
      }
    });

    // Chèn dữ liệu mẫu cho Lịch Đặt Sân
    db.get("SELECT COUNT(*) AS count FROM LichDatSan", (err, row) => {
      if (row.count === 0) {
        console.log('⏳ Đang tạo dữ liệu mẫu cho Lịch Đặt Sân...');
        const stmt = db.prepare("INSERT INTO LichDatSan (tenKhachHang, idSan, khungGio, trangThai, tongTien) VALUES (?, ?, ?, ?, ?)");
        stmt.run('Nguyễn Văn A', 3, '19:00 - 20:30', 'pending', '300,000đ');
        stmt.run('FC Anh Em', 2, '17:30 - 19:00', 'confirmed', '150,000đ');
        stmt.run('Trần Văn B', 1, '20:30 - 22:00', 'pending', '250,000đ');
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
  db.all("SELECT * FROM SanTheThao", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Áp dụng Flash Sale nếu đang bật
    if (isFlashSale) {
      rows = rows.map(r => ({
        ...r,
        giaTienGoc: r.giaTien,
        giaTien: '🔥 ' + (parseInt(r.giaTien.replace(/,/g, '')) / 2).toLocaleString() + 'đ/h'
      }));
    }
    res.json({ courts: rows, isFlashSale });
  });
});

// 2. API: Khách hàng tự đặt sân (Từ UI hoặc AI Chatbot)
app.post('/api/bookings', (req, res) => {
  const { name, courtId, time, amount } = req.body;
  const stmt = db.prepare("INSERT INTO LichDatSan (tenKhachHang, idSan, khungGio, trangThai, tongTien) VALUES (?, ?, ?, ?, ?)");
  stmt.run(name || 'Khách vãng lai', courtId || 1, time || '19:00 - 20:30', 'pending', amount || '250,000đ', function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Đã gửi yêu cầu đặt sân thành công!' });
  });
});

// 3. API: Lấy danh sách Lịch đặt sân (Cho Admin)
app.get('/api/bookings', (req, res) => {
  const query = `
    SELECT LichDatSan.id, LichDatSan.tenKhachHang AS name, SanTheThao.tenSan AS court, 
           LichDatSan.khungGio AS time, LichDatSan.trangThai AS status, LichDatSan.tongTien AS amount
    FROM LichDatSan
    JOIN SanTheThao ON LichDatSan.idSan = SanTheThao.id
    ORDER BY LichDatSan.id DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 3. API: Cập nhật trạng thái duyệt sân (Approve / Reject)
app.patch('/api/bookings/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.run("UPDATE LichDatSan SET trangThai = ? WHERE id = ?", [status, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Đã cập nhật trạng thái', changes: this.changes });
  });
});

// 4. API: Admin AI Command - Tự động sinh/xóa dữ liệu theo lệnh
app.post('/api/admin/ai-execute', (req, res) => {
  const { query } = req.body;
  const lowerQuery = query.toLowerCase();

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
      // Capitalize tên
      extractedName = extractedName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      // Nếu có chỉ định tên mà không có số lượng cụ thể thì mặc định là 1 đơn
      if (!/\d+/.test(lowerQuery)) {
        count = 1;
      }
    }

    let inserted = 0;
    const stmt = db.prepare("INSERT INTO LichDatSan (tenKhachHang, idSan, khungGio, trangThai, tongTien) VALUES (?, ?, ?, ?, ?)");
    
    for (let i = 0; i < count; i++) {
      const name = extractedName || names[Math.floor(Math.random() * names.length)];
      const courtId = courts[Math.floor(Math.random() * courts.length)];
      const time = times[Math.floor(Math.random() * times.length)];
      stmt.run(name, courtId, time, 'pending', '250,000đ', () => {
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
  } else if (/voucher|flash|sale|khuyến mãi/i.test(lowerQuery)) {
    // Lệnh kích hoạt Flash Sale toàn hệ thống
    isFlashSale = true;
    setTimeout(() => { isFlashSale = false; }, 60000 * 120); // Tự tắt sau 2 tiếng
    res.json({ success: true, message: `⚡ CHIẾN DỊCH FLASH SALE: Đã giảm giá 50% toàn bộ sân. Giao diện khách hàng sẽ được cập nhật ngay lập tức!` });
  } else if (isDelete) {
    if (/tất cả|sạch|toàn bộ|hoàn toàn|reset|hết/i.test(lowerQuery)) {
      // Lệnh: Khôi phục cài đặt gốc / Xóa sạch DB
      db.run("DELETE FROM LichDatSan", function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: `🔥 HỆ THỐNG: Đã xóa toàn bộ ${this.changes} dữ liệu đặt sân. Database trống hoàn toàn!` });
      });
    } else {
      // Lệnh: Xóa các đơn chờ
      db.run("DELETE FROM LichDatSan WHERE trangThai = 'pending'", function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: `🗑️ AI đã dọn dẹp ${this.changes} đơn đặt sân đang chờ duyệt.` });
      });
    }
  } else {
    // Phân tích mặc định
    res.json({ 
      success: true, 
      message: 'Xin lỗi, tôi chưa hiểu rõ ý định của bạn. Thử dùng các từ khóa gợi ý như: "tạo", "thêm", "xóa sạch", "reset", "lấp đầy"...'
    });
  }
});

// Khởi chạy Server Backend
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend Server đang chạy tại: http://localhost:${PORT}`);
});
