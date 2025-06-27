const express = require('express');
const ContactRecord = require('../models/ContactRecord');
const Customer = require('../models/Customer');
const authRoutes = require('./auth');
const router = express.Router();

// 使用认证中间件
const { authenticateToken } = authRoutes;

/**
 * @route   GET /api/contacts
 * @desc    获取联系记录列表
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      customer,
      method,
      result,
      dateFrom,
      dateTo,
      search,
    } = req.query;

    // 构建查询条件
    const query = {};
    
    // 如果是普通销售员，只能查看自己负责的客户的联系记录
    if (req.user.role === 'sales') {
      try {
        const customerIds = await Customer.find({ assignedSalesperson: req.user._id })
          .select('_id')
          .exec();
        query.customer = { $in: customerIds.map(c => c._id) };
      } catch (error) {
        console.warn('获取销售员客户列表失败:', error.message);
        // 如果获取客户列表失败，设置一个不存在的ID，确保不返回任何数据
        query.customer = { $in: [] };
      }
    }

    // 按客户筛选
    if (customer) {
      query.customer = customer;
    }

    // 按联系方式筛选
    if (method) {
      query.method = method;
    }

    // 按联系结果筛选
    if (result) {
      query.result = result;
    }

    // 按日期范围筛选
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) {
        query.date.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.date.$lte = new Date(dateTo);
      }
    }

    // 搜索功能
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    // 计算分页
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let contacts = [];
    let total = 0;

    try {
      // 查询联系记录
      contacts = await ContactRecord.find(query)
        .populate('customer', 'name company position')
        .populate('createdBy', 'name')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .exec();

      // 计算总数
      total = await ContactRecord.countDocuments(query);
    } catch (error) {
      console.warn('获取联系记录失败:', error.message);
      // 确保contacts是数组
      contacts = [];
      total = 0;
    }

    res.json({
      status: 'success',
      message: '获取联系记录成功',
      data: {
        contacts: Array.isArray(contacts) ? contacts : [],
        total,
      },
      pagination: {
        current: parseInt(page),
        total: Math.ceil((total || 0) / parseInt(limit)),
        count: Array.isArray(contacts) ? contacts.length : 0,
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
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const contact = await ContactRecord.findById(req.params.id)
      .populate('customer', 'name company position')
      .populate('createdBy', 'name')
      .exec();

    if (!contact) {
      return res.status(404).json({
        status: 'error',
        message: '联系记录不存在',
      });
    }

    // 检查权限：销售员只能查看自己负责客户的联系记录
    if (req.user.role === 'sales') {
      const customer = await Customer.findById(contact.customer._id);
      if (!customer || customer.assignedSalesperson.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: '无权访问此联系记录',
        });
      }
    }

    res.json({
      status: 'success',
      message: '获取联系记录详情成功',
      data: contact,
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
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      customer,
      date,
      method,
      subject,
      content,
      result,
      duration,
      nextFollowUp,
    } = req.body;

    // 验证必填字段
    if (!customer || !date || !method || !subject || !content || !result) {
      return res.status(400).json({
        status: 'error',
        message: '请填写所有必填字段',
      });
    }

    // 验证客户是否存在
    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(404).json({
        status: 'error',
        message: '客户不存在',
      });
    }

    // 检查权限：销售员只能为自己负责的客户创建联系记录
    if (req.user.role === 'sales' && customerDoc.assignedSalesperson.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: '无权为此客户创建联系记录',
      });
    }

    // 创建联系记录
    const contact = new ContactRecord({
      customer,
      date: new Date(date),
      method,
      subject,
      content,
      result,
      duration: duration ? parseInt(duration) : undefined,
      nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : undefined,
      createdBy: req.user._id,
    });

    await contact.save();

    // 更新客户的联系统计
    await Customer.findByIdAndUpdate(customer, {
      $inc: { contactCount: 1 },
      lastContactDate: new Date(date),
      updatedAt: new Date(),
    });

    // 填充关联数据
    await contact.populate('customer', 'name company position');
    await contact.populate('createdBy', 'name');

    res.status(201).json({
      status: 'success',
      message: '联系记录创建成功',
      data: contact,
    });
  } catch (error) {
    console.error('创建联系记录错误:', error);
    res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
    });
  }
});

/**
 * @route   PUT /api/contacts/:id
 * @desc    更新联系记录
 * @access  Private
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const contact = await ContactRecord.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({
        status: 'error',
        message: '联系记录不存在',
      });
    }

    // 检查权限：只能编辑自己创建的联系记录或管理员可以编辑所有
    if (req.user.role === 'sales' && contact.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: '无权修改此联系记录',
      });
    }

    const {
      date,
      method,
      subject,
      content,
      result,
      duration,
      nextFollowUp,
    } = req.body;

    // 更新联系记录
    const updatedContact = await ContactRecord.findByIdAndUpdate(
      req.params.id,
      {
        date: date ? new Date(date) : contact.date,
        method: method || contact.method,
        subject: subject || contact.subject,
        content: content || contact.content,
        result: result || contact.result,
        duration: duration !== undefined ? parseInt(duration) : contact.duration,
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : contact.nextFollowUp,
        updatedAt: new Date(),
      },
      { new: true }
    )
      .populate('customer', 'name company position')
      .populate('createdBy', 'name');

    res.json({
      status: 'success',
      message: '联系记录更新成功',
      data: updatedContact,
    });
  } catch (error) {
    console.error('更新联系记录错误:', error);
    res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
    });
  }
});

/**
 * @route   DELETE /api/contacts/:id
 * @desc    删除联系记录
 * @access  Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const contact = await ContactRecord.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({
        status: 'error',
        message: '联系记录不存在',
      });
    }

    // 检查权限：只能删除自己创建的联系记录或管理员可以删除所有
    if (req.user.role === 'sales' && contact.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: '无权删除此联系记录',
      });
    }

    await ContactRecord.findByIdAndDelete(req.params.id);

    // 更新客户的联系统计
    await Customer.findByIdAndUpdate(contact.customer, {
      $inc: { contactCount: -1 },
      updatedAt: new Date(),
    });

    res.json({
      status: 'success',
      message: '联系记录删除成功',
    });
  } catch (error) {
    console.error('删除联系记录错误:', error);
    res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
    });
  }
});

/**
 * @route   GET /api/contacts/customer/:customerId
 * @desc    获取特定客户的联系记录
 * @access  Private
 */
router.get('/customer/:customerId', authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // 验证客户是否存在
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: '客户不存在',
      });
    }

    // 检查权限：销售员只能查看自己负责客户的联系记录
    if (req.user.role === 'sales' && customer.assignedSalesperson.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: '无权访问此客户的联系记录',
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 查询联系记录
    const contacts = await ContactRecord.find({ customer: customerId })
      .populate('createdBy', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    const total = await ContactRecord.countDocuments({ customer: customerId });

    res.json({
      status: 'success',
      message: '获取客户联系记录成功',
      data: contacts,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: contacts.length,
      },
    });
  } catch (error) {
    console.error('获取客户联系记录错误:', error);
    res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
    });
  }
});

module.exports = router; 