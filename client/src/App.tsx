import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

// 页面组件
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/CustomerList';
import CustomerDetail from './pages/CustomerDetail';
import ContactRecords from './pages/ContactRecords';
import Reports from './pages/Reports';
import Profile from './pages/Profile.tsx';
import PersonMap from './pages/PersonMap';
import InsuranceMatch from './pages/InsuranceMatch';
import ExcelAnalysis from './pages/ExcelAnalysisNew';
import TestEdit from './pages/TestEdit';
import BillManagement from './pages/BillManagement';
import TableBillDisplay from './pages/TableBillDisplay';

// 工具和状态管理
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';

// 样式
import './App.css';

// 配置dayjs中文
dayjs.locale('zh-cn');

// 创建QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5分钟
    },
  },
});

// Ant Design主题配置
const theme = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    fontSize: 14,
    borderRadius: 6,
  },
  components: {
    Layout: {
      siderBg: '#001529',
      triggerBg: '#1890ff',
    },
    Menu: {
      darkItemBg: '#001529',
      darkSubMenuItemBg: '#000c17',
    },
  },
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={zhCN} theme={theme}>
        <Router>
          <div className="App">
            <Routes>
              {/* 登录页面 */}
              <Route path="/login" element={<Login />} />
              
              {/* 主应用路由 - 直接访问无需登录 */}
              <Route path="/" element={<Layout />}>
                {/* 默认重定向到仪表板 */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                
                {/* 仪表板 */}
                <Route path="dashboard" element={<Dashboard />} />
                
                {/* 客户管理 */}
                <Route path="customers" element={<CustomerList />} />
                <Route path="customers/:id" element={<CustomerDetail />} />
                
                {/* 联系记录 */}
                <Route path="contacts" element={<ContactRecords />} />
                
                {/* 报表分析 */}
                <Route path="reports" element={<Reports />} />
                
                {/* 人物关系图 */}
                <Route path="person-map" element={<PersonMap />} />
                
                {/* 智能保险匹配 */}
                <Route path="insurance-match" element={<InsuranceMatch />} />
                
                {/* Excel数据分析 */}
                <Route path="excel-analysis" element={<ExcelAnalysis />} />
                
                {/* 测试编辑功能 */}
                <Route path="test-edit" element={<TestEdit />} />
                
                {/* 账单管理 */}
                <Route path="bills" element={<BillManagement />} />
                
                {/* 月份表格展示 */}
                <Route path="table-bills" element={<TableBillDisplay />} />
                
                {/* 个人资料 */}
                <Route path="profile" element={<Profile />} />
              </Route>
              
              {/* 404重定向 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App; 