# 🚀 ACRM 部署指南

## 📋 目录
1. [系统架构](#系统架构)
2. [数据存储方案](#数据存储方案)
3. [云服务器部署](#云服务器部署)
4. [数据库配置](#数据库配置)
5. [数据备份和迁移](#数据备份和迁移)
6. [监控和维护](#监控和维护)
7. [成本估算](#成本估算)

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (React)   │────│  后端 (Node.js)  │────│ 数据库 (MongoDB) │
│   部署在 Vercel  │    │  部署在云服务器   │    │   MongoDB Atlas │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 💾 数据存储方案

### 方案一：MongoDB Atlas (推荐)
- **优势**: 
  - 全托管服务，无需维护
  - 自动备份和恢复
  - 全球分布式部署
  - 免费套餐可用
- **成本**: 
  - 免费版：512MB存储
  - M10: ¥70/月 (2GB)
  - M20: ¥150/月 (8GB)

### 方案二：自建MongoDB
- **适用**: 对数据完全控制的场景
- **成本**: 服务器成本 + 运维成本
- **维护**: 需要自行备份、监控、优化

## 🚀 云服务器部署

### 推荐配置

#### 阿里云轻量应用服务器
```bash
# 基础配置
CPU: 2核
内存: 4GB
存储: 60GB SSD
带宽: 5Mbps
操作系统: Ubuntu 20.04

# 价格: ¥200-300/月
```

#### 腾讯云轻量服务器
```bash
# 基础配置  
CPU: 2核
内存: 4GB
存储: 80GB SSD
带宽: 6Mbps
操作系统: Ubuntu 20.04

# 价格: ¥180-280/月
```

### 服务器环境搭建

#### 1. 更新系统
```bash
sudo apt update && sudo apt upgrade -y
```

#### 2. 安装Node.js
```bash
# 安装Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node -v
npm -v
```

#### 3. 安装PM2进程管理器
```bash
sudo npm install -g pm2
```

#### 4. 安装Nginx (可选)
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 5. 配置防火墙
```bash
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw allow 5000    # 应用端口
sudo ufw enable
```

### 部署应用

#### 1. 克隆代码
```bash
cd /opt
sudo git clone <your-repo-url> acrm
sudo chown -R $USER:$USER /opt/acrm
cd /opt/acrm
```

#### 2. 安装依赖
```bash
# 后端依赖
cd server
npm install --production

# 前端构建
cd ../client
npm install
npm run build
```

#### 3. 配置环境变量
```bash
# 创建生产环境配置
cd /opt/acrm/server
cp .env.example .env

# 编辑配置文件
nano .env
```

#### 4. 启动应用
```bash
# 使用PM2启动
cd /opt/acrm/server
pm2 start app.js --name "acrm-server"
pm2 startup
pm2 save
```

## 🗄️ 数据库配置

### MongoDB Atlas 设置

#### 1. 创建集群
1. 访问 [MongoDB Atlas](https://cloud.mongodb.com)
2. 创建免费账户
3. 创建新集群 (选择免费M0)
4. 选择云服务商和区域 (推荐选择亚洲-新加坡)

#### 2. 配置网络访问
```bash
# 添加IP白名单
# 开发环境: 添加当前IP
# 生产环境: 添加服务器IP或0.0.0.0/0 (不推荐)
```

#### 3. 创建数据库用户
```bash
# 用户名: acrm-user
# 密码: 生成强密码
# 权限: Read and write to any database
```

#### 4. 获取连接字符串
```bash
# 格式: mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/acrm?retryWrites=true&w=majority
```

### 本地MongoDB (可选)

#### Ubuntu安装
```bash
# 导入公钥
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

# 添加源
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# 安装
sudo apt update
sudo apt install -y mongodb-org

# 启动服务
sudo systemctl start mongod
sudo systemctl enable mongod
```

## 📊 数据备份和迁移

### 使用内置数据管理工具

#### 备份数据
```bash
cd /opt/acrm/server
node scripts/data-management.js backup
```

#### 迁移到云数据库
```bash
# 迁移本地数据到Atlas
node scripts/data-management.js migrate "mongodb+srv://username:password@cluster.mongodb.net/acrm"
```

#### 定期备份脚本
```bash
# 创建定时任务
crontab -e

# 添加每日备份 (凌晨2点)
0 2 * * * cd /opt/acrm/server && node scripts/data-management.js backup && node scripts/data-management.js cleanup
```

### MongoDB Atlas 自动备份
- **连续备份**: 自动启用
- **时间点恢复**: 支持最近24小时内任意时间点
- **备份保留**: 免费版2天，付费版可定制

## 📈 监控和维护

### 应用监控

#### PM2 监控
```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs acrm-server

# 重启应用
pm2 restart acrm-server

# 查看资源使用
pm2 monit
```

#### 系统监控
```bash
# 安装htop
sudo apt install htop

# 监控磁盘使用
df -h

# 监控内存使用
free -h

# 监控网络连接
netstat -tulpn
```

### 日志管理

#### Nginx日志
```bash
# 访问日志
sudo tail -f /var/log/nginx/access.log

# 错误日志
sudo tail -f /var/log/nginx/error.log
```

#### 应用日志
```bash
# PM2日志
pm2 logs acrm-server --lines 100

# 系统日志
sudo journalctl -u mongod -f
```

## 💰 成本估算

### 方案一：阿里云 + MongoDB Atlas
| 组件 | 配置 | 月费用 |
|------|------|--------|
| 阿里云轻量服务器 | 2核4G | ¥250 |
| MongoDB Atlas | M10(2GB) | ¥70 |
| 域名SSL证书 | 基础版 | ¥20 |
| **总计** | | **¥340** |

### 方案二：腾讯云 + MongoDB Atlas
| 组件 | 配置 | 月费用 |
|------|------|--------|
| 腾讯云轻量服务器 | 2核4G | ¥230 |
| MongoDB Atlas | M10(2GB) | ¥70 |
| 域名SSL证书 | 基础版 | ¥20 |
| **总计** | | **¥320** |

### 方案三：Railway + MongoDB Atlas (推荐新手)
| 组件 | 配置 | 月费用 |
|------|------|--------|
| Railway部署 | Hobby计划 | $5 (¥35) |
| MongoDB Atlas | M0免费版 | ¥0 |
| Vercel前端托管 | 免费版 | ¥0 |
| **总计** | | **¥35** |

## 🚀 快速部署 (Railway)

### 1. 准备代码
```bash
# 创建railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### 2. 部署步骤
1. 注册 [Railway](https://railway.app) 账户
2. 连接GitHub仓库
3. 选择server目录部署
4. 配置环境变量
5. 部署完成

### 3. 环境变量配置
```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=your_mongodb_atlas_connection_string
FRONTEND_URL=your_vercel_frontend_url
JWT_SECRET=your_jwt_secret
```

## 🔒 安全配置

### SSL证书
```bash
# 使用Let's Encrypt免费证书
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
sudo certbot renew --dry-run
```

### 环境变量安全
- 永远不要将敏感信息提交到代码库
- 使用强密码和复杂的JWT密钥
- 定期轮换密钥和密码

### 网络安全
- 配置防火墙规则
- 使用SSH密钥认证
- 定期更新系统和依赖

## 📝 部署检查清单

- [ ] 服务器环境搭建完成
- [ ] 数据库连接测试成功
- [ ] 应用启动正常
- [ ] API接口测试通过
- [ ] 前端部署完成
- [ ] SSL证书配置
- [ ] 监控和日志配置
- [ ] 备份策略制定
- [ ] 域名解析配置
- [ ] 性能测试完成

## 🆘 故障排除

### 常见问题

#### 数据库连接失败
```bash
# 检查网络连接
ping cluster0.xxxxx.mongodb.net

# 检查防火墙设置
sudo ufw status

# 检查环境变量
echo $MONGODB_URI
```

#### 应用启动失败
```bash
# 查看详细错误
pm2 logs acrm-server --err

# 检查端口占用
sudo netstat -tulpn | grep :5000

# 手动启动测试
cd /opt/acrm/server
node app.js
```

#### 内存不足
```bash
# 增加swap空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

🎉 **部署完成后，你将拥有一个功能完整、安全可靠的ACRM信息管理系统！**

## 📞 技术支持

遇到部署问题？联系我们：
- 📧 技术支持：tech@acrm.com
- 💬 在线客服：https://acrm.com/support
- 📚 文档中心：https://docs.acrm.com

---

*祝您部署顺利！🎉* 

## 📋 部署概览

本指南将帮助你将ACRM系统部署到生产环境：
- **前端**: Vercel
- **后端**: Railway
- **数据库**: PlanetScale (MySQL)
- **文件存储**: Cloudinary (可选)

## 🗄️ 第一步：准备云数据库

### 推荐方案：PlanetScale (免费版支持1GB)

1. **注册PlanetScale账号**
   - 访问 https://planetscale.com
   - 注册账号并验证邮箱

2. **创建数据库**
   ```bash
   # 数据库名称：acrm-prod
   # 区域：选择离用户最近的区域
   ```

3. **获取连接信息**
   - 点击"Connect" -> "Create password"
   - 复制连接字符串，格式类似：
   ```
   mysql://username:password@host.us-east-2.psdb.cloud/acrm-prod?sslaccept=strict
   ```

### 备选方案：Railway MySQL

1. 在Railway控制台添加MySQL服务
2. 获取数据库连接信息

## 🖥️ 第二步：配置后端环境变量

### 创建环境变战配置

在server目录创建 `.env` 文件：

```bash
# ACRM后端环境变量配置

# 服务器配置
NODE_ENV=production
PORT=3001

# 数据库配置 (PlanetScale MySQL)
DATABASE_URL=mysql://username:password@host.us-east-2.psdb.cloud/acrm-prod?sslaccept=strict

# 或者分别配置 (如果使用Railway MySQL)
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=3306
DB_NAME=railway
DB_USER=root
DB_PASSWORD=your_password

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=7d

# CORS配置
FRONTEND_URL=https://your-app.vercel.app

# 邮件配置 (可选)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🛠️ 第三步：修改数据库配置文件

✅ 已完成！数据库配置文件已自动支持生产环境。

## 🚂 第四步：部署后端到Railway

### 4.1 准备Railway账号
1. 访问 https://railway.app
2. 使用GitHub账号登录
3. 连接你的GitHub仓库

### 4.2 创建Railway项目
1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择你的ACRM仓库
4. 设置根目录为 `server`

### 4.3 配置环境变量
在Railway控制台的Variables标签页添加：

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=你的数据库连接字符串
JWT_SECRET=生成一个32位以上的随机字符串
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://你的前端域名.vercel.app
```

### 4.4 配置构建设置
在Railway项目设置中：
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Root Directory**: `server`

## 🌐 第五步：部署前端到Vercel

### 5.1 准备Vercel账号
1. 访问 https://vercel.com
2. 使用GitHub账号登录

### 5.2 创建Vercel项目
1. 点击 "New Project"
2. 选择你的ACRM仓库
3. 设置框架预设为 "Vite"
4. 设置根目录为 `client`

### 5.3 配置环境变量
在Vercel项目设置的Environment Variables中添加：

```bash
VITE_API_BASE_URL=https://你的railway后端域名.railway.app/api
```

### 5.4 配置构建设置
```bash
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Root Directory: client
```

## ⚙️ 第六步：配置CORS和域名

### 6.1 更新后端CORS配置

✅ CORS配置已经支持生产环境！会自动使用FRONTEND_URL环境变量。

### 6.2 添加生产环境安全中间件

安装安全中间件：

```bash
cd server
npm install helmet compression morgan
```

## 🔒 第七步：恢复认证系统

### 7.1 取消认证中间件的注释

在生产环境部署前，需要恢复用户认证：

1. 在 `server/routes/customers.js` 等路由文件中恢复认证中间件
2. 在前端恢复 `ProtectedRoute` 组件

### 7.2 生成JWT密钥

```bash
# 生成32位随机密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🚀 第八步：部署流程总结

### 8.1 部署检查清单

- [ ] 云数据库已创建并获取连接字符串
- [ ] Railway后端项目已创建并配置环境变量
- [ ] Vercel前端项目已创建并配置环境变量
- [ ] CORS配置正确（FRONTEND_URL指向Vercel域名）
- [ ] JWT密钥已生成并配置
- [ ] 认证系统已恢复（可选，稍后恢复）

### 8.2 部署顺序

1. **先部署数据库** → 获取连接字符串
2. **部署后端** → 获取API域名
3. **部署前端** → 配置API域名
4. **测试连接** → 检查前后端通信

## 🔍 第九步：健康检查和测试

### 9.1 后端健康检查

访问你的Railway域名：
```
https://你的项目名.railway.app/api/health
```

应该返回：
```json
{
  "status": "success",
  "message": "ACRM API 服务正常运行 - MySQL版本",
  "database": "MySQL",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 9.2 前端访问测试

访问你的Vercel域名，应该能正常打开应用。

### 9.3 数据库连接测试

在Railway控制台查看Logs，应该看到：
```
✅ MySQL 数据库连接成功 (生产环境)
📊 生产环境数据库表结构同步完成
```

## 🛠️ 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查DATABASE_URL是否正确
   - 确认数据库服务是否运行
   - 检查网络连接和防火墙

2. **CORS错误**
   - 确认FRONTEND_URL环境变量正确
   - 检查域名格式（包含协议 https://）

3. **API调用失败**
   - 检查VITE_API_BASE_URL是否正确
   - 确认后端服务正常运行

4. **环境变量不生效**
   - 重新部署服务
   - 检查变量名拼写
   - 确认变量值没有多余空格

### 调试命令

```bash
# 查看Railway部署日志
railway logs

# 查看Vercel部署日志
vercel logs

# 本地测试生产环境配置
NODE_ENV=production npm start
```

## 📊 监控和维护

### 性能监控

1. **Railway**: 内置监控面板
2. **Vercel**: Analytics 功能
3. **数据库**: PlanetScale内置监控

### 日志管理

- Railway自动收集应用日志
- 生产环境错误会显示在控制台
- 考虑集成第三方日志服务（如LogRocket）

## 🎯 部署完成后的下一步

1. **配置自定义域名**（可选）
2. **设置SSL证书**（Vercel和Railway自动配置）
3. **配置备份策略**
4. **设置监控告警**
5. **准备维护计划**

---

**🎉 恭喜！你的ACRM系统已成功部署到生产环境！**

如果遇到任何问题，请检查各平台的文档或寻求技术支持。 