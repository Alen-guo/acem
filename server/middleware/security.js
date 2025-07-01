/**
 * 生产环境安全中间件配置
 */
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

/**
 * 配置安全中间件
 */
const configureSecurityMiddleware = (app) => {
  // 仅在生产环境应用安全配置
  if (process.env.NODE_ENV === 'production') {
    // 安全头配置
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", process.env.FRONTEND_URL].filter(Boolean),
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // 响应压缩
    app.use(compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      level: 6, // 压缩级别 (1-9)
      threshold: 1024, // 只压缩大于1KB的响应
    }));

    // 生产环境日志
    app.use(morgan('combined', {
      skip: (req, res) => {
        // 跳过健康检查和静态资源的日志
        return req.url === '/api/health' || req.url.startsWith('/static');
      }
    }));

    console.log('🔒 生产环境安全中间件已启用');
  } else {
    // 开发环境日志
    app.use(morgan('dev'));
    console.log('🛠️ 开发环境日志中间件已启用');
  }
};

/**
 * API限流中间件
 */
const rateLimiter = require('express-rate-limit');

const createRateLimiter = () => {
  return rateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 每个IP最多100个请求
    message: {
      status: 'error',
      message: '请求过于频繁，请稍后再试',
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
    },
    standardHeaders: true, // 返回限流信息在 `RateLimit-*` 头中
    legacyHeaders: false, // 禁用 `X-RateLimit-*` 头
    // 跳过健康检查端点
    skip: (req) => req.url === '/api/health',
  });
};

/**
 * 请求大小限制
 */
const requestSizeLimit = (app) => {
  // 限制JSON请求大小
  app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  }));
  
  // 限制URL编码请求大小
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }));
};

module.exports = {
  configureSecurityMiddleware,
  createRateLimiter,
  requestSizeLimit
}; 