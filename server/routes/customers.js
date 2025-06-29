const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
// const ContactRecord = require('../models/ContactRecord');
// const { authenticateUser } = require('../middleware/auth');

// 暂时跳过认证，方便开发调试
// router.use(authenticateUser);

// 模拟用户ID - 开发阶段使用
const MOCK_USER_ID = 1;

// 获取客户列表 - 支持筛选、搜索、分页
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      tags,
      cooperationStatus,
      priority,
      assignedSalesperson
    } = req.query;

    const whereClause = {};
    
    // 暂时不做权限控制
    // if (req.user.role === '销售员') {
    //   whereClause.assignedSalesperson = req.user._id;
    // }
    
    // 指定销售员筛选
    if (assignedSalesperson) {
      whereClause.assignedSalesperson = assignedSalesperson;
    }

    // 搜索功能 - 使用Sequelize的Op
    const { Op } = require('sequelize');
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { company: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    // 合作状态筛选
    if (cooperationStatus) {
      whereClause.cooperationStatus = cooperationStatus;
    }

    // 优先级筛选
    if (priority) {
      whereClause.priority = priority;
    }

    const offset = (page - 1) * limit;
    
    let customers = [];
    let total = 0;

    try {
      const result = await Customer.findAndCountAll({
        where: whereClause,
        order: [['updatedAt', 'DESC']],
        offset: offset,
        limit: parseInt(limit)
      });

      customers = result.rows;
      total = result.count;
    } catch (error) {
      console.warn('获取客户列表失败:', error.message);
      customers = [];
      total = 0;
    }

    res.json({
      status: 'success',
      data: Array.isArray(customers) ? customers : [],
      pagination: {
        current: parseInt(page),
        total: Math.ceil((total || 0) / limit),
        count: Array.isArray(customers) ? customers.length : 0,
        totalCount: total || 0
      }
    });
  } catch (error) {
    console.error('获取客户列表失败:', error);
    res.json({
      status: 'success',
      data: [],
      pagination: {
        current: parseInt(req.query.page || 1),
        total: 0,
        count: 0,
        totalCount: 0
      }
    });
  }
});

// 获取单个客户详情
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: '客户不存在'
      });
    }

    // 暂时跳过权限检查
    // if (req.user.role === '销售员' && customer.assignedSalesperson.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({
    //     status: 'error',
    //     message: '无权限查看此客户'
    //   });
    // }

    res.json({
      status: 'success',
      data: {
        customer,
        recentContacts: [] // 暂时返回空数组
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取客户详情失败',
      error: error.message
    });
  }
});

// 创建新客户
router.post('/', async (req, res) => {
  try {
    const customerData = {
      ...req.body,
      assignedSalesperson: req.body.assignedSalesperson || MOCK_USER_ID
    };

    const customer = await Customer.create(customerData);

    res.status(201).json({
      status: 'success',
      message: '客户创建成功',
      data: customer
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '创建客户失败',
      error: error.message
    });
  }
});

// 更新客户信息
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: '客户不存在'
      });
    }

    // 暂时跳过权限检查
    // if (req.user.role === '销售员' && customer.assignedSalesperson.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({
    //     status: 'error',
    //     message: '无权限修改此客户'
    //   });
    // }

    await customer.update(req.body);

    res.json({
      status: 'success',
      message: '客户更新成功',
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '更新客户失败',
      error: error.message
    });
  }
});

// 删除客户
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: '客户不存在'
      });
    }

    // 暂时跳过权限检查
    await customer.destroy();

    res.json({
      status: 'success',
      message: '客户删除成功'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '删除客户失败',
      error: error.message
    });
  }
});

// 获取客户统计数据
router.get('/stats/overview', async (req, res) => {
  try {
    const totalCustomers = await Customer.count();
    const highIntentionCustomers = await Customer.count({
      where: { cooperationIntention: { [require('sequelize').Op.gte]: 8 } }
    });

    res.json({
      status: 'success',
      data: {
        totalCustomers,
        newCustomersThisMonth: 0, // 暂时返回0
        highIntentionCustomers,
        totalExpectedValue: 0, // 暂时返回0
        statusDistribution: [],
        priorityDistribution: []
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取统计数据失败',
      error: error.message
    });
  }
});

module.exports = router; 