/**
 * 联系记录页面组件
 * 功能：展示和管理所有联系记录，支持筛选和搜索
 */
import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Tag,
  Space,
  Avatar,
  Modal,
  Form,
  message,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  WechatOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { ContactRecord, ContactMethod, ContactResult } from '../types';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ContactRecords: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form] = Form.useForm();

  // 模拟联系记录数据
  const mockContacts: ContactRecord[] = [
    {
      _id: '1',
      customer: '张总',
      date: new Date('2024-01-15'),
      method: '面谈',
      subject: '产品演示',
      content: '详细演示了产品功能，客户反馈积极，表示会考虑采购。讨论了具体的实施方案和时间安排。',
      result: '非常好',
      duration: 120,
      nextFollowUp: new Date('2024-01-20'),
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
      content: '讨论了价格方案，客户希望能有更多优惠。需要提供更详细的报价单。',
      result: '好',
      duration: 45,
      nextFollowUp: new Date('2024-01-18'),
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
      content: '解答了技术相关问题，客户对技术方案表示认可。',
      result: '好',
      duration: 20,
      createdBy: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const [contacts, setContacts] = useState<ContactRecord[]>(mockContacts);

  // 获取联系方式图标
  const getMethodIcon = (method: ContactMethod) => {
    switch (method) {
      case '电话':
        return <PhoneOutlined style={{ color: '#1890ff' }} />;
      case '邮件':
        return <MailOutlined style={{ color: '#52c41a' }} />;
      case '微信':
        return <WechatOutlined style={{ color: '#52c41a' }} />;
      case '面谈':
        return <UserOutlined style={{ color: '#722ed1' }} />;
      case '视频会议':
        return <VideoCameraOutlined style={{ color: '#fa8c16' }} />;
      default:
        return <PhoneOutlined />;
    }
  };

  // 获取联系结果颜色
  const getResultColor = (result: ContactResult) => {
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

  // 筛选联系记录
  const filteredContacts = contacts.filter((contact) => {
    const matchSearch = contact.customer.includes(searchText) || 
                       contact.subject.includes(searchText) ||
                       contact.content.includes(searchText);
    
    const matchMethod = methodFilter === 'all' || contact.method === methodFilter;
    const matchResult = resultFilter === 'all' || contact.result === resultFilter;
    
    let matchDate = true;
    if (dateRange) {
      const contactDate = dayjs(contact.date);
      matchDate = contactDate.isAfter(dateRange[0].startOf('day')) && 
                  contactDate.isBefore(dateRange[1].endOf('day'));
    }
    
    return matchSearch && matchMethod && matchResult && matchDate;
  });

  // 表格列定义
  const columns: ColumnsType<ContactRecord> = [
    {
      title: '客户信息',
      key: 'customer',
      width: 150,
      render: (record: ContactRecord) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar size={32} icon={<UserOutlined />} style={{ marginRight: 8 }} />
          <span style={{ fontWeight: 'bold' }}>{record.customer}</span>
        </div>
      ),
    },
    {
      title: '联系方式',
      dataIndex: 'method',
      key: 'method',
      width: 100,
      render: (method: ContactMethod) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {getMethodIcon(method)}
          <span style={{ marginLeft: 8 }}>{method}</span>
        </div>
      ),
    },
    {
      title: '联系主题',
      dataIndex: 'subject',
      key: 'subject',
      width: 150,
    },
    {
      title: '联系内容',
      dataIndex: 'content',
      key: 'content',
      render: (content: string) => (
        <div style={{ maxWidth: 200 }}>
          {content.length > 50 ? `${content.substring(0, 50)}...` : content}
        </div>
      ),
    },
    {
      title: '联系结果',
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (result: ContactResult) => (
        <Tag color={getResultColor(result)}>{result}</Tag>
      ),
    },
    {
      title: '联系时间',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration?: number) => duration ? `${duration}分钟` : '-',
    },
    {
      title: '下次跟进',
      dataIndex: 'nextFollowUp',
      key: 'nextFollowUp',
      width: 120,
      render: (date?: Date) => date ? dayjs(date).format('MM-DD') : '-',
    },
  ];

  // 处理新增联系记录
  const handleAddContact = async (values: any) => {
    try {
      setLoading(true);
      // 这里应该调用 API
      const newContact: ContactRecord = {
        _id: Date.now().toString(),
        ...values,
        createdBy: 'current-user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setContacts([newContact, ...contacts]);
      setShowModal(false);
      form.resetFields();
      message.success('联系记录添加成功');
    } catch (error) {
      message.error('添加失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>联系记录</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setShowModal(true)}
        >
          新增联系记录
        </Button>
      </div>

      {/* 筛选条件 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Search
            placeholder="搜索客户、主题或内容"
            style={{ width: 250 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
          
          <Select
            placeholder="联系方式"
            style={{ width: 120 }}
            value={methodFilter}
            onChange={setMethodFilter}
          >
            <Option value="all">全部方式</Option>
            <Option value="电话">电话</Option>
            <Option value="邮件">邮件</Option>
            <Option value="微信">微信</Option>
            <Option value="面谈">面谈</Option>
            <Option value="视频会议">视频会议</Option>
          </Select>

          <Select
            placeholder="联系结果"
            style={{ width: 120 }}
            value={resultFilter}
            onChange={setResultFilter}
          >
            <Option value="all">全部结果</Option>
            <Option value="非常好">非常好</Option>
            <Option value="好">好</Option>
            <Option value="一般">一般</Option>
            <Option value="不理想">不理想</Option>
            <Option value="失败">失败</Option>
          </Select>

          <RangePicker
            placeholder={['开始日期', '结束日期']}
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
          />
        </Space>
      </Card>

      {/* 联系记录表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredContacts}
          rowKey="id"
          pagination={{
            total: filteredContacts.length,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          loading={loading}
        />
      </Card>

      {/* 新增联系记录弹窗 */}
      <Modal
        title="新增联系记录"
        open={showModal}
        onOk={() => form.submit()}
        onCancel={() => {
          setShowModal(false);
          form.resetFields();
        }}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddContact}
        >
          <Form.Item
            name="customer"
            label="客户"
            rules={[{ required: true, message: '请输入客户名称' }]}
          >
            <Input placeholder="客户名称" />
          </Form.Item>

          <Form.Item
            name="date"
            label="联系时间"
            rules={[{ required: true, message: '请选择联系时间' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="method"
            label="联系方式"
            rules={[{ required: true, message: '请选择联系方式' }]}
          >
            <Select placeholder="选择联系方式">
              <Option value="电话">电话</Option>
              <Option value="邮件">邮件</Option>
              <Option value="微信">微信</Option>
              <Option value="面谈">面谈</Option>
              <Option value="视频会议">视频会议</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="subject"
            label="联系主题"
            rules={[{ required: true, message: '请输入联系主题' }]}
          >
            <Input placeholder="联系主题" />
          </Form.Item>

          <Form.Item
            name="content"
            label="联系内容"
            rules={[{ required: true, message: '请输入联系内容' }]}
          >
            <Input.TextArea rows={4} placeholder="详细描述联系内容和客户反馈" />
          </Form.Item>

          <Form.Item
            name="result"
            label="联系结果"
            rules={[{ required: true, message: '请选择联系结果' }]}
          >
            <Select placeholder="选择联系结果">
              <Option value="非常好">非常好</Option>
              <Option value="好">好</Option>
              <Option value="一般">一般</Option>
              <Option value="不理想">不理想</Option>
              <Option value="失败">失败</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="duration"
            label="联系时长（分钟）"
          >
            <Input type="number" placeholder="联系时长" />
          </Form.Item>

          <Form.Item
            name="nextFollowUp"
            label="下次跟进时间"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContactRecords; 