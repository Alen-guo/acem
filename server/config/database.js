/**
 * MySQL数据库配置 - 使用Sequelize ORM
 */
const { Sequelize } = require('sequelize');

// 数据库连接配置
const sequelize = new Sequelize('acrm', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: console.log, // 开发环境显示SQL日志
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true, // 自动添加createdAt和updatedAt
    underscored: false, // 使用camelCase而不是snake_case
    freezeTableName: true // 不自动复数化表名
  }
});

// 测试连接
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL 数据库连接成功');
    
    // 同步数据库表结构
    await sequelize.sync({ alter: true }); // 开发环境使用alter，生产环境建议用migration
    console.log('📊 数据库表结构同步完成');
    
  } catch (error) {
    console.error('❌ MySQL 连接失败:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  connectDB
}; 