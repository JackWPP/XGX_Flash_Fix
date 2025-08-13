import React from 'react';
import { Modal, Form, Input, InputNumber } from 'antd';
import type { Order } from '../../types';

interface UpdateDetailsModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (values: { diagnosis: string; actual_price: number }) => Promise<void>;
  order: Order;
}

const UpdateDetailsModal: React.FC<UpdateDetailsModalProps> = ({ visible, onCancel, onOk, order }) => {
  const [form] = Form.useForm();

  const handleOk = () => {
    form.validateFields().then(values => {
      onOk(values).then(() => {
        form.resetFields();
        onCancel(); // Close modal on success
      });
    });
  };

  return (
    <Modal
      title="更新订单详情"
      visible={visible}
      onCancel={onCancel}
      onOk={handleOk}
      okText="确认更新"
      cancelText="取消"
    >
      <Form form={form} layout="vertical" initialValues={{ diagnosis: order.diagnosis, actual_price: order.actual_price }}>
        <Form.Item name="diagnosis" label="诊断内容" rules={[{ required: true, message: '请填写诊断内容' }]}>
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item name="actual_price" label="最终报价" rules={[{ required: true, message: '请填写最终报价' }]}>
          <InputNumber min={0} style={{ width: '100%' }} addonAfter="元" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateDetailsModal;
