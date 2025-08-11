import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, message, Modal, Upload, Input, Form } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined,
  EyeOutlined,
  EditOutlined,
  CameraOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import type { Order } from '../types';

const TechnicianDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { orders, fetchOrders, updateOrderStatus } = useOrderStore();
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 获取分配给当前技师的订单
  const technicianOrders = orders.filter(order => order.technician_id === user?.id);
  
  // 统计数据
  const stats = {
    pending: technicianOrders.filter(order => order.status === 'assigned').length,
    inProgress: technicianOrders.filter(order => order.status === 'in_progress').length,
    completed: technicianOrders.filter(order => order.status === 'completed').length,
    total: technicianOrders.length
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 状态标签映射
  const getStatusTag = (status: string) => {
    const statusMap = {
      'assigned': { color: 'blue', text: '已分配' },
      'in_progress': { color: 'orange', text: '进行中' },
      'completed': { color: 'green', text: '已完成' },
      'cancelled': { color: 'red', text: '已取消' }
    };
    const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 紧急程度标签
  const getUrgencyTag = (urgency: string) => {
    const urgencyMap = {
      'low': { color: 'green', text: '普通' },
      'medium': { color: 'orange', text: '紧急' },
      'high': { color: 'red', text: '非常紧急' }
    };
    const config = urgencyMap[urgency as keyof typeof urgencyMap] || { color: 'default', text: urgency };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 接受订单
  const handleAcceptOrder = async (orderId: string) => {
    try {
      setLoading(true);
      await updateOrderStatus(orderId, 'in_progress');
      message.success('订单已接受，开始维修');
      fetchOrders();
    } catch (error) {
      message.error('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 完成订单
  const handleCompleteOrder = async (orderId: string) => {
    try {
      setLoading(true);
      await updateOrderStatus(orderId, 'completed');
      message.success('订单已完成');
      fetchOrders();
    } catch (error) {
      message.error('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 更新进度
  const handleUpdateProgress = (order: Order) => {
    setSelectedOrder(order);
    setProgressModalVisible(true);
    form.setFieldsValue({
      progress_notes: order.progress_notes || ''
    });
  };

  // 提交进度更新
  const handleProgressSubmit = async (values: any) => {
    if (!selectedOrder) return;
    
    try {
      setLoading(true);
      // 这里应该调用更新进度的API
      message.success('进度更新成功');
      setProgressModalVisible(false);
      form.resetFields();
      fetchOrders();
    } catch (error) {
      message.error('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_number',
      key: 'order_number',
      width: 120,
    },
    {
      title: '客户信息',
      key: 'customer',
      render: (record: Order) => (
        <div>
          <div>{record.customer_name}</div>
          <div className="text-gray-500 text-sm">{record.customer_phone}</div>
        </div>
      ),
    },
    {
      title: '服务类型',
      dataIndex: 'service_name',
      key: 'service_name',
    },
    {
      title: '设备信息',
      key: 'device',
      render: (record: Order) => (
        <div>
          <div>{record.device_type} {record.device_model}</div>
          <div className="text-gray-500 text-sm">{record.issue_description}</div>
        </div>
      ),
    },
    {
      title: '紧急程度',
      dataIndex: 'urgency',
      key: 'urgency',
      render: (urgency: string) => getUrgencyTag(urgency),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: Order) => (
        <Space>
          {record.status === 'assigned' && (
            <Button 
              type="primary" 
              size="small" 
              onClick={() => handleAcceptOrder(record.id)}
              loading={loading}
            >
              接受订单
            </Button>
          )}
          {record.status === 'in_progress' && (
            <>
              <Button 
                size="small" 
                icon={<EditOutlined />}
                onClick={() => handleUpdateProgress(record)}
              >
                更新进度
              </Button>
              <Button 
                type="primary" 
                size="small" 
                onClick={() => handleCompleteOrder(record.id)}
                loading={loading}
              >
                完成订单
              </Button>
            </>
          )}
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => {
              // 查看订单详情
              window.open(`/order/detail/${record.id}`, '_blank');
            }}
          >
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">维修员工作台</h1>
        <p className="text-gray-600">欢迎回来，{user?.name}</p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待接单"
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="进行中"
              value={stats.inProgress}
              prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completed}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总订单"
              value={stats.total}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 订单列表 */}
      <Card title="我的订单" className="mb-6">
        <Table
          columns={columns}
          dataSource={technicianOrders}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 进度更新模态框 */}
      <Modal
        title="更新维修进度"
        open={progressModalVisible}
        onCancel={() => {
          setProgressModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleProgressSubmit}
        >
          <Form.Item
            name="progress_notes"
            label="进度说明"
            rules={[{ required: true, message: '请输入进度说明' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="请详细描述当前维修进度..."
            />
          </Form.Item>

          <Form.Item
            name="photos"
            label="维修照片"
          >
            <Upload
              listType="picture-card"
              multiple
              beforeUpload={() => false}
            >
              <div>
                <CameraOutlined />
                <div style={{ marginTop: 8 }}>上传照片</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setProgressModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                更新进度
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TechnicianDashboard;