# ACRM系统腾讯云部署步骤清单

## 📅 部署时间安排
**预计总时间**: 2-3天
**建议安排**: 
- 第1天: 账号注册和服务购买
- 第2天: 数据库和后端部署
- 第3天: 前端部署和域名配置

---

## 🎯 第一天：账号准备和服务购买

### ✅ 步骤1: 注册腾讯云账号 (30分钟)
1. **访问腾讯云官网**
   - 地址: https://cloud.tencent.com
   - 点击"免费注册"

2. **注册方式选择**
   - 推荐：微信扫码注册 (最快)
   - 备选：手机号注册

3. **完成实名认证** (必须)
   - 准备身份证正反面照片
   - 个人认证即可
   - 审核时间: 1-10分钟

4. **领取新用户代金券**
   - 进入控制台后会自动弹出
   - 记得领取，可以抵扣费用

### ✅ 步骤2: 购买云数据库MySQL (15分钟)
1. **进入购买页面**
   ```
   控制台 → 云数据库 → MySQL → 立即购买
   ```

2. **选择配置**
   ```
   计费模式: 包年包月 (便宜)
   地域: 广州/上海/北京 (选离你最近的)
   数据库版本: MySQL 8.0
   架构: 单节点 (够用且便宜)
   内存: 1GB
   硬盘: 25GB
   网络: 私有网络VPC (默认)
   购买时长: 1年 (有折扣)
   ```

3. **记录重要信息**
   ```
   实例ID: cdb-xxxxxxx
   内网地址: 等待创建完成后获取
   ```

### ✅ 步骤3: 购买轻量应用服务器 (15分钟)
1. **进入购买页面**
   ```
   控制台 → 轻量应用服务器 → 新建
   ```

2. **选择配置**
   ```
   地域: 与数据库同地域
   镜像类型: 系统镜像
   操作系统: Ubuntu 22.04 LTS
   套餐: 通用型 1核2G (24元/月)
   购买时长: 1年 (有折扣)
   ```

3. **记录服务器信息**
   ```
   实例ID: lhins-xxxxxxx
   公网IP: 等待创建完成后获取
   ```

### 💰 第一天费用预算
```
云数据库MySQL (1年): 约228元
轻量应用服务器 (1年): 约288元
总计: 约516元/年 (约43元/月)
```

---

## 🗄️ 第二天：数据库配置和后端部署

### ✅ 步骤4: 配置MySQL数据库 (20分钟)
1. **等待实例创建完成**
   - 通常需要5-10分钟
   - 状态变为"运行中"

2. **设置数据库密码**
   ```
   点击实例ID → 账号管理 → root账号 → 重置密码
   设置强密码并记录
   ```

3. **创建业务数据库**
   ```
   数据库管理 → 创建数据库
   数据库名称: acrm
   字符集: utf8mb4
   排序规则: utf8mb4_unicode_ci
   ```

4. **配置安全组**
   ```
   数据安全性 → 安全组 → 配置安全组
   添加规则: 来源 0.0.0.0/0, 端口 3306
   ```

5. **获取连接信息**
   ```
   实例详情页面记录:
   内网地址: cdb-xxxxxxx.mysql.tencentcdb.com
   端口: 3306
   ```

### ✅ 步骤5: 配置轻量应用服务器 (30分钟)
1. **重置服务器密码**
   ```
   轻量应用服务器控制台 → 点击实例 → 重置密码
   设置root密码并重启实例
   ```

2. **登录服务器**
   ```bash
   # 使用控制台网页终端 (推荐)
   点击实例 → 登录 → 立即登录
   
   # 或使用本地SSH
   ssh root@你的服务器公网IP
   ```

3. **安装Node.js环境**
   ```bash
   # 更新系统
   apt update && apt upgrade -y
   
   # 安装Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   apt-get install -y nodejs
   
   # 验证安装
   node --version  # 应显示 v18.x.x
   npm --version   # 应显示 9.x.x
   ```

4. **安装必要工具**
   ```bash
   # 安装PM2 (进程管理)
   npm install -g pm2
   
   # 安装Nginx (反向代理)
   apt install nginx -y
   
   # 安装Git
   apt install git -y
   ```

### ✅ 步骤6: 部署后端代码 (30分钟)
1. **上传代码到服务器**
   ```bash
   # 创建项目目录
   mkdir -p /var/www
   cd /var/www
   
   # 克隆代码 (需要先推送到GitHub)
   git clone https://github.com/你的用户名/acrm.git
   cd acrm/server
   ```

2. **安装项目依赖**
   ```bash
   npm install --production
   ```

3. **配置环境变量**
   ```bash
   # 创建环境变量文件
   nano .env
   ```
   
   输入以下内容：
   ```bash
   NODE_ENV=production
   PORT=3001
   
   # 数据库配置 (替换为你的实际信息)
   DB_HOST=cdb-xxxxxxx.mysql.tencentcdb.com
   DB_PORT=3306
   DB_NAME=acrm
   DB_USER=root
   DB_PASSWORD=你设置的数据库密码
   
   # JWT配置 (生成32位随机字符串)
   JWT_SECRET=你的32位随机密钥
   JWT_EXPIRES_IN=7d
   
   # CORS配置 (暂时先用服务器IP)
   FRONTEND_URL=http://你的服务器公网IP
   ```

