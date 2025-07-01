# ACRM系统腾讯云部署指南

## 📋 部署概览

- **前端**: 腾讯云静态网站托管 (免费额度)
- **后端**: 腾讯云轻量应用服务器 (24元/月起)
- **数据库**: 腾讯云数据库MySQL (19元/月起)
- **域名**: 腾讯云域名 (可选，约55元/年)

**总成本**: 约43-100元/月 (根据配置不同)

## 🎯 第一步：注册腾讯云账号

### 1.1 注册流程
1. 访问 https://cloud.tencent.com
2. 点击"免费注册"
3. 使用手机号或微信注册
4. 完成实名认证 (必须，需要身份证)

### 1.2 新用户福利
- 云服务器首年95元 (1核2G)
- 云数据库MySQL首年19元
- 静态网站托管免费额度
- 总计约114元/年

## 🗄️ 第二步：创建MySQL数据库

### 2.1 购买云数据库
1. 进入控制台 → 云数据库 → MySQL
2. 点击"立即购买"
3. 选择配置：
   ```
   地域: 选择离用户最近的地区
   数据库版本: MySQL 8.0
   架构: 单节点
   内存: 1GB (够用)
   硬盘: 25GB
   网络: 默认VPC
   ```
4. 购买时长：建议1年 (有优惠)

### 2.2 配置数据库
1. 等待实例创建完成 (约5-10分钟)
2. 点击实例名称进入详情页
3. 设置root密码
4. 在"数据库管理"中创建数据库：
   ```sql
   数据库名: acrm
   字符集: utf8mb4
   排序规则: utf8mb4_unicode_ci
   ```

### 2.3 配置安全组
1. 进入"安全组"标签
2. 编辑安全组规则
3. 添加规则：
   ```
   类型: MySQL(3306)
   来源: 0.0.0.0/0 (允许所有IP，后续可限制)
   策略: 允许
   ```

### 2.4 获取连接信息
```bash
# 连接信息示例
主机地址: cdb-xxxxxx.cd.tencentcdb.com
端口: 3306
用户名: root
密码: 你设置的密码
数据库名: acrm
```

## 🖥️ 第三步：部署后端到轻量应用服务器

### 3.1 购买轻量应用服务器
1. 进入控制台 → 轻量应用服务器
2. 点击"新建"
3. 选择配置：
   ```
   地域: 与数据库同地域
   镜像: Ubuntu 22.04 LTS
   套餐: 1核2G (24元/月)
   购买时长: 1年 (有优惠)
   ```

### 3.2 服务器初始化
等待服务器创建完成后：

1. **重置密码**
   - 在控制台点击"重置密码"
   - 设置root用户密码

2. **登录服务器**
   ```bash
   # 使用控制台的网页终端，或者本地SSH
   ssh root@服务器公网IP
   ```

3. **安装Node.js**
   ```bash
   # 更新系统
   apt update && apt upgrade -y
   
   # 安装Node.js (使用NodeSource官方源)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   apt-get install -y nodejs
   
   # 验证安装
   node --version
   npm --version
   ```

4. **安装PM2**
   ```bash
   npm install -g pm2
   ```

### 3.3 部署后端代码

1. **上传代码**
   ```bash
   # 方法1: 使用git (推荐)
   cd /var/www
   git clone https://github.com/你的用户名/acrm.git
   cd acrm/server
   
   # 方法2: 使用scp上传 (本地执行)
   scp -r ./server root@服务器IP:/var/www/acrm-server
   ```

2. **安装依赖**
   ```bash
   cd /var/www/acrm/server
   npm install --production
   ```

3. **配置环境变量**
   ```bash
   # 创建.env文件
   nano .env
   ```
   
   添加以下内容：
   ```bash
   NODE_ENV=production
   PORT=3001
   
   # 数据库配置
   DB_HOST=cdb-xxxxxx.cd.tencentcdb.com
   DB_PORT=3306
   DB_NAME=acrm
   DB_USER=root
   DB_PASSWORD=你的数据库密码
   
   # JWT配置
   JWT_SECRET=生成的32位随机字符串
   JWT_EXPIRES_IN=7d
   
   # CORS配置
   FRONTEND_URL=https://你的域名.com
   ```

