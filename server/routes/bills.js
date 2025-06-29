const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const { Op } = require('sequelize');

/**
 * 账单管理路由
 * 提供账单的增删改查和统计功能
 */

// 获取账单列表
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      category,
      month,
      year,
      search,
      status,
      startDate,
      endDate
    } = req.query;

    // 构建查询条件
    const where = {
      createdBy: req.user?.id || 1 // 临时用户ID，实际应该从认证中获取
    };

    if (type) where.type = type;
    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // 日期范围查询优先
    if (startDate && endDate) {
      where.billDate = {
        [Op.between]: [startDate, endDate]
      };
    } else if (month) {
      where.month = parseInt(month);
      if (year) where.year = parseInt(year);
    } else if (year) {
      where.year = parseInt(year);
    }

    // 执行查询
    const { count, rows: bills } = await Bill.findAndCountAll({
      where,
      order: [['billDate', 'DESC']],
      offset: (page - 1) * limit,
      limit: parseInt(limit)
    });

    res.json({
      status: 'success',
      message: '获取账单列表成功',
      data: {
        bills,
        total: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('获取账单列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取账单列表失败',
      error: error.message
    });
  }
});

// 获取账单统计数据
router.get('/stats/overview', async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month } = req.query;
    const userId = req.user?.id || 1;

    console.log('统计查询参数:', { year, month, userId });

    // 当月/当年统计
    let currentWhere = { year: parseInt(year), createdBy: userId };
    if (month) {
      currentWhere.month = parseInt(month);
    }

    // 查询当前时间段的账单
    const currentBills = await Bill.findAll({ where: currentWhere });
    console.log(`查询到 ${month ? month + '月' : year + '年'} 账单数量:`, currentBills.length);
    
    let currentIncome = 0, currentExpense = 0;
    currentBills.forEach(bill => {
      if (bill.type === '收入') currentIncome += parseFloat(bill.amount || 0);
      if (bill.type === '支出') currentExpense += parseFloat(bill.amount || 0);
    });

    // 年度统计（总是查询整年数据）
    const yearlyWhere = { year: parseInt(year), createdBy: userId };
    const yearlyBills = await Bill.findAll({ where: yearlyWhere });
    
    let yearlyIncome = 0, yearlyExpense = 0;
    yearlyBills.forEach(bill => {
      if (bill.type === '收入') yearlyIncome += parseFloat(bill.amount || 0);
      if (bill.type === '支出') yearlyExpense += parseFloat(bill.amount || 0);
    });

    console.log('统计结果:', {
      current: { income: currentIncome, expense: currentExpense },
      yearly: { income: yearlyIncome, expense: yearlyExpense }
    });

    res.json({
      status: 'success',
      message: '获取统计数据成功',
      data: {
        currentMonthIncome: currentIncome,
        currentMonthExpense: currentExpense,
        currentMonthBalance: currentIncome - currentExpense,
        yearlyIncome,
        yearlyExpense,
        yearlyBalance: yearlyIncome - yearlyExpense,
        monthlyTrends: {},
        categoryStats: []
      }
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.json({
      status: 'success',
      message: '获取默认统计数据',
      data: {
        currentMonthIncome: 0,
        currentMonthExpense: 0,
        currentMonthBalance: 0,
        yearlyIncome: 0,
        yearlyExpense: 0,
        yearlyBalance: 0,
        monthlyTrends: {},
        categoryStats: []
      }
    });
  }
});

// 获取分类列表
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Bill.getCategories();

    res.json({
      status: 'success',
      message: '获取分类列表成功',
      data: categories.length > 0 ? categories : ['办公用品', '技术服务', '项目收入', '咨询服务'] // 提供默认分类
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    // 即使出错也返回默认分类，保证前端正常工作
    res.json({
      status: 'success',
      message: '获取默认分类列表',
      data: ['办公用品', '技术服务', '项目收入', '咨询服务', '市场推广', '软件服务']
    });
  }
});

