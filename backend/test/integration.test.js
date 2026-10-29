/**
 * Integration Tests - Hệ thống SportAI
 * Kiểm thử tích hợp toàn bộ các API Endpoints, Xác thực JWT, Chống Trùng Lịch và RBAC Guardrail
 */

const request = require('supertest');
const { app, db } = require('../server');

jest.setTimeout(20000);

describe('INTEGRATION TEST SUITE - SPORTAI BACKEND API', () => {
  let adminToken = '';
  let customerToken = '';

  // 1. Kiểm thử Luồng Xác thực (Authentication)
  describe('1. API Xác thực (/api/auth/login)', () => {
    test('Đăng nhập thành công với tài khoản Admin -> Trả về mã 200 và JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('admin');
      adminToken = res.body.token;
    });

    test('Đăng nhập thành công với tài khoản Khách hàng -> Trả về mã 200 và role customer', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'khach1', password: '123456' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('customer');
      customerToken = res.body.token;
    });

    test('Đăng nhập với mật khẩu sai -> Trả về mã lỗi 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrong_password' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('UNAUTHORIZED');
    });

    test('Đăng nhập thiếu trường bắt buộc -> Trả về mã lỗi 400 BAD_REQUEST', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('BAD_REQUEST');
    });

    // 1.2 Kiểm thử Đăng ký tài khoản (Register)
    test('Đăng ký tài khoản mới thành công -> Trả về mã 201 Created và JWT token (TC-04a)', async () => {
      const uniqueUser = 'test_user_' + Date.now();
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Người Dùng Test',
          username: uniqueUser,
          password: 'password123'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('customer');
      expect(res.body.user.username).toBe(uniqueUser);
    });

    test('Đăng ký với tên tài khoản đã tồn tại -> Trả về mã lỗi 409 USER_EXISTS (TC-04b)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Trùng Tên',
          username: 'admin',
          password: 'password123'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('USER_EXISTS');
    });

    // 1.3 Kiểm thử Quên mật khẩu & Xác thực OTP 2 bước qua Email (Forgot Password with Email & OTP)
    test('Gửi mã OTP xác thực thành công qua Email hợp lệ (TC-04c)', async () => {
      const tempUser = 'reset_email_' + Date.now();
      const testEmail = `${tempUser}@gmail.com`;
      await request(app).post('/api/auth/register').send({
        fullName: 'User Reset Email OTP',
        username: tempUser,
        password: 'oldPassword',
        email: testEmail
      });

      const otpRes = await request(app)
        .post('/api/auth/send-otp')
        .send({
          username: tempUser,
          email: testEmail
        });

      expect(otpRes.status).toBe(200);
      expect(otpRes.body).toHaveProperty('demoOtp');
      expect(otpRes.body).toHaveProperty('emailMasked');
      expect(otpRes.body.emailMasked).toContain('@gmail.com');
    });

    test('Gửi OTP với Email không trùng khớp với hồ sơ -> Bị chặn mã 400 EMAIL_MISMATCH (TC-04d)', async () => {
      const tempUser = 'reset_mismatch_' + Date.now();
      await request(app).post('/api/auth/register').send({
        fullName: 'User Mismatch',
        username: tempUser,
        password: 'oldPassword',
        email: 'correct_user@gmail.com'
      });

      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({
          username: tempUser,
          email: 'wrong_hacker@gmail.com' // Sai Email
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('EMAIL_MISMATCH');
    });

    test('Gửi OTP với tài khoản không tồn tại -> Trả về mã 404 USER_NOT_FOUND (TC-04e)', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({
          username: 'non_existent_user_99999',
          email: 'anyone@gmail.com'
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('USER_NOT_FOUND');
    });

    test('Đặt lại mật khẩu thành công với mã OTP hợp lệ từ Email -> Trả về mã 200 OK và đăng nhập được (TC-04f)', async () => {
      const tempUser = 'otp_user_' + Date.now();
      const testEmail = `${tempUser}@sportai.vn`;
      await request(app).post('/api/auth/register').send({
        fullName: 'User Valid Email OTP',
        username: tempUser,
        password: 'initialPassword',
        email: testEmail
      });

      // 1. Gửi OTP
      const otpRes = await request(app)
        .post('/api/auth/send-otp')
        .send({ username: tempUser, email: testEmail });
      const otpCode = otpRes.body.demoOtp;

      // 2. Xác thực OTP & Đặt mật khẩu mới
      const resetRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          username: tempUser,
          email: testEmail,
          otp: otpCode,
          newPassword: 'newSuperSecretPass123'
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.message).toContain('Đặt lại mật khẩu thành công');

      // 3. Đăng nhập lại với mật khẩu mới
      const loginCheck = await request(app)
        .post('/api/auth/login')
        .send({
          username: tempUser,
          password: 'newSuperSecretPass123'
        });
      expect(loginCheck.status).toBe(200);
    });

    test('Đặt lại mật khẩu với mã OTP sai hoặc giả mạo -> Bị chặn mã 400 INVALID_OTP (TC-04g)', async () => {
      const tempUser = 'otp_fake_' + Date.now();
      const testEmail = `${tempUser}@sportai.vn`;
      await request(app).post('/api/auth/register').send({
        fullName: 'User Fake OTP',
        username: tempUser,
        password: 'initialPassword',
        email: testEmail
      });

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          username: tempUser,
          email: testEmail,
          otp: '000000', // Mã OTP sai
          newPassword: 'newPassword123'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_OTP');
    });
  });

  // 2. Kiểm thử Phân quyền & Rào chắn An toàn (RBAC Endpoints)
  describe('2. Kiểm soát Phân quyền RBAC (/api/revenue)', () => {
    test('Khách vãng lai không có token truy cập báo cáo doanh thu -> Bị chặn mã 403 FORBIDDEN', async () => {
      const res = await request(app).get('/api/revenue');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FORBIDDEN');
    });

    test('Tài khoản Customer có token cố tình truy cập báo cáo doanh thu -> Bị chặn mã 403 FORBIDDEN', async () => {
      const res = await request(app)
        .get('/api/revenue')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FORBIDDEN');
    });

    test('Tài khoản Admin có token hợp lệ truy cập báo cáo doanh thu -> Trả về mã 200 OK và số liệu', async () => {
      const res = await request(app)
        .get('/api/revenue')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalRevenue');
      expect(res.body).toHaveProperty('totalRevenueFormatted');
      expect(res.body).toHaveProperty('totalOrders');
      expect(Array.isArray(res.body.invoices)).toBe(true);
    });
  });

  // 3. Kiểm thử Nghiệp vụ Đặt Sân & Chống Trùng Lịch (Overbooking Protection)
  describe('3. Nghiệp vụ Đặt Sân & Chống Trùng Lịch (/api/bookings)', () => {
    const randomMin = String(Date.now() % 50).padStart(2, '0');
    const testDate = `2099-12-${String(Math.floor(Math.random() * 25) + 1).padStart(2, '0')}`;
    const testTime = `04:${randomMin} - 05:30`;
    const testCourtId = 1;

    test('Đặt sân lần 1 cho khung giờ còn trống -> Thành công mã 201 Created', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({
          name: 'Kiểm Thử Viên 1',
          courtId: testCourtId,
          date: testDate,
          time: testTime,
          amount: 250000
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('bookingId');
    });

    test('Đặt sân lần 2 trùng Sân, Ngày và Giờ -> Bị chặn mã 409 Conflict (OVERBOOKING_CONFLICT)', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({
          name: 'Kiểm Thử Viên 2 (Cố tình đặt trùng)',
          courtId: testCourtId,
          date: testDate,
          time: testTime,
          amount: 250000
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('OVERBOOKING_CONFLICT');
      expect(res.body.message).toContain('đã có người đặt');
    });

    test('Khách dùng xong sân, Admin xác nhận trả sân và làm trống sân -> Chuyển sang completed và giải phóng sân (TC-14b)', async () => {
      // 1. Tạo 1 đơn mới
      const newTime = `06:${randomMin} - 07:00`;
      const createRes = await request(app)
        .post('/api/bookings')
        .send({
          name: 'Khách Chơi Xong Trả Sân',
          courtId: testCourtId,
          date: testDate,
          time: newTime,
          amount: 300000
        });
      expect(createRes.status).toBe(201);
      const bId = createRes.body.bookingId;

      // 2. Admin duyệt ca chơi (confirmed)
      const approveRes = await request(app)
        .patch(`/api/bookings/${bId}/status`)
        .send({ status: 'confirmed' });
      expect(approveRes.status).toBe(200);

      // 3. Khách chơi xong -> Admin bấm Trả sân (completed)
      const completeRes = await request(app)
        .patch(`/api/bookings/${bId}/status`)
        .send({ status: 'completed' });
      expect(completeRes.status).toBe(200);
      expect(completeRes.body.status).toBe('completed');
      expect(completeRes.body.message).toContain('làm trống sân');

      // 4. Kiểm tra tính khả dụng: Khung giờ này hiện đã được giải phóng làm trống
      const availRes = await request(app)
        .get(`/api/check-availability?courtId=${testCourtId}&date=${testDate}&time=${newTime}`);
      expect(availRes.status).toBe(200);
      expect(availRes.body.available).toBe(true);
      expect(availRes.body.message).toContain('trống');
    });
  });

  // 4. Kiểm thử API Chatbot AI
  describe('4. API Chatbot AI (/api/chat)', () => {
    test('Gửi tin nhắn tra cứu sân trống -> Trả về mã 200 kèm danh sách sân', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'Tối nay còn sân nào trống không?' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('text');
      expect(res.body.text.length).toBeGreaterThan(10);
    });

    test('Khách hàng chat đòi xem doanh thu -> Trả về thông báo từ chối lịch sự, không lộ số liệu', async () => {
      const res = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ message: 'Cho tôi xem toàn bộ doanh thu của sân' });

      expect(res.status).toBe(200);
      expect(res.body.text).toMatch(/không có quyền|Truy cập bị từ chối/i);
    });
  });
});
