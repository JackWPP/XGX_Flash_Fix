import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Descriptions, Card, Spin, Alert, Row, Col, Typography, Tag, Button, Modal } from 'antd';
import { UserOutlined, ToolOutlined, AppstoreOutlined, InfoCircleOutlined, CalendarOutlined, DollarCircleOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import api from '../utils/axios';
import type { Order } from '../types';

const { Title, Text } = Typography;

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) {
        setError('订单ID不存在');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/api/v1/orders/${id}`);
        if (response.data.success) {
          setOrder(response.data.data);
        } else {
          setError(response.data.message || '获取订单详情失败');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || '网络错误，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'orange',
      confirmed: 'blue',
      in_progress: 'cyan',
      completed: 'green',
      cancelled: 'red'
    };
    return statusColors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const statusTexts: Record<string, string> = {
      pending: '待确认',
      confirmed: '已确认',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消'
    };
    return statusTexts[status] || status;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="加载失败"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  if (!order) {
    return (
      <Alert
        message="订单不存在"
        description="未找到对应的订单信息"
        type="warning"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>订单详情</Title>
      
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title={<><InfoCircleOutlined /> 基本信息</>}>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="订单号">{order.order_number}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(order.status)}>{getStatusText(order.status)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="预约时间">
                <CalendarOutlined /> {new Date(order.scheduled_time).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="服务地址">{order.address}</Descriptions.Item>
              <Descriptions.Item label="最终价格">
                <DollarCircleOutlined /> ¥{order.final_price}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(order.created_at).toLocaleString()}
              </Descriptions.Item>
              {order.notes && (
                <Descriptions.Item label="备注" span={2}>{order.notes}</Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        <Col span={12}>
          <Card title={<><UserOutlined /> 客户信息</>}>
            <Descriptions column={1}>
              <Descriptions.Item label="姓名">{order.users.name}</Descriptions.Item>
              <Descriptions.Item label="电话">
                <PhoneOutlined /> {order.users.phone}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                <MailOutlined /> {order.users.email}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col span={12}>
          <Card title={<><AppstoreOutlined /> 服务信息</>}>
            <Descriptions column={1}>
              <Descriptions.Item label="服务名称">{order.services.name}</Descriptions.Item>
              <Descriptions.Item label="服务描述">{order.services.description}</Descriptions.Item>
              <Descriptions.Item label="服务类别">{order.services.category}</Descriptions.Item>
              <Descriptions.Item label="基础价格">¥{order.services.base_price}</Descriptions.Item>
              <Descriptions.Item label="预计时长">{order.services.duration}分钟</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {order.technicians && (
          <Col span={24}>
            <Card title={<><ToolOutlined /> 技师信息</>}>
              <Descriptions column={2}>
                <Descriptions.Item label="技师姓名">{order.technicians.name}</Descriptions.Item>
                <Descriptions.Item label="联系电话">
                  <PhoneOutlined /> {order.technicians.phone}
                </Descriptions.Item>
                {order.technicians.specialties && (
                  <Descriptions.Item label="专业技能" span={2}>
                    {order.technicians.specialties.map((specialty, index) => (
                      <Tag key={index} color="blue">{specialty}</Tag>
                    ))}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default OrderDetail;