# ACRM系统阿里云部署指南

## 📋 部署概览

- **前端**: 阿里云OSS静态网站托管 (免费额度)
- **后端**: 阿里云ECS轻量应用服务器 (30元/月起)
- **数据库**: 阿里云RDS MySQL (28元/月起)
- **域名**: 阿里云域名 (约55元/年)

**总成本**: 约58-120元/月 (根据配置不同)

## 🎯 第一步：注册阿里云账号

### 1.1 注册流程
1. 访问 https://www.aliyun.com
2. 点击"免费注册"
3. 使用手机号注册
4. 完成实名认证 (必须，需要身份证)

### 1.2 新用户福利
- ECS云服务器首年99元 (1核2G)
- RDS数据库首年28元 (1核1G)
- OSS存储免费额度
- 总计约127元/年

## 🗄️ 第二步：创建RDS MySQL数据库

### 2.1 购买RDS实例
1. 进入控制台 → 云数据库RDS → MySQL
2. 点击"创建实例"
3. 选择配置：
   ```
   地域: 华东1(杭州) 或就近地区
   数据库版本: MySQL 8.0
   系列: 基础版
   规格: 1核1GB (够用)
   存储: 20GB SSD
   网络: 专有网络VPC
   ```
4. 购买时长：建议1年 (有折扣)

### 2.2 配置数据库
1. 等待实例创建完成 (约5-10分钟)
2. 点击实例ID进入管理页面
3. 在"账号管理"中创建数据库账号：
   ```
   账号名称: acrm_user
   密码: 设置强密码
   账号类型: 普通账号
   授权数据库: acrm (需要先创建)
   ```

4. 在"数据库管理"中创建数据库：
   ```
   数据库名称: acrm
   字符集: utf8mb4
   排序规则: utf8mb4_unicode_ci
   ```

### 2.3 配置白名单
1. 在"数据安全性"中点击"白名单设置"
2. 修改default分组，添加：
   ```
   0.0.0.0/0  # 允许所有IP访问(测试用)
   # 生产环境建议只添加ECS服务器的内网IP
   ```

### 2.4 获取连接信息
```bash
# 内网连接地址 (推荐)
内网地址: rm-xxxxxx.mysql.rds.aliyuncs.com
端口: 3306
数据库名: acrm
用户名: acrm_user
密码: 你设置的密码
```

## 🖥️ 第三步：部署后端到ECS服务器

### 3.1 购买ECS实例
1. 进入控制台 → 云服务器ECS
2. 点击"创建实例"
3. 选择配置：
   ```
   地域: 与RDS同地域
   实例规格: 突发性能实例 t5 (1核2G)
   镜像: Ubuntu 22.04 64位
   系统盘: 40GB 高效云盘
   网络: 专有网络 (与RDS同一个VPC)
   公网IP: 分配公网IPv4地址
   带宽: 1Mbps (够用)
   ```

### 3.2 配置安全组
1. 在ECS实例管理页面点击"安全组"
2. 点击安全组ID进入配置
3. 添加入方向规则：
   ```
   端口范围: 22/22 (SSH)
   授权对象: 0.0.0.0/0
   
   端口范围: 80/80 (HTTP)
   授权对象: 0.0.0.0/0
   
   端口范围: 443/443 (HTTPS)
   授权对象: 0.0.0.0/0
   ```

### 3.3 服务器初始化
1. **重置实例密码**
   - 在ECS管理页面点击"重置实例密码"
   - 设置root密码并重启实例

2. **SSH连接服务器**
   ```bash
   ssh root@ECS公网IP
   ```

3. **安装Node.js**
   ```bash
   # 更新系统
   apt update && apt upgrade -y
   
   # 安装Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   apt-get install -y nodejs
   
   # 安装构建工具
   apt-get install -y build-essential
   
   # 验证安装
   node --version
   npm --version
   ```

4. **安装PM2和Nginx**
   ```bash
   npm install -g pm2
   apt install nginx -y
   ```

### 3.4 部署应用代码
1. **克隆代码**
   ```bash
   cd /var/www
   git clone https://github.com/你的用户名/acrm.git
   cd acrm/server
   ```

2. **安装依赖**
   ```bash
   npm install --production
   ```

3. **配置环境变量**
   ```bash
   nano .env
   ```
   
   添加内容：
   ```bash
   NODE_ENV=production
   PORT=3001
   
   # 阿里云RDS配置
   DB_HOST=rm-xxxxxx.mysql.rds.aliyuncs.com
   DB_PORT=3306
   DB_NAME=acrm
   DB_USER=acrm_user
   DB_PASSWORD=你的数据库密码
   
   # JWT配置
   JWT_SECRET=生成的32位随机字符串
   JWT_EXPIRES_IN=7d
   
   # CORS配置
   FRONTEND_URL=https://你的域名.com
   ```

