const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  // 基本信息
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  company: { type: String },
  position: { type: String },
  country: { type: String },
  city: { type: String },
  
  // 客户特点和标签
  tags: [{ type: String }],
  personality: { type: String }, // 性格特点
  interests: [{ type: String }], // 兴趣爱好
  industryPreference: { type: String }, // 行业偏好
  communicationStyle: { type: String }, // 沟通风格
  
  // 关系网络
  relationships: [{
    relatedCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    relationship: { type: String }, // 关系类型：推荐人、上级、下级、合作伙伴等
    description: { type: String }
  }],
  
  // 拥有资源
  resources: [{
    type: { type: String }, // 资源类型：渠道、资金、产品、人脉等
    description: { type: String },
    value: { type: String }, // 资源价值
    availability: { type: String } // 可用性
  }],
  
  // 合作意向
  cooperationStatus: {
    type: String,
    enum: ['潜在客户', '意向客户', '合作中', '已成交', '已流失'],
    default: '潜在客户'
  },
  cooperationIntention: { type: Number, min: 1, max: 10 }, // 合作意向度 1-10
  cooperationNotes: { type: String },
  expectedValue: { type: Number }, // 预期合作价值
  
  // 销售相关
  assignedSalesperson: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  source: { type: String }, // 客户来源
  priority: { type: String, enum: ['低', '中', '高'], default: '中' },
  
  // 统计数据
  contactCount: { type: Number, default: 0 },
  lastContactDate: { type: Date },
  nextFollowUp: { type: Date },
  
  // 系统字段
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 更新时间中间件
customerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Customer', customerSchema); 