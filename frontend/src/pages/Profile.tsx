import React from 'react';
import {
  Card,
  Button,
  Typography,
  Descriptions,
  Space,
  Modal,
  message,
  Divider,
  Statistic,
  Row,
  Col
} from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  LogoutOutlined,
  SettingOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { useEffect } from 'react';

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { orders, fetchOrders, isLoading } = useOrderStore();

  useEffect(() => {
    // 当用户信息加载后，获取该用户的订单列表
    if (user) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  // 计算订单统计
  const orderStats = {
    total: orders.length,
    pending: orders.filter(order => order.status === 'pending').length,
    processing: orders.filter(order => order.status === 'in_progress').length,
    completed: orders.filter(order => order.status === 'completed').length,
    cancelled: orders.filter(order => order.status === 'cancelled').length
  };

  const handleLogout = () => {
    confirm({
      title: '确认退出',
      icon: <ExclamationCircleOutlined />,
      content: '您确定要退出登录吗？',
      okText: '确认退出',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        logout();
        message.success('已成功退出登录');
        navigate('/');
      }
    });
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleViewOrders = () => {
    navigate('/order/list');
  };

  const handleCreateOrder = () => {
    navigate('/order/create');
  };

  const handleRepairRequest = () => {
    navigate('/repair/request');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <div className="text-center">
            <Title level={3}>请先登录</Title>
            <Paragraph className="text-gray-600 mb-6">
              您需要登录后才能访问个人中心
            </Paragraph>
            <Space>
              <Button onClick={() => navigate('/login')} type="primary">
                去登录
              </Button>
              <Button onClick={handleGoHome}>
                返回首页
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="mb-6">
          <Title level={2} className="text-center text-blue-600 mb-2">
            <UserOutlined className="mr-2" />
            个人中心
          </Title>
          <div className="text-center">
            <Button 
              icon={<HomeOutlined />} 
              onClick={handleGoHome}
              className="mr-2"
            >
              返回首页
            </Button>
            <Button 
              icon={<FileTextOutlined />} 
              onClick={handleViewOrders}
              type="primary"
            >
              我的订单
            </Button>
          </div>
        </div>

        <Row gutter={[24, 24]}>
          {/* 用户信息卡片 */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <span>
                  <UserOutlined className="mr-2" />
                  个人信息
                </span>
              }
              className="h-full"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserOutlined className="text-3xl text-blue-600" />
                </div>
                <Title level={4} className="mb-2">{user.name}</Title>
                <Text type="secondary">用户ID: {user.id}</Text>
              </div>
              
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item 
                  label={<span><UserOutlined className="mr-1" />姓名</span>}
                >
                  {user.name}
                </Descriptions.Item>
                <Descriptions.Item 
                  label={<span><PhoneOutlined className="mr-1" />手机号</span>}
                >
                  {user.phone}
                </Descriptions.Item>
                <Descriptions.Item 
                  label={<span><UserOutlined className="mr-1" />角色</span>}
                >
                  {user.role === 'user' ? '普通用户' : user.role === 'technician' ? '维修员' : user.role === 'admin' ? '管理员' : user.role === 'service' ? '客服人员' : '财务人员'}
                </Descriptions.Item>
                <Descriptions.Item label="注册时间">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '未知'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* 订单统计卡片 */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <span>
                  <FileTextOutlined className="mr-2" />
                  订单统计
                </span>
              }
              className="h-full"
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic 
                    title="总订单数" 
                    value={orderStats.total} 
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="待处理" 
                    value={orderStats.pending} 
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="处理中" 
                    value={orderStats.processing} 
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="已完成" 
                    value={orderStats.completed} 
                    valueStyle={{ color: '#13c2c2' }}
                  />
                </Col>
              </Row>
              
              <Divider />
              
              <div className="text-center">
                <Space direction="vertical" className="w-full">
                  <Button 
                    type="primary" 
                    block 
                    onClick={handleViewOrders}
                    icon={<FileTextOutlined />}
                  >
                    查看所有订单
                  </Button>
                  <Button 
                    block 
                    onClick={handleCreateOrder}
                    className="border-blue-300 text-blue-600 hover:border-blue-500 hover:text-blue-700"
                  >
                    创建新订单
                  </Button>
                </Space>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 快捷操作区域 */}
        <Card className="mt-6">
          <Title level={4} className="mb-4">
            <SettingOutlined className="mr-2" />
            快捷操作
          </Title>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Button 
                type="primary" 
                block 
                size="large"
                onClick={handleCreateOrder}
                className="h-16 bg-blue-500 hover:bg-blue-600"
              >
                <div className="text-center">
                  <div><FileTextOutlined className="text-xl" /></div>
                  <div className="text-sm mt-1">创建订单</div>
                </div>
              </Button>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Button 
                block 
                size="large"
                onClick={handleRepairRequest}
                className="h-16 bg-orange-500 hover:bg-orange-600 text-white border-0"
              >
                <div className="text-center">
                  <div><SettingOutlined className="text-xl" /></div>
                  <div className="text-sm mt-1">设备报修</div>
                </div>
              </Button>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Button 
                block 
                size="large"
                onClick={handleViewOrders}
                className="h-16 border-green-300 text-green-600 hover:border-green-500 hover:text-green-700"
              >
                <div className="text-center">
                  <div><FileTextOutlined className="text-xl" /></div>
                  <div className="text-sm mt-1">我的订单</div>
                </div>
              </Button>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Button 
                block 
                size="large"
                onClick={handleGoHome}
                className="h-16 border-gray-300 text-gray-600 hover:border-gray-500 hover:text-gray-700"
              >
                <div className="text-center">
                  <div><HomeOutlined className="text-xl" /></div>
                  <div className="text-sm mt-1">返回首页</div>
                </div>
              </Button>
            </Col>
          </Row>
        </Card>

        {/* 退出登录区域 */}
        <Card className="mt-6 border-red-200">
          <div className="text-center">
            <Title level={4} className="text-red-600 mb-4">
              <LogoutOutlined className="mr-2" />
              账户管理
            </Title>
            <Paragraph className="text-gray-600 mb-4">
              如果您需要退出当前账户，请点击下方按钮
            </Paragraph>
            <Button 
              type="primary" 
              danger 
              size="large"
              onClick={handleLogout}
              icon={<LogoutOutlined />}
            >
              退出登录
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;