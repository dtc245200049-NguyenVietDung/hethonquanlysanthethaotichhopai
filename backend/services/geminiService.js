/**
 * Gemini AI Service with Agentic Workflow, Function Calling & Graceful Degradation Fallback
 * Tuân thủ mục 1, mục 3 và mục 4 trong .agents/skills/sport-ai-chatbot/SKILL.md
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getSystemInstruction, getToolsForUserRole } = require('../config/geminiConfig');
const { dispatchToolExecution } = require('./aiToolDispatcher');

const GEMINI_TIMEOUT_MS = 8000; // Timeout 8 giây theo quy chuẩn

/**
 * Xử lý tin nhắn Chat qua Gemini API hoặc Tự động Fallback
 */
async function processChatMessage(userMessage, chatHistory = [], userContext = { role: 'customer' }, db) {
  const apiKey = process.env.GEMINI_API_KEY;

  // Nếu không có API Key hoặc key dạng placeholder, fallback ngay sang Rule-based Engine
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    console.log('ℹ️ Không phát hiện GEMINI_API_KEY hợp lệ. Đang chuyển sang Fallback Rule Engine.');
    return await executeLocalRuleMatcher(userMessage, userContext, db, 'Chưa cấu hình GEMINI_API_KEY');
  }

  try {
    // Bọc trong cơ chế Timeout 8s (Promise.race)
    const result = await Promise.race([
      executeGeminiAgenticLoop(userMessage, chatHistory, userContext, db, apiKey),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Quá thời gian chờ phản hồi từ Gemini API (${GEMINI_TIMEOUT_MS}ms)`)), GEMINI_TIMEOUT_MS)
      )
    ]);
    return result;
  } catch (error) {
    console.warn('⚠️ Lỗi kết nối Gemini API, kích hoạt Graceful Degradation Fallback:', error.message);
    return await executeLocalRuleMatcher(userMessage, userContext, db, error.message);
  }
}

/**
 * Agentic Workflow: Multi-turn + Function Calling với Gemini SDK
 */
async function executeGeminiAgenticLoop(userMessage, chatHistory, userContext, db, apiKey) {
  // Rào chắn bảo mật Layer 1 (Zero-Trust Input Guardrail): Ngăn chặn câu hỏi doanh thu từ Customer ngay lập tức
  if (userContext?.role !== 'admin' && /doanh thu|thu nhập|tài chính|lợi nhuận|báo cáo tiền/i.test(userMessage)) {
    return {
      text: '🔒 **Truy cập bị từ chối:** Bạn không có quyền xem báo cáo doanh thu tài chính. Dữ liệu này chỉ dành riêng cho Quản trị viên sân.',
      reply: '🔒 **Truy cập bị từ chối:** Bạn không có quyền xem báo cáo doanh thu tài chính. Dữ liệu này chỉ dành riêng cho Quản trị viên sân.',
      isFallback: false,
      toolsUsed: []
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  const tools = getToolsForUserRole(userContext?.role);
  const systemInstruction = getSystemInstruction(userContext?.role);

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemInstruction,
    tools: tools
  });

  // Chuyển đổi Chat History gần nhất (Sliding Context Buffer N=10)
  const recentHistory = (chatHistory || []).slice(-10).map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text || '' }]
  }));

  const chat = model.startChat({
    history: recentHistory
  });

  // Lượt 1: Gửi tin nhắn của người dùng tới Gemini
  const response1 = await chat.sendMessage(userMessage);
  const functionCalls = response1.response.functionCalls();

  // Nếu Gemini không yêu cầu gọi Tool nào, trả về trực tiếp kết quả
  if (!functionCalls || functionCalls.length === 0) {
    return {
      text: response1.response.text(),
      isFallback: false,
      toolsUsed: []
    };
  }

  // Lượt 2: Có yêu cầu gọi Function Calling Tool
  const toolsUsed = [];
  const functionResponses = [];

  for (const call of functionCalls) {
    const toolName = call.name;
    const toolArgs = call.args;
    toolsUsed.push({ name: toolName, args: toolArgs });

    console.log(`🤖 [Gemini Function Calling] Đang kích hoạt tool: ${toolName}`, toolArgs);

    // Thực thi Tool qua Dispatcher (có kiểm tra RBAC)
    const toolExecutionResult = await dispatchToolExecution(toolName, toolArgs, userContext, db);

    functionResponses.push({
      functionResponse: {
        name: toolName,
        response: toolExecutionResult
      }
    });
  }

  // Gửi kết quả Tool về lại Gemini để tổng hợp câu trả lời tự nhiên
  const response2 = await chat.sendMessage(functionResponses);

  return {
    text: response2.response.text(),
    isFallback: false,
    toolsUsed: toolsUsed
  };
}

/**
 * Rule-Based NLU Fallback Engine (Graceful Degradation khi mất mạng hoặc hết Quota)
 */
async function executeLocalRuleMatcher(message, userContext, db, reason) {
  const lower = message.toLowerCase();

  // 1. Kiểm tra quyền truy cập Doanh thu
  if (/doanh thu|thu nhập|tài chính|lợi nhuận|báo cáo tiền/i.test(lower)) {
    if (userContext.role !== 'admin') {
      return {
        text: '🔒 **Truy cập bị từ chối:** Dữ liệu doanh thu và thống kê tài chính chỉ dành riêng cho Ban Quản trị. Quý khách vui lòng tra cứu lịch sân hoặc liên hệ lễ tân để được hỗ trợ.',
        isFallback: true,
        fallbackReason: reason
      };
    }

    // Admin hỏi doanh thu -> Truy vấn DB cục bộ
    const revenueReport = await dispatchToolExecution('generate_revenue_report', {}, userContext, db);
    return {
      text: `📊 **BÁO CÁO DOANH THU NHANH (FALLBACK ENGINE)**\n\n` +
            `- **Tổng doanh thu:** ${revenueReport.totalRevenueFormatted}\n` +
            `- **Tổng số lượt đặt:** ${revenueReport.totalOrders} lượt\n` +
            `- **Tỷ lệ lấp đầy ước tính:** ${revenueReport.occupancyRate}\n\n` +
            `*(Dữ liệu được trích xuất trực tiếp từ CSDL nội bộ do Gemini API đang bận hoặc chờ kết nối).*`,
      isFallback: true,
      fallbackReason: reason,
      data: revenueReport
    };
  }

  // 2. Tra cứu sân trống / Khung giờ
  if (/trống|còn sân|lịch|đặt sân|chỗ/i.test(lower)) {
    const availability = await dispatchToolExecution('get_available_courts', {
      date: new Date().toISOString().split('T')[0],
      start_time: '17:30',
      end_time: '19:00'
    }, userContext, db);

    if (availability.courts && availability.courts.length > 0) {
      let courtList = availability.courts.map((c, i) => 
        `${i + 1}. **${c.tenSan}** (${c.loaiSan}) - Giá: \`${c.giaTienGioFormatted}\``
      ).join('\n');

      return {
        text: `🟢 **DANH SÁCH SÂN CÒN TRỐNG TỐI NAY (17:30 - 19:00):**\n\n${courtList}\n\n👉 Bạn muốn đặt sân nào? Hãy gõ *"Đặt sân [Tên sân]"* hoặc chọn trực tiếp trên giao diện nhé!`,
        isFallback: true,
        fallbackReason: reason,
        actionCard: {
          title: availability.courts[0].tenSan,
          price: availability.courts[0].giaTienGioFormatted,
          tags: [availability.courts[0].loaiSan, 'Còn trống']
        }
      };
    } else {
      return {
        text: `⚠️ Các sân trong khung giờ cao điểm hiện đã kín. Gợi ý bạn chọn khung giờ sau 20:30 để có giá ưu đãi hơn!`,
        isFallback: true,
        fallbackReason: reason
      };
    }
  }

  // 3. Tra cứu giá tiền / bảng giá
  if (/giá|bao nhiêu|tiền|chi phí|bảng giá/i.test(lower)) {
    return {
      text: `🏷️ **BẢNG GIÁ NIÊM YẾT SÂN THỂ THAO:**\n\n` +
            `1. **Sân Tập B2 (Sân 5 người):** 150.000 VNĐ/giờ\n` +
            `2. **Sân Trung Tâm A1 (Sân 7 người):** 250.000 VNĐ/giờ\n` +
            `3. **Sân VIP C3 (Sân 7 người cỏ nhân tạo):** 300.000 VNĐ/giờ\n\n` +
            `*(Miễn phí nước lọc và bóng thi đấu tiêu chuẩn)*`,
      isFallback: true,
      fallbackReason: reason
    };
  }

  // 4. Tư vấn ghép đội / Khác
  return {
    text: `Chào bạn! Tôi là **SportAI Assistant**.\nTôi có thể hỗ trợ bạn:\n` +
          `- Tra cứu lịch sân trống hôm nay và ngày mai\n` +
          `- Xem chi tiết bảng giá các sân 5 và sân 7\n` +
          `- Tư vấn đặt sân phù hợp theo số lượng người\n\n` +
          `Bạn muốn kiểm tra sân lúc mấy giờ?`,
    isFallback: true,
    fallbackReason: reason
  };
}

module.exports = {
  processChatMessage,
  executeGeminiAgenticLoop,
  executeLocalRuleMatcher
};
