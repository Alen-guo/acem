/**
 * 全局错误边界组件
 * 功能：捕获组件树中的 JavaScript 错误，记录错误并显示备用 UI
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('ErrorBoundary caught an error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary details:', error, errorInfo);
    this.setState({ error, errorInfo });

    // 在这里可以将错误日志上报给服务
    this.logErrorToService(error, errorInfo);
  }

  // 错误日志上报
  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // 可以集成错误监控服务，如 Sentry
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // 发送到后端日志服务
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      }).catch(err => {
        console.error('上报错误失败:', err);
      });
    } catch (reportError) {
      console.error('错误上报异常:', reportError);
    }
  };

  // 重置错误状态
  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  // 刷新页面
  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 自定义降级 UI
      if (this.props.fallback) {
        return this.props.fallback;
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
            status="error"
            title="应用程序出现错误"
            subTitle="抱歉，应用程序遇到了一个错误。请查看控制台获取详细信息。"
            extra={[
              <Button type="primary" key="refresh" onClick={this.handleReload}>
                刷新页面
              </Button>,
              <Button key="console" onClick={() => console.log('Error details:', this.state.error, this.state.errorInfo)}>
                查看错误详情
              </Button>
            ]}
                      />
          <details style={{ marginTop: '20px', textAlign: 'left', background: '#f5f5f5', padding: '10px' }}>
            <summary>错误详情</summary>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {this.state.error?.toString()}
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 