4. **启动应用**
   ```bash
   pm2 start app.js --name "acrm-server"
   pm2 startup
   pm2 save
   ```

### 3.5 配置Nginx
1. **创建Nginx配置**
   ```bash
   nano /etc/nginx/sites-available/acrm
   ```
   
   添加配置：
   ```nginx
   server {
       listen 80;
       server_name 你的域名.com;
       
       # API代理
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
       
       # 静态文件 (如果前端也部署在同一服务器)
       location / {
           root /var/www/acrm/client/dist;
           try_files $uri $uri/ /index.html;
       }
   }
   ```

2. **启用配置**
   ```bash
   ln -s /etc/nginx/sites-available/acrm /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   systemctl enable nginx
   ```

## 🌐 第四步：部署前端到OSS

### 4.1 开通OSS服务
1. 进入控制台 → 对象存储OSS
2. 点击"立即开通"
3. 创建Bucket：
   ```
   Bucket名称: acrm-frontend (全局唯一)
   地域: 与ECS同地域
   存储类型: 标准存储
   读写权限: 公共读
   ```

### 4.2 配置静态网站托管
1. 在Bucket管理页面点击"基础设置"
2. 找到"静态页面"，点击"设置"
3. 配置：
   ```
   默认首页: index.html
   默认404页: index.html (SPA应用)
   ```

### 4.3 构建并上传前端
1. **本地构建**
   ```bash
   cd client
   
   # 配置API地址
   echo "VITE_API_BASE_URL=http://你的ECS公网IP/api" > .env.production
   
   # 构建
   npm run build
   ```

2. **上传文件**
   - 方法1: 使用OSS控制台上传dist目录下的所有文件
   - 方法2: 使用阿里云CLI：
   ```bash
   # 安装CLI
   npm install -g @alicloud/cli
   
   # 配置CLI
   aliyun configure
   
   # 上传文件
   aliyun oss cp -r ./dist/ oss://acrm-frontend/
   ```

### 4.4 配置CDN加速 (可选)
1. 进入控制台 → CDN
2. 添加加速域名
3. 源站设置为OSS Bucket域名

## 🔧 第五步：配置域名

### 5.1 购买域名
1. 进入控制台 → 域名
2. 搜索并购买域名
3. 完成实名认证

### 5.2 配置DNS解析
1. 进入控制台 → 云解析DNS
2. 添加解析记录：
   ```
   # 后端API
   记录类型: A
   主机记录: api
   记录值: ECS公网IP
   
   # 前端 (如果使用OSS)
   记录类型: CNAME
   主机记录: www
   记录值: OSS Bucket域名
   ```

### 5.3 SSL证书
1. 进入控制台 → SSL证书
2. 购买免费证书
3. 申请并下载证书
4. 配置到Nginx

## 💰 成本对比

### 阿里云 vs 腾讯云
```
阿里云基础配置:
- ECS (1核2G): 30元/月
- RDS MySQL: 28元/月
- OSS: 基本免费
- 域名: 55元/年
总计: 58元/月 + 55元/年

腾讯云基础配置:
- 轻量服务器: 24元/月  
- 云数据库: 19元/月
- 静态托管: 免费
- 域名: 55元/年
总计: 43元/月 + 55元/年
```

**结论**: 腾讯云更便宜，阿里云生态更完善

## 🛠️ 运维管理

### 监控告警
1. 进入控制台 → 云监控
2. 创建报警规则：
   - CPU使用率 > 80%
   - 内存使用率 > 80%
   - 磁盘使用率 > 80%

### 日志管理
1. 安装日志服务SLS
2. 配置日志收集
3. 设置日志分析和告警

### 自动备份
1. RDS自动备份已启用
2. ECS创建快照策略
3. 代码备份到Git

## 🎯 选择建议

### 选择阿里云的情况：
- ✅ 需要企业级稳定性
- ✅ 预算充足 (58元/月以上)
- ✅ 需要完善的监控和运维工具
- ✅ 有复杂的业务需求

### 选择腾讯云的情况：
- ✅ 个人项目或小型企业
- ✅ 预算有限 (43元/月)
- ✅ 快速上线需求
- ✅ 微信生态集成

---

**🎉 阿里云部署完成！**

阿里云的优势：
- 🏢 企业级稳定性
- 📊 完善的监控体系
- 🛡️ 强大的安全防护
- 📞 7x24小时技术支持
- 🌐 全球节点覆盖 