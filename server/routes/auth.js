const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

/**
 * 生成 JWT Token
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * 验证 JWT Token 中间件
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: '访问令牌不存在',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: '用户不存在',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: '用户已被禁用',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: '访问令牌无效',
    });
  }
};

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'sales' } = req.body;

    // 验证必填字段
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: '请填写所有必填字段',
      });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 'error',
        message: '请输入有效的邮箱地址',
      });
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: '密码长度不能少于6位',
      });
    }

    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: '该邮箱已被注册',
      });
    }

    // 加密密码
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await user.save();

    // 生成 token
    const token = generateToken(user._id);

    // 返回用户信息（不包含密码）
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      status: 'success',
      message: '注册成功',
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: '请输入邮箱和密码',
      });
    }

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: '邮箱或密码错误',
      });
    }

    // 检查用户是否被禁用
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: '用户已被禁用',
      });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: '邮箱或密码错误',
      });
    }

    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();

    // 生成 token
    const token = generateToken(user._id);

    // 返回用户信息（不包含密码）
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      department: user.department,
      phone: user.phone,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };

    res.json({
      status: 'success',
      message: '登录成功',
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userResponse = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar,
      department: req.user.department,
      phone: req.user.phone,
      isActive: req.user.isActive,
      lastLogin: req.user.lastLogin,
      createdAt: req.user.createdAt,
    };

    res.json({
      status: 'success',
      message: '获取用户信息成功',
      data: userResponse,
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    更新用户信息
 * @access  Private
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, department, avatar } = req.body;
    const userId = req.user._id;

    // 验证姓名
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '姓名不能为空',
      });
    }

    // 更新用户信息
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name: name.trim(),
        phone,
        department,
        avatar,
        updatedAt: new Date(),
      },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在',
      });
    }

    res.json({
      status: 'success',
      message: '用户信息更新成功',
      data: updatedUser,
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
    });
  }
});

/**
 * @route   PUT /api/auth/password
 * @desc    修改密码
 * @access  Private
 */
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user._id;

    // 验证必填字段
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: '请输入当前密码和新密码',
      });
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: '新密码长度不能少于6位',
      });
    }

    // 获取用户（包含密码）
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在',
      });
    }

    // 验证当前密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: '当前密码错误',
      });
    }

    // 加密新密码
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // 更新密码
    await User.findByIdAndUpdate(userId, {
      password: hashedNewPassword,
      updatedAt: new Date(),
    });

    res.json({
      status: 'success',
      message: '密码修改成功',
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
    });
  }
});

// 导出认证中间件供其他路由使用
router.authenticateToken = authenticateToken;

module.exports = router; 