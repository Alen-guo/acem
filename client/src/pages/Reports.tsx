/**
 * 报表分析页面组件
 * 功能：展示销售数据分析、客户统计、业绩报表等
 */
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Select, DatePicker, Table, Progress } from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  PhoneOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { CooperationStatus } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface ReportData {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  totalContacts: number;
  totalValue: number;
  avgIntention: number;
  statusDistribution: { status: CooperationStatus; count: number; value: number }[];
  monthlyTrends: { month: string; customers: number; contacts: number; value: number }[];
}

const Reports: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('month');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [reportData, setReportData] = useState<ReportData>({
    totalCustomers: 0,
    newCustomers: 0,
    activeCustomers: 0,
    totalContacts: 0,
    totalValue: 0,
    avgIntention: 0,
    statusDistribution: [],
    monthlyTrends: [],
  });

  // 模拟数据
  useEffect(() => {
    const mockData: ReportData = {
      totalCustomers: 25,
      newCustomers: 8,
      activeCustomers: 18,
      totalContacts: 156,
      totalValue: 5800000,
      avgIntention: 6.8,
      statusDistribution: [
        { status: '潜在客户', count: 10, value: 800000 },
        { status: '意向客户', count: 8, value: 2500000 },
        { status: '合作中', count: 5, value: 2000000 },
        { status: '已成交', count: 2, value: 500000 },
      ],
      monthlyTrends: [
        { month: '2023-09', customers: 15, contacts: 89, value: 3200000 },
        { month: '2023-10', customers: 18, contacts: 112, value: 4100000 },
        { month: '2023-11', customers: 22, contacts: 134, value: 4900000 },
        { month: '2023-12', customers: 25, contacts: 156, value: 5800000 },
      ],
    };
    setReportData(mockData);
  }, [timeRange, dateRange]);

  // 获取状态颜色
  const getStatusColor = (status: CooperationStatus) => {
    switch (status) {
      case '潜在客户':
        return '#faad14';
      case '意向客户':
        return '#1890ff';
      case '合作中':
        return '#52c41a';
      case '已成交':
        return '#722ed1';
      case '已流失':
        return '#f5222d';
      default:
        return '#d9d9d9';
    }
  };

  // 客户状态分布表格列
  const statusColumns: ColumnsType<typeof reportData.statusDistribution[0]> = [
    {
      title: '合作状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: CooperationStatus) => (
        <span style={{ color: getStatusColor(status), fontWeight: 'bold' }}>
          {status}
        </span>
      ),
    },
    {
      title: '客户数量',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => `${count} 个`,
    },
    {
      title: '占比',
      key: 'percentage',
      render: (record: typeof reportData.statusDistribution[0]) => (
        <Progress
          percent={Math.round((record.count / reportData.totalCustomers) * 100)}
          strokeColor={getStatusColor(record.status)}
          size="small"
        />
      ),
    },
    {
      title: '预期价值',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
  ];

  // 月度趋势表格列
  const trendColumns: ColumnsType<typeof reportData.monthlyTrends[0]> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      render: (month: string) => dayjs(month).format('YYYY年MM月'),
    },
    {
      title: '客户数量',
      dataIndex: 'customers',
      key: 'customers',
      render: (customers: number, record: typeof reportData.monthlyTrends[0], index: number) => {
        const prevRecord = reportData.monthlyTrends[index - 1];
        const trend = prevRecord ? customers - prevRecord.customers : 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span>{customers}</span>
            {trend > 0 && <RiseOutlined style={{ color: '#52c41a', marginLeft: 8 }} />}
            {trend < 0 && <FallOutlined style={{ color: '#f5222d', marginLeft: 8 }} />}
          </div>
        );
      },
    },
    {
      title: '联系次数',
      dataIndex: 'contacts',
      key: 'contacts',
    },
    {
      title: '预期价值',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>报表分析</h1>
        <div style={{ display: 'flex', gap: 16 }}>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 120 }}
          >
            <Option value="week">本周</Option>
            <Option value="month">本月</Option>
            <Option value="quarter">本季度</Option>
            <Option value="year">本年</Option>
            <Option value="custom">自定义</Option>
          </Select>
          {timeRange === 'custom' && (
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              placeholder={['开始日期', '结束日期']}
            />
          )}
        </div>
      </div>

      {/* 关键指标概览 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="客户总数"
              value={reportData.totalCustomers}
              prefix={<UserOutlined />}
              suffix="个"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="新增客户"
              value={reportData.newCustomers}
              prefix={<UserOutlined />}
              suffix="个"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="活跃客户"
              value={reportData.activeCustomers}
              prefix={<TrophyOutlined />}
              suffix="个"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="联系次数"
              value={reportData.totalContacts}
              prefix={<PhoneOutlined />}
              suffix="次"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="预期总价值"
              value={reportData.totalValue}
              prefix={<DollarOutlined />}
              precision={0}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="平均意向度"
              value={reportData.avgIntention}
              suffix="/ 10"
              precision={1}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* 客户状态分布 */}
        <Col span={12}>
          <Card title="客户状态分布" style={{ height: 400 }}>
            <Table
              columns={statusColumns}
              dataSource={reportData.statusDistribution}
              rowKey="status"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* 月度趋势 */}
        <Col span={12}>
          <Card title="月度发展趋势" style={{ height: 400 }}>
            <Table
              columns={trendColumns}
              dataSource={reportData.monthlyTrends}
              rowKey="month"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports; 