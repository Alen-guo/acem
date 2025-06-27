/**
 * 联系记录弹窗组件
 * 功能：用于新增和编辑联系记录的弹窗表单
 */
import React from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber } from 'antd';
import { ContactMethod, ContactResult, ContactFormData } from '../types';

const { Option } = Select;
const { TextArea } = Input;

interface ContactModalProps {
  visible: boolean;
  loading: boolean;
  initialValues?: Partial<ContactFormData>;
  onCancel: () => void;
  onSubmit: (values: ContactFormData) => void;
}

const ContactModal: React.FC<ContactModalProps> = ({
  visible,
  loading,
  initialValues,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    onSubmit(values);
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={initialValues ? "编辑联系记录" : "新增联系记录"}
      open={visible}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={initialValues}
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
          <DatePicker
            style={{ width: '100%' }}
            placeholder="选择联系时间"
            showTime
            format="YYYY-MM-DD HH:mm"
          />
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
            <Option value="WhatsApp">WhatsApp</Option>
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
          <TextArea
            rows={4}
            placeholder="详细描述联系内容、客户反馈和讨论要点"
          />
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
          <InputNumber
            style={{ width: '100%' }}
            placeholder="联系时长"
            min={1}
            max={999}
          />
        </Form.Item>

        <Form.Item
          name="nextFollowUp"
          label="下次跟进时间"
        >
          <DatePicker
            style={{ width: '100%' }}
            placeholder="选择下次跟进时间"
            showTime
            format="YYYY-MM-DD HH:mm"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ContactModal; 