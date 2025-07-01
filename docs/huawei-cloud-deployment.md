# 华为云 ACRM 系统部署指南

## 方案概述
- **服务器**：华为云 Flexus L实例 2核2G3M（58元/年）
- **数据库**：自建MySQL（免费）
- **前端**：部署到服务器静态目录
- **总成本**：约58元/年（4.8元/月）

## 第一阶段：购买和配置服务器

### 1. 购买华为云服务器
1. 访问华为云官网，注册账号
2. 选择 **Flexus L实例-2核2G3M 1年**
3. 操作系统选择：**Ubuntu 20.04 LTS**
4. 地域选择：**华东-上海一**（国内访问速度快）
5. 完成购买，记录服务器公网IP

### 2. 配置安全组
在华为云控制台配置安全组规则：
```
入方向规则：
- HTTP：80端口，源地址 0.0.0.0/0
- HTTPS：443端口，源地址 0.0.0.0/0  
- SSH：22端口，源地址 0.0.0.0/0
- 自定义：3001端口，源地址 0.0.0.0/0（后端API）
- MySQL：3306端口，源地址 127.0.0.1/32（仅本机访问）
```

### 3. 连接服务器
```bash
# 使用SSH连接服务器（替换为您的实际IP）
ssh root@您的服务器IP

# 首次连接需要修改root密码
passwd root
```

## 第二阶段：安装基础环境

### 1. 更新系统
```bash
# 更新软件包列表
apt update && apt upgrade -y

# 安装基础工具
apt install -y curl wget git vim unzip
```

### 2. 安装Node.js
```bash
# 安装Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# 验证安装
node --version
npm --version
```

### 3. 安装MySQL
```bash
# 安装MySQL服务器
apt install -y mysql-server

# 启动MySQL服务
systemctl start mysql
systemctl enable mysql

# 安全配置MySQL
mysql_secure_installation
```

MySQL安全配置选项：
- 设置root密码：**选择一个强密码**
- 移除匿名用户：**Y**
- 禁止root远程登录：**Y**
- 移除test数据库：**Y**
- 重新加载权限表：**Y**

### 4. 配置MySQL数据库
```bash
# 登录MySQL
mysql -u root -p

# 在MySQL中执行以下命令：
CREATE DATABASE acrm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'acrmuser'@'localhost' IDENTIFIED BY '您的数据库密码';
GRANT ALL PRIVILEGES ON acrm.* TO 'acrmuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. 安装Nginx
```bash
# 安装Nginx
apt install -y nginx

# 启动Nginx
systemctl start nginx
systemctl enable nginx

# 检查状态
systemctl status nginx
```

## 第三阶段：部署后端代码

### 1. 上传代码到服务器
```bash
# 在服务器上创建项目目录
mkdir -p /var/www/acrm
cd /var/www/acrm

# 方式1：使用git克隆（如果代码在git仓库）
git clone 您的代码仓库地址 .

# 方式2：手动上传（在本地执行）
# scp -r ./server root@您的服务器IP:/var/www/acrm/
# scp -r ./client root@您的服务器IP:/var/www/acrm/
```

### 2. 配置后端环境变量
```bash
# 在服务器上创建环境变量文件
cd /var/www/acrm/server
cat > .env << EOF
NODE_ENV=production
PORT=3001

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=acrm
DB_USER=acrmuser
DB_PASSWORD=您的数据库密码

# JWT配置
JWT_SECRET=您的JWT密钥（建议32位随机字符串）

# 其他配置
FRONTEND_URL=http://您的服务器IP
EOF
```

### 3. 安装后端依赖
```bash
cd /var/www/acrm/server
npm install --production
```

### 4. 安装PM2进程管理器
```bash
# 全局安装PM2
npm install -g pm2

# 创建PM2配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'acrm-backend',
    script: 'app.js',
    cwd: '/var/www/acrm/server',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/acrm-error.log',
    out_file: '/var/log/acrm-out.log',
    log_file: '/var/log/acrm-combined.log',
    time: true
  }]
};
EOF

