import React, { useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, message, Typography } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined,
  EyeOutlined,
  MailOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import type { Order } from '../types';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const statusMap = {
  pending: '待处理',
  pending_acceptance: '待技师接收',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  paid: '已支付',
};

const statusColor = {
  pending: 'orange',
  pending_acceptance: 'gold',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'red',
  paid: 'purple',
};

// “待我接收”列表的列定义
const PendingAcceptanceColumns = (
  onAccept: (id: string) => void, 
  onReject: (id: string) => void,
  onViewDetails: (id: string) => void
) => [
  { title: '订单号', dataIndex: 'order_number', key: 'order_number' },
  { title: '用户', dataIndex: ['users', 'name'], key: 'user_name' },
  { title: '服务类型', dataIndex: ['services', 'name'], key: 'service_name' },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (text:string) => new Date(text).toLocaleString() },
  {
    title: '操作',
    key: 'action',
    render: (_: any, record: Order) => (
      <Space>
        <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => onAccept(record.id)}>接受</Button>
        <Button danger size="small" icon={<CloseCircleOutlined />} onClick={() => onReject(record.id)}>拒绝</Button>
        <Button size="small" icon={<EyeOutlined />} onClick={() => onViewDetails(record.id)}>详情</Button>
      </Space>
    ),
  },
];

// “我的订单”列表的列定义
const MyOrdersColumns = (onViewDetails: (id: string) => void) => [
    { title: '订单号', dataIndex: 'order_number', key: 'order_number' },
    { title: '用户', dataIndex: ['users', 'name'], key: 'user_name' },
    { title: '服务类型', dataIndex: ['services', 'name'], key: 'service_name' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof statusMap) => <Tag color={statusColor[status]}>{statusMap[status]}</Tag>,
    },
    { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', render: (text:string) => new Date(text).toLocaleString() },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Order) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => onViewDetails(record.id)}>处理 / 详情</Button>
      ),
    },
];


const TechnicianDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    orders, 
    pendingAcceptanceOrders,
    fetchOrders, 
    fetchPendingAcceptanceOrders,
    acceptOrder,
    rejectOrder,
    isLoading 
  } = useOrderStore();

  useEffect(() => {
    // 获取分配给当前技师的、状态为“待接收”的订单
    fetchPendingAcceptanceOrders({});
    // 获取当前技师处理中或已完成的订单
    fetchOrders({ status: 'in_progress' });
  }, [fetchPendingAcceptanceOrders, fetchOrders]);

  const handleAccept = async (orderId: string) => {
    try {
      await acceptOrder(orderId);
      message.success('订单已接受！');
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleReject = async (orderId: string) => {
    try {
      await rejectOrder(orderId);
      message.warning('订单已拒绝。');
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleViewDetails = (orderId: string) => {
    navigate(`/order/detail/${orderId}`);
  };

  // 统计数据
  const stats = {
    pendingAcceptance: pendingAcceptanceOrders.length,
    inProgress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <Title level={2} className="mb-2">工作台</Title>
      <Text type="secondary" className="mb-6 block">欢迎回来, {user?.name}！</Text>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="待我接收"
              value={stats.pendingAcceptance}
              prefix={<MailOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="进行中"
              value={stats.inProgress}
              prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="已完成 (本月)"
              value={stats.completed}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="待我接收的订单" className="mb-6">
        <Table
          columns={PendingAcceptanceColumns(handleAccept, handleReject, handleViewDetails)}
          dataSource={pendingAcceptanceOrders}
          rowKey="id"
          loading={isLoading}
          pagination={false}
        />
      </Card>

      <Card title="我处理中的订单">
        <Table
          columns={MyOrdersColumns(handleViewDetails)}
          dataSource={orders.filter(o => o.status === 'in_progress')}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  );
};

export default TechnicianDashboard;
