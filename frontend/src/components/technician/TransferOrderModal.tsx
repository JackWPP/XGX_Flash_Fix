import React, { useEffect } from 'react';
import { Modal, Form, Select, Button, Space } from 'antd';
import { useUserStore } from '../../store/userStore';

const { Option } = Select;

interface TransferOrderModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (newTechnicianId?: string) => Promise<void>;
}

const TransferOrderModal: React.FC<TransferOrderModalProps> = ({ visible, onCancel, onOk }) => {
  const [form] = Form.useForm();
  const { users: technicians, fetchUsers } = useUserStore();

  useEffect(() => {
    if (visible) {
      fetchUsers({ role: 'technician', limit: 100 });
    }
  }, [visible, fetchUsers]);

  const handleTransfer = () => {
    form.validateFields().then(values => {
      onOk(values.newTechnicianId).then(() => {
        form.resetFields();
        onCancel();
      });
    });
  };

  const handleAbandon = () => {
    onOk(undefined).then(() => { // Pass undefined to signify abandonment
      form.resetFields();
      onCancel();
    });
  };

  return (
    <Modal
      title="转单或放弃订单"
      visible={visible}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel}>取消</Button>,
        <Button key="abandon" danger onClick={handleAbandon}>放弃订单</Button>,
        <Button key="submit" type="primary" onClick={handleTransfer}>确认转单</Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <p>您可以将此订单转交给另一位技师，或放弃订单使其返回接单大厅。</p>
        <Form.Item name="newTechnicianId" label="选择新的技师">
          <Select placeholder="选择一位技师以转单">
            {technicians.map(tech => (
              <Option key={tech.id} value={tech.id}>{tech.name}</Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TransferOrderModal;
