const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

const app = express();

// 全局 CORS 配置，放在所有中间件和路由之前
app.use(cors({
  origin: true, // 允许所有来源（开发环境）
  credentials: true,
}));

// 中间件配置
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', // Vite开发服务器
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// MySQL数据库连接
const { testConnection } = require('./config/database');

// 连接数据库
testConnection();

// 路由配置 - 暂时不使用认证中间件，方便开发调试
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/users', require('./routes/users'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/table-data', require('./routes/tableData'));

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'ACRM API 服务正常运行 - MySQL版本',
    database: 'MySQL',
    timestamp: new Date().toISOString(),
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    status: 'error',
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API 端点不存在'
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 ACRM 服务器启动成功，端口: ${PORT}`);
  console.log(`📊 API 文档: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  数据库: MySQL`);
}); 