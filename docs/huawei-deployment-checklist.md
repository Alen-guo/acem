# 华为云部署清单

## 准备工作清单 ✅

### 第一天：购买和基础配置
- [ ] 注册华为云账号
- [ ] 购买 Flexus L实例-2核2G3M（58元/年）
- [ ] 选择 Ubuntu 20.04 LTS 系统
- [ ] 配置安全组（开放80、443、22、3001端口）
- [ ] 记录服务器公网IP地址
- [ ] SSH连接服务器并修改root密码

### 第二天：环境安装
- [ ] 更新系统：`apt update && apt upgrade -y`
- [ ] 安装Node.js 18.x LTS
- [ ] 安装MySQL服务器
- [ ] 配置MySQL安全设置
- [ ] 创建数据库和用户
- [ ] 安装Nginx

### 第三天：代码部署
- [ ] 上传代码到服务器 `/var/www/acrm/`
- [ ] 配置后端环境变量 `.env`
- [ ] 安装后端依赖 `npm install --production`
- [ ] 安装PM2进程管理器
- [ ] 启动后端服务

### 第四天：前端部署
- [ ] 配置前端API地址
- [ ] 构建前端项目 `npm run build`
- [ ] 配置Nginx反向代理
- [ ] 测试网站访问

## 关键命令速查表

### 服务器连接
```bash
ssh root@您的服务器IP
```

### MySQL配置
```sql
CREATE DATABASE acrm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'acrmuser'@'localhost' IDENTIFIED BY '您的密码';
GRANT ALL PRIVILEGES ON acrm.* TO 'acrmuser'@'localhost';
FLUSH PRIVILEGES;
```

### 环境变量配置
```bash
# /var/www/acrm/server/.env
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=acrm
DB_USER=acrmuser
DB_PASSWORD=您的数据库密码
JWT_SECRET=您的32位随机密钥
FRONTEND_URL=http://您的服务器IP
```

### PM2服务管理
```bash
pm2 start ecosystem.config.js  # 启动服务
pm2 status                     # 查看状态
pm2 logs acrm-backend         # 查看日志
pm2 restart acrm-backend      # 重启服务
```

### Nginx管理
```bash
nginx -t                      # 测试配置
systemctl reload nginx        # 重载配置
systemctl status nginx        # 查看状态
```

## 测试验证清单

### 基础服务测试
- [ ] 服务器SSH连接正常
- [ ] MySQL服务运行正常：`systemctl status mysql`
- [ ] Nginx服务运行正常：`systemctl status nginx`
- [ ] PM2后端进程运行正常：`pm2 status`

### 功能测试
- [ ] 前端页面访问：`http://您的服务器IP`
- [ ] API接口测试：`http://您的服务器IP/api/customers`
- [ ] 数据库连接测试
- [ ] 客户数据CRUD操作测试

## 常见问题解决

### 1. 前端页面无法访问
```bash
# 检查Nginx配置
nginx -t
# 查看Nginx错误日志
tail -f /var/log/nginx/error.log
```

### 2. API接口报错
```bash
# 查看后端日志
pm2 logs acrm-backend
# 检查后端进程状态
pm2 status
```

### 3. 数据库连接失败
```bash
# 测试数据库连接
mysql -u acrmuser -p acrm
# 检查MySQL服务状态
systemctl status mysql
```

### 4. 端口访问问题
- 检查华为云安全组配置
- 确认端口在安全组中已开放
- 检查服务器防火墙设置

## 维护操作

### 定期备份
```bash
# 数据库备份
mysqldump -u acrmuser -p acrm > backup_$(date +%Y%m%d).sql
# 代码备份
tar -czf acrm_backup_$(date +%Y%m%d).tar.gz /var/www/acrm
```

### 日志清理
```bash
# 清理PM2日志
pm2 flush
# 清理Nginx日志
truncate -s 0 /var/log/nginx/access.log
truncate -s 0 /var/log/nginx/error.log
```

### 系统更新
```bash
# 更新系统包
apt update && apt upgrade -y
# 重启服务
systemctl restart nginx
pm2 restart acrm-backend
```

## 成本预算

| 项目 | 费用 | 备注 |
|------|------|------|
| 华为云服务器 | 58元/年 | Flexus L实例 2核2G3M |
| 域名（可选） | 60元/年 | .com域名 |
| SSL证书 | 免费 | Let's Encrypt |
| **总计** | **58-118元/年** | 平均5-10元/月 |

## 联系支持

如果遇到问题：
1. 查看详细部署指南：`docs/huawei-cloud-deployment.md`
2. 检查系统日志和应用日志
3. 参考华为云官方文档
4. 联系技术支持

---

**预计部署时间**：2-4小时
**技术难度**：中等
**适用场景**：个人项目、小团队使用

祝您部署顺利！🚀 