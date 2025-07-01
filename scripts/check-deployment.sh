#!/bin/bash

# ACRM 部署状态检查脚本
# 使用方法: ./check-deployment.sh [服务器IP]

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

echo -e "${BLUE}=== ACRM 部署状态检查 ===${NC}"
echo -e "服务器IP: ${GREEN}$SERVER_IP${NC}"
echo ""

# 检查 SSH 连接
echo -e "${YELLOW}1. 检查 SSH 连接...${NC}"
if ssh -o ConnectTimeout=5 root@$SERVER_IP "echo 'SSH连接正常'" 2>/dev/null; then
    echo -e "${GREEN}✓ SSH 连接正常${NC}"
else
    echo -e "${RED}✗ SSH 连接失败${NC}"
    exit 1
fi
echo ""

# 检查系统服务
echo -e "${YELLOW}2. 检查系统服务状态...${NC}"
ssh root@$SERVER_IP "
    echo '=== Nginx 状态 ==='
    systemctl is-active nginx
    echo '=== MySQL 状态 ==='
    systemctl is-active mysql
    echo '=== PM2 状态 ==='
    pm2 status --no-daemon
"

# 检查前端文件
echo -e "${YELLOW}3. 检查前端文件...${NC}"
ssh root@$SERVER_IP "
    echo '前端文件列表:'
    ls -la $PROJECT_DIR/client/dist/ 2>/dev/null || echo '前端文件不存在'
    echo ''
    echo '前端文件大小:'
    du -sh $PROJECT_DIR/client/dist/ 2>/dev/null || echo '无法获取大小信息'
"

# 检查 Nginx 配置
echo -e "${YELLOW}4. 检查 Nginx 配置...${NC}"
ssh root@$SERVER_IP "
    echo 'Nginx 配置测试:'
    nginx -t
    echo ''
    echo '启用的站点:'
    ls -la /etc/nginx/sites-enabled/
"

# 检查端口监听
echo -e "${YELLOW}5. 检查端口监听状态...${NC}"
ssh root@$SERVER_IP "
    echo '监听端口:'
    netstat -tulpn | grep -E ':(80|443|3001|3306)'
"

# 检查磁盘空间
echo -e "${YELLOW}6. 检查系统资源...${NC}"
ssh root@$SERVER_IP "
    echo '磁盘使用情况:'
    df -h /
    echo ''
    echo '内存使用情况:'
    free -h
    echo ''
    echo 'CPU 负载:'
    uptime
"

# 检查应用日志
echo -e "${YELLOW}7. 检查应用日志...${NC}"
ssh root@$SERVER_IP "
    echo '最近的 Nginx 错误日志:'
    tail -5 /var/log/nginx/error.log 2>/dev/null || echo '无错误日志'
    echo ''
    echo '最近的 PM2 日志:'
    pm2 logs acrm-backend --lines 5 --nostream 2>/dev/null || echo '无 PM2 日志'
"

# 测试 HTTP 访问
echo -e "${YELLOW}8. 测试 HTTP 访问...${NC}"
echo "测试前端页面访问:"
if curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP | grep -q "200"; then
    echo -e "${GREEN}✓ 前端页面访问正常${NC}"
else
    echo -e "${RED}✗ 前端页面访问失败${NC}"
fi

echo "测试 API 接口访问:"
if curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP/api/customers | grep -q "200\|401\|403"; then
    echo -e "${GREEN}✓ API 接口访问正常${NC}"
else
    echo -e "${RED}✗ API 接口访问失败${NC}"
fi

echo ""
echo -e "${BLUE}=== 检查完成 ===${NC}"
echo -e "${GREEN}访问地址: http://$SERVER_IP${NC}"
echo -e "${YELLOW}如需查看详细日志，请使用:${NC}"
echo "  ssh root@$SERVER_IP 'tail -f /var/log/nginx/error.log'"
echo "  ssh root@$SERVER_IP 'pm2 logs acrm-backend'" 