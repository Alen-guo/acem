# 华为云 ACRM 前端部署指南

## 快速部署步骤

### 1. 本地构建前端

在项目根目录执行：

```bash
# 进入前端目录
cd client

# 创建生产环境配置文件
cat > .env.production << EOF
VITE_API_BASE_URL=http://您的服务器IP:3001/api
VITE_APP_TITLE=ACRM 客户关系管理系统
EOF

# 安装依赖
npm install

# 构建生产版本
npm run build
```

### 2. 上传到华为云服务器

```bash
# 替换为您的服务器IP
SERVER_IP="您的服务器IP"

# 在服务器上创建目录
ssh root@$SERVER_IP "mkdir -p /var/www/acrm/client"

# 上传构建文件
scp -r client/dist/* root@$SERVER_IP:/var/www/acrm/client/dist/
```

### 3. 配置 Nginx

在服务器上执行：

```bash
# 创建 Nginx 配置文件
cat > /etc/nginx/sites-available/acrm << EOF
server {
    listen 80;
    server_name 您的服务器IP;
    
    # 前端静态文件
    location / {
        root /var/www/acrm/client/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # 安全头
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
    }
    
    # 后端API代理
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/acrm/client/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 启用配置
ln -sf /etc/nginx/sites-available/acrm /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重启 Nginx
systemctl reload nginx
```

### 4. 验证部署

```bash
# 检查 Nginx 状态
systemctl status nginx

# 检查前端文件
ls -la /var/www/acrm/client/dist/

# 测试访问
curl -I http://您的服务器IP
```

## 使用自动化脚本

如果您想使用自动化脚本，可以：

```bash
# 给脚本执行权限
chmod +x scripts/huawei-frontend-deploy.sh

# 运行部署脚本
./scripts/huawei-frontend-deploy.sh 您的服务器IP
```

## 常见问题解决

### 1. 前端页面无法访问

检查 Nginx 配置：
```bash
nginx -t
systemctl status nginx
tail -f /var/log/nginx/error.log
```

### 2. API 接口无法访问

检查后端服务：
```bash
pm2 status
pm2 logs acrm-backend
```

### 3. 静态资源加载失败

检查文件权限：
```bash
chown -R www-data:www-data /var/www/acrm/client/dist
chmod -R 755 /var/www/acrm/client/dist
```

### 4. 跨域问题

确保 Nginx 配置中的 API 代理正确：
```nginx
location /api/ {
    proxy_pass http://localhost:3001/api/;
    # ... 其他配置
}
```

## 性能优化

### 1. 启用 Gzip 压缩

在 Nginx 配置中添加：
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

### 2. 浏览器缓存

静态资源已经配置了长期缓存，如需调整：
```nginx
location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. 安全配置

添加安全头：
```nginx
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

## 更新部署

当需要更新前端时：

```bash
# 1. 本地重新构建
cd client
npm run build

# 2. 上传新文件
scp -r dist/* root@您的服务器IP:/var/www/acrm/client/dist/

# 3. 清除浏览器缓存或强制刷新
```

## 监控和维护

### 1. 日志监控
```bash
# Nginx 访问日志
tail -f /var/log/nginx/access.log

# Nginx 错误日志
tail -f /var/log/nginx/error.log

# 应用日志
pm2 logs acrm-backend
```

### 2. 性能监控
```bash
# 查看系统资源
htop
free -h
df -h

# 查看网络连接
netstat -tulpn | grep :80
```

---

按照以上步骤，您就可以成功将 ACRM 前端应用部署到华为云服务器上了！ 