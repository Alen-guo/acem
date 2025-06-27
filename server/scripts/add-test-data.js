/**
 * 添加测试数据脚本
 * 用于生成测试用的账单数据，包括不同工作表来源的数据
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// 数据库连接
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB Atlas 连接成功');
    } else {
      await mongoose.connect('mongodb://localhost:27017/acrm');
      console.log('本地MongoDB 连接成功');
    }
  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1);
  }
};

// 引入模型
const Bill = require('../models/Bill');
const User = require('../models/User');

// 添加测试账单数据
const addTestBills = async () => {
  try {
    // 获取或创建测试用户
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword', // 实际应用中应该是哈希后的密码
        role: 'user'
      });
      await testUser.save();
      console.log('创建测试用户成功');
    }

    // 清除现有的测试数据
    await Bill.deleteMany({ 
      createdBy: testUser._id,
      title: { $regex: /(汇总表|明细表|清单表|总表)/ }
    });

    // 创建测试账单数据 - 模拟不同Excel工作表的数据
    const testBills = [
      // 汇总表工作表数据
      {
        title: '办公用品采购',
        description: JSON.stringify({
          sheetName: '汇总表',
          originalIndex: 1,
          originalData: {
            '项目': '办公用品采购',
            '数量': 50,
            '单价': 120,
            '金额': 6000,
            '备注': '笔记本、文具等'
          }
        }),
        amount: 6000,
        type: '支出',
        category: '汇总表',
        date: new Date('2025-06-15'),
        status: '已支付',
        tags: ['汇总表', '办公用品'],
        createdBy: testUser._id
      },
      {
        title: '差旅费报销',
        description: JSON.stringify({
          sheetName: '汇总表',
          originalIndex: 2,
          originalData: {
            '项目': '差旅费报销',
            '出差地点': '上海',
            '天数': 3,
            '金额': 2800,
            '备注': '业务出差'
          }
        }),
        amount: 2800,
        type: '支出',
        category: '汇总表',
        date: new Date('2025-06-18'),
        status: '已支付',
        tags: ['汇总表', '差旅费'],
        createdBy: testUser._id
      },
      {
        title: '项目收入',
        description: JSON.stringify({
          sheetName: '汇总表',
          originalIndex: 3,
          originalData: {
            '项目': '项目收入',
            '客户': 'ABC公司',
            '合同金额': 50000,
            '已收金额': 25000,
            '备注': '首期款项'
          }
        }),
        amount: 25000,
        type: '收入',
        category: '汇总表',
        date: new Date('2025-06-20'),
        status: '已支付',
        tags: ['汇总表', '项目收入'],
        createdBy: testUser._id
      },

      // 明细表工作表数据
      {
        title: '电脑设备-笔记本',
        description: JSON.stringify({
          sheetName: '明细表',
          originalIndex: 1,
          originalData: {
            '设备名称': '联想ThinkPad',
            '型号': 'T14s',
            '数量': 2,
            '单价': 7500,
            '总价': 15000,
            '供应商': '联想授权店'
          }
        }),
        amount: 15000,
        type: '支出',
        category: '明细表',
        date: new Date('2025-06-10'),
        status: '已支付',
        tags: ['明细表', '设备采购'],
        createdBy: testUser._id
      },
      {
        title: '电脑设备-显示器',
        description: JSON.stringify({
          sheetName: '明细表',
          originalIndex: 2,
          originalData: {
            '设备名称': '戴尔显示器',
            '型号': 'U2720Q',
            '数量': 4,
            '单价': 3200,
            '总价': 12800,
            '供应商': '戴尔官方'
          }
        }),
        amount: 12800,
        type: '支出',
        category: '明细表',
        date: new Date('2025-06-12'),
        status: '已支付',
        tags: ['明细表', '设备采购'],
        createdBy: testUser._id
      },
      {
        title: '软件授权费',
        description: JSON.stringify({
          sheetName: '明细表',
          originalIndex: 3,
          originalData: {
            '软件名称': 'Microsoft Office 365',
            '授权用户数': 20,
            '单价': 68,
            '年费': 1360,
            '有效期': '2025-2026年'
          }
        }),
        amount: 1360,
        type: '支出',
        category: '明细表',
        date: new Date('2025-06-14'),
        status: '已支付',
        tags: ['明细表', '软件授权'],
        createdBy: testUser._id
      },

      // 清单表工作表数据
      {
        title: '服务费收入-咨询',
        description: JSON.stringify({
          sheetName: '清单表',
          originalIndex: 1,
          originalData: {
            '服务类型': '管理咨询',
            '客户名称': 'XYZ集团',
            '服务周期': '3个月',
            '总费用': 80000,
            '已完成': '60%'
          }
        }),
        amount: 48000,
        type: '收入',
        category: '清单表',
        date: new Date('2025-06-25'),
        status: '已支付',
        tags: ['清单表', '咨询收入'],
        createdBy: testUser._id
      },
      {
        title: '服务费收入-技术支持',
        description: JSON.stringify({
          sheetName: '清单表',
          originalIndex: 2,
          originalData: {
            '服务类型': '技术支持',
            '客户名称': 'DEF科技',
            '服务内容': '系统维护',
            '月费': 12000,
            '支付月份': '2025年6月'
          }
        }),
        amount: 12000,
        type: '收入',
        category: '清单表',
        date: new Date('2025-06-30'),
        status: '已支付',
        tags: ['清单表', '技术支持'],
        createdBy: testUser._id
      },

      // 总表工作表数据
      {
        title: '房租支出',
        description: JSON.stringify({
          sheetName: '总表',
          originalIndex: 1,
          originalData: {
            '费用类型': '办公场地租金',
            '面积': '200平方米',
            '月租金': 15000,
            '季度': '2025年Q2',
            '总计': 45000
          }
        }),
        amount: 45000,
        type: '支出',
        category: '总表',
        date: new Date('2025-06-01'),
        status: '已支付',
        tags: ['总表', '房租'],
        createdBy: testUser._id
      },
      {
        title: '水电费',
        description: JSON.stringify({
          sheetName: '总表',
          originalIndex: 2,
          originalData: {
            '费用类型': '水电费',
            '电费': 3200,
            '水费': 800,
            '网络费': 1000,
            '总计': 5000
          }
        }),
        amount: 5000,
        type: '支出',
        category: '总表',
        date: new Date('2025-06-05'),
        status: '已支付',
        tags: ['总表', '水电费'],
        createdBy: testUser._id
      },
      {
        title: '销售业绩奖金',
        description: JSON.stringify({
          sheetName: '总表',
          originalIndex: 3,
          originalData: {
            '奖金类型': '季度销售奖金',
            '获奖人数': 8,
            '人均奖金': 5000,
            '总奖金': 40000,
            '季度': '2025年Q2'
          }
        }),
        amount: 40000,
        type: '收入',
        category: '总表',
        date: new Date('2025-06-28'),
        status: '已支付',
        tags: ['总表', '奖金收入'],
        createdBy: testUser._id
      }
    ];

    // 批量插入测试数据
    const insertedBills = await Bill.insertMany(testBills);
    console.log(`成功添加 ${insertedBills.length} 条测试账单数据`);

    // 按工作表分组统计
    const groupStats = {};
    testBills.forEach(bill => {
      const sheetName = bill.category;
      if (!groupStats[sheetName]) {
        groupStats[sheetName] = {
          count: 0,
          totalIncome: 0,
          totalExpense: 0
        };
      }
      groupStats[sheetName].count++;
      if (bill.type === '收入') {
        groupStats[sheetName].totalIncome += bill.amount;
      } else {
        groupStats[sheetName].totalExpense += bill.amount;
      }
    });

    console.log('\n工作表分组统计:');
    Object.entries(groupStats).forEach(([sheetName, stats]) => {
      console.log(`${sheetName}:`);
      console.log(`  - 记录数: ${stats.count} 条`);
      console.log(`  - 收入: ¥${stats.totalIncome.toLocaleString()}`);
      console.log(`  - 支出: ¥${stats.totalExpense.toLocaleString()}`);
      console.log(`  - 结余: ¥${(stats.totalIncome - stats.totalExpense).toLocaleString()}`);
    });

    return insertedBills;
  } catch (error) {
    console.error('添加测试数据失败:', error);
    throw error;
  }
};

// 主函数
const main = async () => {
  try {
    await connectDB();
    await addTestBills();
    console.log('\n测试数据添加完成！');
    console.log('请在月份表格展示页面查看按工作表分组的数据');
    process.exit(0);
  } catch (error) {
    console.error('操作失败:', error);
    process.exit(1);
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { addTestBills }; 