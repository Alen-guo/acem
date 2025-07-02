/**
 * MySQL数据库配置 - 使用Sequelize ORM
 * 支持开发环境和生产环境
 */
const { Sequelize } = require('sequelize');
require('dotenv').config();

// 数据库配置
const config = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'acrm',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    dialect: 'mysql',
    logging: console.log, // 开发环境显示SQL日志
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'acrm',
    username: process.env.DB_USER || 'acrmuser',
    password: process.env.DB_PASSWORD,
    dialect: 'mysql',
    logging: false, // 生产环境关闭SQL日志
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  }
};

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// 创建Sequelize实例
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions || {},
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Database connection established successfully (${env} mode)`);
    
    // 在开发环境下同步数据库表结构 - 暂时禁用，避免索引错误
    // if (env === 'development') {
    //   await sequelize.sync({ alter: true });
    //   console.log('📋 Database tables synchronized');
    // }
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  testConnection,
  config: dbConfig
}; 