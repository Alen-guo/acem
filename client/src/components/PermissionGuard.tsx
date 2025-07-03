/**
 * 权限保护组件
 * 功能：根据用户权限控制内容的显示
 */
import React from 'react';
import { Result, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback,
}) => {
  const { hasPermission } = useAuthStore();
  const navigate = useNavigate();

  if (!hasPermission(permission)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div style={{ 
        padding: '50px', 
        textAlign: 'center',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Result
          status="403"
          title="权限不足"
          subTitle="抱歉，您没有访问此功能的权限。"
          icon={<LockOutlined style={{ color: '#faad14' }} />}
          extra={
            <Button type="primary" onClick={() => navigate('/dashboard')}>
              返回首页
            </Button>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
};

export default PermissionGuard; 