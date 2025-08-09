import React, { useEffect, useState } from 'react';
import {
  Table,
  Typography,
  Input,
  Button,
  Modal,
  Form,
  message,
  Tag,
  Row,
  Col,
  InputNumber,
  Switch,
  Select,
} from 'antd';
import { useServiceStore } from '../../store/serviceStore';
import type { Service } from '../../store/serviceStore';
import type { TableProps } from 'antd';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const ServiceManagement: React.FC = () => {
  const { services, total, isLoading, fetchServices, createService, updateService } = useServiceStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form] = Form.useForm();

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
  });

  useEffect(() => {
    fetchServices(filters);
  }, [fetchServices, filters]);

  const handleAddNew = () => {
    setEditingService(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true });
    setIsModalVisible(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.setFieldsValue({
      ...service,
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingService(null);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingService) {
        await updateService(editingService.id, values);
        message.success('服务更新成功');
      } else {
        await createService(values);
        message.success('服务创建成功');
      }
      handleCancel();
      fetchServices(filters); // Refresh data
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns: TableProps<Service>['columns'] = [
    { title: '服务名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    { title: '基础价格', dataIndex: 'base_price', key: 'base_price', render: (price) => `¥${price.toFixed(2)}` },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? '可用' : '禁用'}</Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (text) => new Date(text).toLocaleString() },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => handleEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>服务管理</Title>
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} md={8}>
          <Search
            placeholder="按服务名称或描述搜索"
            onSearch={(value) => setFilters({ ...filters, search: value, page: 1 })}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Button type="primary" onClick={handleAddNew}>
            新建服务
          </Button>
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={services}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: filters.page,
          pageSize: filters.limit,
          total: total,
          onChange: (page, limit) => {
            setFilters({ ...filters, page, limit });
          },
        }}
      />
      <Modal
        title={editingService ? '编辑服务' : '新建服务'}
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={isLoading}
      >
        <Form form={form} layout="vertical" initialValues={{ is_active: true }}>
          <Form.Item name="name" label="服务名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述" rules={[{ required: true }]}>
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="base_price" label="基础价格" rules={[{ required: true, type: 'number', min: 0 }]}>
            <InputNumber style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item name="is_active" label="是否可用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ServiceManagement;