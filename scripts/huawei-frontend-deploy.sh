#!/bin/bash

# 华为云 ACRM 前端部署脚本
# 使用方法: ./huawei-frontend-deploy.sh [服务器IP]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查参数
if [ $# -eq 0 ]; then
    echo -e "${RED}错误: 请提供服务器IP地址${NC}"
    echo "使用方法: $0 <服务器IP>"
    exit 1
fi

SERVER_IP=$1
PROJECT_DIR="/var/www/acrm"

echo -e "${GREEN}开始部署 ACRM 前端应用到华为云服务器: $SERVER_IP${NC}"

# 第一步：本地构建前端
echo -e "${YELLOW}步骤 1: 本地构建前端应用...${NC}"
cd client

# 检查是否存在 .env.production 文件
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}创建生产环境配置文件...${NC}"
    cat > .env.production << EOF
VITE_API_BASE_URL=http://$SERVER_IP:3001/api
VITE_APP_TITLE=ACRM 客户关系管理系统
EOF
fi

# 安装依赖
echo "安装前端依赖..."
npm install

# 构建生产版本
echo "构建生产版本..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}前端构建成功！${NC}"
else
    echo -e "${RED}前端构建失败！${NC}"
    exit 1
fi

# 第二步：上传到服务器
echo -e "${YELLOW}步骤 2: 上传前端文件到服务器...${NC}"

# 创建远程目录
ssh root@$SERVER_IP "mkdir -p $PROJECT_DIR/client"

# 上传构建文件
echo "上传 dist 目录..."
scp -r dist/* root@$SERVER_IP:$PROJECT_DIR/client/dist/

# 第三步：配置 Nginx
echo -e "${YELLOW}步骤 3: 配置 Nginx...${NC}"

# 创建 Nginx 配置文件
ssh root@$SERVER_IP "cat > /etc/nginx/sites-available/acrm << 'EOF'
server {
    listen 80;
    server_name $SERVER_IP;
    
    # 前端静态文件
    location / {
        root $PROJECT_DIR/client/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # 添加安全头
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection \"1; mode=block\";
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
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root $PROJECT_DIR/client/dist;
        expires 1y;
        add_header Cache-Control \"public, immutable\";
        add_header Vary Accept-Encoding;
    }
    
    # 安全配置
    location ~ /\. {
        deny all;
    }
    
    # 错误页面
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
}
EOF"

# 启用站点配置
ssh root@$SERVER_IP "
    # 备份默认配置
    if [ -f /etc/nginx/sites-enabled/default ]; then
        mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak
    fi
    
    # 启用 ACRM 配置
    ln -sf /etc/nginx/sites-available/acrm /etc/nginx/sites-enabled/
    
    # 测试配置
    nginx -t
    
    # 重启 Nginx
    systemctl reload nginx
"

# 第四步：验证部署
echo -e "${YELLOW}步骤 4: 验证部署...${NC}"

# 检查服务状态
echo "检查 Nginx 状态..."
ssh root@$SERVER_IP "systemctl status nginx --no-pager -l"

echo "检查前端文件..."
ssh root@$SERVER_IP "ls -la $PROJECT_DIR/client/dist/"

echo "检查 Nginx 配置..."
ssh root@$SERVER_IP "nginx -t"

echo -e "${GREEN}前端部署完成！${NC}"
echo -e "${GREEN}访问地址: http://$SERVER_IP${NC}"
echo -e "${YELLOW}如果遇到问题，请检查:${NC}"
echo "1. Nginx 日志: tail -f /var/log/nginx/error.log"
echo "2. 前端文件: ls -la $PROJECT_DIR/client/dist/"
echo "3. 防火墙设置: ufw status" 