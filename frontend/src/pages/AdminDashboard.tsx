import React, { useEffect } from 'react';
import { Card, Typography, Row, Col, Statistic, Button, Space, Table, Tag, Spin, Empty } from 'antd';
import { AreaChartOutlined, UserOutlined, FileDoneOutlined, DollarOutlined, PlusOutlined, EyeOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useUserStore } from '../store/userStore';
import { useOrderStore } from '../store/orderStore';
import { useServiceStore } from '../store/serviceStore';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // 从store获取数据
  const { users, total: totalUsers, fetchUsers } = useUserStore();
  const { orders, total: totalOrders, fetchOrders } = useOrderStore();
  const { services, total: totalServices, fetchServices } = useServiceStore();
  
  // 加载状态
  const [loading, setLoading] = React.useState(true);

  // 获取实时数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchUsers({ limit: 5 }),
          fetchOrders({ limit: 5 }),
          fetchServices({ limit: 5 })
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchUsers, fetchOrders, fetchServices]);

  // 计算统计数据
  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  }).length;

  const totalRevenue = orders.reduce((sum, order) => sum + (order.final_price || 0), 0);

  // 最近订单表格列定义
  const recentOrdersColumns = [
    {
      title: '订单号',
      dataIndex: 'order_number',
      key: 'order_number',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '客户',
      dataIndex: ['users', 'name'],
      key: 'user_name',
      render: (name: string) => name || '未知用户',
    },
    {
      title: '服务类型',
      dataIndex: ['services', 'name'],
      key: 'service_name',
      render: (name: string) => name || '未知服务',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          'pending': 'orange',
          'in_progress': 'blue',
          'completed': 'green',
          'cancelled': 'red',
          'paid': 'purple',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: '金额',
      dataIndex: 'final_price',
      key: 'final_price',
      render: (price: number) => `¥${price?.toFixed(2) || '0.00'}`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: any) => (
        <Button 
          type="link" 
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/order/detail/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  // 快速操作按钮
  const quickActions = [
    {
      title: '创建订单',
      icon: <PlusOutlined />,
      color: 'bg-blue-500',
      path: '/admin/orders/create',
    },
    {
      title: '用户管理',
      icon: <UserOutlined />,
      color: 'bg-green-500',
      path: '/admin/users',
    },
    {
      title: '服务管理',
      icon: <AreaChartOutlined />,
      color: 'bg-purple-500',
      path: '/admin/services',
    },
    {
      title: '查看所有订单',
      icon: <ArrowRightOutlined />,
      color: 'bg-orange-500',
      path: '/admin/orders',
    },
  ];

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <Title level={2} className="text-gray-800">
          后台管理仪表盘
        </Title>
        <Text type="secondary">
          实时监控业务数据和快速操作
        </Text>
      </div>
      
      {/* 快速操作区域 */}
      <Card className="mb-6">
        <Title level={4} className="mb-4">快速操作</Title>
        <Row gutter={[16, 16]}>
          {quickActions.map((action, index) => (
            <Col key={index} xs={24} sm={12} lg={6}>
              <Button
                type="primary"
                size="large"
                icon={action.icon}
                className={`w-full ${action.color} hover:opacity-90 transition-opacity`}
                onClick={() => navigate(action.path)}
              >
                {action.title}
              </Button>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 统计卡片区域 */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总订单数"
              value={totalOrders}
              prefix={<FileDoneOutlined />}
              valueStyle={{ color: '#cf1322' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日订单"
              value={todayOrders}
              prefix={<FileDoneOutlined />}
              valueStyle={{ color: '#faad14' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总收入"
              value={totalRevenue}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#1890ff' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* 最近订单区域 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="最近订单" extra={<Button type="link" onClick={() => navigate('/admin/orders')}>查看全部</Button>}>
            {loading ? (
              <div className="flex justify-center py-8">
                <Spin />
              </div>
            ) : orders.length > 0 ? (
              <Table
                dataSource={orders.slice(0, 5)}
                columns={recentOrdersColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="暂无订单数据" />
            )}
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="系统概览">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <Text>服务总数</Text>
                <Text strong>{totalServices}</Text>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <Text>活跃用户数</Text>
                <Text strong className="text-green-600">{users.filter(u => u.is_active).length}</Text>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <Text>待处理订单</Text>
                <Text strong className="text-orange-600">
                  {orders.filter(o => o.status === 'pending' || o.status === 'in_progress').length}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
