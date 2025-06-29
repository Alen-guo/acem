/**
 * 客户数据模型 - MySQL/Sequelize版本
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // 基本信息
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '客户姓名'
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
  phone: {
    type: DataTypes.STRING(50),
    comment: '电话号码'
  },
  company: {
    type: DataTypes.STRING(200),
    comment: '公司名称'
  },
  position: {
    type: DataTypes.STRING(100),
    comment: '职位'
  },
  country: {
    type: DataTypes.STRING(50),
    comment: '国家'
  },
  city: {
    type: DataTypes.STRING(50),
    comment: '城市'
  },
  
  // 客户特点和标签 (JSON格式存储)
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '标签列表'
  },
  personality: {
    type: DataTypes.TEXT,
    comment: '性格特点'
  },
  interests: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '兴趣爱好'
  },
  industryPreference: {
    type: DataTypes.STRING(100),
    comment: '行业偏好'
  },
  communicationStyle: {
    type: DataTypes.STRING(100),
    comment: '沟通风格'
  },
  
  // 关系网络和资源 (JSON格式存储)
  relationships: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '关系网络'
  },
  resources: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '拥有资源'
  },
  
  // 合作意向
  cooperationStatus: {
    type: DataTypes.ENUM('潜在客户', '意向客户', '合作中', '已成交', '已流失'),
    defaultValue: '潜在客户',
    comment: '合作状态'
  },
  cooperationIntention: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 10
    },
    comment: '合作意向度(1-10)'
  },
  cooperationNotes: {
    type: DataTypes.TEXT,
    comment: '合作备注'
  },
  expectedValue: {
    type: DataTypes.DECIMAL(15, 2),
    comment: '预期合作价值'
  },
  
  // 销售相关
  assignedSalesperson: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '分配的销售员ID'
  },
  source: {
    type: DataTypes.STRING(100),
    comment: '客户来源'
  },
  priority: {
    type: DataTypes.ENUM('低', '中', '高'),
    defaultValue: '中',
    comment: '优先级'
  },
  
  // 统计数据
  contactCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '联系次数'
  },
  lastContactDate: {
    type: DataTypes.DATE,
    comment: '最后联系时间'
  },
  nextFollowUp: {
    type: DataTypes.DATE,
    comment: '下次跟进时间'
  }
}, {
  tableName: 'customers',
  comment: '客户信息表',
  indexes: [
    // 创建索引优化查询性能
    { fields: ['assignedSalesperson'] },
    { fields: ['cooperationStatus'] },
    { fields: ['priority'] },
    { fields: ['lastContactDate'] },
    { fields: ['nextFollowUp'] },
    { fields: ['assignedSalesperson', 'cooperationStatus'] },
    { fields: ['assignedSalesperson', 'nextFollowUp'] }
  ]
});

module.exports = Customer; 