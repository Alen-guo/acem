import React, { useState } from 'react';
import { Card, Table, Button, Input, Select, Tag, Avatar, Progress, Statistic, Row, Col, Space } from 'antd';
import { UserOutlined, PlusOutlined, SearchOutlined, FilterOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;
const { Option } = Select;

interface Customer {
  id: string;
  name: string;
  company: string;
  position: string;
  phone: string;
  email: string;
  tags: string[];
  cooperationStatus: string;
  cooperationIntention: number;
  expectedValue: number;
  contactCount: number;
  lastContactDate: string;
  personality: string;
  resources: { type: string; value: string }[];
}

const CustomerList: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [intentionFilter, setIntentionFilter] = useState('all');

  // 模拟客户数据
  const mockCustomers: Customer[] = [
    {
      id: '1',
      name: '张总',
      company: '华东贸易有限公司',
      position: '总经理',
      phone: '+86 138 0000 0000',
      email: 'zhang@company.com',
      tags: ['重点客户', '决策者', '长期合作'],
      cooperationStatus: '意向客户',
      cooperationIntention: 8,
      expectedValue: 500000,
      contactCount: 15,
      lastContactDate: '2024-01-15',
      personality: '务实稳重，决策谨慎',
      resources: [
        { type: '资金', value: '300万预算' },
        { type: '渠道', value: '华东经销网络' }
      ]
    },
    {
      id: '2',
      name: '李经理',
      company: '上海制造集团',
      position: '采购经理',
      phone: '+86 139 0000 0000',
      email: 'li@manufacturing.com',
      tags: ['新客户', '制造业'],
      cooperationStatus: '潜在客户',
      cooperationIntention: 6,
      expectedValue: 300000,
      contactCount: 8,
      lastContactDate: '2024-01-12',
      personality: '专业严谨，注重细节',
      resources: [
        { type: '技术', value: '工程团队' },
        { type: '人脉', value: '行业协会' }
      ]
    },
    {
      id: '3',
      name: '王总',
      company: '广州贸易公司',
      position: '董事长',
      phone: '+86 137 0000 0000',
      email: 'wang@trade.com',
      tags: ['高价值', '推荐人'],
      cooperationStatus: '合作中',
      cooperationIntention: 9,
      expectedValue: 800000,
      contactCount: 25,
      lastContactDate: '2024-01-18',
      personality: '爽快直接，重视关系',
      resources: [
        { type: '资金', value: '充足资金' },
        { type: '渠道', value: '珠三角网络' },
        { type: '人脉', value: '政府关系' }
      ]
    }
  ];

  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

  // 筛选客户
  const filteredCustomers = customers.filter(customer => {
    const matchSearch = customer.name.includes(searchText) || 
                       customer.company.includes(searchText) ||
                       customer.tags.some(tag => tag.includes(searchText));
    
    const matchStatus = statusFilter === 'all' || customer.cooperationStatus === statusFilter;
    
    const matchIntention = intentionFilter === 'all' || 
                          (intentionFilter === 'high' && customer.cooperationIntention >= 8) ||
                          (intentionFilter === 'medium' && customer.cooperationIntention >= 5 && customer.cooperationIntention < 8) ||
                          (intentionFilter === 'low' && customer.cooperationIntention < 5);
    
    return matchSearch && matchStatus && matchIntention;
  });

  // 统计数据
  const totalCustomers = customers.length;
  const highIntentionCustomers = customers.filter(c => c.cooperationIntention >= 8).length;
  const totalExpectedValue = customers.reduce((sum, c) => sum + c.expectedValue, 0);
  const totalContacts = customers.reduce((sum, c) => sum + c.contactCount, 0);

  // 表格列定义
  const columns = [
    {
      title: '客户信息',
      key: 'customer',
      width: 300,
      render: (customer: Customer) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar size={40} icon={<UserOutlined />} style={{ marginRight: '12px' }} />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{customer.name}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>{customer.company}</div>
            <div style={{ color: '#999', fontSize: '12px' }}>{customer.position}</div>
          </div>
        </div>
      )
    },
    {
      title: '客户特点',
      key: 'features',
      width: 200,
      render: (customer: Customer) => (
        <div>
          <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>
            {customer.personality}
          </div>
          <div>
            {customer.tags.slice(0, 2).map(tag => (
              <Tag key={tag} size="small" color="blue" style={{ marginBottom: '2px' }}>
                {tag}
              </Tag>
            ))}
            {customer.tags.length > 2 && (
              <Tag size="small" color="default">+{customer.tags.length - 2}</Tag>
            )}
          </div>
        </div>
      )
    },
    {
      title: '资源盘点',
      key: 'resources',
      width: 150,
      render: (customer: Customer) => (
        <div>
          {customer.resources.slice(0, 2).map((resource, index) => (
            <div key={index} style={{ fontSize: '12px', marginBottom: '2px' }}>
              <Tag size="small" color="orange">{resource.type}</Tag>
              <span style={{ color: '#666' }}>{resource.value}</span>
            </div>
          ))}
          {customer.resources.length > 2 && (
            <div style={{ fontSize: '12px', color: '#999' }}>
              +{customer.resources.length - 2}个资源
            </div>
          )}
        </div>
      )
    },
    {
      title: '合作意向',
      key: 'intention',
      width: 120,
      render: (customer: Customer) => (
        <div>
          <Progress
            type="line"
            percent={customer.cooperationIntention * 10}
            size="small"
            strokeColor={customer.cooperationIntention >= 8 ? '#52c41a' : customer.cooperationIntention >= 5 ? '#1890ff' : '#faad14'}
            showInfo={false}
          />
          <div style={{ fontSize: '12px', textAlign: 'center', marginTop: '4px' }}>
            {customer.cooperationIntention}/10
          </div>
        </div>
      )
    },
    {
      title: '合作状态',
      key: 'status',
      width: 100,
      render: (customer: Customer) => {
        const colorMap: Record<string, string> = {
          '潜在客户': 'default',
          '意向客户': 'processing',
          '合作中': 'success',
          '已成交': 'success',
          '已流失': 'error'
        };
        return <Tag color={colorMap[customer.cooperationStatus]}>{customer.cooperationStatus}</Tag>;
      }
    },
    {
      title: '联系情况',
      key: 'contact',
      width: 120,
      render: (customer: Customer) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
            {customer.contactCount}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>联系次数</div>
          <div style={{ fontSize: '10px', color: '#999' }}>
            {customer.lastContactDate}
          </div>
        </div>
      )
    },
    {
      title: '预期价值',
      key: 'value',
      width: 100,
      render: (customer: Customer) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f5222d' }}>
            ¥{(customer.expectedValue / 10000).toFixed(1)}万
          </div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (customer: Customer) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/customers/${customer.id}`)}
        >
          查看
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="客户总数"
              value={totalCustomers}
              suffix="个"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="高意向客户"
              value={highIntentionCustomers}
              suffix="个"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总联系次数"
              value={totalContacts}
              suffix="次"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="预期总价值"
              value={totalExpectedValue / 10000}
              suffix="万元"
              precision={1}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选和搜索 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Search
              placeholder="搜索客户姓名、公司或标签"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              placeholder="合作状态"
            >
              <Option value="all">全部状态</Option>
              <Option value="潜在客户">潜在客户</Option>
              <Option value="意向客户">意向客户</Option>
              <Option value="合作中">合作中</Option>
              <Option value="已成交">已成交</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              value={intentionFilter}
              onChange={setIntentionFilter}
              style={{ width: '100%' }}
              placeholder="意向程度"
            >
              <Option value="all">全部意向</Option>
              <Option value="high">高意向(8-10)</Option>
              <Option value="medium">中意向(5-7)</Option>
              <Option value="low">低意向(1-4)</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Space>
              <Button type="primary" icon={<PlusOutlined />}>
                添加客户
              </Button>
              <Button icon={<FilterOutlined />}>
                高级筛选
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 客户表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredCustomers}
          rowKey="id"
          pagination={{
            total: filteredCustomers.length,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default CustomerList; 