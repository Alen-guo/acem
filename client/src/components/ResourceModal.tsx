/**
 * 资源管理弹窗组件
 * 功能：用于新增和编辑客户资源的弹窗表单
 */
import React from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { ResourceValue, ResourceAvailability, ResourceFormData } from '../types';

const { Option } = Select;
const { TextArea } = Input;

interface ResourceModalProps {
  visible: boolean;
  loading: boolean;
  initialValues?: Partial<ResourceFormData>;
  onCancel: () => void;
  onSubmit: (values: ResourceFormData) => void;
}

const ResourceModal: React.FC<ResourceModalProps> = ({
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
      title={initialValues ? "编辑资源信息" : "新增资源信息"}
      open={visible}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={500}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={initialValues}
      >
        <Form.Item
          name="type"
          label="资源类型"
          rules={[{ required: true, message: '请选择资源类型' }]}
        >
          <Select placeholder="选择资源类型">
            <Option value="资金">资金资源</Option>
            <Option value="渠道">渠道资源</Option>
            <Option value="人脉">人脉资源</Option>
            <Option value="技术">技术资源</Option>
            <Option value="设备">设备资源</Option>
            <Option value="其他">其他资源</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="资源描述"
          rules={[{ required: true, message: '请输入资源描述' }]}
        >
          <TextArea
            rows={3}
            placeholder="详细描述资源内容、规模、特点等"
          />
        </Form.Item>

        <Form.Item
          name="value"
          label="资源价值"
          rules={[{ required: true, message: '请选择资源价值' }]}
        >
          <Select placeholder="选择资源价值等级">
            <Option value="高">高价值</Option>
            <Option value="中">中价值</Option>
            <Option value="低">低价值</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="availability"
          label="可用性状态"
          rules={[{ required: true, message: '请选择可用性状态' }]}
        >
          <Select placeholder="选择可用性状态">
            <Option value="可用">完全可用</Option>
            <Option value="部分可用">部分可用</Option>
            <Option value="不可用">暂不可用</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ResourceModal; 