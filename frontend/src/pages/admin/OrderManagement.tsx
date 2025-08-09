import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Typography,
  Input,
  Select,
  Button,
  Modal,
  Form,
  message,
  Tag,
  Space,
  Row,
  Col,
  DatePicker,
} from 'antd';
import { useOrderStore } from '../../store/orderStore';
import { useUserStore } from '../../store/userStore';
import type { User } from '../../store/userStore';
import type { TableProps } from 'antd';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'paid';

const statusMap: Record<OrderStatus, string> = {
  pending: '待处理',
  accepted: '已接单',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  paid: '已支付',
};

const statusColor: Record<OrderStatus, string> = {
  pending: 'orange',
  accepted: 'cyan',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'red',
  paid: 'purple',
};

const OrderManagement: React.FC = () => {
  const navigate = useNavigate();
  const { orders, total, isLoading, fetchOrders, assignTechnician } = useOrderStore();
  const { users: technicians, fetchUsers: fetchTechnicians } = useUserStore();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [form] = Form.useForm();

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: '',
  });

  useEffect(() => {
    fetchOrders(filters);
  }, [fetchOrders, filters]);

  useEffect(() => {
    // 获取技师列表用于指派
    fetchTechnicians({ role: 'technician', limit: 100 });
  }, [fetchTechnicians]);

  const handleAssign = (order: any) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedOrder(null);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (selectedOrder) {
        await assignTechnician(selectedOrder.id, values.technicianId);
        message.success('技师指派成功');
        handleCancel();
      }
    } catch (error) {
      message.error('指派失败');
    }
  };

  const columns: TableProps<any>['columns'] = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no' },
    { title: '用户', dataIndex: ['users', 'name'], key: 'user_name' },
    { title: '服务类型', dataIndex: ['services', 'name'], key: 'service_name' },
    { title: '设备型号', dataIndex: 'device_model', key: 'device_model' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => (
        <Tag color={statusColor[status]}>{statusMap[status]}</Tag>
      ),
    },
    { title: '指派给', dataIndex: ['technicians', 'name'], key: 'technician_name', render: (name) => name || '-' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (text) => new Date(text).toLocaleString() },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/order/detail/${record.id}`)}>详情</Button>
          {record.status === 'pending' && (
            <Button type="link" onClick={() => handleAssign(record)}>
              指派
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>订单管理</Title>
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} md={8}>
          <Search
            placeholder="按订单号、用户姓名搜索"
            onSearch={(value) => setFilters({ ...filters, search: value, page: 1 })}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="按状态筛选"
            style={{ width: '100%' }}
            onChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
            allowClear
          >
            {Object.entries(statusMap).map(([key, value]) => (
              <Option key={key} value={key}>{value}</Option>
            ))}
          </Select>
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={orders}
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
        title="指派技师"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={isLoading}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="technicianId" label="选择技师" rules={[{ required: true, message: '请选择一位技师' }]}>
            <Select placeholder="请选择技师">
              {technicians.map((tech) => (
                <Option key={tech.id} value={tech.id}>{tech.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderManagement;