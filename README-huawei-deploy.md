# 华为云 ACRM 前端部署快速指南

## 🚀 一键部署

### 方法一：使用自动化脚本（推荐）

```bash
# 1. 给脚本执行权限
chmod +x scripts/huawei-frontend-deploy.sh

# 2. 运行部署脚本（替换为您的服务器IP）
./scripts/huawei-frontend-deploy.sh 您的服务器IP
```

### 方法二：手动部署

#### 步骤 1：本地构建
```bash
cd client

# 创建生产环境配置
cat > .env.production << EOF
VITE_API_BASE_URL=http://您的服务器IP:3001/api
VITE_APP_TITLE=ACRM 客户关系管理系统
EOF

# 安装依赖并构建
npm install
npm run build
```

#### 步骤 2：上传到服务器
```bash
# 替换为您的服务器IP
SERVER_IP="您的服务器IP"

# 上传文件
ssh root@$SERVER_IP "mkdir -p /var/www/acrm/client"
scp -r client/dist/* root@$SERVER_IP:/var/www/acrm/client/dist/
```

#### 步骤 3：配置 Nginx
```bash
# 在服务器上执行
ssh root@$SERVER_IP

# 创建 Nginx 配置
cat > /etc/nginx/sites-available/acrm << 'EOF'
server {
    listen 80;
    server_name 您的服务器IP;
    
    location / {
        root /var/www/acrm/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        root /var/www/acrm/client/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 启用配置
ln -sf /etc/nginx/sites-available/acrm /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

## 🔍 检查部署状态

```bash
# 使用检查脚本
./scripts/check-deployment.sh 您的服务器IP

# 或手动检查
ssh root@您的服务器IP "systemctl status nginx"
ssh root@您的服务器IP "ls -la /var/www/acrm/client/dist/"
```

## 🌐 访问应用

部署完成后，在浏览器中访问：
```
http://您的服务器IP
```

## 📝 更新部署

当需要更新前端时：

```bash
# 1. 重新构建
cd client
npm run build

# 2. 上传新文件
scp -r dist/* root@您的服务器IP:/var/www/acrm/client/dist/

# 3. 清除浏览器缓存
```

## 🛠️ 故障排除

### 常见问题

1. **前端页面无法访问**
   ```bash
   ssh root@您的服务器IP "nginx -t"
   ssh root@您的服务器IP "systemctl status nginx"
   ```

2. **API 接口无法访问**
   ```bash
   ssh root@您的服务器IP "pm2 status"
   ssh root@您的服务器IP "pm2 logs acrm-backend"
   ```

3. **静态资源加载失败**
   ```bash
   ssh root@您的服务器IP "chown -R www-data:www-data /var/www/acrm/client/dist"
   ```

### 查看日志

```bash
# Nginx 错误日志
ssh root@您的服务器IP "tail -f /var/log/nginx/error.log"

# 应用日志
ssh root@您的服务器IP "pm2 logs acrm-backend"
```

## 📋 部署清单

- [ ] 华为云服务器已购买并配置
- [ ] 安全组已开放 80、443、22、3001 端口
- [ ] 后端服务已部署并运行
- [ ] 数据库已配置并连接
- [ ] 前端代码已构建
- [ ] Nginx 已配置并重启
- [ ] 域名解析已配置（可选）
- [ ] SSL 证书已安装（可选）

## 💰 成本估算

- **服务器**：58元/年（华为云 Flexus L实例）
- **域名**：约60元/年（可选）
- **总计**：58-118元/年

---

🎉 **部署完成后，您就可以通过浏览器访问您的 ACRM 系统了！** 