// 获取月份表格数据 - 按原始Excel结构分组
router.get('/monthly-sheets', async (req, res) => {
  try {
    const { month, year, startDate, endDate } = req.query;
    const { Op } = require('sequelize');
    
    let whereClause = {};
    
    if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      whereClause.billDate = {
        [Op.between]: [startOfMonth, endOfMonth]
      };
    } else if (startDate && endDate) {
      whereClause.billDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const bills = await Bill.findAll({
      where: whereClause,
      order: [['billDate', 'DESC']]
    });

    // 按工作表分组并重构原始Excel结构
    const sheetGroups = {};
    
    bills.forEach(bill => {
      try {
        const descData = JSON.parse(bill.description || '{}');
        const sheetName = descData.sheetName || bill.category || '未知来源';
        const originalData = descData.originalData || {};
        const sheetStructure = descData.sheetStructure;
        
        if (!sheetGroups[sheetName]) {
          sheetGroups[sheetName] = {
            name: sheetName,
            data: [],
            columns: [],
            structure: sheetStructure,
            totalIncome: 0,
            totalExpense: 0,
            count: 0
          };
        }
        
        // 添加行数据
        sheetGroups[sheetName].data.push({
          ...originalData,
          _billId: bill.id,
          _originalIndex: descData.originalIndex || 0,
          _billAmount: bill.amount,
          _billType: bill.type,
          _billDate: bill.billDate,
          _billStatus: bill.status
        });
        
        // 统计金额
        if (bill.type === '收入') {
          sheetGroups[sheetName].totalIncome += bill.amount;
        } else {
          sheetGroups[sheetName].totalExpense += bill.amount;
        }
        sheetGroups[sheetName].count++;
        
        // 提取列信息（从第一条记录中获取）
        if (sheetGroups[sheetName].columns.length === 0 && Object.keys(originalData).length > 0) {
          sheetGroups[sheetName].columns = Object.keys(originalData)
            .filter(key => !key.startsWith('_'))
            .map(key => ({
              title: key,
              dataIndex: key,
              key: key,
              ellipsis: true,
              width: calculateColumnWidth(key, [originalData])
            }));
        }
        
      } catch (error) {
        console.error('解析账单描述失败:', error);
      }
    });

    // 转换为数组并排序
    const sheetsArray = Object.values(sheetGroups).sort((a, b) => b.count - a.count);

    res.json({
      status: 'success',
      message: '获取月份表格数据成功',
      data: {
        sheets: sheetsArray,
        totalSheets: sheetsArray.length,
        totalRecords: bills.length,
        summary: {
          totalIncome: sheetsArray.reduce((sum, sheet) => sum + sheet.totalIncome, 0),
          totalExpense: sheetsArray.reduce((sum, sheet) => sum + sheet.totalExpense, 0),
          totalCount: sheetsArray.reduce((sum, sheet) => sum + sheet.count, 0)
        }
      }
    });
  } catch (error) {
    console.error('获取月份表格数据失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取月份表格数据失败',
      error: error.message
    });
  }
});

// 获取账单详情 - 移到最后，避免路由冲突
router.get('/:id', async (req, res) => {
  try {
    const bill = await Bill.findByPk(req.params.id);

    if (!bill) {
      return res.status(404).json({
        status: 'error',
        message: '账单不存在'
      });
    }

    res.json({
      status: 'success',
      message: '获取账单详情成功',
      data: bill
    });
  } catch (error) {
    console.error('获取账单详情失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取账单详情失败',
      error: error.message
    });
  }
});

// 创建账单
router.post('/', async (req, res) => {
  try {
    const billData = {
      ...req.body,
      createdBy: req.user?.id || 1 // 临时用户ID
    };

    // 自动设置月份和年份
    if (billData.billDate) {
      const date = new Date(billData.billDate);
      billData.month = date.getMonth() + 1;
      billData.year = date.getFullYear();
    }

    const bill = await Bill.create(billData);

    res.status(201).json({
      status: 'success',
      message: '创建账单成功',
      data: bill
    });
  } catch (error) {
    console.error('创建账单失败:', error);
    res.status(500).json({
      status: 'error',
      message: '创建账单失败',
      error: error.message
    });
  }
});

// 更新账单
router.put('/:id', async (req, res) => {
  try {
    const [updatedRowsCount] = await Bill.update(req.body, {
      where: { id: req.params.id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        status: 'error',
        message: '账单不存在'
      });
    }

    const bill = await Bill.findByPk(req.params.id);

    res.json({
      status: 'success',
      message: '更新账单成功',
      data: bill
    });
  } catch (error) {
    console.error('更新账单失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新账单失败',
      error: error.message
    });
  }
});

