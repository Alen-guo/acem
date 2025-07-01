#!/bin/bash

# 前端部署问题快速修复脚本
# 使用方法: ./fix-frontend.sh [服务器IP]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查参数
if [ $# -eq 0 ]; then
    echo -e "${RED}错误: 请提供服务器IP地址${NC}"
    echo "使用方法: $0 <服务器IP>"
    exit 1
fi

SERVER_IP=$1
PROJECT_DIR="/var/www/acrm"

echo -e "${BLUE}=== 前端部署问题快速修复 ===${NC}"
echo -e "服务器IP: ${GREEN}$SERVER_IP${NC}"
echo ""

# 检查 SSH 连接
echo -e "${YELLOW}检查 SSH 连接...${NC}"
if ! ssh -o ConnectTimeout=5 root@$SERVER_IP "echo 'SSH连接正常'" 2>/dev/null; then
    echo -e "${RED}SSH 连接失败，请检查服务器IP和SSH配置${NC}"
    exit 1
fi
echo -e "${GREEN}✓ SSH 连接正常${NC}"
echo ""

# 1. 检查并修复前端文件
echo -e "${YELLOW}1. 检查前端文件...${NC}"
if ! ssh root@$SERVER_IP "test -f $PROJECT_DIR/client/dist/index.html" 2>/dev/null; then
    echo -e "${RED}前端文件不存在，需要重新部署${NC}"
    echo "请先运行: ./scripts/huawei-frontend-deploy.sh $SERVER_IP"
    exit 1
else
    echo -e "${GREEN}✓ 前端文件存在${NC}"
fi

# 2. 修复文件权限
echo -e "${YELLOW}2. 修复文件权限...${NC}"
ssh root@$SERVER_IP "
    chown -R www-data:www-data $PROJECT_DIR/client/dist/
    chmod -R 755 $PROJECT_DIR/client/dist/
    echo '文件权限已修复'
"

# 3. 检查并修复 Nginx 配置
echo -e "${YELLOW}3. 检查 Nginx 配置...${NC}"
ssh root@$SERVER_IP "
    if [ ! -f /etc/nginx/sites-available/acrm ]; then
        echo '创建 Nginx 配置文件...'
        cat > /etc/nginx/sites-available/acrm << 'EOF'
server {
    listen 80;
    server_name $SERVER_IP;
    
    # 前端静态文件
    location / {
        root $PROJECT_DIR/client/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # 安全头
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
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root $PROJECT_DIR/client/dist;
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }
}
EOF
        echo 'Nginx 配置文件已创建'
    else
        echo 'Nginx 配置文件已存在'
    fi
"

# 4. 启用 Nginx 配置
echo -e "${YELLOW}4. 启用 Nginx 配置...${NC}"
ssh root@$SERVER_IP "
    # 备份默认配置
    if [ -f /etc/nginx/sites-enabled/default ]; then
        mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak
    fi
    
    # 启用 ACRM 配置
    ln -sf /etc/nginx/sites-available/acrm /etc/nginx/sites-enabled/
    echo 'Nginx 配置已启用'
"

# 5. 测试 Nginx 配置
echo -e "${YELLOW}5. 测试 Nginx 配置...${NC}"
if ssh root@$SERVER_IP "nginx -t" 2>/dev/null; then
    echo -e "${GREEN}✓ Nginx 配置正确${NC}"
else
    echo -e "${RED}✗ Nginx 配置错误${NC}"
    ssh root@$SERVER_IP "nginx -t"
    exit 1
fi

# 6. 启动/重启 Nginx
echo -e "${YELLOW}6. 启动 Nginx 服务...${NC}"
ssh root@$SERVER_IP "
    systemctl start nginx
    systemctl enable nginx
    systemctl reload nginx
    echo 'Nginx 服务已启动'
"

# 7. 检查防火墙
echo -e "${YELLOW}7. 检查防火墙设置...${NC}"
ssh root@$SERVER_IP "
    # 检查 UFW
    if command -v ufw >/dev/null 2>&1; then
        ufw allow 80/tcp
        ufw allow 443/tcp
        echo 'UFW 防火墙规则已更新'
    fi
    
    # 检查 iptables
    iptables -C INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || iptables -A INPUT -p tcp --dport 80 -j ACCEPT
    iptables -C INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || iptables -A INPUT -p tcp --dport 443 -j ACCEPT
    echo 'iptables 规则已更新'
"

# 8. 检查服务状态
echo -e "${YELLOW}8. 检查服务状态...${NC}"
ssh root@$SERVER_IP "
    echo 'Nginx 状态:'
    systemctl is-active nginx
    echo ''
    echo '80端口监听:'
    netstat -tulpn | grep :80 || echo '80端口未监听'
    echo ''
    echo 'PM2 状态:'
    pm2 status --no-daemon 2>/dev/null || echo 'PM2 未运行'
"

# 9. 测试访问
echo -e "${YELLOW}9. 测试访问...${NC}"
echo "等待服务启动..."
sleep 3

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://$SERVER_IP 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ 前端访问正常！${NC}"
    echo -e "${GREEN}访问地址: http://$SERVER_IP${NC}"
elif [ "$HTTP_CODE" = "000" ]; then
    echo -e "${RED}✗ 无法连接到服务器${NC}"
    echo "请检查："
    echo "1. 服务器是否正常运行"
    echo "2. 防火墙是否开放80端口"
    echo "3. 华为云安全组是否配置正确"
else
    echo -e "${YELLOW}⚠ HTTP 状态码: $HTTP_CODE${NC}"
    echo "请检查 Nginx 错误日志:"
    ssh root@$SERVER_IP "tail -5 /var/log/nginx/error.log"
fi

echo ""
echo -e "${BLUE}=== 修复完成 ===${NC}"
echo -e "${YELLOW}如果仍有问题，请运行诊断脚本:${NC}"
echo "./scripts/diagnose-frontend.sh $SERVER_IP" 