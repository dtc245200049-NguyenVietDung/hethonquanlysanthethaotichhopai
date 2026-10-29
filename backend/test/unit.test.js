/**
 * Unit Tests - Hệ thống SportAI
 * Kiểm thử đơn vị các hàm nghiệp vụ, RBAC Guardrails và Context Engineering UTC+7
 */

const { getSystemInstruction, getToolsForUserRole } = require('../config/geminiConfig');
const { dispatchToolExecution } = require('../services/aiToolDispatcher');
const { generateToken, JWT_SECRET } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

describe('1. Kiểm thử Context Engineering & System Instruction (UTC+7)', () => {
  test('System Instruction phải nhúng múi giờ Việt Nam (UTC+7, Asia/Ho_Chi_Minh) và ngày thực tế', () => {
    const instruction = getSystemInstruction();
    expect(instruction).toContain('UTC+7');
    expect(instruction).toContain('Asia/Ho_Chi_Minh');
    expect(instruction).toContain('SportAI');
    expect(instruction).toContain('Function Calling');
  });

  test('Lớp bảo vệ RBAC Lớp 1: Khách hàng (Customer) bị loại bỏ hoàn toàn tool generate_revenue_report', () => {
    const customerTools = getToolsForUserRole('customer');
    const toolNames = customerTools[0].functionDeclarations.map(t => t.name);
    
    expect(toolNames).toContain('get_available_courts');
    expect(toolNames).toContain('get_court_details_and_pricing');
    expect(toolNames).toContain('recommend_booking_options');
    expect(toolNames).not.toContain('generate_revenue_report');
  });

  test('Lớp bảo vệ RBAC Lớp 1: Admin được cấp quyền đầy đủ cả 4 tools gồm generate_revenue_report', () => {
    const adminTools = getToolsForUserRole('admin');
    const toolNames = adminTools[0].functionDeclarations.map(t => t.name);
    
    expect(toolNames).toHaveLength(4);
    expect(toolNames).toContain('generate_revenue_report');
  });
});

describe('2. Kiểm thử Rào chắn An toàn (RBAC Guardrail Layer 2) trong Dispatcher', () => {
  test('User có role "customer" cố tình gọi generate_revenue_report phải bị chặn mã 403 FORBIDDEN', async () => {
    const fakeDb = {};
    const result = await dispatchToolExecution('generate_revenue_report', {}, { role: 'customer' }, fakeDb);
    
    expect(result.status).toBe('FORBIDDEN');
    expect(result.error_code).toBe(403);
    expect(result.message).toContain('không có quyền xem báo cáo doanh thu');
  });

  test('User chưa đăng nhập (role null/undefined) cố tình gọi báo cáo doanh thu phải bị chặn 403', async () => {
    const fakeDb = {};
    const result = await dispatchToolExecution('generate_revenue_report', {}, null, fakeDb);
    
    expect(result.status).toBe('FORBIDDEN');
    expect(result.error_code).toBe(403);
  });

  test('Tool không tồn tại phải trả về status ERROR', async () => {
    const fakeDb = {};
    const result = await dispatchToolExecution('unknown_malicious_tool', {}, { role: 'admin' }, fakeDb);
    
    expect(result.status).toBe('ERROR');
    expect(result.message).toContain('Không tìm thấy tool');
  });
});

describe('3. Kiểm thử Xác thực JWT Token & RBAC Middleware', () => {
  test('generateToken phải tạo chuỗi JWT hợp lệ chứa đúng vai trò và thông tin user', () => {
    const mockUser = {
      id: 99,
      username: 'test_admin',
      fullName: 'Người Quản Lý Test',
      role: 'admin'
    };

    const token = generateToken(mockUser);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.id).toBe(99);
    expect(decoded.username).toBe('test_admin');
    expect(decoded.role).toBe('admin');
  });

  test('Token hết hạn hoặc sai bí mật khóa (secret) phải ném ngoại lệ khi giải mã', () => {
    const fakeToken = jwt.sign({ id: 1, role: 'admin' }, 'wrong_secret_key');
    
    expect(() => {
      jwt.verify(fakeToken, JWT_SECRET);
    }).toThrow();
  });
});
