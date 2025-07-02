/**
 * 用户数据模型 - MySQL/Sequelize版本
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // 基本信息
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '用户名'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    },
    comment: '邮箱地址'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码'
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '姓名'
  },
  
  // 个人信息
  phone: {
    type: DataTypes.STRING(50),
    comment: '电话号码'
  },
  avatar: {
    type: DataTypes.STRING(500),
    comment: '头像URL'
  },
  department: {
    type: DataTypes.STRING(100),
    comment: '部门'
  },
  position: {
    type: DataTypes.STRING(100),
    comment: '职位'
  },
  
  // 权限和角色
  role: {
    type: DataTypes.ENUM('销售员', '销售主管', '销售经理', '管理员'),
    defaultValue: '销售员',
    comment: '角色'
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '权限列表'
  },
  
  // 销售相关
  salesTarget: {
    type: DataTypes.DECIMAL(15, 2),
    comment: '销售目标'
  },
  commission: {
    type: DataTypes.DECIMAL(5, 4),
    comment: '提成比例'
  },
  territory: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '负责地区'
  },
  
  // 账户状态
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否激活'
  },
  lastLogin: {
    type: DataTypes.DATE,
    comment: '最后登录时间'
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '邮箱是否验证'
  },
  
  // 通知设置 (JSON格式存储)
  notificationSettings: {
    type: DataTypes.JSON,
    defaultValue: {
      email: true,
      followUpReminders: true,
      dailyReport: false,
      weeklyReport: true
    },
    comment: '通知设置'
  }
}, {
  tableName: 'users',
  comment: '用户表',
  indexes: [
    { fields: ['username'], unique: true },
    { fields: ['email'], unique: true },
    { fields: ['role'] },
    { fields: ['isActive'] }
  ]
});

// 实例方法：隐藏密码字段
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

module.exports = User; 