4. **启动后端服务**
   ```bash
   # 使用PM2启动应用
   pm2 start app.js --name "acrm-server"
   
   # 设置开机自启
   pm2 startup
   pm2 save
   
   # 查看运行状态
   pm2 status
   ```

5. **配置Nginx反向代理**
   ```bash
   # 创建Nginx配置文件
   nano /etc/nginx/sites-available/acrm
   ```
   
   输入配置：
   ```nginx
   server {
       listen 80;
       server_name 你的服务器公网IP;
       
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   启用配置：
   ```bash
   ln -s /etc/nginx/sites-available/acrm /etc/nginx/sites-enabled/
   nginx -t  # 测试配置
   systemctl restart nginx
   systemctl enable nginx
   ```

6. **测试后端部署**
   ```bash
   # 测试API健康检查
   curl http://localhost:3001/api/health
   
   # 测试通过Nginx访问
   curl http://你的服务器公网IP/api/health
   ```

---

## 🌐 第三天：前端部署和域名配置

### ✅ 步骤7: 开通静态网站托管 (15分钟)
1. **开通云开发服务**
   ```
   控制台 → 云开发 → 立即使用
   创建环境 → 选择空模板
   环境名称: acrm-prod
   ```

2. **开通静态网站托管**
   ```
   云开发控制台 → 静态网站托管 → 开通
   ```

### ✅ 步骤8: 构建和部署前端 (20分钟)
1. **本地配置生产环境**
   ```bash
   # 在本地项目的client目录下
   cd client
   
   # 创建生产环境配置
   echo "VITE_API_BASE_URL=http://你的服务器公网IP/api" > .env.production
   ```

2. **构建前端项目**
   ```bash
   npm run build
   ```

3. **上传静态文件**
   - 方法1: 使用控制台上传
     ```
     云开发控制台 → 静态网站托管 → 文件管理
     上传 client/dist 目录下的所有文件
     ```
   
   - 方法2: 使用CLI工具
     ```bash
     # 安装腾讯云CLI
     npm install -g @cloudbase/cli
     
     # 登录
     tcb login
     
     # 部署
     tcb hosting deploy ./dist -e 你的环境ID
     ```

### ✅ 步骤9: 配置域名 (可选，30分钟)
1. **购买域名**
   ```
   控制台 → 域名注册 → 搜索域名 → 购买
   价格: 约55元/年
   ```

2. **域名实名认证**
   ```
   域名管理 → 实名认证
   上传身份证信息
   ```

3. **配置DNS解析**
   ```
   控制台 → DNS解析 → 添加记录
   
   记录类型: A
   主机记录: @
   记录值: 你的服务器公网IP
   TTL: 600
   ```

4. **更新前端配置**
   ```bash
   # 更新API地址为域名
   echo "VITE_API_BASE_URL=http://你的域名.com/api" > .env.production
   
   # 重新构建和部署
   npm run build
   # 重新上传到静态网站托管
   ```

5. **更新后端CORS配置**
   ```bash
   # 在服务器上修改.env文件
   nano /var/www/acrm/server/.env
   
   # 修改FRONTEND_URL
   FRONTEND_URL=https://你的域名.com
   
   # 重启后端服务
   pm2 restart acrm-server
   ```

---

## 🔍 第四天：测试和优化

### ✅ 步骤10: 全面测试 (30分钟)
1. **后端API测试**
   ```bash
   curl http://你的域名.com/api/health
   ```

2. **前端访问测试**
   ```
   在浏览器访问你的静态网站托管域名
   测试各个功能页面
   ```

3. **数据库连接测试**
   ```bash
   # 在服务器上查看PM2日志
   pm2 logs acrm-server
   
   # 应该看到数据库连接成功的消息
   ```

### ✅ 步骤11: 性能优化 (可选)
1. **启用CDN加速**
   ```
   控制台 → CDN → 添加域名
   源站类型: 自有源
   源站地址: 静态网站托管域名
   ```

2. **配置SSL证书**
   ```
   控制台 → SSL证书 → 申请免费证书
   下载证书并配置到Nginx
   ```

---

## 📋 部署检查清单

### 必须完成项
- [ ] 腾讯云账号注册和实名认证
- [ ] 云数据库MySQL购买和配置
- [ ] 轻量应用服务器购买和配置
- [ ] 后端代码部署和运行
- [ ] 前端构建和部署
- [ ] API和前端访问测试通过

### 可选优化项
- [ ] 域名购买和配置
- [ ] SSL证书配置
- [ ] CDN加速配置
- [ ] 监控和告警设置

---

## 💡 重要提醒

### 🔑 密码和密钥管理
- 数据库密码要设置强密码
- JWT_SECRET要生成32位以上随机字符串
- 服务器root密码要妥善保管

### 🛡️ 安全注意事项
- 生产环境要启用认证系统
- 定期更新系统和依赖包
- 配置防火墙规则

### 💰 费用控制
- 新用户优惠约114元/年
- 后续续费约516元/年
- 可以设置余额告警

### 📞 遇到问题怎么办
1. 查看腾讯云官方文档
2. 联系腾讯云在线客服
3. 查看服务器和数据库日志
4. 检查安全组和网络配置

---

**🎉 完成部署后，你的ACRM系统就可以正式上线使用了！**

总成本: 约43元/月，性价比极高，访问速度快，完全满足商业使用需求。 