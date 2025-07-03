/**
 * 主布局组件
 * 功能：提供应用的整体布局结构，包含侧边栏导航和主内容区域
 */
import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Space, MenuProps } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ContactsOutlined,
  BarChartOutlined,
  ShareAltOutlined,
  SafetyOutlined,
  FileExcelOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  WalletOutlined,
  TableOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, checkAuth, hasPermission } = useAuthStore();
  
  // 检查认证状态
  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  // 默认用户信息（演示模式）
  const currentUser = user || {
    name: '演示用户',
    email: 'demo@example.com',
    role: 'sales',
    avatar: null,
  };
  const [collapsed, setCollapsed] = useState(false);

  // 菜单项配置
  const menuItems: MenuProps['items'] = [
    // {
    //   key: '/dashboard',
    //   icon: <DashboardOutlined />,
    //   label: '仪表板',
    //   onClick: () => navigate('/dashboard'),
    // },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: (
        <span>
          客户管理 <LockOutlined style={{ fontSize: '12px', marginLeft: '4px', opacity: 0.6 }} />
        </span>
      ),
      onClick: () => navigate('/customers'),
    },
    {
      key: '/contacts',
      icon: <ContactsOutlined />,
      label: (
        <span>
          联系记录 <LockOutlined style={{ fontSize: '12px', marginLeft: '4px', opacity: 0.6 }} />
        </span>
      ),
      onClick: () => navigate('/contacts'),
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: (
        <span>
          报表分析 <LockOutlined style={{ fontSize: '12px', marginLeft: '4px', opacity: 0.6 }} />
        </span>
      ),
      onClick: () => navigate('/reports'),
    },
    {
      key: '/person-map',
      icon: <ShareAltOutlined />,
      label: (
        <span>
          人物关系图 <LockOutlined style={{ fontSize: '12px', marginLeft: '4px', opacity: 0.6 }} />
        </span>
      ),
      onClick: () => navigate('/person-map'),
    },
    // {
    //   key: '/insurance-match',
    //   icon: <SafetyOutlined />,
    //   label: '智能保险匹配',
    //   onClick: () => navigate('/insurance-match'),
    // },
    ...(hasPermission('excel.analysis') ? [{
      key: '/excel-analysis',
      icon: <FileExcelOutlined />,
      label: 'Excel数据分析',
      onClick: () => navigate('/excel-analysis'),
    }] : []),
    {
      key: '/bills',
      icon: <WalletOutlined />,
      label: '账单管理',
      onClick: () => navigate('/bills'),
    },
    {
      key: '/table-bills',
      icon: <TableOutlined />,
      label: '月份表格',
      onClick: () => navigate('/table-bills'),
    },
  ];

  // 用户菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      {/* 固定侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={200}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          height: '100vh',
          transition: 'width 0.2s',
        }}
      >
        <div
          style={{
            height: '64px',
            margin: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'ACRM' : 'ACRM信息系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[location.pathname]}
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>

      {/* 主体内容区（包含固定Header和可滚动Content） */}
      <div
        style={{
          marginLeft: collapsed ? 80 : 200,
          height: '100vh',
          transition: 'margin-left 0.2s',
          background: '#f5f6fa',
        }}
      >
        {/* 固定Header */}
        <Header
          style={{
            position: 'fixed',
            left: collapsed ? 80 : 200,
            right: 0,
            top: 0,
            height: 64,
            zIndex: 101,
            padding: '0 16px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'left 0.2s',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />

          <Space>
            <span>欢迎回来，{currentUser.name}</span>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar
                size="default"
                icon={<UserOutlined />}
                src={currentUser.avatar}
                style={{ cursor: 'pointer' }}
              />
            </Dropdown>
          </Space>
        </Header>

        {/* 可滚动主内容区 */}
        <div
          style={{
            marginTop: 80,
            padding: 24,
            minHeight: 'calc(100vh - 80px)',
            height: 'calc(100vh - 80px)',
            overflowY: 'auto',
            background: '#fff',
            borderRadius: '8px',
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout; 