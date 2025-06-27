const mongoose = require('mongoose');

/**
 * 数据库配置和连接管理
 */

const connectDB = async () => {
  try {
    // 本地开发环境
    const localURI = 'mongodb://localhost:27017/acrm';
    
    // 云数据库环境 (生产环境使用)
    const cloudURI = process.env.MONGODB_URI || localURI;
    
    console.log('🔄 正在连接数据库...');
    
    const conn = await mongoose.connect(cloudURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB 连接成功: ${conn.connection.host}`);
    
    // 监听连接事件
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB 连接错误:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB 连接断开');
    });

    // 应用关闭时断开数据库连接
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('📴 应用关闭，数据库连接已断开');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    
    // 如果是云数据库连接失败，尝试本地数据库
    if (process.env.MONGODB_URI && error.message.includes('ENOTFOUND')) {
      console.log('🔄 云数据库连接失败，尝试连接本地数据库...');
      try {
        await mongoose.connect('mongodb://localhost:27017/acrm', {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log('✅ 本地 MongoDB 连接成功');
      } catch (localError) {
        console.error('❌ 本地数据库也连接失败:', localError.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB; 