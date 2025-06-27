import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
}

interface AuthActions {
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
    setLoading: (loading: boolean) => void;
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
            login: (token: string, user: User) => {
                set({
                    user,
                    token,
                    isAuthenticated: true,
                    loading: false,
                });

                // 设置 axios 默认 header
                if (typeof window !== 'undefined') {
                    localStorage.setItem('auth_token', token);
                }
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    loading: false,
                });

                // 清除本地存储
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth_token');
                }
            },

            updateUser: (userData: Partial<User>) => {
                const { user } = get();
                if (user) {
                    set({
                        user: { ...user, ...userData },
                    });
                }
            },

            setLoading: (loading: boolean) => {
                set({ loading });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
); 