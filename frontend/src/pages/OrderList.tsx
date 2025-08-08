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
import { getServiceMappingByDatabaseId, getServiceMappingByName } from '../utils/serviceMapping';
import api from '../utils/axios';

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

// 后端返回的原始订单数据结构（数据库字段名）
interface RawOrder {
  id: string;
  order_number?: string;
  user_id: string;
  service_id?: string;
  device_type: string;
  device_model?: string;
  issue_description: string;
  urgency_level: string;
  status: OrderStatus;
  estimated_price?: number;
  actual_price?: number;
  contact_phone?: string;
  contact_address?: string;
  created_at: string;
  updated_at: string;
  services?: Service;
  users?: User;
  technicians?: User;
}

// 前端使用的订单数据结构
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

// 紧急程度配置 - 与数据库字段值保持一致
const urgencyConfig = {
  low: { color: 'default', text: '不紧急' },
  normal: { color: 'blue', text: '一般' },
  high: { color: 'orange', text: '紧急' },
  urgent: { color: 'red', text: '特急' }
};

const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const { isLoading, updateOrderStatus } = useOrderStore();

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // 数据转换函数：将后端返回的数据转换为前端期望的格式
  const transformOrderData = (rawOrder: RawOrder): Order => {
    return {
      id: rawOrder.id,
      orderNo: rawOrder.order_number,
      userId: rawOrder.user_id,
      serviceId: rawOrder.service_id,
      serviceType: rawOrder.services?.name || '未知服务',
      deviceModel: rawOrder.device_model || '未知设备',
      description: rawOrder.issue_description || '无描述',
      images: [], // 暂时为空数组
      urgency: rawOrder.urgency_level,
      status: rawOrder.status,
      estimatedPrice: rawOrder.estimated_price,
      finalPrice: rawOrder.actual_price,
      contactPhone: rawOrder.contact_phone,
      address: rawOrder.contact_address,
      createdAt: rawOrder.created_at,
      updatedAt: rawOrder.updated_at,
      user: rawOrder.users,
      service: rawOrder.services,
      assignedUser: rawOrder.technicians
    };
  };

  useEffect(() => {
    const fetchAndTransformOrders = async () => {
      try {
        // 使用axios实例调用API，确保请求发送到正确的后端服务器
        const response = await api.get('/api/v1/orders?page=1&limit=100');
        
        console.log('API响应:', response.data); // 添加调试日志
        
        if (response.data.success && response.data.data) {
          // 转换数据格式
          const transformedOrders = response.data.data.map((rawOrder: RawOrder) => transformOrderData(rawOrder));
          console.log('转换后的订单数据:', transformedOrders); // 添加调试日志
          // 设置到allOrders状态
          setAllOrders(transformedOrders);
        } else {
          console.warn('API返回格式异常:', response.data);
          message.error('获取订单数据失败');
        }
      } catch (error) {
        console.error('获取订单失败:', error);
        message.error('网络请求失败，请检查网络连接');
      }
    };
    
    fetchAndTransformOrders();
  }, []);

  useEffect(() => {
    let filtered = allOrders;

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
  }, [allOrders, statusFilter, searchText]);

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
          // 重新获取订单列表
          const response = await api.get('/api/v1/orders?page=1&limit=100');
          
          if (response.data.success && response.data.data) {
            const transformedOrders = response.data.data.map((rawOrder: RawOrder) => transformOrderData(rawOrder));
            setAllOrders(transformedOrders);
          }
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
      render: (serviceType: string, record: Order) => {
        // 使用服务映射函数来获取正确的服务名称
        if (record.serviceId) {
          const serviceMapping = getServiceMappingByDatabaseId(record.serviceId);
          return serviceMapping?.name || serviceType || '未知服务';
        }
        // 如果没有serviceId，尝试通过服务名称获取映射
        const serviceMapping = getServiceMappingByName(serviceType);
        return serviceMapping?.name || serviceType || '未知服务';
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
        // 添加容错处理，避免undefined错误
        if (!config) {
          return <Tag color="default">{urgency || '未知'}</Tag>;
        }
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
                onClick={() => {
                  const fetchAndTransformOrders = async () => {
                    try {
                      const response = await api.get('/api/v1/orders?page=1&limit=100');
                      
                      console.log('刷新API响应:', response.data);
                      
                      if (response.data.success && response.data.data) {
                        const transformedOrders = response.data.data.map((rawOrder: RawOrder) => transformOrderData(rawOrder));
                        setAllOrders(transformedOrders);
                        message.success('订单列表已刷新');
                      } else {
                        console.warn('刷新API返回格式异常:', response.data);
                        message.error('刷新订单数据失败');
                      }
                    } catch (error) {
                      console.error('刷新订单失败:', error);
                      message.error('刷新失败，请检查网络连接');
                    }
                  };
                  fetchAndTransformOrders();
                }}
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