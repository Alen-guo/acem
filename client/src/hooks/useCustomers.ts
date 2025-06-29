/**
 * 客户数据管理 Hook
 * 提供客户列表的增删改查功能，统一管理加载状态和错误处理
 */
import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { customerAPI } from '../services/api';
import { Customer, ApiResponse } from '../types';

interface UseCustomersOptions {
  autoFetch?: boolean;
  initialFilters?: {
    search?: string;
    status?: string;
    priority?: string;
  };
}

interface UseCustomersReturn {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  pagination: {
    current: number;
    total: number;
    pageSize: number;
  };
  filters: {
    search: string;
    status: string;
    priority: string;
  };
  // Actions
  fetchCustomers: () => Promise<void>;
  createCustomer: (data: Partial<Customer>) => Promise<boolean>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<boolean>;
  deleteCustomer: (id: string) => Promise<boolean>;
  setFilters: (filters: Partial<typeof filters>) => void;
  setPagination: (page: number, pageSize?: number) => void;
  refresh: () => Promise<void>;
}

export const useCustomers = (options: UseCustomersOptions = {}): UseCustomersReturn => {
  const { autoFetch = true, initialFilters = {} } = options;

  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPaginationState] = useState({
    current: 1,
    total: 0,
    pageSize: 20
  });
  const [filters, setFiltersState] = useState({
    search: initialFilters.search || '',
    status: initialFilters.status || 'all',
    priority: initialFilters.priority || 'all'
  });

  // 获取客户列表
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.priority !== 'all' && { priority: filters.priority })
      };

      const response: ApiResponse<{ customers: Customer[]; total: number }> = 
        await customerAPI.getCustomers(params);

      if (response.status === 'success' && response.data) {
        setCustomers(response.data.customers || []);
        setPaginationState(prev => ({
          ...prev,
          total: response.data?.total || 0
        }));
      } else {
        throw new Error(response.message || '获取客户列表失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取客户列表失败';
      setError(errorMessage);
      message.error(errorMessage);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters]);

  // 创建客户
  const createCustomer = useCallback(async (data: Partial<Customer>): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await customerAPI.createCustomer(data);
      
      if (response.status === 'success') {
        message.success('客户创建成功');
        await fetchCustomers(); // 重新获取列表
        return true;
      } else {
        throw new Error(response.message || '创建客户失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建客户失败';
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCustomers]);

  // 更新客户
  const updateCustomer = useCallback(async (id: string, data: Partial<Customer>): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await customerAPI.updateCustomer(id, data);
      
      if (response.status === 'success') {
        message.success('客户更新成功');
        // 更新本地状态
        setCustomers(prev => prev.map(customer => 
          customer._id === id ? { ...customer, ...data } : customer
        ));
        return true;
      } else {
        throw new Error(response.message || '更新客户失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新客户失败';
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 删除客户
  const deleteCustomer = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await customerAPI.deleteCustomer(id);
      
      if (response.status === 'success') {
        message.success('客户删除成功');
        // 更新本地状态
        setCustomers(prev => prev.filter(customer => customer._id !== id));
        return true;
      } else {
        throw new Error(response.message || '删除客户失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除客户失败';
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 设置过滤条件
  const setFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    // 重置到第一页
    setPaginationState(prev => ({ ...prev, current: 1 }));
  }, []);

  // 设置分页
  const setPagination = useCallback((page: number, pageSize?: number) => {
    setPaginationState(prev => ({
      ...prev,
      current: page,
      ...(pageSize && { pageSize })
    }));
  }, []);

  // 刷新数据
  const refresh = useCallback(() => {
    return fetchCustomers();
  }, [fetchCustomers]);

  // 自动获取数据
  useEffect(() => {
    if (autoFetch) {
      fetchCustomers();
    }
  }, [fetchCustomers, autoFetch]);

  return {
    customers,
    loading,
    error,
    pagination,
    filters,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    setFilters,
    setPagination,
    refresh
  };
}; 