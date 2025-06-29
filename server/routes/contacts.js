const express = require('express');
// const ContactRecord = require('../models/ContactRecord');
const Customer = require('../models/Customer');
// const authRoutes = require('./auth');
const router = express.Router();

// 暂时跳过认证，方便开发调试
// const { authenticateToken } = authRoutes;

/**
 * @route   GET /api/contacts
 * @desc    获取联系记录列表
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    // 暂时返回空数据，联系记录功能稍后实现
    res.json({
      status: 'success',
      message: '获取联系记录成功',
      data: {
        contacts: [],
        total: 0,
      },
      pagination: {
        current: parseInt(req.query.page || 1),
        total: 0,
        count: 0,
      },
    });
  } catch (error) {
    console.error('获取联系记录错误:', error);
    res.json({
      status: 'success',
      message: '获取联系记录成功',
      data: {
        contacts: [],
        total: 0,
      },
      pagination: {
        current: parseInt(req.query.page || 1),
        total: 0,
        count: 0,
      },
    });
  }
});

/**
 * @route   GET /api/contacts/:id
 * @desc    获取联系记录详情
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    res.json({
      status: 'success',
      message: '获取联系记录详情成功',
      data: null,
    });
  } catch (error) {
    console.error('获取联系记录详情错误:', error);
    res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
    });
  }
});

/**
 * @route   POST /api/contacts
 * @desc    创建联系记录
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    // 暂时返回成功响应
    res.status(201).json({
      status: 'success',
      message: '联系记录创建成功',
      data: { id: Date.now(), ...req.body },
    });
  } catch (error) {
    console.error('创建联系记录错误:', error);
    res.status(500).json({
      status: 'error',
      message: '创建联系记录失败',
    });
  }
});

/**
 * @route   GET /api/contacts/customer/:customerId
 * @desc    获取指定客户的联系记录
 * @access  Private
 */
router.get('/customer/:customerId', async (req, res) => {
  try {
    res.json({
      status: 'success',
      message: '获取客户联系记录成功',
      data: []
    });
  } catch (error) {
    console.error('获取客户联系记录错误:', error);
    res.status(500).json({
      status: 'error',
      message: '获取客户联系记录失败',
    });
  }
});

module.exports = router; 