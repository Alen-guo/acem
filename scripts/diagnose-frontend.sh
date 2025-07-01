#!/bin/bash

# 前端部署问题诊断脚本
# 使用方法: ./diagnose-frontend.sh [服务器IP]

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

echo -e "${BLUE}=== 前端部署问题诊断 ===${NC}"
echo -e "服务器IP: ${GREEN}$SERVER_IP${NC}"
echo ""

# 1. 检查 SSH 连接
echo -e "${YELLOW}1. 检查 SSH 连接...${NC}"
if ssh -o ConnectTimeout=5 root@$SERVER_IP "echo 'SSH连接正常'" 2>/dev/null; then
    echo -e "${GREEN}✓ SSH 连接正常${NC}"
else
    echo -e "${RED}✗ SSH 连接失败${NC}"
    echo "请检查："
    echo "  - 服务器IP是否正确"
    echo "  - SSH密钥是否配置"
    echo "  - 防火墙是否开放22端口"
    exit 1
fi
echo ""

# 2. 检查 Nginx 服务状态
echo -e "${YELLOW}2. 检查 Nginx 服务状态...${NC}"
ssh root@$SERVER_IP "
    echo 'Nginx 运行状态:'
    systemctl is-active nginx
    echo ''
    echo 'Nginx 启动状态:'
    systemctl is-enabled nginx
    echo ''
    echo 'Nginx 进程:'
    ps aux | grep nginx | grep -v grep
"

# 3. 检查 Nginx 配置
echo -e "${YELLOW}3. 检查 Nginx 配置...${NC}"
ssh root@$SERVER_IP "
    echo 'Nginx 配置测试:'
    nginx -t
    echo ''
    echo '启用的站点配置:'
    ls -la /etc/nginx/sites-enabled/
    echo ''
    echo 'ACRM 站点配置内容:'
    cat /etc/nginx/sites-available/acrm 2>/dev/null || echo '配置文件不存在'
"

# 4. 检查前端文件
echo -e "${YELLOW}4. 检查前端文件...${NC}"
ssh root@$SERVER_IP "
    echo '前端目录结构:'
    ls -la $PROJECT_DIR/client/ 2>/dev/null || echo '前端目录不存在'
    echo ''
    echo 'dist 目录内容:'
    ls -la $PROJECT_DIR/client/dist/ 2>/dev/null || echo 'dist 目录不存在'
    echo ''
    echo 'index.html 文件:'
    cat $PROJECT_DIR/client/dist/index.html 2>/dev/null | head -10 || echo 'index.html 不存在'
"

# 5. 检查端口监听
echo -e "${YELLOW}5. 检查端口监听...${NC}"
ssh root@$SERVER_IP "
    echo '80端口监听状态:'
    netstat -tulpn | grep :80 || echo '80端口未监听'
    echo ''
    echo '3001端口监听状态:'
    netstat -tulpn | grep :3001 || echo '3001端口未监听'
"

# 6. 检查防火墙
echo -e "${YELLOW}6. 检查防火墙设置...${NC}"
ssh root@$SERVER_IP "
    echo 'UFW 状态:'
    ufw status 2>/dev/null || echo 'UFW 未安装或未运行'
    echo ''
    echo 'iptables 规则:'
    iptables -L -n | grep -E '(80|443)' || echo '无相关防火墙规则'
"

# 7. 检查文件权限
echo -e "${YELLOW}7. 检查文件权限...${NC}"
ssh root@$SERVER_IP "
    echo '前端文件权限:'
    ls -la $PROJECT_DIR/client/dist/ 2>/dev/null || echo '无法访问前端文件'
    echo ''
    echo 'Nginx 用户:'
    ps aux | grep nginx | grep -v grep | head -1
"

# 8. 检查 Nginx 日志
echo -e "${YELLOW}8. 检查 Nginx 日志...${NC}"
ssh root@$SERVER_IP "
    echo '最近的错误日志:'
    tail -10 /var/log/nginx/error.log 2>/dev/null || echo '错误日志文件不存在'
    echo ''
    echo '最近的访问日志:'
    tail -5 /var/log/nginx/access.log 2>/dev/null || echo '访问日志文件不存在'
"

# 9. 本地测试 HTTP 访问
echo -e "${YELLOW}9. 测试 HTTP 访问...${NC}"
echo "测试 80 端口连接:"
if nc -z -w5 $SERVER_IP 80 2>/dev/null; then
    echo -e "${GREEN}✓ 80 端口可访问${NC}"
else
    echo -e "${RED}✗ 80 端口无法访问${NC}"
fi

echo "测试 HTTP 响应:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://$SERVER_IP 2>/dev/null || echo "000")
echo "HTTP 状态码: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ HTTP 访问正常${NC}"
elif [ "$HTTP_CODE" = "000" ]; then
    echo -e "${RED}✗ 无法连接到服务器${NC}"
else
    echo -e "${YELLOW}⚠ HTTP 状态码: $HTTP_CODE${NC}"
fi

# 10. 提供解决方案
echo ""
echo -e "${BLUE}=== 常见问题解决方案 ===${NC}"

echo -e "${YELLOW}如果前端文件不存在:${NC}"
echo "1. 在本地构建前端: cd client && npm run build"
echo "2. 上传文件: scp -r client/dist/* root@$SERVER_IP:/var/www/acrm/client/dist/"

echo -e "${YELLOW}如果 Nginx 配置错误:${NC}"
echo "1. 检查配置: ssh root@$SERVER_IP 'nginx -t'"
echo "2. 重启 Nginx: ssh root@$SERVER_IP 'systemctl reload nginx'"

echo -e "${YELLOW}如果端口未监听:${NC}"
echo "1. 启动 Nginx: ssh root@$SERVER_IP 'systemctl start nginx'"
echo "2. 检查防火墙: ssh root@$SERVER_IP 'ufw allow 80'"

echo -e "${YELLOW}如果文件权限问题:${NC}"
echo "1. 修复权限: ssh root@$SERVER_IP 'chown -R www-data:www-data /var/www/acrm/client/dist'"
echo "2. 设置权限: ssh root@$SERVER_IP 'chmod -R 755 /var/www/acrm/client/dist'"

echo ""
echo -e "${GREEN}诊断完成！请根据上述检查结果进行相应的修复。${NC}" 