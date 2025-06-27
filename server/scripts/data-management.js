const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

// 导入所有模型
const Customer = require('../models/Customer');
const ContactRecord = require('../models/ContactRecord');
const User = require('../models/User');
const Bill = require('../models/Bill');

/**
 * 数据管理工具
 * 支持数据备份、还原、迁移等功能
 */

class DataManager {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
  }

  // 确保备份目录存在
  async ensureBackupDir() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  // 数据备份
  async backup() {
    await this.ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `backup-${timestamp}.json`);

    console.log('🔄 开始数据备份...');

    try {
      const data = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data: {
          customers: await Customer.find({}),
          contacts: await ContactRecord.find({}),
          users: await User.find({}).select('-password'),
          bills: await Bill.find({})
        }
      };

      await fs.writeFile(backupPath, JSON.stringify(data, null, 2));
      console.log(`✅ 数据备份完成: ${backupPath}`);
      console.log(`📊 备份统计:
        - 客户: ${data.data.customers.length} 条
        - 联系记录: ${data.data.contacts.length} 条  
        - 用户: ${data.data.users.length} 条
        - 账单: ${data.data.bills.length} 条`);

      return backupPath;
    } catch (error) {
      console.error('❌ 数据备份失败:', error);
      throw error;
    }
  }

  // 数据还原
  async restore(backupPath) {
    console.log('🔄 开始数据还原...');

    try {
      const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
      const { data } = backupData;

      // 清空现有数据（谨慎操作）
      console.log('⚠️  正在清空现有数据...');
      await Customer.deleteMany({});
      await ContactRecord.deleteMany({});
      await User.deleteMany({});
      await Bill.deleteMany({});

      // 还原数据
      console.log('📥 正在还原数据...');
      if (data.customers?.length) {
        await Customer.insertMany(data.customers);
      }
      if (data.contacts?.length) {
        await ContactRecord.insertMany(data.contacts);
      }
      if (data.users?.length) {
        await User.insertMany(data.users);
      }
      if (data.bills?.length) {
        await Bill.insertMany(data.bills);
      }

      console.log(`✅ 数据还原完成:
        - 客户: ${data.customers?.length || 0} 条
        - 联系记录: ${data.contacts?.length || 0} 条
        - 用户: ${data.users?.length || 0} 条
        - 账单: ${data.bills?.length || 0} 条`);

    } catch (error) {
      console.error('❌ 数据还原失败:', error);
      throw error;
    }
  }

  // 数据迁移到云数据库
  async migrateToCloud(cloudUri) {
    console.log('🔄 开始数据迁移到云数据库...');

    try {
      // 备份本地数据
      const backupPath = await this.backup();

      // 连接云数据库
      console.log('🔌 连接云数据库...');
      await mongoose.disconnect();
      await mongoose.connect(cloudUri);
      console.log('✅ 云数据库连接成功');

      // 还原数据到云数据库
      await this.restore(backupPath);

      console.log('✅ 数据迁移完成！');
    } catch (error) {
      console.error('❌ 数据迁移失败:', error);
      throw error;
    }
  }

  // 列出所有备份文件
  async listBackups() {
    await this.ensureBackupDir();
    const files = await fs.readdir(this.backupDir);
    const backups = files
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .sort()
      .reverse();

    console.log('📂 可用的备份文件:');
    backups.forEach((file, index) => {
      const timestamp = file.replace('backup-', '').replace('.json', '');
      console.log(`${index + 1}. ${file} (${timestamp})`);
    });

    return backups;
  }

  // 清理旧备份（保留最近10个）
  async cleanupBackups() {
    const backups = await this.listBackups();
    if (backups.length > 10) {
      const toDelete = backups.slice(10);
      for (const file of toDelete) {
        await fs.unlink(path.join(this.backupDir, file));
      }
      console.log(`🗑️ 已清理 ${toDelete.length} 个旧备份文件`);
    }
  }
}

module.exports = DataManager;

// 如果直接运行此脚本，则执行相应操作
if (require.main === module) {
  const command = process.argv[2];
  const arg = process.argv[3];

  const dataManager = new DataManager();

  (async () => {
    try {
      // 连接数据库
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/acrm');

      switch (command) {
        case 'backup':
          await dataManager.backup();
          break;
        case 'restore':
          if (!arg) {
            console.error('❌ 请指定备份文件路径');
            process.exit(1);
          }
          await dataManager.restore(arg);
          break;
        case 'migrate':
          if (!arg) {
            console.error('❌ 请指定云数据库连接字符串');
            process.exit(1);
          }
          await dataManager.migrateToCloud(arg);
          break;
        case 'list':
          await dataManager.listBackups();
          break;
        case 'cleanup':
          await dataManager.cleanupBackups();
          break;
        default:
          console.log(`
数据管理工具使用方法:

node data-management.js backup              # 备份数据
node data-management.js restore <备份文件>   # 还原数据
node data-management.js migrate <云数据库URI> # 迁移到云数据库
node data-management.js list                # 列出备份文件
node data-management.js cleanup             # 清理旧备份
          `);
      }
    } catch (error) {
      console.error('❌ 操作失败:', error);
    } finally {
      await mongoose.disconnect();
      process.exit(0);
    }
  })();
} 