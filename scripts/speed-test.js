#!/usr/bin/env node

/**
 * ACRM系统部署方案速度测试工具
 * 测试不同部署方案的访问延迟
 */

const https = require('https');
const http = require('http');

console.log('🚀 ACRM部署方案速度测试');
console.log('========================================');

/**
 * 测试URL响应时间
 */
function testSpeed(url, name) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      resolve({
        name,
        url,
        status: res.statusCode,
        responseTime,
        success: res.statusCode < 400
      });
    });
    
    req.on('error', (err) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      resolve({
        name,
        url,
        status: 'ERROR',
        responseTime,
        success: false,
        error: err.message
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        name,
        url,
        status: 'TIMEOUT',
        responseTime: 10000,
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

/**
 * 批量测试多个URL
 */
async function batchTest(urls, rounds = 3) {
  const results = [];
  
  for (let round = 1; round <= rounds; round++) {
    console.log(`\n📊 第 ${round} 轮测试:`);
    
    for (const { url, name } of urls) {
      const result = await testSpeed(url, name);
      results.push({ ...result, round });
      
      const status = result.success ? '✅' : '❌';
      const time = result.responseTime < 1000 
        ? `${result.responseTime}ms` 
        : `${(result.responseTime / 1000).toFixed(2)}s`;
      
      console.log(`  ${status} ${name}: ${time}`);
      
      if (!result.success && result.error) {
        console.log(`     错误: ${result.error}`);
      }
      
      // 避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}

/**
 * 计算平均响应时间
 */
function calculateAverage(results) {
  const grouped = {};
  
  results.forEach(result => {
    if (!grouped[result.name]) {
      grouped[result.name] = [];
    }
    if (result.success) {
      grouped[result.name].push(result.responseTime);
    }
  });
  
  const averages = {};
  Object.keys(grouped).forEach(name => {
    const times = grouped[name];
    if (times.length > 0) {
      averages[name] = {
        average: Math.round(times.reduce((a, b) => a + b) / times.length),
        min: Math.min(...times),
        max: Math.max(...times),
        success: times.length
      };
    } else {
      averages[name] = {
        average: 0,
        min: 0,
        max: 0,
        success: 0
      };
    }
  });
  
  return averages;
}

/**
 * 主测试函数
 */
async function main() {
  // 测试目标URLs
  const testUrls = [
    // Vercel示例站点 (前端)
    { name: 'Vercel前端 (全球CDN)', url: 'https://vercel.com' },
    
    // Railway示例API (后端)
    { name: 'Railway后端 (美国西部)', url: 'https://railway.app' },
    
    // 腾讯云测试
    { name: '腾讯云 (中国)', url: 'https://cloud.tencent.com' },
    
    // 阿里云测试
    { name: '阿里云 (中国)', url: 'https://www.aliyun.com' },
    
    // 国外知名服务测试
    { name: 'GitHub (全球)', url: 'https://github.com' },
    
    // 国内CDN测试
    { name: '百度 (国内CDN)', url: 'https://www.baidu.com' }
  ];
  
  console.log('正在测试各服务商的访问速度...\n');
  console.log('测试位置: 中国大陆');
  console.log('测试轮数: 3轮');
  console.log('超时时间: 10秒\n');
  
  // 执行测试
  const results = await batchTest(testUrls, 3);
  
  // 计算平均值
  const averages = calculateAverage(results);
  
  // 显示结果
  console.log('\n📈 测试结果汇总:');
  console.log('========================================');
  
  Object.keys(averages).forEach(name => {
    const avg = averages[name];
    if (avg.success > 0) {
      console.log(`\n🎯 ${name}:`);
      console.log(`   平均响应时间: ${avg.average}ms`);
      console.log(`   最快响应: ${avg.min}ms`);
      console.log(`   最慢响应: ${avg.max}ms`);
      console.log(`   成功率: ${avg.success}/3`);
      
      // 速度评级
      let rating = '';
      if (avg.average < 100) rating = '🚀 极快';
      else if (avg.average < 300) rating = '⚡ 很快';
      else if (avg.average < 500) rating = '✅ 良好';
      else if (avg.average < 1000) rating = '⚠️ 一般';
      else rating = '🐌 较慢';
      
      console.log(`   速度评级: ${rating}`);
    } else {
      console.log(`\n❌ ${name}: 连接失败`);
    }
  });
  
  // 给出建议
  console.log('\n💡 部署建议:');
  console.log('========================================');
  
  const vercelSpeed = averages['Vercel前端 (全球CDN)']?.average || 0;
  const railwaySpeed = averages['Railway后端 (美国西部)']?.average || 0;
  const tencentSpeed = averages['腾讯云 (中国)']?.average || 0;
  
  if (vercelSpeed > 0 && vercelSpeed < 300) {
    console.log('✅ Vercel前端: 访问速度良好，推荐使用');
  } else {
    console.log('⚠️ Vercel前端: 访问速度一般，考虑国内CDN');
  }
  
  if (railwaySpeed > 0 && railwaySpeed < 500) {
    console.log('✅ Railway后端: API响应可接受');
  } else if (railwaySpeed > 500) {
    console.log('⚠️ Railway后端: API响应较慢，建议考虑国内云服务');
  } else {
    console.log('❌ Railway后端: 无法访问或响应超时');
  }
  
  if (tencentSpeed > 0 && tencentSpeed < 200) {
    console.log('🏆 腾讯云: 国内访问最快，推荐商业项目使用');
  }
  
  console.log('\n🎯 最终建议:');
  if (railwaySpeed > 0 && railwaySpeed < 800) {
    console.log('Railway + Vercel方案可用，适合个人项目和原型开发');
    console.log('如需更好的用户体验，建议使用腾讯云/阿里云');
  } else {
    console.log('Railway访问较慢，强烈建议使用国内云服务商');
  }
  
  console.log('\n⏱️ 测试完成!');
}

// 运行测试
main().catch(console.error); 