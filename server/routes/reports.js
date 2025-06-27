const express = require('express');
const Customer = require('../models/Customer');
const ContactRecord = require('../models/ContactRecord');
const authRoutes = require('./auth');
const router = express.Router();

// 使用认证中间件
const { authenticateToken } = authRoutes;

/**
 * @route   GET /api/reports/dashboard
 * @desc    获取仪表板统计数据
 * @access  Private
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // 构建查询条件（销售员只能看自己的数据）
    const customerQuery = req.user.role === 'sales' ? 
      { assignedSalesperson: req.user._id } : {};

    // 基础统计 - 添加错误处理
    let totalCustomers = 0;
    let highIntentionCustomers = 0;
    let totalExpectedValue = 0;
    let totalContacts = 0;
    let recentContacts = [];
    let cooperationStatusStats = [];

    try {
      totalCustomers = await Customer.countDocuments(customerQuery);
    } catch (error) {
      console.warn('获取客户总数失败:', error.message);
    }

    try {
      highIntentionCustomers = await Customer.countDocuments({
        ...customerQuery,
        cooperationIntention: { $gte: 8 }
      });
    } catch (error) {
      console.warn('获取高意向客户数失败:', error.message);
    }

    // 预期总价值
    try {
      const valueAggregation = await Customer.aggregate([
        { $match: customerQuery },
        {
          $group: {
            _id: null,
            totalExpectedValue: { $sum: '$expectedValue' }
          }
        }
      ]);
      totalExpectedValue = valueAggregation[0]?.totalExpectedValue || 0;
    } catch (error) {
      console.warn('获取预期总价值失败:', error.message);
    }

    // 联系次数统计
    try {
      let contactQuery = {};
      if (req.user.role === 'sales') {
        const customerIds = await Customer.find({ assignedSalesperson: req.user._id })
          .select('_id');
        contactQuery.customer = { $in: customerIds.map(c => c._id) };
      }
      totalContacts = await ContactRecord.countDocuments(contactQuery);

      // 最近联系记录
      recentContacts = await ContactRecord.find(contactQuery)
        .populate('customer', 'name company')
        .sort({ date: -1 })
        .limit(5)
        .exec();
    } catch (error) {
      console.warn('获取联系记录统计失败:', error.message);
    }

    // 合作状态统计
    try {
      cooperationStatusStats = await Customer.aggregate([
        { $match: customerQuery },
        {
          $group: {
            _id: '$cooperationStatus',
            count: { $sum: 1 },
            totalValue: { $sum: '$expectedValue' }
          }
        },
        {
          $project: {
            status: '$_id',
            count: 1,
            totalValue: 1,
            _id: 0
          }
        }
      ]);
    } catch (error) {
      console.warn('获取合作状态统计失败:', error.message);
    }

    res.json({
      status: 'success',
      message: '获取仪表板数据成功',
      data: {
        totalCustomers,
        highIntentionCustomers,
        totalExpectedValue,
        totalContacts,
        recentContacts: Array.isArray(recentContacts) ? recentContacts : [],
        cooperationStatusStats: Array.isArray(cooperationStatusStats) ? cooperationStatusStats : []
      }
    });
  } catch (error) {
    console.error('获取仪表板数据错误:', error);
    // 返回默认数据结构
    res.json({
      status: 'success',
      message: '获取仪表板数据成功',
      data: {
        totalCustomers: 0,
        highIntentionCustomers: 0,
        totalExpectedValue: 0,
        totalContacts: 0,
        recentContacts: [],
        cooperationStatusStats: []
      }
    });
  }
});

/**
 * @route   GET /api/reports/sales
 * @desc    获取销售统计数据
 * @access  Private
 */
