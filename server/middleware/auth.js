/**
 * 认证中间件
 * 用于验证用户身份和权限
 */

// 临时认证中间件 - 开发阶段使用
const authenticateUser = (req, res, next) => {
  // 暂时跳过认证，直接设置默认用户
  // 生产环境需要实现真正的JWT认证
  req.user = {
    id: '507f1f77bcf86cd799439011',
    name: '默认用户',
    email: 'default@example.com'
  };
  
  next();
};

// JWT验证中间件（待实现）
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    // 开发阶段允许无token访问
    req.user = {
      id: '507f1f77bcf86cd799439011',
      name: '默认用户',
      email: 'default@example.com'
    };
    return next();
  }

  try {
    // TODO: 实现JWT验证逻辑
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded;
    
    // 暂时使用默认用户
    req.user = {
      id: '507f1f77bcf86cd799439011',
      name: '默认用户',
      email: 'default@example.com'
    };
    
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: '无效的访问令牌'
    });
  }
};

module.exports = {
  authenticateUser,
  verifyToken
}; 