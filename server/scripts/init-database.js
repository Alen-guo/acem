/**
 * 数据库初始化脚本
 * 用于逐个同步表结构，诊断索引问题
 */
const { sequelize } = require('../config/database');

// 导入所有模型
const Customer = require('../models/Customer');
const User = require('../models/User');
const ContactRecord = require('../models/ContactRecord');
const Bill = require('../models/Bill');
const TableData = require('../models/TableData');

const models = {
  Customer,
  User,
  ContactRecord,
  Bill,
  TableData
};

async function initDatabase() {
  try {
    console.log('🚀 开始初始化数据库...');
    
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 逐个同步模型
    for (const [modelName, model] of Object.entries(models)) {
      try {
        console.log(`📋 正在同步 ${modelName} 表...`);
        await model.sync({ alter: true });
        console.log(`✅ ${modelName} 表同步成功`);
      } catch (error) {
        console.error(`❌ ${modelName} 表同步失败:`, error.message);
        if (error.message.includes('Too many keys specified')) {
          console.log(`🔍 ${modelName} 表索引过多，请检查模型定义`);
        }
      }
    }
    
    console.log('🎉 数据库初始化完成！');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// 运行初始化
initDatabase(); 