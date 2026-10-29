# Multi-stage Dockerfile cho SportAI Frontend Web App
# Stage 1: Build static assets với Node.js
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Phục vụ ứng dụng qua Nginx web server siêu nhẹ
FROM nginx:alpine

# Sao chép thư mục dist đã build vào thư mục phục vụ của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Cấu hình Nginx chuyển hướng SPA cho React Router
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