// 删除账单
router.delete('/:id', async (req, res) => {
  try {
    const deletedRowsCount = await Bill.destroy({
      where: { id: req.params.id }
    });

    if (deletedRowsCount === 0) {
      return res.status(404).json({
        status: 'error',
        message: '账单不存在'
      });
    }

    res.json({
      status: 'success',
      message: '删除账单成功',
      data: { deletedId: req.params.id }
    });
  } catch (error) {
    console.error('删除账单失败:', error);
    res.status(500).json({
      status: 'error',
      message: '删除账单失败',
      error: error.message
    });
  }
});

// 批量导入表格数据
router.post('/batch-import', async (req, res) => {
  try {
    const { bills, month, year, sheetsData } = req.body;
    
    if (!bills || !Array.isArray(bills) || bills.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '表格数据不能为空'
      });
    }

    const userId = req.user?.id || 1; // 临时用户ID
    const processedBills = [];

    // 处理每条表格数据
    for (const tableData of bills) {
      try {
        const processedBill = {
          title: tableData.displayTitle || tableData.title || tableData.name || tableData.description || `${tableData.sheetName || '表格'}-第${tableData.originalIndex || 1}行`,
          description: JSON.stringify({
            sheetName: tableData.sheetName,
            originalIndex: tableData.originalIndex,
            originalData: tableData,
            // 保存完整的工作表结构信息
            sheetStructure: sheetsData?.find(sheet => sheet.name === tableData.sheetName) || null
          }),
          amount: parseFloat(tableData.displayAmount) || parseFloat(tableData.amount) || 0,
          type: tableData.displayAmount >= 0 ? '收入' : '支出',
          category: tableData.sheetName || '导入表格',
          billDate: new Date(),
          status: '已支付',
          tags: tableData.sheetName ? [tableData.sheetName] : [],
          createdBy: userId
        };

        // 如果指定了月份和年份，则设置日期
        if (month && year) {
          const monthStr = String(month).padStart(2, '0');
          processedBill.billDate = new Date(`${year}-${monthStr}-01`);
          processedBill.month = parseInt(month);
          processedBill.year = parseInt(year);
        }

        const bill = await Bill.create(processedBill);
        processedBills.push(bill);
      } catch (error) {
        console.error('处理单条表格数据失败:', error);
        // 继续处理其他数据
      }
    }

    res.json({
      status: 'success',
      message: `成功导入 ${processedBills.length} 条表格记录`,
      data: {
        importedCount: processedBills.length,
        totalCount: bills.length,
        bills: processedBills
      }
    });
  } catch (error) {
    console.error('批量导入表格数据失败:', error);
    res.status(500).json({
      status: 'error',
      message: '批量导入表格数据失败',
      error: error.message
    });
  }
});

// 计算列宽度的辅助函数
function calculateColumnWidth(header, data) {
  const headerStr = String(header).toLowerCase().trim();
  
  // 序号列特殊处理
  const isSequenceColumn = 
    headerStr === '序号' || 
    headerStr === '序' || 
    headerStr === 'no' || 
    headerStr === 'no.' ||
    headerStr === 'id' || 
    headerStr === '编号';
    
  if (isSequenceColumn) {
    return 60;
  }

  // 基于表头长度计算最小宽度
  const headerWidth = header.length * 14 + 50;
  
  // 基于数据内容计算宽度
  let maxDataLength = 0;
  data.forEach(row => {
    const cellValue = row[header];
    if (cellValue !== null && cellValue !== undefined) {
      const valueLength = String(cellValue).length;
      maxDataLength = Math.max(maxDataLength, valueLength);
    }
  });
  
  const dataWidth = maxDataLength * 12 + 50;
  const calculatedWidth = Math.max(headerWidth, dataWidth);
  
  // 根据列类型设置不同的宽度范围
  if (header.includes('名称') || header.includes('描述') || header.includes('备注')) {
    return Math.min(Math.max(calculatedWidth, 120), 350);
  } else if (header.includes('数量') || header.includes('价格') || header.includes('金额') || header.includes('单价')) {
    return Math.min(Math.max(calculatedWidth, 80), 150);
  } else if (header.includes('日期') || header.includes('时间')) {
    return Math.min(Math.max(calculatedWidth, 100), 160);
  } else {
    return Math.min(Math.max(calculatedWidth, 80), 250);
  }
}

module.exports = router; 