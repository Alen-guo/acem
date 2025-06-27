/**
 * 仪表板页面组件
 * 功能：展示系统概览、关键指标、最近活动等信息
 */
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Avatar, Tag, Button, Progress } from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  PhoneOutlined,
  TrophyOutlined,
  RiseOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Customer, ContactRecord, DashboardStats } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    highIntentionCustomers: 0,
    totalExpectedValue: 0,
    totalContacts: 0,
    recentContacts: [],
    cooperationStatusStats: [],
  });

  // 模拟数据
  useEffect(() => {
    // 这里应该调用 API 获取真实数据
    const mockStats: DashboardStats = {
      totalCustomers: 25,
      highIntentionCustomers: 8,
      totalExpectedValue: 5800000,
      totalContacts: 156,
      recentContacts: [
        {
          _id: '1',
          customer: '张总',
          date: new Date('2024-01-15'),
          method: '面谈',
          subject: '产品演示',
          content: '详细演示了产品功能，客户反馈积极',
          result: '非常好',
          duration: 120,
          createdBy: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: '2',
          customer: '李经理',
          date: new Date('2024-01-14'),
          method: '电话',
          subject: '价格商议',
          content: '讨论了价格方案和交付时间',
          result: '好',
          duration: 45,
          createdBy: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: '3',
          customer: '王总',
          date: new Date('2024-01-13'),
          method: '微信',
          subject: '技术咨询',
          content: '解答了技术相关问题',
          result: '好',
          duration: 20,
          createdBy: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      cooperationStatusStats: [
        { status: '潜在客户', count: 10 },
        { status: '意向客户', count: 8 },
        { status: '合作中', count: 5 },
        { status: '已成交', count: 2 },
      ],
    };
    setStats(mockStats);
  }, []);

  // 获取联系结果颜色
  const getResultColor = (result: string) => {
    switch (result) {
      case '非常好':
        return 'green';
      case '好':
        return 'blue';
      case '一般':
        return 'orange';
      case '不理想':
        return 'red';
      case '失败':
        return 'red';
      default:
        return 'default';
    }
  };

  // 获取联系方式图标
  const getMethodIcon = (method: string) => {
    switch (method) {
      case '电话':
        return <PhoneOutlined />;
      case '面谈':
        return <UserOutlined />;
      default:
        return <PhoneOutlined />;
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>仪表板</h1>

      {/* 关键指标卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="客户总数"
              value={stats.totalCustomers}
              prefix={<UserOutlined />}
              suffix="个"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="高意向客户"
              value={stats.highIntentionCustomers}
              prefix={<TrophyOutlined />}
              suffix="个"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总联系次数"
              value={stats.totalContacts}
              prefix={<PhoneOutlined />}
              suffix="次"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="预期总价值"
              value={stats.totalExpectedValue}
              prefix={<DollarOutlined />}
              suffix="元"
              precision={0}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* 最近联系记录 */}
        <Col span={16}>
          <Card
            title="最近联系记录"
            extra={
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => navigate('/contacts')}
              >
                查看全部
              </Button>
            }
          >
            <List
              itemLayout="horizontal"
              dataSource={stats.recentContacts}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Tag color={getResultColor(item.result)} key="result">
                      {item.result}
                    </Tag>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar icon={getMethodIcon(item.method)} size="large" />
                    }
                    title={
                      <div>
                        <strong>{item.customer}</strong>
                        <span style={{ marginLeft: 8, color: '#666' }}>
                          {item.subject}
                        </span>
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: 4 }}>
                          {item.content.substring(0, 50)}
                          {item.content.length > 50 && '...'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          {item.date.toLocaleDateString()} • {item.method}
                          {item.duration && ` • ${item.duration}分钟`}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 合作状态统计 */}
        <Col span={8}>
          <Card title="合作状态统计">
            <div style={{ padding: '0 16px' }}>
              {stats.cooperationStatusStats.map((item) => (
                <div
                  key={item.status}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <span>{item.status}</span>
                  <div style={{ flex: 1, margin: '0 16px' }}>
                    <Progress
                      percent={(item.count / stats.totalCustomers) * 100}
                      showInfo={false}
                      size="small"
                    />
                  </div>
                  <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
            
            <Button
              type="primary"
              style={{ width: '100%', marginTop: 16 }}
              onClick={() => navigate('/customers')}
            >
              管理客户
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 