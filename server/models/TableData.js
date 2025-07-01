/**
 * 表格数据模型
 * 用于存储从Excel导入的原始表格数据
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TableData = sequelize.define('TableData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // 文件信息
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '文件名'
  },
  sheetName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '工作表名称'
  },
  
  // 时间信息
  targetYear: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '目标年份'
  },
  targetMonth: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '目标月份'
  },
  
  // 数据统计
  totalRows: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '总行数'
  },
  validRows: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '有效行数'
  },
  
  // 数据内容
  headers: {
    type: DataTypes.JSON,
    comment: '表头信息'
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: '表格数据'
  },
  
  // 处理状态
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending',
    comment: '处理状态'
  },
  
  // 错误信息
  errorMessage: {
    type: DataTypes.TEXT,
    comment: '错误信息'
  },
  
  // 元数据
  metadata: {
    type: DataTypes.JSON,
    comment: '元数据信息'
  },
  
  // 创建人
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '创建人ID'
  },
  
  // 备注
  notes: {
    type: DataTypes.TEXT,
    comment: '备注信息'
  }
}, {
  tableName: 'table_data',
  timestamps: true,
  indexes: [
    {
      fields: ['createdBy', 'targetYear', 'targetMonth']
    },
    {
      fields: ['fileName', 'sheetName']
    },
    {
      fields: ['status']
    },
    {
      fields: ['targetYear', 'targetMonth']
    }
  ],
  comment: '表格数据表'
});

// 静态方法：获取月度数据
TableData.getMonthlyData = async function(year, month, options = {}) {
  try {
    const where = {
      targetYear: year,
      targetMonth: month,
      status: 'completed'
    };
    
    if (options.sheetName) {
      where.sheetName = options.sheetName;
    }
    
    const result = await TableData.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: options.limit || 50
    });
    
    return result;
  } catch (error) {
    console.error('获取月度数据失败:', error);
    return [];
  }
};

// 静态方法：获取统计信息
TableData.getStats = async function(year) {
  try {
    const stats = await TableData.findAll({
      attributes: [
        'targetMonth',
        'sheetName',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('totalRows')), 'totalRows'],
        [sequelize.fn('SUM', sequelize.col('validRows')), 'validRows']
      ],
      where: {
    targetYear: year,
        status: 'completed'
      },
      group: ['targetMonth', 'sheetName'],
      order: [['targetMonth', 'ASC']],
      raw: true
    });
    
    return stats;
  } catch (error) {
    console.error('获取统计信息失败:', error);
    return [];
  }
};

module.exports = TableData; 