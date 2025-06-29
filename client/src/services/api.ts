import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, Customer, ContactRecord, User, Bill, BillFormData, BillStats, DashboardStats, CustomerStatsResponse, SalesStatsResponse, CustomerAnalysisResponse, ExcelImportResponse } from '../types';

// 创建 axios 实例
const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // 未授权，清除token并跳转到登录页
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

/**
 * 客户管理 API
 */
export const customerAPI = {
    // 获取客户列表
    getCustomers: (params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        priority?: string;
    }): Promise<ApiResponse<{ customers: Customer[]; total: number }>> =>
        api.get('/customers', { params }).then((res) => res.data),

    // 获取客户详情
    getCustomer: (id: string): Promise<ApiResponse<Customer>> =>
        api.get(`/customers/${id}`).then((res) => res.data),

    // 创建客户
    createCustomer: (data: Partial<Customer>): Promise<ApiResponse<Customer>> =>
        api.post('/customers', data).then((res) => res.data),

    // 更新客户
    updateCustomer: (id: string, data: Partial<Customer>): Promise<ApiResponse<Customer>> =>
        api.put(`/customers/${id}`, data).then((res) => res.data),

    // 删除客户
    deleteCustomer: (id: string): Promise<ApiResponse> =>
        api.delete(`/customers/${id}`).then((res) => res.data),

    // 获取客户统计数据
    getCustomerStats: (): Promise<ApiResponse<CustomerStatsResponse>> =>
        api.get('/customers/stats').then((res) => res.data),
};

/**
 * 联系记录 API
 */
export const contactAPI = {
    // 获取联系记录列表
    getContacts: (params?: {
        page?: number;
        limit?: number;
        customer?: string;
        method?: string;
        dateRange?: [string, string];
    }): Promise<ApiResponse<{ contacts: ContactRecord[]; total: number }>> =>
        api.get('/contacts', { params }).then((res) => res.data),

    // 获取联系记录详情
    getContact: (id: string): Promise<ApiResponse<ContactRecord>> =>
        api.get(`/contacts/${id}`).then((res) => res.data),

    // 创建联系记录
    createContact: (data: Partial<ContactRecord>): Promise<ApiResponse<ContactRecord>> =>
        api.post('/contacts', data).then((res) => res.data),

    // 更新联系记录
    updateContact: (id: string, data: Partial<ContactRecord>): Promise<ApiResponse<ContactRecord>> =>
        api.put(`/contacts/${id}`, data).then((res) => res.data),

    // 删除联系记录
    deleteContact: (id: string): Promise<ApiResponse> =>
        api.delete(`/contacts/${id}`).then((res) => res.data),

    // 获取客户的联系记录
    getCustomerContacts: (customerId: string): Promise<ApiResponse<ContactRecord[]>> =>
        api.get(`/contacts/customer/${customerId}`).then((res) => res.data),
};

/**
 * 用户管理 API
 */
export const userAPI = {
    // 登录
    login: (credentials: { email: string; password: string }): Promise<ApiResponse<{ user: User; token: string }>> =>
        api.post('/auth/login', credentials).then((res) => res.data),

    // 注册
    register: (userData: { name: string; email: string; password: string }): Promise<ApiResponse<{ user: User; token: string }>> =>
        api.post('/auth/register', userData).then((res) => res.data),

    // 获取当前用户信息
    getCurrentUser: (): Promise<ApiResponse<User>> =>
        api.get('/auth/me').then((res) => res.data),

    // 更新用户信息
    updateUser: (data: Partial<User>): Promise<ApiResponse<User>> =>
        api.put('/auth/profile', data).then((res) => res.data),

    // 修改密码
    changePassword: (data: { oldPassword: string; newPassword: string }): Promise<ApiResponse> =>
        api.put('/auth/password', data).then((res) => res.data),
};

/**
 * 报表统计 API
 */
export const reportAPI = {
    // 获取仪表板数据
    getDashboardData: (): Promise<ApiResponse<DashboardStats>> =>
        api.get('/reports/dashboard').then((res) => res.data),

    // 获取销售统计
    getSalesStats: (params?: { dateRange?: [string, string] }): Promise<ApiResponse<SalesStatsResponse>> =>
        api.get('/reports/sales', { params }).then((res) => res.data),

    // 获取客户分析
    getCustomerAnalysis: (): Promise<ApiResponse<CustomerAnalysisResponse>> =>
        api.get('/reports/customers').then((res) => res.data),
};

