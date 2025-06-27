const mongoose = require('mongoose');

const contactRecordSchema = new mongoose.Schema({
  // 关联信息
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  salesperson: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // 联系信息
  contactDate: { type: Date, required: true, default: Date.now },
  contactMethod: {
    type: String,
    enum: ['电话', '邮件', '微信', 'WhatsApp', '面谈', '视频会议', '其他'],
    required: true
  },
  
  // 沟通内容
  subject: { type: String, required: true }, // 沟通主题
  content: { type: String, required: true }, // 详细内容
  duration: { type: Number }, // 沟通时长（分钟）
  
  // 沟通结果
  result: {
    type: String,
    enum: ['非常好', '好', '一般', '不理想', '失败'],
    required: true
  },
  customerFeedback: { type: String }, // 客户反馈
  nextAction: { type: String }, // 下一步行动
  
  // 跟进设置
  needFollowUp: { type: Boolean, default: false },
  followUpDate: { type: Date },
  followUpReminder: { type: String },
  
  // 附件和文档
  attachments: [{
    filename: { type: String },
    fileUrl: { type: String },
    fileType: { type: String }
  }],
  
  // 重要性和状态
  importance: { type: String, enum: ['低', '中', '高'], default: '中' },
  isCompleted: { type: Boolean, default: true },
  
  // 系统字段
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 更新时间中间件
contactRecordSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 索引优化
contactRecordSchema.index({ customer: 1, contactDate: -1 });
contactRecordSchema.index({ salesperson: 1, contactDate: -1 });

module.exports = mongoose.model('ContactRecord', contactRecordSchema); 