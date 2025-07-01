/**
 * 性能优化工具
 * 针对Railway + Vercel部署方案的优化策略
 */

// API请求缓存
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

/**
 * 带缓存的API请求
 */
export const cachedApiRequest = async (url: string, options: RequestInit = {}) => {
  const cacheKey = `${url}_${JSON.stringify(options)}`;
  const cached = apiCache.get(cacheKey);
  
  // 检查缓存是否有效
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('🚀 使用缓存数据:', url);
    return cached.data;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await response.json();
    
    // 缓存成功的响应
    if (response.ok) {
      apiCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
    }
    
    return data;
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
};

/**
 * API请求重试机制
 */
export const retryApiRequest = async (
  url: string, 
  options: RequestInit = {}, 
  maxRetries = 3,
  delay = 1000
) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return await response.json();
      }
      
      // 如果是服务器错误，进行重试
      if (response.status >= 500 && i < maxRetries - 1) {
        console.warn(`API请求失败，${delay}ms后重试... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // 指数退避
        continue;
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      
      console.warn(`网络错误，${delay}ms后重试... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

/**
 * 预加载关键数据
 */
export const preloadCriticalData = async () => {
  const criticalEndpoints = [
    '/api/customers?limit=10',
    '/api/reports/dashboard',
    '/api/users/profile',
  ];
  
  console.log('🔄 预加载关键数据...');
  
  const promises = criticalEndpoints.map(endpoint => 
    cachedApiRequest(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`)
      .catch(error => console.warn(`预加载失败: ${endpoint}`, error))
  );
  
  await Promise.allSettled(promises);
  console.log('✅ 关键数据预加载完成');
};

/**
 * 网络状态监听
 */
export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private isOnline = navigator.onLine;
  private callbacks: Array<(online: boolean) => void> = [];
  
  static getInstance() {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }
  
  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyCallbacks(true);
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyCallbacks(false);
    });
  }
  
  private notifyCallbacks(online: boolean) {
    this.callbacks.forEach(callback => callback(online));
  }
  
  onStatusChange(callback: (online: boolean) => void) {
    this.callbacks.push(callback);
  }
  
  getStatus() {
    return this.isOnline;
  }
}

/**
 * 请求超时控制
 */
export const timeoutRequest = (
  promise: Promise<any>, 
  timeout = 10000,
  timeoutMessage = '请求超时，请检查网络连接'
) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(timeoutMessage)), timeout)
    )
  ]);
};

/**
 * 批量请求优化
 */
export const batchRequests = async <T>(
  requests: Array<() => Promise<T>>,
  concurrency = 3
): Promise<T[]> => {
  const results: T[] = [];
  
  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(request => request())
    );
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results[i + index] = result.value;
      } else {
        console.error(`批量请求失败 [${i + index}]:`, result.reason);
      }
    });
  }
  
  return results;
};

/**
 * 性能监控
 */
export class PerformanceMonitor {
  private static metrics: Array<{
    name: string;
    duration: number;
    timestamp: number;
  }> = [];
  
  static startTimer(name: string) {
    const startTime = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - startTime;
        this.metrics.push({
          name,
          duration,
          timestamp: Date.now(),
        });
        
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  }
  
  static getMetrics() {
    return this.metrics;
  }
  
  static getAverageTime(name: string) {
    const filtered = this.metrics.filter(m => m.name === name);
    if (filtered.length === 0) return 0;
    
    const total = filtered.reduce((sum, m) => sum + m.duration, 0);
    return total / filtered.length;
  }
  
  static reportSlowRequests(threshold = 2000) {
    const slowRequests = this.metrics.filter(m => m.duration > threshold);
    
    if (slowRequests.length > 0) {
      console.warn('🐌 发现慢请求:', slowRequests);
      return slowRequests;
    }
    
    return [];
  }
}

/**
 * 离线存储支持
 */
export class OfflineStorage {
  private static readonly STORAGE_KEY = 'acrm_offline_data';
  
  static save(key: string, data: any) {
    try {
      const storage = this.getStorage();
      storage[key] = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storage));
    } catch (error) {
      console.error('离线存储失败:', error);
    }
  }
  
  static load(key: string, maxAge = 30 * 60 * 1000) { // 30分钟
    try {
      const storage = this.getStorage();
      const item = storage[key];
      
      if (!item) return null;
      
      if (Date.now() - item.timestamp > maxAge) {
        delete storage[key];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storage));
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.error('离线存储读取失败:', error);
      return null;
    }
  }
  
  private static getStorage() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }
}

// 导出默认配置
export const performanceConfig = {
  apiTimeout: 10000,        // API超时时间
  cacheMaxAge: 5 * 60 * 1000, // 缓存时间
  retryAttempts: 3,         // 重试次数
  concurrency: 3,           // 并发请求数
  slowRequestThreshold: 2000, // 慢请求阈值
}; 