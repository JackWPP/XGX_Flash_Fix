import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Input,
  Select,

  Modal,
  Rate,
  message,
  Tooltip,
} from 'antd';
import {
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/orderStore';

// 本地类型定义
type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'paid';

type UserRole = 'user' | 'technician' | 'admin' | 'service' | 'finance';

interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  options: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: string;
  orderNo?: string;
  userId: string;
  serviceId?: string;
  serviceType: string;
  deviceModel?: string;
  description: string;
  images: string[];
  urgency: string;
  status: OrderStatus;
  quotedPrice?: number;
  finalPrice?: number;
  estimatedPrice?: number;
  assignedTo?: string;
  contactName?: string;
  contactPhone?: string;
  address?: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  service?: Service;
  assignedUser?: User;
}
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const { TextArea } = Input;

// 订单状态配置
const statusConfig = {
  pending: { color: 'orange', text: '待接单' },
  accepted: { color: 'blue', text: '已接单' },
  in_progress: { color: 'processing', text: '维修中' },
  completed: { color: 'success', text: '已完成' },
  cancelled: { color: 'error', text: '已取消' },
  paid: { color: 'green', text: '已支付' }
};

// 紧急程度配置
const urgencyConfig = {
  low: { color: 'default', text: '不紧急' },
  medium: { color: 'blue', text: '一般' },
  high: { color: 'orange', text: '紧急' },
  urgent: { color: 'red', text: '特急' }
};

const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const { orders, isLoading, fetchOrders, updateOrderStatus } = useOrderStore();

  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    let filtered = orders;

    // 状态筛选
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // 搜索筛选
    if (searchText) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchText.toLowerCase()) ||
        order.serviceType.toLowerCase().includes(searchText.toLowerCase()) ||
        order.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchText]);

  // 查看订单详情
  const handleViewOrder = (orderId: string) => {
    navigate(`/order/detail/${orderId}`);
  };

  // 取消订单
  const handleCancelOrder = async (orderId: string) => {
    Modal.confirm({
      title: '确认取消订单',
      content: '取消后订单无法恢复，确定要取消吗？',
      onOk: async () => {
        try {
          await updateOrderStatus(orderId, 'cancelled');
          message.success('订单已取消');
          fetchOrders();
        } catch {
          message.error('取消订单失败');
        }
      }
    });
  };

  // 评价订单
  const handleRateOrder = (order: Order) => {
    setSelectedOrder(order);
    setRateModalVisible(true);
  };

  // 提交评价
  const handleSubmitRating = async () => {
    if (!selectedOrder) return;

    try {
      // 这里应该调用评价API
      message.success('评价提交成功');
      setRateModalVisible(false);
      setRating(5);
      setComment('');
      setSelectedOrder(null);
    } catch {
      message.error('评价提交失败');
    }
  };

  const columns: ColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => (
        <Text copyable={{ text: id }} className="font-mono text-sm">
          {id.slice(0, 8)}...
        </Text>
      )
    },
    {
      title: '服务类型',
      dataIndex: 'serviceType',
      key: 'serviceType',
      width: 120,
      render: (serviceType: string) => {
        const serviceMap: { [key: string]: string } = {
          'system-reinstall': '系统重装',
          'cleaning': '清灰服务',
          'software-install': '软件安装',
          'water-damage': '电脑进水',
          'battery-replacement': '手机电池更换',
          'screen-replacement': '手机屏幕更换'
        };
        return serviceMap[serviceType] || serviceType;
      }
    },
    {
      title: '问题描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (description: string) => (
        <Tooltip title={description}>
          <Text ellipsis style={{ maxWidth: 180 }}>
            {description}
          </Text>
        </Tooltip>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: OrderStatus) => {
        const config = statusConfig[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '紧急程度',
      dataIndex: 'urgency',
      key: 'urgency',
      width: 100,
      render: (urgency: string) => {
        const config = urgencyConfig[urgency as keyof typeof urgencyConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '预估价格',
      dataIndex: 'estimatedPrice',
      key: 'estimatedPrice',
      width: 100,
      render: (price: number) => (
        <Text className="font-semibold text-orange-600">
          ¥{price}
        </Text>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record: Order) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewOrder(record.id)}
            />
          </Tooltip>
          
          {record.status === 'pending' && (
            <Tooltip title="取消订单">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleCancelOrder(record.id)}
              />
            </Tooltip>
          )}
          
          {record.status === 'completed' && !record.rating && (
            <Tooltip title="评价订单">
              <Button
                type="text"
                icon={<StarOutlined />}
                onClick={() => handleRateOrder(record)}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <Card className="mb-6">
          <div className="flex justify-between items-center mb-6">
            <Title level={2} className="m-0">
              我的订单
            </Title>
            <Space>
              <Button
                type="primary"
                onClick={() => navigate('/order/create')}
              >
                创建订单
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchOrders()}
                loading={isLoading}
              >
                刷新
              </Button>
            </Space>
          </div>

          {/* 筛选区域 */}
          <div className="mb-6">
            <Space wrap size="middle">
              <Search
                placeholder="搜索订单号、服务类型或问题描述"
                allowClear
                style={{ width: 300 }}
                onSearch={setSearchText}
                onChange={(e) => !e.target.value && setSearchText('')}
              />
              
              <Select
                value={statusFilter}
                style={{ width: 120 }}
                onChange={(value: OrderStatus | 'all') => setStatusFilter(value)}
              >
                <Option value="all">全部状态</Option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <Option key={key} value={key}>
                    {config.text}
                  </Option>
                ))}
              </Select>
            </Space>
          </div>

          {/* 订单表格 */}
          <Table
            columns={columns}
            dataSource={filteredOrders}
            rowKey="id"
            loading={isLoading}
            pagination={{
              total: filteredOrders.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </div>

      {/* 评价模态框 */}
      <Modal
        title="订单评价"
        open={rateModalVisible}
        onOk={handleSubmitRating}
        onCancel={() => {
          setRateModalVisible(false);
          setRating(5);
          setComment('');
          setSelectedOrder(null);
        }}
        okText="提交评价"
        cancelText="取消"
      >
        {selectedOrder && (
          <div>
            <div className="mb-4">
              <Text strong>订单号：</Text>
              <Text className="font-mono">{selectedOrder.id}</Text>
            </div>
            <div className="mb-4">
              <Text strong>服务类型：</Text>
              <Text>{selectedOrder.serviceType}</Text>
            </div>
            <div className="mb-4">
              <Text strong>服务评分：</Text>
              <div className="mt-2">
                <Rate value={rating} onChange={setRating} />
              </div>
            </div>
            <div className="mb-4">
              <Text strong>评价内容：</Text>
              <TextArea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="请分享您对本次服务的评价和建议"
                maxLength={200}
                showCount
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderList;