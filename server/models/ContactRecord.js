/**
 * 联系记录数据模型 - MySQL/Sequelize版本
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContactRecord = sequelize.define('ContactRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // 关联信息
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '客户ID'
  },
  salespersonId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '销售员ID'
  },
  
  // 联系信息
  contactDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '联系日期'
  },
  contactMethod: {
    type: DataTypes.ENUM('电话', '邮件', '微信', 'WhatsApp', '面谈', '视频会议', '其他'),
    allowNull: false,
    comment: '联系方式'
  },
  
  // 沟通内容
  subject: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '沟通主题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '详细内容'
  },
  duration: {
    type: DataTypes.INTEGER,
    comment: '沟通时长（分钟）'
  },
  
  // 沟通结果
  result: {
    type: DataTypes.ENUM('非常好', '好', '一般', '不理想', '失败'),
    allowNull: false,
    comment: '沟通结果'
  },
  customerFeedback: {
    type: DataTypes.TEXT,
    comment: '客户反馈'
  },
  nextAction: {
    type: DataTypes.TEXT,
    comment: '下一步行动'
  },
  
  // 跟进设置
  needFollowUp: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否需要跟进'
  },
  followUpDate: {
    type: DataTypes.DATE,
    comment: '跟进日期'
  },
  followUpReminder: {
    type: DataTypes.STRING(500),
    comment: '跟进提醒'
  },
  
  // 附件和文档 (JSON格式存储)
  attachments: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '附件列表'
  },
  
  // 重要性和状态
  importance: {
    type: DataTypes.ENUM('低', '中', '高'),
    defaultValue: '中',
    comment: '重要性'
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否完成'
  }
}, {
  tableName: 'contactrecords',
  comment: '联系记录表',
  indexes: [
    { fields: ['customerId', 'contactDate'] },
    { fields: ['salespersonId', 'contactDate'] },
    { fields: ['contactDate'] },
    { fields: ['needFollowUp', 'followUpDate'] }
  ]
});

module.exports = ContactRecord; 