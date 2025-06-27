/**
 * 个人资料页面组件
 * 功能：用户个人信息管理、密码修改、系统设置等
 */
import React, { useState } from 'react';
import { Card, Form, Input, Button, Avatar, Upload, message, Divider, Row, Col } from 'antd';
import { UserOutlined, CameraOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { userAPI } from '../services/api';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // 处理头像上传
  const handleAvatarUpload = (info: any) => {
    if (info.file.status === 'done') {
      // 这里应该上传到服务器并获取URL
      const avatarUrl = URL.createObjectURL(info.file.originFileObj);
      updateUser({ avatar: avatarUrl });
      message.success('头像更新成功');
    }
  };

  // 更新个人信息
  const handleUpdateProfile = async (values: any) => {
    setLoading(true);
    try {
      const response = await userAPI.updateUser(values);
      if (response.status === 'success' && response.data) {
        updateUser(response.data);
        message.success('个人信息更新成功');
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async (values: any) => {
    setPasswordLoading(true);
    try {
      const response = await userAPI.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      if (response.status === 'success') {
        message.success('密码修改成功');
        passwordForm.resetFields();
      } else {
        message.error(response.message || '密码修改失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '密码修改失败，请重试');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 24 }}>个人资料</h1>

      {/* 基本信息卡片 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <Upload
            name="avatar"
            listType="picture-card"
            className="avatar-uploader"
            showUploadList={false}
            action="/api/upload/avatar"
            onChange={handleAvatarUpload}
          >
            <Avatar
              size={80}
              src={user?.avatar}
              icon={<UserOutlined />}
              style={{ cursor: 'pointer' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: '#1890ff',
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <CameraOutlined style={{ fontSize: 12 }} />
            </div>
          </Upload>
          <div style={{ marginLeft: 24 }}>
            <h2 style={{ margin: 0 }}>{user?.name}</h2>
            <p style={{ color: '#666', margin: '4px 0' }}>{user?.email}</p>
            <p style={{ color: '#666', margin: 0 }}>
              {user?.role === 'admin' ? '管理员' : user?.role === 'manager' ? '经理' : '销售员'}
            </p>
          </div>
        </div>

        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleUpdateProfile}
          initialValues={{
            name: user?.name,
            email: user?.email,
            phone: user?.phone,
            department: user?.department,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号码"
              >
                <Input prefix={<PhoneOutlined />} placeholder="请输入手机号码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="department"
                label="部门"
              >
                <Input placeholder="请输入部门" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              更新信息
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 密码修改卡片 */}
      <Card title="修改密码">
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="oldPassword"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入当前密码"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不能少于6位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入新密码"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请确认新密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={passwordLoading}>
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Profile; 