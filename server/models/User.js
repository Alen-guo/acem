const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // 基本信息
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  
  // 个人信息
  phone: { type: String },
  avatar: { type: String },
  department: { type: String },
  position: { type: String },
  
  // 权限和角色
  role: {
    type: String,
    enum: ['销售员', '销售主管', '销售经理', '管理员'],
    default: '销售员'
  },
  permissions: [{
    type: String,
    enum: ['查看所有客户', '编辑所有客户', '删除客户', '导出数据', '查看报表', '管理用户']
  }],
  
  // 销售相关
  salesTarget: { type: Number }, // 销售目标
  commission: { type: Number }, // 提成比例
  territory: [{ type: String }], // 负责地区
  
  // 账户状态
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  emailVerified: { type: Boolean, default: false },
  
  // 通知设置
  notificationSettings: {
    email: { type: Boolean, default: true },
    followUpReminders: { type: Boolean, default: true },
    dailyReport: { type: Boolean, default: false },
    weeklyReport: { type: Boolean, default: true }
  },
  
  // 系统字段
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 更新时间中间件
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 隐藏密码字段
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema); 