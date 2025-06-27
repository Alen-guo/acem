const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

const app = express();

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

// 数据库连接
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://alenguo7578:0WPYi4Ct3M4I1zX2@cluster0.unsthar.mongodb.net/acrm?retryWrites=true&w=majority';

// 设置Mongoose缓冲选项
mongoose.set('bufferCommands', false);

mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  family: 4
})
.then(() => console.log('✅ MongoDB Atlas 云数据库连接成功'))
.catch(err => {
  console.error('❌ MongoDB 连接失败:', err);
  // 如果云数据库连接失败，尝试本地数据库
  console.log('🔄 尝试连接本地数据库...');
  mongoose.connect('mongodb://localhost:27017/acrm', {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    family: 4
  })
    .then(() => console.log('✅ 本地 MongoDB 连接成功'))
    .catch(localErr => console.error('❌ 本地数据库也连接失败:', localErr));
});

// 路由配置
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
    message: 'ACRM API 服务正常运行',
    timestamp: new Date().toISOString()
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 ACRM 服务器启动成功，端口: ${PORT}`);
  console.log(`📊 API 文档: http://localhost:${PORT}/api/health`);
}); 