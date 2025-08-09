import React from 'react';
import { Card, Typography, Row, Col, Statistic } from 'antd';
import { AreaChartOutlined, UserOutlined, FileDoneOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const AdminDashboard: React.FC = () => {
  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <Title level={2} className="mb-6 text-gray-800">
        后台管理仪表盘
      </Title>
      
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="总用户数"
              value={1128}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="今日订单"
              value={93}
              prefix={<FileDoneOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="总收入"
              value={112893.00}
              prefix="¥"
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Title level={4}>功能正在开发中</Title>
        <Text type="secondary">
          这是一个后台管理的占位页面。后续将在这里添加更多数据图表和管理功能。
        </Text>
      </Card>
    </div>
  );
};

export default AdminDashboard;
