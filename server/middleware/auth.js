/**
 * 认证中间件
 * 用于验证用户身份和权限
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT密钥 - 应该从环境变量获取
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * JWT验证中间件
 * 验证请求头中的token
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: '访问令牌缺失或格式错误'
      });
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
    
    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 从数据库获取用户信息
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: '用户不存在或已被禁用'
      });
    }

    // 将用户信息添加到请求对象
    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    };
    
    next();
  } catch (error) {
    console.error('Token验证失败:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: '无效的访问令牌'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: '访问令牌已过期'
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: '认证服务器错误'
    });
  }
};

/**
 * 角色权限验证中间件
 * @param {Array} allowedRoles - 允许的角色列表
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: '未认证的请求'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: '权限不足'
      });
    }

    next();
  };
};

/**
 * 生成JWT token
 * @param {Object} user - 用户对象
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
    }
  );
};

/**
 * 开发环境临时认证中间件
 * 仅在开发模式下使用
 */
const developmentAuth = (req, res, next) => {
  if (process.env.NODE_ENV !== 'development') {
    return authenticateUser(req, res, next);
  }

  // 开发环境默认用户
  req.user = {
    _id: '507f1f77bcf86cd799439011',
    name: '开发用户',
    email: 'dev@example.com',
    role: 'admin',
    department: '开发部'
  };
  
  next();
};

module.exports = {
  authenticateUser,
  requireRole,
  generateToken,
  developmentAuth
}; 