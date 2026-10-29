/**
 * Email Service - Hệ thống SportAI
 * Gửi email xác thực mã OTP khôi phục mật khẩu (Hỗ trợ Gmail SMTP và Fallback Dev Logger)
 */

const nodemailer = require('nodemailer');

/**
 * Che một phần địa chỉ email để bảo mật thông tin (Ví dụ: admin@sportai.vn -> a***n@sportai.vn)
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [name, domain] = email.split('@');
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

/**
 * Gửi Email chứa Mã OTP 6 chữ số
 * @param {string} toEmail - Địa chỉ email người nhận
 * @param {string} recipientName - Tên người nhận
 * @param {string} otp - Mã OTP 6 chữ số
 * @returns {Promise<{ success: boolean, isSimulated: boolean, message?: string }>}
 */
async function sendOtpEmail(toEmail, recipientName, otp) {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 580px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0284c7, #00f2fe); padding: 28px 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 1px;">
          🏆 SportAI - Đặt Sân Thể Thao
        </h1>
        <p style="margin: 6px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
          Xác thực khôi phục mật khẩu tài khoản
        </p>
      </div>

      <!-- Body Content -->
      <div style="padding: 32px 28px; background-color: #1e293b;">
        <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1; margin-top: 0;">
          Xin chào <strong>${recipientName || 'Quý khách'}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
          Hệ thống SportAI nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email này.
          Vui lòng sử dụng mã xác thực OTP dưới đây để hoàn tất:
        </p>

        <!-- OTP Box -->
        <div style="margin: 28px 0; text-align: center;">
          <div style="display: inline-block; background: rgba(0, 242, 254, 0.1); border: 2px dashed #00f2fe; border-radius: 12px; padding: 14px 36px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #00f2fe; font-family: 'Courier New', monospace;">
              ${otp}
            </span>
          </div>
          <p style="margin: 10px 0 0; font-size: 13px; color: #38bdf8;">
            ⏱️ Mã xác thực có hiệu lực trong vòng <strong>5 phút</strong>
          </p>
        </div>

        <!-- Warning Note -->
        <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; border-radius: 6px; padding: 12px 16px; margin-top: 24px;">
          <p style="margin: 0; font-size: 13px; color: #fca5a5; line-height: 1.5;">
            🔒 <strong>Cảnh báo bảo mật:</strong> Tuyệt đối không cung cấp mã OTP này cho bất kỳ ai. Nhân viên SportAI không bao giờ yêu cầu cung cấp mã OTP của bạn. Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua thư.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding: 16px 24px; text-align: center; background-color: #0f172a; border-top: 1px solid rgba(255,255,255,0.06);">
        <p style="margin: 0; font-size: 12px; color: #64748b;">
          © ${new Date().getFullYear()} SportAI Inc. Tất cả quyền được bảo lưu.
        </p>
      </div>
    </div>
  `;

  // Nếu người dùng đã cung cấp cấu hình Gmail SMTP trong .env -> Gửi Email Thật 100%
  if (emailUser && emailPass && emailUser !== 'your_email@gmail.com') {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass
        }
      });

      const info = await transporter.sendMail({
        from: `"SportAI Support" <${emailUser}>`,
        to: toEmail,
        subject: `[SportAI] Mã OTP xác thực khôi phục mật khẩu: ${otp}`,
        text: `Chào ${recipientName}, Mã OTP SportAI của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`,
        html: htmlContent
      });

      console.log(`📧 [EMAIL SMTP] Đã gửi email OTP thật thành công tới ${toEmail} (MessageId: ${info.messageId})`);
      return { success: true, isSimulated: false, messageId: info.messageId };
    } catch (smtpErr) {
      console.warn(`⚠️ [EMAIL SMTP WARNING] Gửi qua Gmail SMTP thất bại (${smtpErr.message}). Chuyển sang mô phỏng Dev Logger:`);
    }
  }

  // Chế độ mô phỏng / Development Fallback (khi chưa cấu hình Gmail App Password)
  console.log('══════════════════════════════════════════════════════════════════');
  console.log(`📧 [EMAIL SERVICE - MÔ PHỎNG HỘP THƯ GMAIL]`);
  console.log(`   Người nhận : ${recipientName} <${toEmail}>`);
  console.log(`   Tiêu đề    : [SportAI] Mã OTP xác thực khôi phục mật khẩu`);
  console.log(`   MÃ OTP 6 SỐ: [ ${otp} ]`);
  console.log(`   Hiệu lực   : 5 phút`);
  console.log('══════════════════════════════════════════════════════════════════');

  return { success: true, isSimulated: true };
}

module.exports = {
  sendOtpEmail,
  maskEmail
};