4. **启动应用**
   ```bash
   # 使用PM2启动
   pm2 start app.js --name "acrm-server"
   
   # 设置开机自启
   pm2 startup
   pm2 save
   
   # 查看状态
   pm2 status
   ```

### 3.4 配置Nginx反向代理

1. **安装Nginx**
   ```bash
   apt install nginx -y
   ```

2. **配置Nginx**
   ```bash
   # 创建配置文件
   nano /etc/nginx/sites-available/acrm
   ```
   
   添加配置：
   ```nginx
   server {
       listen 80;
       server_name 你的域名.com;  # 或者使用服务器IP
       
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

3. **启用配置**
   ```bash
   ln -s /etc/nginx/sites-available/acrm /etc/nginx/sites-enabled/
   nginx -t  # 测试配置
   systemctl restart nginx
   systemctl enable nginx
   ```

## 🌐 第四步：部署前端到静态网站托管

### 4.1 开通静态网站托管
1. 进入控制台 → 云开发 → 静态网站托管
2. 开通服务 (有免费额度)
3. 创建环境

### 4.2 本地构建前端
```bash
# 在本地项目中
cd client

# 配置生产环境API地址
echo "VITE_API_BASE_URL=http://你的服务器IP/api" > .env.production

# 构建项目
npm run build
```

### 4.3 上传静态文件
1. 在静态网站托管控制台点击"文件管理"
2. 将`client/dist`目录下的所有文件上传
3. 或者使用腾讯云CLI工具：
   ```bash
   # 安装CLI
   npm install -g @cloudbase/cli
   
   # 登录
   tcb login
   
   # 部署
   tcb hosting deploy ./dist -e 你的环境ID
   ```

## 🔧 第五步：配置域名和SSL (可选)

### 5.1 购买域名
1. 进入控制台 → 域名注册
2. 搜索并购买域名 (约55元/年)
3. 完成域名实名认证

### 5.2 配置DNS解析
1. 进入控制台 → DNS解析
2. 添加记录：
   ```
   记录类型: A
   主机记录: @
   记录值: 你的服务器公网IP
   TTL: 600
   ```

### 5.3 配置SSL证书
1. 进入控制台 → SSL证书
2. 申请免费证书
3. 下载证书并配置到Nginx

## 💰 成本计算

### 基础配置 (适合个人项目)
```
轻量应用服务器 (1核2G): 24元/月
云数据库MySQL (1GB): 19元/月
静态网站托管: 免费额度内
域名 (可选): 55元/年
总计: 约43元/月 + 55元/年
```

### 进阶配置 (适合小型企业)
```
轻量应用服务器 (2核4G): 54元/月
云数据库MySQL (2GB): 42元/月
CDN加速: 约10元/月
域名: 55元/年
总计: 约106元/月 + 55元/年
```

## 🛠️ 运维和监控

### 日志查看
```bash
# 查看PM2日志
pm2 logs acrm-server

# 查看Nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 性能监控
1. 腾讯云控制台有内置监控
2. 可以设置告警规则
3. 推荐安装云监控Agent

### 备份策略
1. 数据库自动备份 (腾讯云提供)
2. 代码备份 (Git仓库)
3. 服务器快照 (定期创建)

## 🔍 故障排除

### 常见问题
1. **数据库连接失败**
   - 检查安全组配置
   - 确认数据库密码
   - 测试网络连通性

2. **服务器无法访问**
   - 检查防火墙设置
   - 确认Nginx配置
   - 查看PM2进程状态

3. **静态网站无法访问**
   - 检查文件上传是否完整
   - 确认域名解析
   - 查看控制台错误日志

### 调试命令
```bash
# 测试数据库连接
mysql -h 数据库地址 -P 3306 -u root -p

# 测试端口占用
netstat -tulpn | grep 3001

# 测试API接口
curl http://localhost:3001/api/health
```

---

**🎉 恭喜！你的ACRM系统已成功部署到腾讯云！**

这个方案的优势：
- ✅ 完全支持中国用户
- ✅ 访问速度快
- ✅ 成本可控
- ✅ 技术支持完善
- ✅ 支持微信/支付宝付款 