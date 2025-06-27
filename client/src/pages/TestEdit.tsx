import React, { useState } from 'react';
import { Table, Button, Form, Input, message, Space } from 'antd';
import { EditOutlined, SaveOutlined } from '@ant-design/icons';

interface TestData {
  key: string;
  name: string;
  age: number;
  email: string;
}

const TestEdit: React.FC = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState<TestData[]>([
    { key: '1', name: '张三', age: 25, email: 'zhangsan@example.com' },
    { key: '2', name: '李四', age: 30, email: 'lisi@example.com' },
    { key: '3', name: '王五', age: 28, email: 'wangwu@example.com' },
  ]);
  const [editingKey, setEditingKey] = useState<string>('');

  const isEditing = (record: TestData) => record.key === editingKey;

  const edit = (record: TestData) => {
    form.setFieldsValue({
      name: record.name,
      age: record.age,
      email: record.email,
    });
    setEditingKey(record.key);
    console.log('开始编辑:', record.key);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (key: string) => {
    try {
      const row = await form.validateFields();
      const newData = [...data];
      const index = newData.findIndex((item) => key === item.key);
      
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, { ...item, ...row });
        setData(newData);
        setEditingKey('');
        message.success('保存成功');
      }
    } catch (errInfo) {
      console.log('验证失败:', errInfo);
    }
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: TestData) => {
        const editing = isEditing(record);
        console.log('渲染姓名列:', { key: record.key, editing, editingKey });
        
        return editing ? (
          <Form.Item
            name="name"
            style={{ margin: 0 }}
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input />
          </Form.Item>
        ) : (
          text
        );
      },
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      render: (text: number, record: TestData) => {
        const editing = isEditing(record);
        
        return editing ? (
          <Form.Item
            name="age"
            style={{ margin: 0 }}
            rules={[{ required: true, message: '请输入年龄' }]}
          >
            <Input type="number" />
          </Form.Item>
        ) : (
          text
        );
      },
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (text: string, record: TestData) => {
        const editing = isEditing(record);
        
        return editing ? (
          <Form.Item
            name="email"
            style={{ margin: 0 }}
            rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}
          >
            <Input />
          </Form.Item>
        ) : (
          text
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TestData) => {
        const editing = isEditing(record);
        
        return editing ? (
          <Space>
            <Button
              type="link"
              onClick={() => save(record.key)}
              size="small"
              icon={<SaveOutlined />}
            >
              保存
            </Button>
            <Button
              type="link"
              onClick={cancel}
              size="small"
            >
              取消
            </Button>
          </Space>
        ) : (
          <Button
            type="link"
            disabled={editingKey !== ''}
            onClick={() => edit(record)}
            size="small"
            icon={<EditOutlined />}
          >
            编辑
          </Button>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>可编辑表格测试</h2>
      <p>当前编辑行: {editingKey || '无'}</p>
      
      <Form form={form} component={false}>
        <Table
          bordered
          dataSource={data}
          columns={columns}
          rowClassName={(record) => isEditing(record) ? 'editable-row editing' : 'editable-row'}
          pagination={false}
        />
      </Form>
    </div>
  );
};

export default TestEdit; 