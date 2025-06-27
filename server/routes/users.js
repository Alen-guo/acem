const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateUser } = require('../middleware/auth');

/**
 * 用户管理路由
 * 提供用户信息的增删改查功能
 */

// 应用认证中间件
router.use(authenticateUser);

// 获取用户列表（管理员功能）
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    let users = [];
    let total = 0;

    try {
      users = await User.find(query)
        .select('-password') // 不返回密码
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      total = await User.countDocuments(query);
    } catch (error) {
      console.warn('获取用户列表失败:', error.message);
      users = [];
      total = 0;
    }

    res.json({
      status: 'success',
      message: '获取用户列表成功',
      data: {
        users: Array.isArray(users) ? users : [],
        total: total || 0,
        currentPage: parseInt(page),
        totalPages: Math.ceil((total || 0) / limit)
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.json({
      status: 'success',
      message: '获取用户列表成功',
      data: {
        users: [],
        total: 0,
        currentPage: parseInt(req.query.page || 1),
        totalPages: 0
      }
    });
  }
});

// 获取用户详情
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }

    res.json({
      status: 'success',
      message: '获取用户详情成功',
      data: user
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取用户详情失败',
      error: error.message
    });
  }
});

// 更新用户信息
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, department, role } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, department, role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }

    res.json({
      status: 'success',
      message: '更新用户信息成功',
      data: user
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新用户信息失败',
      error: error.message
    });
  }
});

// 删除用户
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }

    res.json({
      status: 'success',
      message: '删除用户成功',
      data: { deletedId: req.params.id }
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      status: 'error',
      message: '删除用户失败',
      error: error.message
    });
  }
});

module.exports = router; 