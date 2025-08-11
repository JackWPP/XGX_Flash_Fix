import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Input, 
  Select, 
  DatePicker, 
  Row, 
  Col,
  message,
  Modal,
  Form,
  Upload,
  Progress
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CameraOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import type { Order } from '../../types';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const TechnicianOrders: React.FC = () => {
  const { user } = useAuthStore();
  const { orders, fetchOrders, updateOrderStatus } = useOrderStore();
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 获取分配给当前技师的订单
  const technicianOrders = orders.filter(order => {
    const matchesTechnician = order.technician_id === user?.id;
    const matchesSearch = !searchText || 
      order.order_number.toLowerCase().includes(searchText.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchText.toLowerCase()) ||
      order.service_name.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    
    return matchesTechnician && matchesSearch && matchesStatus;
  });

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
    Modal.confirm({
      title: '确认完成订单',
      content: '确认已完成维修工作？完成后将通知客户。',
      onOk: async () => {
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
      }
    });
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

  // 获取进度百分比
  const getProgressPercent = (status: string) => {
    const progressMap = {
      'assigned': 0,
      'in_progress': 50,
      'completed': 100,
      'cancelled': 0
    };
    return progressMap[status as keyof typeof progressMap] || 0;
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_number',
      key: 'order_number',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: '客户信息',
      key: 'customer',
      width: 150,
      render: (record: Order) => (
        <div>
          <div className="font-medium">{record.customer_name}</div>
          <div className="text-gray-500 text-sm">{record.customer_phone}</div>
        </div>
      ),
    },
    {
      title: '服务类型',
      dataIndex: 'service_name',
      key: 'service_name',
      width: 120,
    },
    {
      title: '设备信息',
      key: 'device',
      width: 200,
      render: (record: Order) => (
        <div>
          <div className="font-medium">{record.device_type} {record.device_model}</div>
          <div className="text-gray-500 text-sm line-clamp-2">{record.issue_description}</div>
        </div>
      ),
    },
    {
      title: '紧急程度',
      dataIndex: 'urgency',
      key: 'urgency',
      width: 100,
      render: (urgency: string) => getUrgencyTag(urgency),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '进度',
      key: 'progress',
      width: 120,
      render: (record: Order) => (
        <Progress 
          percent={getProgressPercent(record.status)} 
          size="small"
          status={record.status === 'completed' ? 'success' : 'active'}
        />
      ),
    },
    {
      title: '预约时间',
      dataIndex: 'preferred_time',
      key: 'preferred_time',
      width: 150,
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (record: Order) => (
        <Space size="small">
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
                icon={<CheckCircleOutlined />}
                onClick={() => handleCompleteOrder(record.id)}
                loading={loading}
              >
                完成
              </Button>
            </>
          )}
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => {
              window.open(`/order/detail/${record.id}`, '_blank');
            }}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">我的订单</h1>
        
        {/* 搜索和筛选 */}
        <Card className="mb-4">
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Input
                placeholder="搜索订单号、客户姓名或服务类型"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={6}>
              <Select
                placeholder="订单状态"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                className="w-full"
              >
                <Option value="assigned">已分配</Option>
                <Option value="in_progress">进行中</Option>
                <Option value="completed">已完成</Option>
                <Option value="cancelled">已取消</Option>
              </Select>
            </Col>
            <Col xs={24} sm={8}>
              <RangePicker className="w-full" placeholder={['开始日期', '结束日期']} />
            </Col>
            <Col xs={24} sm={2}>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => {
                  setSearchText('');
                  setStatusFilter('');
                  fetchOrders();
                }}
              >
                重置
              </Button>
            </Col>
          </Row>
        </Card>
      </div>

      {/* 订单列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={technicianOrders}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1400 }}
          size="middle"
        />
      </Card>

      {/* 进度更新模态框 */}
      <Modal
        title={`更新订单进度 - ${selectedOrder?.order_number}`}
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
            <TextArea
              rows={4}
              placeholder="请详细描述当前维修进度、遇到的问题或需要客户配合的事项..."
            />
          </Form.Item>

          <Form.Item
            name="photos"
            label="维修照片"
            extra="上传维修过程照片，让客户了解维修进展"
          >
            <Upload
              listType="picture-card"
              multiple
              beforeUpload={() => false}
              maxCount={6}
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

export default TechnicianOrders;