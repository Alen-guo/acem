// 客户信息接口
export interface Customer {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    position?: string;
    country?: string;
    city?: string;

    // 客户特点和标签
    tags: string[];
    personality?: string;
    interests: string[];
    industryPreference?: string;
    communicationStyle?: string;

    // 关系网络
    relationships: Relationship[];

    // 拥有资源
    resources: Resource[];

    // 合作意向
    cooperationStatus: CooperationStatus;
    cooperationIntention?: number;
    cooperationNotes?: string;
    expectedValue?: number;

    // 销售相关
    assignedSalesperson: string;
    source?: string;
    priority: Priority;

    // 统计数据
    contactCount: number;
    lastContactDate?: Date;
    nextFollowUp?: Date;

    // 系统字段
    createdAt: Date;
    updatedAt: Date;
}

// 关系接口
export interface Relationship {
    relatedCustomer: string;
    relationship: string;
    description?: string;
    strength?: number; // 关系强度 0-1
}

// 资源接口
export interface Resource {
    type: string;
    description: string;
    value: ResourceValue;
    availability: ResourceAvailability;
}

// 联系记录接口
export interface ContactRecord {
    _id: string;
    customer: string;
    date: Date;
    method: ContactMethod;
    subject: string;
    content: string;
    result: ContactResult;
    duration?: number; // 分钟
    nextFollowUp?: Date;
    attachments?: string[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

// 用户接口
export interface User {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
    department?: string;
    phone?: string;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// 网络图节点接口
export interface NetworkNode {
    id: string;
    name: string;
    type: 'customer' | 'contact' | 'resource';
    x: number;
    y: number;
    color?: string;
    size?: number;
}

// 网络图连线接口
export interface NetworkEdge {
    id: string;
    source: string;
    target: string;
    type: string;
    strength?: number;
    label?: string;
}

// 枚举类型
export type CooperationStatus = '潜在客户' | '意向客户' | '合作中' | '已成交' | '已流失';
export type Priority = '低' | '中' | '高';
export type ResourceValue = '高' | '中' | '低';
export type ResourceAvailability = '可用' | '部分可用' | '不可用';
export type ContactMethod = '电话' | '邮件' | '微信' | 'WhatsApp' | '面谈' | '视频会议';
export type ContactResult = '非常好' | '好' | '一般' | '不理想' | '失败';
export type UserRole = 'admin' | 'sales' | 'manager';

// API 响应格式
export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    message: string;
    data?: T;
    pagination?: {
        current: number;
        total: number;
        count: number;
    };
}

// 表单相关类型
export interface CustomerFormData {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    position?: string;
    country?: string;
    city?: string;
    tags: string[];
    personality?: string;
    interests: string[];
    industryPreference?: string;
    communicationStyle?: string;
    cooperationStatus: CooperationStatus;
    cooperationIntention?: number;
    expectedValue?: number;
    priority: Priority;
    source?: string;
}

export interface ContactFormData {
    customer: string;
    date: Date;
    method: ContactMethod;
    subject: string;
    content: string;
    result: ContactResult;
    duration?: number;
    nextFollowUp?: Date;
}

export interface ResourceFormData {
    type: string;
    description: string;
    value: ResourceValue;
    availability: ResourceAvailability;
}

// 统计数据类型
export interface DashboardStats {
    totalCustomers: number;
    highIntentionCustomers: number;
    totalExpectedValue: number;
    totalContacts: number;
    recentContacts: ContactRecord[];
    cooperationStatusStats: { status: CooperationStatus; count: number }[];
}

// 账单管理相关类型
export interface Bill {
    _id: string;
    title: string;
    description?: string;
    amount: number;
    type: BillType;
    category: string;
    date: Date;
    month: string; // 格式：YYYY-MM
    year: number;
    status: BillStatus;
    tags?: string[];
    attachments?: string[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface BillFormData {
    title: string;
    description?: string;
    amount: number;
    type: BillType;
    category: string;
    date: Date;
    tags?: string[];
}

export interface BillSummary {
    month: string;
    totalIncome: number;
    totalExpense: number;
    balance: number;
    billCount: number;
}

export interface BillStats {
    currentMonthIncome: number;
    currentMonthExpense: number;
    currentMonthBalance: number;
    yearlyIncome: number;
    yearlyExpense: number;
    yearlyBalance: number;
    monthlyStats: BillSummary[];
    categoryStats: { category: string; amount: number; count: number }[];
}

// 账单枚举类型
export type BillType = '收入' | '支出';
export type BillStatus = '已支付' | '待支付' | '已逾期' | '已取消'; 

// 具体的API响应类型
export interface CustomerStatsResponse {
  totalCustomers: number;
  newCustomersThisMonth: number;
  highIntentionCustomers: number;
  totalExpectedValue: number;
  statusDistribution: { status: CooperationStatus; count: number }[];
  priorityDistribution: { priority: Priority; count: number }[];
}

export interface SalesStatsResponse {
  totalSales: number;
  monthlyGrowth: number;
  topSalespeople: { name: string; sales: number; customerCount: number }[];
  monthlyTrend: { month: string; sales: number; customers: number }[];
}

export interface CustomerAnalysisResponse {
  industryDistribution: { industry: string; count: number }[];
  regionDistribution: { region: string; count: number }[];
  cooperationTrend: { month: string; newCustomers: number; signedDeals: number }[];
  customerRetention: { month: string; retentionRate: number }[];
}

// Excel导入相关类型
export interface ExcelImportResponse {
  success: boolean;
  importedCount: number;
  errors: string[];
  data: any[];
}

export interface SheetData {
  sheetName: string;
  headers: string[];
  data: Record<string, any>[];
  rowCount: number;
} 