router.get('/sales', authenticateToken, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    // 构建日期范围
    let dateRange = {};
    if (dateFrom || dateTo) {
      if (dateFrom) dateRange.$gte = new Date(dateFrom);
      if (dateTo) dateRange.$lte = new Date(dateTo);
    } else {
      // 默认最近30天
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateRange.$gte = thirtyDaysAgo;
    }

    // 构建查询条件
    const customerQuery = req.user.role === 'sales' ? 
      { assignedSalesperson: req.user._id } : {};
    
    if (Object.keys(dateRange).length > 0) {
      customerQuery.createdAt = dateRange;
    }

    let monthlyCustomers = [];
    let contactMethodStats = [];
    let contactResultStats = [];
    let priorityStats = [];

    // 按月统计新增客户
    try {
      monthlyCustomers = await Customer.aggregate([
        { $match: customerQuery },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            totalValue: { $sum: '$expectedValue' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        },
        {
          $project: {
            month: {
              $concat: [
                { $toString: '$_id.year' },
                '-',
                {
                  $cond: {
                    if: { $lt: ['$_id.month', 10] },
                    then: { $concat: ['0', { $toString: '$_id.month' }] },
                    else: { $toString: '$_id.month' }
                  }
                }
              ]
            },
            customers: '$count',
            value: '$totalValue',
            _id: 0
          }
        }
      ]);
    } catch (error) {
      console.warn('获取月度客户统计失败:', error.message);
    }

    // 联系记录统计
    try {
      let contactQuery = {};
      if (req.user.role === 'sales') {
        const customerIds = await Customer.find({ assignedSalesperson: req.user._id })
          .select('_id');
        contactQuery.customer = { $in: customerIds.map(c => c._id) };
      }
      
      if (Object.keys(dateRange).length > 0) {
        contactQuery.date = dateRange;
      }

      // 按联系方式统计
      contactMethodStats = await ContactRecord.aggregate([
        { $match: contactQuery },
        {
          $group: {
            _id: '$method',
            count: { $sum: 1 },
            avgDuration: { $avg: '$duration' }
          }
        },
        {
          $project: {
            method: '$_id',
            count: 1,
            avgDuration: { $round: ['$avgDuration', 0] },
            _id: 0
          }
        }
      ]);

      // 按联系结果统计
      contactResultStats = await ContactRecord.aggregate([
        { $match: contactQuery },
        {
          $group: {
            _id: '$result',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            result: '$_id',
            count: 1,
            _id: 0
          }
        }
      ]);
    } catch (error) {
      console.warn('获取联系记录统计失败:', error.message);
    }

    // 客户优先级分布
    try {
      priorityStats = await Customer.aggregate([
        { $match: customerQuery },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 },
            totalValue: { $sum: '$expectedValue' }
          }
        },
        {
          $project: {
            priority: '$_id',
            count: 1,
            totalValue: 1,
            _id: 0
          }
        }
      ]);
    } catch (error) {
      console.warn('获取优先级统计失败:', error.message);
    }

    res.json({
      status: 'success',
      message: '获取销售统计成功',
      data: {
        monthlyTrends: Array.isArray(monthlyCustomers) ? monthlyCustomers : [],
        contactMethodStats: Array.isArray(contactMethodStats) ? contactMethodStats : [],
        contactResultStats: Array.isArray(contactResultStats) ? contactResultStats : [],
        priorityStats: Array.isArray(priorityStats) ? priorityStats : []
      }
    });
  } catch (error) {
    console.error('获取销售统计错误:', error);
    res.json({
      status: 'success',
      message: '获取销售统计成功',
      data: {
        monthlyTrends: [],
        contactMethodStats: [],
        contactResultStats: [],
        priorityStats: []
      }
    });
  }
});

/**
 * @route   GET /api/reports/customers
 * @desc    获取客户分析数据
 * @access  Private
 */
