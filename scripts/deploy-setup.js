#!/usr/bin/env node

/**
 * ACRM系统部署设置脚本
 * 自动化部署准备工作
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 ACRM系统部署设置脚本');
console.log('================================');

/**
 * 生成JWT密钥
 */
function generateJWTSecret() {
  const secret = crypto.randomBytes(32).toString('hex');
  console.log('🔐 JWT密钥已生成:');
  console.log(`JWT_SECRET=${secret}`);
  console.log('');
  return secret;
}

/**
 * 检查必要文件是否存在
 */
function checkRequiredFiles() {
  const requiredFiles = [
    'server/package.json',
    'client/package.json',
    'server/config/database.js',
    'server/app.js'
  ];

  console.log('📋 检查必要文件...');
  
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - 文件不存在`);
      return false;
    }
  }
  
  console.log('');
  return true;
}

/**
 * 检查依赖包
 */
function checkDependencies() {
  console.log('📦 检查生产环境依赖...');
  
  const serverPackagePath = path.join(process.cwd(), 'server/package.json');
  const clientPackagePath = path.join(process.cwd(), 'client/package.json');
  
  try {
    const serverPackage = JSON.parse(fs.readFileSync(serverPackagePath, 'utf8'));
    const clientPackage = JSON.parse(fs.readFileSync(clientPackagePath, 'utf8'));
    
    // 检查服务器依赖
    const requiredServerDeps = ['express', 'sequelize', 'mysql2', 'dotenv', 'cors', 'jsonwebtoken'];
    const serverDeps = Object.keys(serverPackage.dependencies || {});
    
    console.log('后端依赖检查:');
    for (const dep of requiredServerDeps) {
      if (serverDeps.includes(dep)) {
        console.log(`  ✅ ${dep}`);
      } else {
        console.log(`  ❌ ${dep} - 缺少依赖`);
      }
    }
    
    // 检查前端依赖
    const requiredClientDeps = ['react', 'antd', 'axios', 'react-router-dom'];
    const clientDeps = Object.keys(clientPackage.dependencies || {});
    
    console.log('前端依赖检查:');
    for (const dep of requiredClientDeps) {
      if (clientDeps.includes(dep)) {
        console.log(`  ✅ ${dep}`);
      } else {
        console.log(`  ❌ ${dep} - 缺少依赖`);
      }
    }
    
  } catch (error) {
    console.log('❌ 依赖检查失败:', error.message);
    return false;
  }
  
  console.log('');
  return true;
}

/**
 * 创建环境变量模板
 */
function createEnvTemplate() {
  console.log('📝 创建环境变量模板...');
  
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  
  const envTemplate = `# ACRM生产环境配置
# 复制此文件内容到Railway和Vercel的环境变量设置中

# =================================
# Railway后端环境变量
# =================================
NODE_ENV=production
PORT=3001

# 数据库配置 (PlanetScale)
DATABASE_URL=mysql://username:password@host.us-east-2.psdb.cloud/acrm-prod?sslaccept=strict

# 或者使用Railway MySQL (备选)
# DB_HOST=containers-us-west-xxx.railway.app
# DB_PORT=3306
# DB_NAME=railway
# DB_USER=root
# DB_PASSWORD=your_password

# JWT配置
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=7d

# CORS配置
FRONTEND_URL=https://your-app-name.vercel.app

# 邮件配置 (可选)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# API限流配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# =================================
# Vercel前端环境变量
# =================================
VITE_API_BASE_URL=https://your-railway-app.railway.app/api
`;

  try {
    fs.writeFileSync('.env.production', envTemplate);
    console.log('✅ 环境变量模板已创建: .env.production');
    console.log('   请根据实际情况修改配置值');
  } catch (error) {
    console.log('❌ 创建环境变量模板失败:', error.message);
  }
  
  console.log('');
}

/**
 * 创建部署清单
 */
function createDeploymentChecklist() {
  console.log('📋 创建部署清单...');
  
  const checklist = `# ACRM系统部署清单

## 准备阶段
- [ ] 代码已推送到GitHub
- [ ] 本地测试通过
- [ ] 数据库迁移脚本准备完成

## 数据库设置
- [ ] PlanetScale账号已注册
- [ ] 数据库 'acrm-prod' 已创建
- [ ] 数据库连接字符串已获取
- [ ] 数据库连接测试通过

## Railway后端部署
- [ ] Railway账号已注册并连接GitHub
- [ ] 新项目已创建
- [ ] 根目录设置为 'server'
- [ ] 环境变量已配置:
  - [ ] NODE_ENV=production
  - [ ] PORT=3001
  - [ ] DATABASE_URL=数据库连接字符串
  - [ ] JWT_SECRET=生成的密钥
  - [ ] FRONTEND_URL=Vercel域名
- [ ] 构建设置已配置
- [ ] 部署成功，健康检查通过

## Vercel前端部署
- [ ] Vercel账号已注册并连接GitHub
- [ ] 新项目已创建
- [ ] 框架预设选择 'Vite'
- [ ] 根目录设置为 'client'
- [ ] 环境变量已配置:
  - [ ] VITE_API_BASE_URL=Railway API域名
- [ ] 构建设置已配置
- [ ] 部署成功，页面可正常访问

## 功能测试
- [ ] 前端页面正常加载
- [ ] API接口正常响应
- [ ] 数据库连接正常
- [ ] 用户认证功能正常(如已启用)
- [ ] CORS配置正确
- [ ] 各页面功能正常

## 安全检查
- [ ] 生产环境环境变量已设置
- [ ] 敏感信息未暴露在代码中
- [ ] HTTPS已启用
- [ ] 安全头已配置
- [ ] API限流已启用

## 监控和维护
- [ ] 日志监控已设置
- [ ] 错误监控已启用
- [ ] 性能监控已配置
- [ ] 备份策略已制定

## 完成
- [ ] 所有功能测试通过
- [ ] 生产环境稳定运行
- [ ] 文档已更新
- [ ] 团队已通知

---
部署完成时间: ${new Date().toISOString()}
`;

  try {
    fs.writeFileSync('deployment-checklist.md', checklist);
    console.log('✅ 部署清单已创建: deployment-checklist.md');
  } catch (error) {
    console.log('❌ 创建部署清单失败:', error.message);
  }
  
  console.log('');
}

/**
 * 主函数
 */
function main() {
  console.log('开始部署设置...\n');
  
  // 检查必要文件
  if (!checkRequiredFiles()) {
    console.log('❌ 部署设置失败: 缺少必要文件');
    process.exit(1);
  }
  
  // 检查依赖
  if (!checkDependencies()) {
    console.log('⚠️  警告: 存在缺少的依赖，请检查package.json');
  }
  
  // 生成JWT密钥
  generateJWTSecret();
  
  // 创建环境变量模板
  createEnvTemplate();
  
  // 创建部署清单
  createDeploymentChecklist();
  
  console.log('🎉 部署设置完成！');
  console.log('');
  console.log('下一步:');
  console.log('1. 查看 .env.production 文件，根据实际情况修改配置');
  console.log('2. 按照 deployment-checklist.md 逐步完成部署');
  console.log('3. 参考 docs/deployment-guide.md 获取详细指导');
  console.log('');
  console.log('祝您部署顺利！🚀');
}

// 运行主函数
main(); 