const mongoose = require('mongoose');

/**
 * 账单数据模型
 * 功能：定义账单的数据结构和验证规则
 */
const billSchema = new mongoose.Schema({
  // 基本信息
  title: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: 500
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  
  // 分类信息
  type: {
    type: String,
    enum: ['收入', '支出'],
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  
  // 时间信息
  date: { 
    type: Date, 
    required: true 
  },
  month: { 
    type: String, 
    required: true 
  }, // 格式：YYYY-MM
  year: { 
    type: Number, 
    required: true 
  },
  
  // 状态和标签
  status: {
    type: String,
    enum: ['已支付', '待支付', '已逾期', '已取消'],
    default: '已支付'
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // 附件
  attachments: [{
    type: String
  }],
  
  // 创建者
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // 系统字段
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// 索引优化
billSchema.index({ createdBy: 1, month: -1 });
billSchema.index({ createdBy: 1, year: -1, type: 1 });
billSchema.index({ createdBy: 1, category: 1 });
billSchema.index({ createdBy: 1, date: -1 });

// 更新时间中间件
billSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // 自动设置month和year字段
  if (this.date) {
    const date = new Date(this.date);
    this.month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    this.year = date.getFullYear();
  }
  
  next();
});

// 验证前中间件 - 确保在验证前设置month和year
billSchema.pre('validate', function(next) {
  // 自动设置month和year字段
  if (this.date && (!this.month || !this.year)) {
    const date = new Date(this.date);
    this.month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    this.year = date.getFullYear();
  }
  
  next();
});

// 静态方法：获取用户的月度统计
billSchema.statics.getMonthlyStats = async function(userId, year) {
  return this.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(userId),
        year: year
      }
    },
    {
      $group: {
        _id: {
          month: '$month',
          type: '$type'
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.month',
        stats: {
          $push: {
            type: '$_id.type',
            amount: '$totalAmount',
            count: '$count'
          }
        }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);
};

// 静态方法：获取分类统计
billSchema.statics.getCategoryStats = async function(userId, year) {
  return this.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(userId),
        year: year
      }
    },
    {
      $group: {
        _id: {
          category: '$category',
          type: '$type'
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { totalAmount: -1 }
    }
  ]);
};

module.exports = mongoose.model('Bill', billSchema); 