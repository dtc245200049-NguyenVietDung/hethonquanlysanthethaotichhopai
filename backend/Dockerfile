# Multi-stage Dockerfile cho SportAI Backend Server
FROM node:20-alpine AS base

WORKDIR /app

# Sao chép file cấu hình dependencies
COPY package*.json ./

# Cài đặt dependencies (bao gồm cả devDependencies cho testing nếu cần)
RUN npm ci --only=production

# Sao chép mã nguồn ứng dụng
COPY . .

# Mở cổng 3000
EXPOSE 3000

# Biến môi trường mặc định
ENV NODE_ENV=production
ENV PORT=3000

# Lệnh khởi chạy server
CMD ["node", "server.js"]
