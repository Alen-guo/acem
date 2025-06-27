/**
 * 表格数据模型
 * 用于存储从Excel导入的原始表格数据
 */

const mongoose = require('mongoose');

const tableDataSchema = new mongoose.Schema({
  // 基本信息
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  sheetName: {
    type: String,
    required: true,
    trim: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  targetMonth: {
    type: String, // 格式: YYYY-MM
    required: true
  },
  targetYear: {
    type: Number,
    required: true
  },
  
  // 表格结构信息
  columns: [{
    title: String,
    dataIndex: String,
    key: String,
    width: Number,
    ellipsis: Boolean
  }],
  
  // 原始数据
  originalData: [{
    type: mongoose.Schema.Types.Mixed // 存储原始Excel行数据
  }],
  
  // 统计信息
  totalRows: {
    type: Number,
    default: 0
  },
  totalColumns: {
    type: Number,
    default: 0
  },
  
  // 元数据
  metadata: {
    hasChanges: {
      type: Boolean,
      default: false
    },
    originalStructure: {
      type: mongoose.Schema.Types.Mixed
    },
    importSettings: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  
  // 用户信息
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 状态
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

// 索引
tableDataSchema.index({ targetMonth: 1, targetYear: 1 });
tableDataSchema.index({ sheetName: 1, targetMonth: 1 });
tableDataSchema.index({ createdBy: 1, uploadDate: -1 });
tableDataSchema.index({ fileName: 1, uploadDate: -1 });

// 虚拟字段 - 获取月份标识
tableDataSchema.virtual('monthKey').get(function() {
  return `${this.targetYear}-${String(this.targetMonth).padStart(2, '0')}`;
});

// 实例方法 - 获取数据摘要
tableDataSchema.methods.getSummary = function() {
  return {
    id: this._id,
    fileName: this.fileName,
    sheetName: this.sheetName,
    monthKey: this.targetMonth,
    totalRows: this.totalRows,
    totalColumns: this.totalColumns,
    uploadDate: this.uploadDate,
    status: this.status
  };
};

// 静态方法 - 按月份获取所有表格
tableDataSchema.statics.findByMonth = function(year, month) {
  return this.find({
    targetYear: year,
    targetMonth: month,
    status: 'active'
  }).populate('createdBy', 'username email').sort({ uploadDate: -1 });
};

// 静态方法 - 按日期范围获取表格
tableDataSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    uploadDate: {
      $gte: startDate,
      $lte: endDate
    },
    status: 'active'
  }).populate('createdBy', 'username email').sort({ uploadDate: -1 });
};

const TableData = mongoose.model('TableData', tableDataSchema);

module.exports = TableData; 