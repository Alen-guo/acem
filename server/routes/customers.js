const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const ContactRecord = require('../models/ContactRecord');
const { authenticateUser } = require('../middleware/auth');

// 应用认证中间件
router.use(authenticateUser);

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

    const query = {};
    
    // 权限控制：普通销售员只能看到自己的客户
    if (req.user.role === '销售员') {
      query.assignedSalesperson = req.user._id;
    }
    
    // 指定销售员筛选
    if (assignedSalesperson && req.user.role !== '销售员') {
      query.assignedSalesperson = assignedSalesperson;
    }

    // 搜索功能
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // 标签筛选
    if (tags) {
      const tagArray = tags.split(',');
      query.tags = { $in: tagArray };
    }

    // 合作状态筛选
    if (cooperationStatus) {
      query.cooperationStatus = cooperationStatus;
    }

    // 优先级筛选
    if (priority) {
      query.priority = priority;
    }

    const skip = (page - 1) * limit;
    
    let customers = [];
    let total = 0;

    try {
      customers = await Customer.find(query)
        .populate('assignedSalesperson', 'fullName username')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      total = await Customer.countDocuments(query);
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
    const customer = await Customer.findById(req.params.id)
      .populate('assignedSalesperson', 'fullName username email')
      .populate('relationships.relatedCustomer', 'name company');

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: '客户不存在'
      });
    }

    // 权限检查
    if (req.user.role === '销售员' && customer.assignedSalesperson._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: '无权限查看此客户'
      });
    }

    // 获取最近的联系记录
    const recentContacts = await ContactRecord.find({ customer: req.params.id })
      .populate('salesperson', 'fullName')
      .sort({ contactDate: -1 })
      .limit(5);

    res.json({
      status: 'success',
      data: {
        customer,
        recentContacts
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
      assignedSalesperson: req.body.assignedSalesperson || req.user._id
    };

    const customer = new Customer(customerData);
    await customer.save();

    await customer.populate('assignedSalesperson', 'fullName username');

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
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: '客户不存在'
      });
    }

    // 权限检查
    if (req.user.role === '销售员' && customer.assignedSalesperson.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: '无权限修改此客户'
      });
    }

    Object.assign(customer, req.body);
    await customer.save();

    await customer.populate('assignedSalesperson', 'fullName username');

    res.json({
      status: 'success',
      message: '客户信息更新成功',
      data: customer
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '更新客户失败',
      error: error.message
    });
  }
});

// 删除客户
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: '客户不存在'
      });
    }

    // 权限检查 - 只有管理员和销售经理可以删除
    if (!['管理员', '销售经理'].includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: '无权限删除客户'
      });
    }

    // 删除相关联系记录
    await ContactRecord.deleteMany({ customer: req.params.id });
    
    await Customer.findByIdAndDelete(req.params.id);

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
    const query = {};
    
    // 权限控制
    if (req.user.role === '销售员') {
      query.assignedSalesperson = req.user._id;
    }

    // 确保即使没有数据也返回默认结构
    let stats;
    try {
      const result = await Customer.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            潜在客户: { $sum: { $cond: [{ $eq: ['$cooperationStatus', '潜在客户'] }, 1, 0] } },
            意向客户: { $sum: { $cond: [{ $eq: ['$cooperationStatus', '意向客户'] }, 1, 0] } },
            合作中: { $sum: { $cond: [{ $eq: ['$cooperationStatus', '合作中'] }, 1, 0] } },
            已成交: { $sum: { $cond: [{ $eq: ['$cooperationStatus', '已成交'] }, 1, 0] } },
            已流失: { $sum: { $cond: [{ $eq: ['$cooperationStatus', '已流失'] }, 1, 0] } },
            avgCooperationIntention: { $avg: '$cooperationIntention' },
            totalExpectedValue: { $sum: '$expectedValue' }
          }
        }
      ]);
      
      stats = result[0];
    } catch (aggregateError) {
      console.warn('统计聚合查询失败，返回默认数据:', aggregateError.message);
      stats = null;
    }

    // 返回默认数据结构
    const defaultStats = {
      totalCustomers: 0,
      潜在客户: 0,
      意向客户: 0,
      合作中: 0,
      已成交: 0,
      已流失: 0,
      avgCooperationIntention: 0,
      totalExpectedValue: 0
    };

    res.json({
      status: 'success',
      data: stats || defaultStats
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    // 即使出错也返回默认数据结构
    res.json({
      status: 'success',
      data: {
        totalCustomers: 0,
        潜在客户: 0,
        意向客户: 0,
        合作中: 0,
        已成交: 0,
        已流失: 0,
        avgCooperationIntention: 0,
        totalExpectedValue: 0
      }
    });
  }
});

module.exports = router; 