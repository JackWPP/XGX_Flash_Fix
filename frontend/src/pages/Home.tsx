import React from 'react';
import { Card, Button, Row, Col, Typography, Input, FloatButton } from 'antd';
import {
  ToolOutlined,
  LaptopOutlined,
  MobileOutlined,
  SettingOutlined,
  CustomerServiceOutlined,
  PlusOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

// 服务项目数据
const services = [
  {
    id: 'system-reinstall',
    name: '系统重装',
    description: '电脑系统重新安装，包含驱动安装',
    icon: <LaptopOutlined className="text-2xl" />,
    price: '50元起',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
  },
  {
    id: 'cleaning',
    name: '清灰服务',
    description: '电脑内部清灰，提升散热效果',
    icon: <ToolOutlined className="text-2xl" />,
    price: '30元起',
    color: 'bg-green-50 border-green-200 hover:bg-green-100'
  },
  {
    id: 'software-install',
    name: '软件安装',
    description: '常用软件安装配置',
    icon: <SettingOutlined className="text-2xl" />,
    price: '20元起',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
  },
  {
    id: 'water-damage',
    name: '电脑进水',
    description: '电脑进水处理和维修',
    icon: <ToolOutlined className="text-2xl" />,
    price: '100元起',
    color: 'bg-red-50 border-red-200 hover:bg-red-100'
  },
  {
    id: 'battery-replacement',
    name: '手机电池更换',
    description: '手机电池更换服务',
    icon: <MobileOutlined className="text-2xl" />,
    price: '80元起',
    color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
  },
  {
    id: 'screen-replacement',
    name: '手机屏幕更换',
    description: '手机屏幕更换服务',
    icon: <MobileOutlined className="text-2xl" />,
    price: '150元起',
    color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
  }
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const handleServiceClick = (serviceId: string) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/order/create', search: `?service=${serviceId}` } } });
    } else {
      navigate(`/order/create?service=${serviceId}`);
    }
  };

  const handleQuickOrder = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/order/create' } } });
    } else {
      navigate('/order/create');
    }
  };

  const handleOrderSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/order/search?q=${encodeURIComponent(value.trim())}`);
    }
  };

  const handleRepairRequest = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/repair/request' } } });
    } else {
      navigate('/repair/request');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Title level={3} className="m-0 text-blue-600">
                新干线闪修平台
              </Title>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Text>欢迎，{user?.name}</Text>
                  <Button type="primary" onClick={() => navigate('/order/list')}>
                    我的订单
                  </Button>
                  <Button onClick={() => navigate('/profile')}>
                    个人中心
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => navigate('/login')}>登录</Button>
                  <Button type="primary" onClick={() => navigate('/register')}>
                    注册
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 欢迎区域 */}
        <div className="text-center mb-12">
          <Title level={1} className="text-gray-800 mb-4">
            专业维修服务，值得信赖
          </Title>
          <Paragraph className="text-lg text-gray-600 max-w-2xl mx-auto">
            提供电脑、手机等设备的专业维修服务，快速响应，透明报价，让您的设备重获新生
          </Paragraph>
        </div>

        {/* 订单查询 */}
        <div className="mb-12">
          <Card className="max-w-md mx-auto">
            <Title level={4} className="text-center mb-4">
              订单查询
            </Title>
            <Search
              placeholder="请输入订单号查询"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleOrderSearch}
            />
          </Card>
        </div>

        {/* 报修服务区域 */}
        <div className="mb-12">
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200">
            <div className="text-center">
              <div className="mb-4">
                <ToolOutlined className="text-4xl text-orange-600" />
              </div>
              <Title level={3} className="text-orange-800 mb-4">
                设备故障？不知道选什么服务？
              </Title>
              <Paragraph className="text-gray-700 mb-6 text-lg">
                直接描述您的设备故障，我们的专业技术员将为您诊断并提供最适合的解决方案
              </Paragraph>
              <Button
                type="primary"
                size="large"
                onClick={handleRepairRequest}
                className="bg-gradient-to-r from-orange-500 to-red-500 border-0 px-8 py-2 h-auto text-lg"
              >
                <ToolOutlined className="mr-2" />
                立即报修
              </Button>
            </div>
          </Card>
        </div>

        {/* 服务项目 */}
        <div className="mb-12">
          <Title level={2} className="text-center mb-8">
            或选择具体服务项目
          </Title>
          <Row gutter={[24, 24]}>
            {services.map((service) => (
              <Col xs={24} sm={12} lg={8} key={service.id}>
                <Card
                  className={`h-full cursor-pointer transition-all duration-300 ${service.color} border-2`}
                  hoverable
                  onClick={() => handleServiceClick(service.id)}
                >
                  <div className="text-center">
                    <div className="mb-4 text-blue-600">
                      {service.icon}
                    </div>
                    <Title level={4} className="mb-2">
                      {service.name}
                    </Title>
                    <Paragraph className="text-gray-600 mb-4">
                      {service.description}
                    </Paragraph>
                    <div className="text-orange-600 font-semibold text-lg">
                      {service.price}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* 服务优势 */}
        <div className="mb-12">
          <Title level={2} className="text-center mb-8">
            为什么选择我们
          </Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CustomerServiceOutlined className="text-2xl text-blue-600" />
                </div>
                <Title level={4}>专业技术</Title>
                <Paragraph className="text-gray-600">
                  经验丰富的维修团队，专业的技术支持，确保维修质量
                </Paragraph>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ToolOutlined className="text-2xl text-green-600" />
                </div>
                <Title level={4}>快速响应</Title>
                <Paragraph className="text-gray-600">
                  24小时内响应，快速诊断问题，高效完成维修服务
                </Paragraph>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SettingOutlined className="text-2xl text-orange-600" />
                </div>
                <Title level={4}>透明报价</Title>
                <Paragraph className="text-gray-600">
                  明码标价，无隐藏费用，让您清楚了解每一项服务成本
                </Paragraph>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* 快速下单浮动按钮 */}
      <FloatButton
        icon={<PlusOutlined />}
        type="primary"
        style={{ right: 24, bottom: 24 }}
        onClick={handleQuickOrder}
        tooltip="快速下单"
      />
    </div>
  );
};

export default Home;