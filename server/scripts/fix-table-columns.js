/**
 * 修复数据库表字段名脚本
 * 将驼峰命名的字段改为下划线命名，与 Sequelize underscored: true 配置一致
 */
const { sequelize } = require('../config/database');

async function fixTableColumns() {
  try {
    console.log('🔧 开始修复数据库表字段名...');
    
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 修复 bills 表的字段名
    console.log('📋 修复 bills 表字段名...');
    
    // 先检查表结构
    const [results] = await sequelize.query("SHOW COLUMNS FROM bills");
    console.log('当前 bills 表字段:', results.map(r => r.Field));
    
    // 如果字段是驼峰命名，则需要修改为下划线命名
    const columnsToFix = [
      { old: 'billDate', new: 'bill_date' },
      { old: 'customerId', new: 'customer_id' },
      { old: 'projectName', new: 'project_name' },
      { old: 'isApproved', new: 'is_approved' },
      { old: 'approvedBy', new: 'approved_by' },
      { old: 'approvedAt', new: 'approved_at' },
      { old: 'createdBy', new: 'created_by' },
      { old: 'createdAt', new: 'created_at' },
      { old: 'updatedAt', new: 'updated_at' }
    ];
    
    for (const column of columnsToFix) {
      try {
        // 检查旧字段是否存在
        const fieldExists = results.some(r => r.Field === column.old);
        if (fieldExists) {
          console.log(`🔄 修改字段 ${column.old} → ${column.new}`);
          await sequelize.query(`ALTER TABLE bills CHANGE ${column.old} ${column.new} ${getColumnDefinition(column.new)}`);
        }
      } catch (error) {
        console.log(`⚠️  字段 ${column.old} 可能已经是正确格式:`, error.message);
      }
    }
    
    // 修复 customers 表的字段名
    console.log('📋 修复 customers 表字段名...');
    const [customerResults] = await sequelize.query("SHOW COLUMNS FROM customers");
    
    const customerColumnsToFix = [
      { old: 'industryPreference', new: 'industry_preference' },
      { old: 'communicationStyle', new: 'communication_style' },
      { old: 'cooperationStatus', new: 'cooperation_status' },
      { old: 'cooperationIntention', new: 'cooperation_intention' },
      { old: 'cooperationNotes', new: 'cooperation_notes' },
      { old: 'expectedValue', new: 'expected_value' },
      { old: 'assignedSalesperson', new: 'assigned_salesperson' },
      { old: 'contactCount', new: 'contact_count' },
      { old: 'lastContactDate', new: 'last_contact_date' },
      { old: 'nextFollowUp', new: 'next_follow_up' },
      { old: 'createdAt', new: 'created_at' },
      { old: 'updatedAt', new: 'updated_at' }
    ];
    
    for (const column of customerColumnsToFix) {
      try {
        const fieldExists = customerResults.some(r => r.Field === column.old);
        if (fieldExists) {
          console.log(`🔄 修改客户表字段 ${column.old} → ${column.new}`);
          await sequelize.query(`ALTER TABLE customers CHANGE ${column.old} ${column.new} ${getCustomerColumnDefinition(column.new)}`);
        }
      } catch (error) {
        console.log(`⚠️  客户表字段 ${column.old} 可能已经是正确格式:`, error.message);
      }
    }
    
    // 修复 contactrecords 表的字段名
    console.log('📋 修复 contactrecords 表字段名...');
    const contactColumnsToFix = [
      { old: 'customerId', new: 'customer_id' },
      { old: 'salespersonId', new: 'salesperson_id' },
      { old: 'contactDate', new: 'contact_date' },
      { old: 'contactMethod', new: 'contact_method' },
      { old: 'customerFeedback', new: 'customer_feedback' },
      { old: 'nextAction', new: 'next_action' },
      { old: 'needFollowUp', new: 'need_follow_up' },
      { old: 'followUpDate', new: 'follow_up_date' },
      { old: 'followUpReminder', new: 'follow_up_reminder' },
      { old: 'isCompleted', new: 'is_completed' },
      { old: 'createdAt', new: 'created_at' },
      { old: 'updatedAt', new: 'updated_at' }
    ];
    
    for (const column of contactColumnsToFix) {
      try {
        await sequelize.query(`ALTER TABLE contactrecords CHANGE ${column.old} ${column.new} ${getContactColumnDefinition(column.new)}`);
        console.log(`✅ 修改联系记录表字段 ${column.old} → ${column.new}`);
      } catch (error) {
        console.log(`⚠️  联系记录表字段 ${column.old} 可能已经是正确格式:`, error.message);
      }
    }
    
    console.log('🎉 数据库表字段名修复完成！');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 修复数据库表字段名失败:', error);
    process.exit(1);
  }
}

function getColumnDefinition(columnName) {
  const definitions = {
    'bill_date': 'DATE NOT NULL COMMENT "账单日期"',
    'customer_id': 'INT COMMENT "关联客户ID"',
    'project_name': 'VARCHAR(200) COMMENT "项目名称"',
    'is_approved': 'BOOLEAN DEFAULT FALSE',
    'approved_by': 'INT COMMENT "审核人ID"',
    'approved_at': 'DATETIME COMMENT "审核时间"',
    'created_by': 'INT NOT NULL COMMENT "创建人ID"',
    'created_at': 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    'updated_at': 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  };
  return definitions[columnName] || 'TEXT';
}

function getCustomerColumnDefinition(columnName) {
  const definitions = {
    'industry_preference': 'VARCHAR(100) COMMENT "行业偏好"',
    'communication_style': 'VARCHAR(100) COMMENT "沟通风格"',
    'cooperation_status': 'ENUM("潜在客户", "意向客户", "合作中", "已成交", "已流失") DEFAULT "潜在客户"',
    'cooperation_intention': 'INT COMMENT "合作意向度(1-10)"',
    'cooperation_notes': 'TEXT COMMENT "合作备注"',
    'expected_value': 'DECIMAL(15, 2) COMMENT "预期合作价值"',
    'assigned_salesperson': 'INT NOT NULL COMMENT "分配的销售员ID"',
    'contact_count': 'INT DEFAULT 0 COMMENT "联系次数"',
    'last_contact_date': 'DATETIME COMMENT "最后联系时间"',
    'next_follow_up': 'DATETIME COMMENT "下次跟进时间"',
    'created_at': 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    'updated_at': 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  };
  return definitions[columnName] || 'TEXT';
}

function getContactColumnDefinition(columnName) {
  const definitions = {
    'customer_id': 'INT NOT NULL COMMENT "客户ID"',
    'salesperson_id': 'INT NOT NULL COMMENT "销售员ID"',
    'contact_date': 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
    'contact_method': 'ENUM("电话", "邮件", "微信", "WhatsApp", "面谈", "视频会议", "其他") NOT NULL',
    'customer_feedback': 'TEXT COMMENT "客户反馈"',
    'next_action': 'TEXT COMMENT "下一步行动"',
    'need_follow_up': 'BOOLEAN DEFAULT FALSE',
    'follow_up_date': 'DATETIME',
    'follow_up_reminder': 'VARCHAR(500)',
    'is_completed': 'BOOLEAN DEFAULT TRUE',
    'created_at': 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    'updated_at': 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  };
  return definitions[columnName] || 'TEXT';
}

// 运行修复脚本
fixTableColumns(); 