# 启动应用
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 第四阶段：部署前端代码

### 1. 构建前端项目
```bash
cd /var/www/acrm/client

# 安装依赖
npm install

# 修改API地址配置
# 编辑 .env.production 文件
cat > .env.production << EOF
VITE_API_BASE_URL=http://您的服务器IP:3001/api
EOF

# 构建生产版本
npm run build
```

### 2. 配置Nginx
```bash
# 创建Nginx配置文件
cat > /etc/nginx/sites-available/acrm << EOF
server {
    listen 80;
    server_name 您的服务器IP;
    
    # 前端静态文件
    location / {
        root /var/www/acrm/client/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
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
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        root /var/www/acrm/client/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 启用站点
ln -s /etc/nginx/sites-available/acrm /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重启Nginx
systemctl reload nginx
```

## 第五阶段：数据库初始化

### 1. 运行数据库迁移
```bash
cd /var/www/acrm/server

# 如果有数据库迁移脚本，运行它
node scripts/migrate.js

# 或者手动创建表结构（如果需要）
mysql -u acrmuser -p acrm < database/schema.sql
```

## 第六阶段：测试和验证

### 1. 检查服务状态
```bash
# 检查PM2进程
pm2 status

# 检查Nginx状态
systemctl status nginx

# 检查MySQL状态
systemctl status mysql

# 查看应用日志
pm2 logs acrm-backend
```

### 2. 访问测试
1. 在浏览器访问：`http://您的服务器IP`
2. 检查前端页面是否正常加载
3. 测试API接口：`http://您的服务器IP/api/customers`
4. 测试数据库连接和CRUD操作

## 第七阶段：域名和SSL配置（可选）

### 1. 域名配置
如果您有域名，修改DNS解析指向服务器IP

### 2. SSL证书配置
```bash
# 安装Certbot
apt install -y certbot python3-certbot-nginx

# 申请SSL证书（替换为您的域名）
certbot --nginx -d 您的域名.com

# 设置自动续期
crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

## 维护和监控

### 1. 定期备份
```bash
# 创建备份脚本
cat > /root/backup.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
mysqldump -u acrmuser -p您的数据库密码 acrm > /root/backup/acrm_\$DATE.sql
tar -czf /root/backup/acrm_code_\$DATE.tar.gz /var/www/acrm
# 保留最近7天的备份
find /root/backup -name "*.sql" -mtime +7 -delete
find /root/backup -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /root/backup.sh
mkdir -p /root/backup

# 设置定时备份（每天凌晨2点）
crontab -e
# 添加：0 2 * * * /root/backup.sh
```

### 2. 监控脚本
```bash
# 创建监控脚本
cat > /root/monitor.sh << EOF
#!/bin/bash
# 检查服务状态
pm2 describe acrm-backend > /dev/null
if [ \$? -ne 0 ]; then
    echo "Backend service is down, restarting..."
    pm2 restart acrm-backend
fi

# 检查磁盘空间
DISK_USAGE=\$(df / | grep -vE '^Filesystem' | awk '{print \$5}' | sed 's/%//g')
if [ \$DISK_USAGE -gt 80 ]; then
    echo "Disk usage is above 80%: \$DISK_USAGE%"
fi
EOF

chmod +x /root/monitor.sh

# 设置定时监控（每5分钟）
crontab -e
# 添加：*/5 * * * * /root/monitor.sh
```

## 成本总结

- **服务器**：58元/年
- **域名**：约60元/年（可选）
- **SSL证书**：免费（Let's Encrypt）
- **总计**：58-118元/年

## 技术支持

如遇到问题，可以：
1. 查看应用日志：`pm2 logs acrm-backend`
2. 查看Nginx日志：`tail -f /var/log/nginx/error.log`
3. 查看MySQL日志：`tail -f /var/log/mysql/error.log`
4. 检查系统资源：`htop` 或 `free -h`

---

按照以上步骤，您就可以成功将ACRM系统部署到华为云服务器上了！ 