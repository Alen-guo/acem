const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 账单数据模型
 * 功能：定义账单的数据结构和验证规则
 */
const Bill = sequelize.define('Bill', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // 基本信息
  title: { 
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '账单标题'
  },
  amount: { 
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: '金额'
  },
  type: {
    type: DataTypes.ENUM('收入', '支出'),
    allowNull: false,
    comment: '账单类型'
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '分类'
  },
  description: {
    type: DataTypes.TEXT,
    comment: '描述'
  },
  
  // 时间信息
  billDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '账单日期'
  },
  month: { 
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '月份'
  },
  year: { 
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '年份'
  },
  
  // 状态信息
  status: {
    type: DataTypes.ENUM('待处理', '已确认', '已支付', '已取消'),
    defaultValue: '待处理',
    comment: '状态'
  },
  priority: {
    type: DataTypes.ENUM('低', '中', '高'),
    defaultValue: '中',
    comment: '优先级'
  },
  
  // 关联信息
  customerId: {
    type: DataTypes.INTEGER,
    comment: '关联客户ID'
  },
  projectName: {
    type: DataTypes.STRING(200),
    comment: '项目名称'
  },
  
  // 文件信息
  attachments: {
    type: DataTypes.JSON,
    comment: '附件列表'
  },
  
  // 审核信息
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已审核'
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    comment: '审核人ID'
  },
  approvedAt: {
    type: DataTypes.DATE,
    comment: '审核时间'
  },
  
  // 创建信息
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '创建人ID'
  },
  
  // 标签和备注
  tags: {
    type: DataTypes.JSON,
    comment: '标签列表'
  },
  notes: {
    type: DataTypes.TEXT,
    comment: '备注'
  }
}, {
  tableName: 'bills',
  timestamps: true,
  indexes: [
    {
      fields: ['createdBy', 'billDate']
    },
    {
      fields: ['type', 'category']
    },
    {
      fields: ['year', 'month']
    },
    {
      fields: ['status']
    }
  ],
  comment: '账单表'
});

// 静态方法：获取分类列表
Bill.getCategories = async function() {
  try {
    const result = await Bill.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('category')), 'category']],
      raw: true
    });
    return result.map(item => item.category).filter(Boolean);
  } catch (error) {
    console.error('获取分类列表失败:', error);
    return [];
  }
};

// 静态方法：获取统计数据
Bill.getStats = async function(year = new Date().getFullYear()) {
  try {
    const stats = await Bill.findAll({
      attributes: [
        'type',
        'month',
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        year: year
      },
      group: ['type', 'month'],
      raw: true
    });

    // 格式化统计数据
    const monthlyStats = {};
    const typeStats = { 收入: 0, 支出: 0 };
    
    stats.forEach(stat => {
      const month = stat.month;
      if (!monthlyStats[month]) {
        monthlyStats[month] = { 收入: 0, 支出: 0 };
      }
      monthlyStats[month][stat.type] = parseFloat(stat.totalAmount) || 0;
      typeStats[stat.type] += parseFloat(stat.totalAmount) || 0;
    });

    return {
      monthlyStats,
      typeStats,
      totalIncome: typeStats.收入,
      totalExpense: typeStats.支出,
      netIncome: typeStats.收入 - typeStats.支出
    };
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return {
      monthlyStats: {},
      typeStats: { 收入: 0, 支出: 0 },
      totalIncome: 0,
      totalExpense: 0,
      netIncome: 0
    };
  }
};

module.exports = Bill; 