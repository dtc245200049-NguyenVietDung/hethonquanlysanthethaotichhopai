/**
 * Cấu hình Gemini API & Khai báo Function Calling Tools
 * Tuân thủ quy chuẩn: .agents/skills/sport-ai-chatbot/SKILL.md
 */

// 1. Hàm tạo System Instruction động với Múi giờ Việt Nam (UTC+7) và RBAC Guardrail
function getSystemInstruction(role = 'customer') {
  const now = new Date();
  const vnTime = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);

  const todayIso = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);

  const rbacRule = role === 'admin'
    ? '3. Người dùng hiện tại có vai trò ADMIN. Khi người dùng hỏi doanh thu, báo cáo tài chính, hãy gọi tool "generate_revenue_report" để xuất dữ liệu.'
    : '3. RÀO CHẮN BẢO MẬT RBAC: Người dùng hiện tại là KHÁCH HÀNG (role: customer). Bạn TUYỆT ĐỐI KHÔNG ĐƯỢC cung cấp báo cáo doanh thu, số liệu tài chính hoặc hóa đơn. Nếu người dùng hỏi doanh thu, bạn PHẢI phản hồi từ chối lịch sự: "Rất tiếc, bạn không có quyền xem báo cáo doanh thu tài chính. Dữ liệu này chỉ dành riêng cho Quản trị viên sân."';

  return `Bạn là SportAI - Chuyên viên Tư vấn & Quản lý Đặt sân Thể thao Thông minh (Bóng đá, Cầu lông, Pickleball).
Thời gian thực hiện tại của hệ thống: ${vnTime} (Ngày hôm nay: ${todayIso}, Múi giờ Việt Nam UTC+7, Asia/Ho_Chi_Minh).

### VAI TRÒ & PHONG THÁI:
- Giao tiếp thân thiện, ngắn gọn, lịch sự, chuyên nghiệp bằng tiếng Việt chuẩn mực.
- Tuyệt đối trung thực với dữ liệu: Không tự bịa đặt lịch sân hoặc giá tiền; luôn kích hoạt Function Calling để lấy dữ liệu thực tế từ Database.

### NGUYÊN TẮC XỬ LÝ THỜI GIAN & TOOL USE:
1. Quy đổi từ ngữ thời gian tương đối ("hôm nay", "tối nay", "ngày mai", "tối mai", "cuối tuần") thành ngày cụ thể (YYYY-MM-DD) và khung giờ (HH:mm) dựa trên ngày hôm nay (${todayIso}) trước khi truyền vào tham số Tool.
2. Nếu người dùng chỉ nói chung chung như "sân 7 tối mai", hãy tự ngầm hiểu:
   - date: ngày mai tính từ ${todayIso}
   - start_time: "18:00", end_time: "19:30"
   - sport_type: "Bóng đá sân 7"
${rbacRule}

### ĐỊNH DẠNG TRẢ LỜI:
- Bảng biểu rõ ràng khi liệt kê các sân trống: Cột gồm [Tên Sân | Loại Sân | Khung Giờ | Giá Tiền | Đánh giá].
- Định dạng tiền tệ chuẩn tiếng Việt: ví dụ 250.000 VNĐ.
- Gợi ý hành động tiếp theo cho khách hàng (ví dụ: "Bạn có muốn đặt sân này không?").`;
}

// 2. Khai báo 4 Function Calling Tools chuẩn cho Gemini
const geminiToolsDefinition = [
  {
    functionDeclarations: [
      {
        name: "get_available_courts",
        description: "Tra cứu danh sách sân còn trống trong ngày và khung giờ cụ thể theo loại môn thể thao.",
        parameters: {
          type: "OBJECT",
          properties: {
            date: {
              type: "STRING",
              description: "Ngày cần kiểm tra theo định dạng YYYY-MM-DD (Ví dụ: 2026-10-28)."
            },
            start_time: {
              type: "STRING",
              description: "Giờ bắt đầu theo định dạng HH:mm (Ví dụ: 17:30 hoặc 18:00)."
            },
            end_time: {
              type: "STRING",
              description: "Giờ kết thúc theo định dạng HH:mm (Ví dụ: 19:00 hoặc 20:30)."
            },
            sport_type: {
              type: "STRING",
              description: "Loại môn thể thao hoặc quy mô sân.",
              enum: ["Bóng đá sân 5", "Bóng đá sân 7", "Cầu lông", "Pickleball", "Tất cả"]
            }
          },
          required: ["date", "start_time", "end_time"]
        }
      },
      {
        name: "get_court_details_and_pricing",
        description: "Lấy chi tiết cấu hình, loại sân, bảng giá theo khung giờ và trạng thái hoạt động của một sân cụ thể.",
        parameters: {
          type: "OBJECT",
          properties: {
            court_id: {
              type: "INTEGER",
              description: "ID định danh của sân thể thao (1, 2, 3...)."
            }
          },
          required: ["court_id"]
        }
      },
      {
        name: "recommend_booking_options",
        description: "Tư vấn và đề xuất các phương án đặt sân tối ưu nhất dựa trên số lượng người chơi, ngân sách và khung giờ mong muốn.",
        parameters: {
          type: "OBJECT",
          properties: {
            player_count: {
              type: "INTEGER",
              description: "Số lượng người tham gia trận đấu (Ví dụ: 10 người, 14 người)."
            },
            budget: {
              type: "NUMBER",
              description: "Ngân sách dự kiến tối đa (VNĐ) cho toàn bộ trận đấu."
            },
            preferred_time: {
              type: "STRING",
              description: "Khung giờ mong muốn hoặc mô tả thời gian (Ví dụ: 18:00 - 20:00)."
            },
            sport_type: {
              type: "STRING",
              description: "Môn thể thao ưu tiên (Bóng đá, Cầu lông, Pickleball)."
            }
          },
          required: ["player_count"]
        }
      },
      {
        name: "generate_revenue_report",
        description: "Xuất báo cáo thống kê doanh thu, tỷ lệ lấp đầy sân và danh sách hóa đơn thanh toán. CHỈ DÀNH CHO ADMIN.",
        parameters: {
          type: "OBJECT",
          properties: {
            start_date: {
              type: "STRING",
              description: "Ngày bắt đầu kỳ báo cáo theo chuẩn YYYY-MM-DD."
            },
            end_date: {
              type: "STRING",
              description: "Ngày kết thúc kỳ báo cáo theo chuẩn YYYY-MM-DD."
            },
            group_by: {
              type: "STRING",
              description: "Tiêu chí gom nhóm dữ liệu.",
              enum: ["day", "week", "month", "court"]
            },
            export_format: {
              type: "STRING",
              description: "Định dạng kết quả mong muốn.",
              enum: ["summary_table", "json_chart", "excel_download", "word_report"]
            }
          },
          required: ["start_date", "end_date", "group_by"]
        }
      }
    ]
  }
];

// Hàm lọc Tools theo vai trò (Lớp bảo vệ RBAC Lớp 1)
function getToolsForUserRole(role) {
  if (role === 'admin') {
    return geminiToolsDefinition;
  }
  // Nếu là Customer: Loại bỏ hoàn toàn tool generate_revenue_report khỏi danh sách khai báo gửi lên Gemini
  const customerDeclarations = geminiToolsDefinition[0].functionDeclarations.filter(
    tool => tool.name !== 'generate_revenue_report'
  );
  return [{ functionDeclarations: customerDeclarations }];
}

module.exports = {
  getSystemInstruction,
  geminiToolsDefinition,
  getToolsForUserRole
};