/**
 * 账单管理 API
 */
export const billAPI = {
    // 获取账单列表
    getBills: (params?: {
        page?: number;
        limit?: number;
        type?: string;
        category?: string;
        month?: string;
        year?: number;
        search?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<ApiResponse<{ bills: Bill[]; total: number; currentPage: number; totalPages: number }>> =>
        api.get('/bills', { params }).then((res) => res.data),

    // 获取账单详情
    getBill: (id: string): Promise<ApiResponse<Bill>> =>
        api.get(`/bills/${id}`).then((res) => res.data),

    // 创建账单
    createBill: (data: BillFormData): Promise<ApiResponse<Bill>> =>
        api.post('/bills', data).then((res) => res.data),

    // 更新账单
    updateBill: (id: string, data: Partial<BillFormData>): Promise<ApiResponse<Bill>> =>
        api.put(`/bills/${id}`, data).then((res) => res.data),

    // 删除账单
    deleteBill: (id: string): Promise<ApiResponse> =>
        api.delete(`/bills/${id}`).then((res) => res.data),

    // 获取账单统计数据
    getBillStats: (params?: { year?: number; month?: string }): Promise<ApiResponse<BillStats>> =>
        api.get('/bills/stats/overview', { params }).then((res) => res.data),

    // 获取分类列表
    getCategories: (): Promise<ApiResponse<string[]>> =>
        api.get('/bills/categories/list').then((res) => res.data),

    // 批量导入账单
    batchImportBills: async (data: {
        bills: BillFormData[],
        month?: number,
        year?: number,
        sheetsData?: ExcelImportResponse[]
    }): Promise<ApiResponse<ExcelImportResponse>> => {
        return api.post('/bills/batch-import', data).then((res) => res.data);
    },

    // 导出账单数据
    exportBills: async (params?: {
        type?: string;
        month?: string;
        year?: number;
        format?: 'excel' | 'csv';
    }): Promise<Blob> => {
        return api.get('/bills/export', { 
            params,
            responseType: 'blob'
        }).then((res) => res.data);
    },

    // 解析Excel文件
    parseExcelFile: async (file: File): Promise<ApiResponse<ExcelImportResponse>> => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/bills/parse-excel', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then((res) => res.data);
    },

    // 获取月份表格数据 - 按Excel原始结构（旧的账单API，保留兼容性）
    getMonthlySheets: async (params: {
        month?: string;
        year?: number;
        startDate?: string;
        endDate?: string;
    }) => {
        const queryParams = new URLSearchParams();
        if (params.month) queryParams.append('month', params.month);
        if (params.year) queryParams.append('year', params.year.toString());
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        const response = await api.get(`/bills/monthly-sheets?${queryParams.toString()}`);
        return response.data;
    },
};

// 表格数据API（独立模块）
export const tableDataAPI = {
    // 导入表格数据
    importTableData: async (data: {
        fileName: string;
        sheets: any[];
        targetMonth: number;
        targetYear: number;
    }) => {
        const response = await api.post('/table-data/import', data);
        return response.data;
    },

    // 获取月份表格数据
    getMonthlyTableData: async (params: {
        month?: string;
        year?: number;
        startDate?: string;
        endDate?: string;
    }) => {
        const queryParams = new URLSearchParams();
        if (params.month) queryParams.append('month', params.month);
        if (params.year) queryParams.append('year', params.year.toString());
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        const response = await api.get(`/table-data/monthly?${queryParams.toString()}`);
        return response.data;
    },

    // 获取表格列表
    getTableList: async (params: {
        page?: number;
        limit?: number;
        month?: string;
        year?: number;
        sheetName?: string;
    } = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.month) queryParams.append('month', params.month);
        if (params.year) queryParams.append('year', params.year.toString());
        if (params.sheetName) queryParams.append('sheetName', params.sheetName);

        const response = await api.get(`/table-data/list?${queryParams.toString()}`);
        return response.data;
    },

    // 删除表格数据
    deleteTableData: async (id: string) => {
        const response = await api.delete(`/table-data/${id}`);
        return response.data;
    },

    // 获取表格详情
    getTableDetail: async (id: string) => {
        const response = await api.get(`/table-data/${id}`);
        return response.data;
    },
};

export default api; 