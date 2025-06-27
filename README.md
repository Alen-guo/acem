# ACRM 信息管理系统

一个专注于销售人员使用的现代化信息管理工具，帮助销售团队更好地管理客户信息、跟踪合作意向、记录联系历史，并可视化客户关系网络。

## 🚀 项目特色

### 核心功能
- **客户信息管理** - 记录客户基本信息、特点、喜好和标签
- **关系网络管理** - 建立和维护客户间的关系网络
- **资源盘点** - 管理客户拥有的各类资源
- **合作意向跟踪** - 跟踪客户合作状态和意向程度
- **联系记录管理** - 详细记录每次客户联系的内容和结果
- **关系网络可视化** - 以图形化方式展示客户关系网络

### 技术亮点
- 🎨 **现代化界面** - 基于 Ant Design 的美观用户界面
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 🔐 **权限管理** - 基于角色的访问控制
- 📊 **数据分析** - 丰富的报表和统计功能
- 🌐 **国际化支持** - 多语言界面（中文/英文）
- ⚡ **高性能** - 优化的数据库查询和前端渲染

## 🛠️ 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **UI库**: Ant Design 5.x
- **状态管理**: Zustand + React Query
- **路由**: React Router DOM
- **构建工具**: Vite
- **样式**: CSS + Ant Design 主题

### 后端
- **运行环境**: Node.js
- **框架**: Express.js
- **数据库**: MongoDB + Mongoose
- **认证**: JWT (JSON Web Tokens)
- **安全**: Helmet + bcryptjs + 速率限制
- **工具**: dotenv + cors

### 部署
- **前端**: Vercel
- **后端**: Railway
- **数据库**: MongoDB Atlas

## 📦 快速开始

### 环境要求
- Node.js >= 16.0.0
- MongoDB >= 4.4.0
- npm 或 yarn

### 1. 克隆项目
```bash
git clone https://github.com/your-username/acrm.git
cd acrm
```

### 2. 安装依赖
```bash
# 安装根目录依赖
npm install

# 安装客户端依赖
cd client
npm install

# 安装服务端依赖
cd ../server
npm install
```

### 3. 配置环境变量

#### 服务端配置 (server/.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/acrm
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
BCRYPT_ROUNDS=10
```

#### 客户端配置 (client/.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=信息管理系统
```

### 4. 启动项目

#### 开发模式
```bash
# 启动服务端 (终端1)
cd server
npm run dev

# 启动客户端 (终端2)
cd client
npm run dev
```

#### 生产模式
```bash
# 构建客户端
cd client
npm run build

# 启动服务端
cd ../server
npm start
```

访问 http://localhost:3000 即可使用系统。

## 📋 系统功能

### 用户管理
- 用户注册和登录
- 个人资料管理
- 密码修改
- 权限控制（管理员/经理/销售员）

### 客户管理
- 客户信息录入和编辑
- 客户标签和分类
- 客户搜索和筛选
- 客户导入导出

### 联系记录
- 联系历史记录
- 多种联系方式支持
- 联系结果评估
- 下次跟进提醒

### 关系网络
- 客户关系建立
- 关系强度设置
- 网络图谱可视化
- 关系路径分析

### 资源管理
- 客户资源盘点
- 资源价值评估
- 资源可用性跟踪

### 报表分析
- 仪表板概览
- 销售统计报表
- 客户分析报告
- 个人业绩统计

## 🏗️ 项目结构

```
acrm/
├── client/                 # 前端应用
│   ├── public/            # 静态资源
│   │   ├── components/    # 通用组件
│   │   ├── pages/         # 页面组件
│   │   ├── store/         # 状态管理
│   │   ├── services/      # API 服务
│   │   ├── types/         # TypeScript 类型
│   │   └── utils/         # 工具函数
│   ├── package.json
│   └── vite.config.ts
├── server/                # 后端应用
│   ├── models/           # 数据模型
│   ├── routes/           # 路由定义
│   ├── middleware/       # 中间件
│   ├── utils/            # 工具函数
│   ├── package.json
│   └── app.js
├── docs/                 # 项目文档
├── .cursorrules         # 开发规范
└── README.md
```

## 🔧 开发指南

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 ESLint 和 Prettier 规范
- 组件使用 PascalCase 命名
- 文件使用 kebab-case 命名
- 变量使用 camelCase 命名

### 提交规范
```
feat: 新增功能
fix: 修复问题
docs: 文档更新
style: 代码格式修改
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

### API 设计
- RESTful 风格的接口设计
- 统一的响应格式
- 完善的错误处理
- JWT 认证机制

## 🚀 部署指南

### Vercel 部署（前端）
1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 设置构建命令: `cd client && npm run build`
4. 设置输出目录: `client/dist`
5. 配置环境变量

### Railway 部署（后端）
1. 在 Railway 中连接 GitHub 仓库
2. 选择 server 目录作为根目录
3. 配置环境变量
4. 部署应用

### MongoDB Atlas（数据库）
1. 创建 MongoDB Atlas 集群
2. 配置网络访问
3. 创建数据库用户
4. 获取连接字符串

## 📊 业务价值

### 目标市场
- 中小企业销售团队
- 海外市场开拓
- B2B 信息管理

### 核心价值
1. **提升效率** - 集中管理客户信息，减少信息查找时间
2. **增强关系** - 可视化客户网络，发现潜在商机
3. **科学决策** - 数据驱动的销售分析和预测
4. **规范流程** - 标准化的客户管理流程
5. **团队协作** - 共享客户资源和销售经验

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交变更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- 项目地址: https://github.com/your-username/acrm
- 问题反馈: https://github.com/your-username/acrm/issues
- 邮箱: your-email@example.com

## 🙏 致谢

感谢所有为这个项目贡献代码和建议的开发者！

---

⭐ 如果这个项目对你有帮助，请给它一个星标！ 