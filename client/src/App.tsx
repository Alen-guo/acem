import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import ErrorBoundary from './components/ErrorBoundary';

// 导入所有页面组件
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/CustomerList';
import CustomerDetail from './pages/CustomerDetail';
import ContactRecords from './pages/ContactRecords';
import Profile from './pages/Profile';
import BillManagement from './pages/BillManagement';
import Reports from './pages/Reports';
import PersonMap from './pages/PersonMap';
import ExcelAnalysisNew from './pages/ExcelAnalysisNew';
import InsuranceMatch from './pages/InsuranceMatch';
import TableBillDisplay from './pages/TableBillDisplay';

import 'dayjs/locale/zh-cn';
import './App.css';

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

function App() {
  console.log('App component is rendering...');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          locale={zhCN}
          theme={{
            algorithm: theme.defaultAlgorithm,
            token: {
              colorPrimary: '#1677ff',
              colorBgLayout: '#f5f5f5',
            },
          }}
        >
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="customers" element={<CustomerList />} />
                <Route path="customers/:id" element={<CustomerDetail />} />
                <Route path="contacts" element={<ContactRecords />} />
                <Route path="profile" element={<Profile />} />
                <Route path="bills" element={<BillManagement />} />
                <Route path="reports" element={<Reports />} />  
                <Route path="person-map" element={<PersonMap />} />
                <Route path="excel-analysis" element={<ExcelAnalysisNew />} />
                <Route path="insurance-match" element={<InsuranceMatch />} />
                <Route path="table-bills" element={<TableBillDisplay />} />
                <Route path="*" element={<div style={{padding: '20px'}}>页面不存在，请检查路由配置</div>} />
              </Route>
            </Routes>
          </Router>
        </ConfigProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App; 