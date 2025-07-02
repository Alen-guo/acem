/**
 * 账单管理页面
 * 功能：提供账单的增删改查、统计分析和按月管理功能
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Tag,
  Row,
  Col,
  Statistic,
  Tabs,
  message,
  Popconfirm,
  Typography,
  Divider,
  Empty,
  Radio,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  BarChartOutlined,
  CalendarOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

import { billAPI } from '../services/api';
import { Bill, BillFormData, BillType, BillStatus } from '../types';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;
const { TabPane } = Tabs;

const BillManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchForm] = Form.useForm();
  const [billForm] = Form.useForm();

  // 状态管理
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [dateMode, setDateMode] = useState<'month' | 'range'>('month');
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 10,
    year: new Date().getFullYear(),
    month: String(new Date().getMonth() + 1), // month类型为字符串
  });

  // 获取账单列表
  const { data: billsData, isLoading: billsLoading } = useQuery(
    ['bills', searchParams],
    () => billAPI.getBills(searchParams),
    {
      keepPreviousData: true,
    }
  );

  // 获取统计数据（传递year和month，month转为string）
  const { data: statsData } = useQuery(
    ['billStats', searchParams.year, searchParams.month],
    () => billAPI.getBillStats({ year: searchParams.year, month: searchParams.month?.toString() })
  );

  // 获取分类列表
  const { data: categoriesData } = useQuery('billCategories', billAPI.getCategories);

  // 账单操作mutations
  const createBillMutation = useMutation(billAPI.createBill, {
    onSuccess: () => {
      message.success('创建账单成功');
      setIsModalVisible(false);
      billForm.resetFields();
      queryClient.invalidateQueries(['bills']);
      queryClient.invalidateQueries(['billStats']);
    },
    onError: () => {
      message.error('创建账单失败');
    },
  });

  const updateBillMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<BillFormData> }) =>
      billAPI.updateBill(id, data),
    {
      onSuccess: () => {
        message.success('更新账单成功');
        setIsModalVisible(false);
        setEditingBill(null);
        billForm.resetFields();
        queryClient.invalidateQueries(['bills']);
        queryClient.invalidateQueries(['billStats']);
      },
      onError: () => {
        message.error('更新账单失败');
      },
    }
  );

  const deleteBillMutation = useMutation(billAPI.deleteBill, {
    onSuccess: () => {
      message.success('删除账单成功');
      queryClient.invalidateQueries(['bills']);
      queryClient.invalidateQueries(['billStats']);
    },
    onError: () => {
      message.error('删除账单失败');
    },
  });

  // 默认分类选项
  const defaultCategories = [
    '餐饮美食', '交通出行', '购物消费', '生活缴费', '医疗健康',
    '教育培训', '住房租赁', '娱乐休闲', '工资收入', '投资收益',
    '其他收入', '其他支出'
  ];

  const allCategories = [
    ...defaultCategories,
    ...(categoriesData?.data || [])
  ].filter((item, index, arr) => arr.indexOf(item) === index);

  // 表格列定义
  const columns: ColumnsType<Bill> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: BillType) => (
        <Tag color={type === '收入' ? 'green' : 'red'}>{type}</Tag>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number, record: Bill) => (
        <Text strong style={{ color: record.type === '收入' ? '#52c41a' : '#ff4d4f' }}>
          {record.type === '收入' ? '+' : '-'}¥{amount.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: BillStatus) => {
        const colors = {
          '已支付': 'green',
          '待支付': 'orange',
          '已逾期': 'red',
          '已取消': 'default',
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record: Bill) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条账单记录吗？"
            onConfirm={() => deleteBillMutation.mutate(record._id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 处理搜索
  const handleSearch = (values: any) => {
    const newParams: any = {
      ...searchParams,
      page: 1,
      search: values.search,
      type: values.type,
      category: values.category,
    };

    // 根据日期模式处理不同的日期参数
    if (dateMode === 'month') {
      newParams.year = Number(values.year);
      newParams.month = String(Number(values.month)); // month传字符串
      delete newParams.startDate;
      delete newParams.endDate;
    } else if (dateMode === 'range' && values.dateRange) {
      newParams.startDate = values.dateRange[0].startOf('day').toISOString();
      newParams.endDate = values.dateRange[1].endOf('day').toISOString();
      delete newParams.year;
      delete newParams.month;
    }

    setSearchParams(newParams);
  };

  // 处理表格分页
  const handleTableChange = (pagination: any) => {
    setSearchParams({
      ...searchParams,
      page: pagination.current,
      limit: pagination.pageSize,
      month: String(searchParams.month), // 保证month字段为字符串
    });
  };

  // 打开新增/编辑模态框
  const handleAdd = () => {
    setEditingBill(null);
    setIsModalVisible(true);
    billForm.resetFields();
  };

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill);
    setIsModalVisible(true);
    billForm.setFieldsValue({
      ...bill,
      date: dayjs(bill.date),
    });
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await billForm.validateFields();
      const dateObj = dayjs(values.date);
      const formData: BillFormData = {
        ...values,
        billDate: dateObj.toDate(),
        year: dateObj.year(),
        month: dateObj.month() + 1,
      };
      // 删除多余字段，避免类型报错
      if ('date' in formData) {
        delete (formData as any).date;
      }
      if (editingBill) {
        updateBillMutation.mutate({ id: editingBill._id, data: formData });
      } else {
        createBillMutation.mutate(formData);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const stats = statsData?.data;

  return (
    <div>
      <Title level={2}>
        <DollarOutlined /> 账单管理
      </Title>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={`${searchParams.month || (new Date().getMonth() + 1)}月收入`}
              value={stats?.currentMonthIncome || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={`${searchParams.month || (new Date().getMonth() + 1)}月支出`}
              value={stats?.currentMonthExpense || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={`${searchParams.month || (new Date().getMonth() + 1)}月结余`}
              value={stats?.currentMonthBalance || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ 
                color: (stats?.currentMonthBalance || 0) >= 0 ? '#3f8600' : '#cf1322' 
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="年度结余"
              value={stats?.yearlyBalance || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ 
                color: (stats?.yearlyBalance || 0) >= 0 ? '#3f8600' : '#cf1322' 
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索区域 */}
      <Card style={{ marginBottom: 16 }}>
        {/* 日期选择模式 */}
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ marginRight: 16 }}>日期筛选模式：</Text>
          <Radio.Group 
            value={dateMode} 
            onChange={(e) => {
              setDateMode(e.target.value);
              searchForm.resetFields(['year', 'month', 'dateRange']);
            }}
          >
            <Radio.Button value="month">按月份</Radio.Button>
            <Radio.Button value="range">按日期范围</Radio.Button>
          </Radio.Group>
        </div>

        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          initialValues={{
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1, // 默认本月
          }}
        >
          <Form.Item name="search">
            <Input
              placeholder="搜索账单标题或描述"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="type">
            <Select placeholder="选择类型" style={{ width: 120 }} allowClear>
              <Select.Option value="收入">收入</Select.Option>
              <Select.Option value="支出">支出</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="category">
            <Select placeholder="选择分类" style={{ width: 120 }} allowClear>
              {allCategories.map(cat => (
                <Select.Option key={cat} value={cat}>{cat}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          {dateMode === 'month' ? (
            <>
              <Form.Item name="year">
                <Select placeholder="选择年份" style={{ width: 100 }}>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <Select.Option key={year} value={year}>{year}</Select.Option>
                    );
                  })}
                </Select>
              </Form.Item>
              <Form.Item name="month">
                <Select placeholder="选择月份" style={{ width: 100 }} allowClear>
                  {Array.from({ length: 12 }, (_, i) => (
                    <Select.Option key={i + 1} value={i + 1}>{i + 1}月</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          ) : (
            <Form.Item name="dateRange">
              <RangePicker
                style={{ width: 240 }}
                placeholder={['开始日期', '结束日期']}
                format="YYYY-MM-DD"
              />
            </Form.Item>
          )}
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                搜索
              </Button>
              <Button onClick={() => {
                searchForm.resetFields();
                setDateMode('month');
                setSearchParams({ page: 1, limit: 10, year: new Date().getFullYear(), month: String(new Date().getMonth() + 1) });
              }}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 账单列表 */}
      <Card
        title="账单列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增账单
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={billsData?.data?.bills || []}
          rowKey="id"
          loading={billsLoading}
          pagination={{
            current: billsData?.data?.currentPage || 1,
            total: billsData?.data?.total || 0,
            pageSize: searchParams.limit,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 新增/编辑模态框 */}
      <Modal
        title={editingBill ? '编辑账单' : '新增账单'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingBill(null);
          billForm.resetFields();
        }}
        confirmLoading={createBillMutation.isLoading || updateBillMutation.isLoading}
        width={600}
      >
        <Form
          form={billForm}
          layout="vertical"
          initialValues={{
            type: '支出',
            status: '已支付',
            date: dayjs(), // 默认当前时间
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="账单标题"
                rules={[{ required: true, message: '请输入账单标题' }]}
              >
                <Input placeholder="请输入账单标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="类型"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Select>
                  <Select.Option value="收入">收入</Select.Option>
                  <Select.Option value="支出">支出</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="金额"
                rules={[{ required: true, message: '请输入金额' }]}
              >
                <InputNumber
                  placeholder="请输入金额"
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  prefix="¥"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select
                  placeholder="请选择分类"
                  showSearch
                  allowClear
                  optionFilterProp="children"
                >
                  {allCategories.map(cat => (
                    <Select.Option key={cat} value={cat}>{cat}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  <Select.Option value="已支付">已支付</Select.Option>
                  <Select.Option value="待支付">待支付</Select.Option>
                  <Select.Option value="已逾期">已逾期</Select.Option>
                  <Select.Option value="已取消">已取消</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="描述">
            <Input.TextArea
              placeholder="请输入账单描述（可选）"
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item name="tags" label="标签">
            <Select
              mode="tags"
              placeholder="添加标签（可选）"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BillManagement; 