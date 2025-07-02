/**
 * 数据库表创建脚本
 * 用于手动创建必要的数据库表
 */
const { sequelize } = require('../config/database');

async function createTables() {
  try {
    console.log('🚀 开始创建数据库表...');
    
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 创建基础表结构，不使用复杂索引
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        fullName VARCHAR(100) NOT NULL,
        phone VARCHAR(50),
        avatar VARCHAR(500),
        department VARCHAR(100),
        position VARCHAR(100),
        role ENUM('销售员', '销售主管', '销售经理', '管理员') DEFAULT '销售员',
        permissions JSON,
        salesTarget DECIMAL(15, 2),
        commission DECIMAL(5, 4),
        territory JSON,
        isActive BOOLEAN DEFAULT TRUE,
        lastLogin DATETIME,
        emailVerified BOOLEAN DEFAULT FALSE,
        notificationSettings JSON,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ users 表创建成功');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL COMMENT '客户姓名',
        email VARCHAR(255) NOT NULL UNIQUE COMMENT '邮箱地址',
        phone VARCHAR(50) COMMENT '电话号码',
        company VARCHAR(200) COMMENT '公司名称',
        position VARCHAR(100) COMMENT '职位',
        country VARCHAR(50) COMMENT '国家',
        city VARCHAR(50) COMMENT '城市',
        tags JSON COMMENT '标签列表',
        personality TEXT COMMENT '性格特点',
        interests JSON COMMENT '兴趣爱好',
        industryPreference VARCHAR(100) COMMENT '行业偏好',
        communicationStyle VARCHAR(100) COMMENT '沟通风格',
        relationships JSON COMMENT '关系网络',
        resources JSON COMMENT '拥有资源',
        cooperationStatus ENUM('潜在客户', '意向客户', '合作中', '已成交', '已流失') DEFAULT '潜在客户',
        cooperationIntention INT COMMENT '合作意向度(1-10)',
        cooperationNotes TEXT COMMENT '合作备注',
        expectedValue DECIMAL(15, 2) COMMENT '预期合作价值',
        assignedSalesperson INT NOT NULL COMMENT '分配的销售员ID',
        source VARCHAR(100) COMMENT '客户来源',
        priority ENUM('低', '中', '高') DEFAULT '中',
        contactCount INT DEFAULT 0 COMMENT '联系次数',
        lastContactDate DATETIME COMMENT '最后联系时间',
        nextFollowUp DATETIME COMMENT '下次跟进时间',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_assigned_salesperson (assignedSalesperson),
        INDEX idx_cooperation_status (cooperationStatus)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ customers 表创建成功');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS bills (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(200) NOT NULL COMMENT '账单标题',
        amount DECIMAL(15, 2) NOT NULL COMMENT '金额',
        type ENUM('收入', '支出') NOT NULL COMMENT '账单类型',
        category VARCHAR(100) NOT NULL COMMENT '分类',
        description TEXT COMMENT '描述',
        billDate DATE NOT NULL COMMENT '账单日期',
        month INT NOT NULL COMMENT '月份',
        year INT NOT NULL COMMENT '年份',
        status ENUM('待处理', '已确认', '已支付', '已取消') DEFAULT '待处理',
        priority ENUM('低', '中', '高') DEFAULT '中',
        customerId INT COMMENT '关联客户ID',
        projectName VARCHAR(200) COMMENT '项目名称',
        attachments JSON COMMENT '附件列表',
        isApproved BOOLEAN DEFAULT FALSE,
        approvedBy INT COMMENT '审核人ID',
        approvedAt DATETIME COMMENT '审核时间',
        createdBy INT NOT NULL COMMENT '创建人ID',
        tags JSON COMMENT '标签列表',
        notes TEXT COMMENT '备注',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_created_by_date (createdBy, billDate),
        INDEX idx_year_month (year, month)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ bills 表创建成功');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS contactrecords (
        id INT PRIMARY KEY AUTO_INCREMENT,
        customerId INT NOT NULL COMMENT '客户ID',
        salespersonId INT NOT NULL COMMENT '销售员ID',
        contactDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        contactMethod ENUM('电话', '邮件', '微信', 'WhatsApp', '面谈', '视频会议', '其他') NOT NULL,
        subject VARCHAR(200) NOT NULL COMMENT '沟通主题',
        content TEXT NOT NULL COMMENT '详细内容',
        duration INT COMMENT '沟通时长（分钟）',
        result ENUM('非常好', '好', '一般', '不理想', '失败') NOT NULL,
        customerFeedback TEXT COMMENT '客户反馈',
        nextAction TEXT COMMENT '下一步行动',
        needFollowUp BOOLEAN DEFAULT FALSE,
        followUpDate DATETIME,
        followUpReminder VARCHAR(500),
        attachments JSON,
        importance ENUM('低', '中', '高') DEFAULT '中',
        isCompleted BOOLEAN DEFAULT TRUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_customer_date (customerId, contactDate),
        INDEX idx_salesperson_date (salespersonId, contactDate)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ contactrecords 表创建成功');
    
    console.log('🎉 所有数据库表创建完成！');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 创建数据库表失败:', error);
    process.exit(1);
  }
}

// 运行创建脚本
createTables(); 