router.get('/customers', authenticateToken, async (req, res) => {
  try {
    // 构建查询条件
    const customerQuery = req.user.role === 'sales' ? 
      { assignedSalesperson: req.user._id } : {};

    // 客户来源统计
    const sourceStats = await Customer.aggregate([
      { $match: customerQuery },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          source: { $ifNull: ['$_id', '未知'] },
          count: 1,
          _id: 0
        }
      }
    ]);

    // 意向度分布
    const intentionStats = await Customer.aggregate([
      { $match: customerQuery },
      {
        $bucket: {
          groupBy: '$cooperationIntention',
          boundaries: [0, 3, 6, 8, 11],
          default: 'unknown',
          output: {
            count: { $sum: 1 },
            totalValue: { $sum: '$expectedValue' }
          }
        }
      },
      {
        $project: {
          range: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'unknown'] }, then: '未设置' },
                { case: { $lt: ['$_id', 3] }, then: '低意向(1-2)' },
                { case: { $lt: ['$_id', 6] }, then: '中意向(3-5)' },
                { case: { $lt: ['$_id', 8] }, then: '较高意向(6-7)' },
                { case: { $gte: ['$_id', 8] }, then: '高意向(8-10)' }
              ],
              default: '其他'
            }
          },
          count: 1,
          totalValue: 1,
          _id: 0
        }
      }
    ]);

    // 地区分布
    const regionStats = await Customer.aggregate([
      { $match: customerQuery },
      {
        $group: {
          _id: '$city',
          count: { $sum: 1 },
          totalValue: { $sum: '$expectedValue' }
        }
      },
      {
        $project: {
          city: { $ifNull: ['$_id', '未知'] },
          count: 1,
          totalValue: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 行业分布
    const industryStats = await Customer.aggregate([
      { $match: customerQuery },
      {
        $group: {
          _id: '$industryPreference',
          count: { $sum: 1 },
          avgIntention: { $avg: '$cooperationIntention' }
        }
      },
      {
        $project: {
          industry: { $ifNull: ['$_id', '未知'] },
          count: 1,
          avgIntention: { $round: ['$avgIntention', 1] },
          _id: 0
        }
      }
    ]);

    // 最有价值客户
    const topCustomers = await Customer.find(customerQuery)
      .sort({ expectedValue: -1 })
      .limit(10)
      .select('name company expectedValue cooperationIntention contactCount')
      .exec();

    res.json({
      status: 'success',
      message: '获取客户分析成功',
      data: {
        sourceStats,
        intentionStats,
        regionStats,
        industryStats,
        topCustomers,
      },
    });
  } catch (error) {
    console.error('获取客户分析错误:', error);
    res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
    });
  }
});

/**
 * @route   GET /api/reports/performance
 * @desc    获取个人业绩统计
 * @access  Private
 */
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { year = new Date().getFullYear() } = req.query;

    // 构建年度日期范围
    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear = new Date(`${year}-12-31`);

    // 个人客户统计
    const customerStats = await Customer.aggregate([
      {
        $match: {
          assignedSalesperson: userId,
          createdAt: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalValue: { $sum: '$expectedValue' },
          avgIntention: { $avg: '$cooperationIntention' },
          closedDeals: {
            $sum: {
              $cond: [{ $eq: ['$cooperationStatus', '已成交'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // 月度业绩趋势
    const monthlyPerformance = await Customer.aggregate([
      {
        $match: {
          assignedSalesperson: userId,
          createdAt: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          customers: { $sum: 1 },
          value: { $sum: '$expectedValue' }
        }
      },
      {
        $project: {
          month: '$_id',
          customers: 1,
          value: 1,
          _id: 0
        }
      },
      { $sort: { month: 1 } }
    ]);

    // 联系活动统计
    const customerIds = await Customer.find({ assignedSalesperson: userId })
      .select('_id');
    
    const contactStats = await ContactRecord.aggregate([
      {
        $match: {
          customer: { $in: customerIds.map(c => c._id) },
          date: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: null,
          totalContacts: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          successfulContacts: {
            $sum: {
              $cond: [
                { $in: ['$result', ['非常好', '好']] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const stats = customerStats[0] || {
      totalCustomers: 0,
      totalValue: 0,
      avgIntention: 0,
      closedDeals: 0
    };

    const contacts = contactStats[0] || {
      totalContacts: 0,
      avgDuration: 0,
      successfulContacts: 0
    };

    res.json({
      status: 'success',
      message: '获取个人业绩统计成功',
      data: {
        customerStats: stats,
        contactStats: contacts,
        monthlyPerformance,
        successRate: contacts.totalContacts > 0 ? 
          Math.round((contacts.successfulContacts / contacts.totalContacts) * 100) : 0,
        conversionRate: stats.totalCustomers > 0 ? 
          Math.round((stats.closedDeals / stats.totalCustomers) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('获取个人业绩统计错误:', error);
    res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
    });
  }
});

module.exports = router; 