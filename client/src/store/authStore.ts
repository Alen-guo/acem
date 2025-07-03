import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

// 预定义的用户账号
const PREDEFINED_USERS = [
  { username: 'alenguo', password: '123456gx', name: '阿伦', role: 'admin' as const },
  { username: 'zhouzhou', password: 'zhouzhouzhou0', name: '周周', role: 'sales' as const },
  { username: '360buy', password: '360buy123', name: '360用户', role: 'manager' as const },
];

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
}

interface AuthActions {
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
    setLoading: (loading: boolean) => void;
    checkAuth: () => void;
    hasPermission: (permission: string) => boolean;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            // State
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,

            // Actions
            login: async (username: string, password: string): Promise<boolean> => {
                set({ loading: true });
                
                // 模拟异步验证
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // 验证用户名和密码
                const user = PREDEFINED_USERS.find(
                    u => u.username === username && u.password === password
                );
                
                if (user) {
                    const token = `token_${user.username}_${Date.now()}`;
                    const userData: User = {
                        _id: user.username,
                        name: user.name,
                        email: `${user.username}@example.com`,
                        role: user.role,
                        avatar: undefined,
                        isActive: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    
                    set({
                        user: userData,
                        token,
                        isAuthenticated: true,
                        loading: false,
                    });
                    
                    // 存储到sessionStorage
                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem('auth_token', token);
                        sessionStorage.setItem('auth_user', JSON.stringify(userData));
                    }
                    
                    return true;
                } else {
                    set({ loading: false });
                    return false;
                }
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    loading: false,
                });

                // 清除sessionStorage
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('auth_token');
                    sessionStorage.removeItem('auth_user');
                }
            },

            updateUser: (userData: Partial<User>) => {
                const { user } = get();
                if (user) {
                    const updatedUser = { ...user, ...userData };
                    set({ user: updatedUser });
                    
                    // 更新sessionStorage
                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem('auth_user', JSON.stringify(updatedUser));
                    }
                }
            },

            setLoading: (loading: boolean) => {
                set({ loading });
            },

            checkAuth: () => {
                if (typeof window !== 'undefined') {
                    const token = sessionStorage.getItem('auth_token');
                    const userStr = sessionStorage.getItem('auth_user');
                    
                    if (token && userStr) {
                        try {
                            const user = JSON.parse(userStr);
                            set({
                                user,
                                token,
                                isAuthenticated: true,
                                loading: false,
                            });
                        } catch (error) {
                            console.error('解析用户信息失败:', error);
                            // 清除无效数据
                            sessionStorage.removeItem('auth_token');
                            sessionStorage.removeItem('auth_user');
                        }
                    }
                }
            },

            hasPermission: (permission: string): boolean => {
                const { user } = get();
                if (!user) return false;
                
                // 权限控制逻辑
                const permissions = {
                    'bills.export': ['admin', 'sales'], // 账单导出权限
                    'bills.create': ['admin', 'sales'], // 新增账单权限
                    'excel.analysis': ['admin', 'sales'], // Excel分析页面权限
                };
                
                const allowedRoles = permissions[permission as keyof typeof permissions];
                return allowedRoles ? allowedRoles.includes(user.role) : true;
            },
        }),
        {
            name: 'auth-storage',
            storage: {
                getItem: (name) => {
                    const value = sessionStorage.getItem(name);
                    return value ? JSON.parse(value) : null;
                },
                setItem: (name, value) => {
                    sessionStorage.setItem(name, JSON.stringify(value));
                },
                removeItem: (name) => {
                    sessionStorage.removeItem(name);
                },
            },
            partialize: (state: AuthStore) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }) as Partial<AuthStore>,
        }
    )
); 