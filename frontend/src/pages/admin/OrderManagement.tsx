import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Typography,
  Input,
  Select,
  Button,
  Modal,
  Form,
  message,
  Tag,
  Space,
  Row,
  Col,
  Tabs,
} from 'antd';
import { useOrderStore } from '../../store/orderStore';
import type { Order } from '../../types';
import { useUserStore } from '../../store/userStore';
import type { TableProps } from 'antd';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

// 更新状态映射
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

// 可复用的订单表格组件
const OrderTable: React.FC<{
  orders: Order[];
  loading: boolean;
  total: number;
  onAssign: (order: Order) => void;
  onPaginationChange: (page: number, limit: number) => void;
  activeTab: string;
}> = ({ orders, loading, total, onAssign, onPaginationChange, activeTab }) => {
  const navigate = useNavigate();

  const columns: TableProps<Order>['columns'] = [
    { title: '订单号', dataIndex: 'order_number', key: 'order_number' },
    { title: '用户', dataIndex: ['users', 'name'], key: 'user_name' },
    { title: '服务类型', dataIndex: ['services', 'name'], key: 'service_name' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof statusMap) => (
        <Tag color={statusColor[status]}>{statusMap[status]}</Tag>
      ),
    },
    { title: '指派给', dataIndex: ['technicians', 'name'], key: 'technician_name', render: (name) => name || '-' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (text) => new Date(text).toLocaleString() },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/order/detail/${record.id}`)}>详情</Button>
          {activeTab === 'unclaimed' && record.status === 'pending' && (
            <Button type="link" onClick={() => onAssign(record)}>指派</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={orders}
      rowKey="id"
      loading={loading}
      pagination={{
        pageSize: 10,
        total,
        onChange: onPaginationChange,
      }}
    />
  );
};


const OrderManagement: React.FC = () => {
  const {
    orders,
    unclaimedOrders,
    pendingAcceptanceOrders,
    pagination,
    isLoading,
    fetchOrders,
    fetchUnclaimedOrders,
    fetchPendingAcceptanceOrders,
    assignTechnician,
  } = useOrderStore();
  
  const { users: technicians, fetchUsers: fetchTechnicians } = useUserStore();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState('unclaimed');
  const [form] = Form.useForm();

  const fetchData = useCallback((page = 1, limit = 10) => {
    switch (activeTab) {
      case 'unclaimed':
        fetchUnclaimedOrders({ page, limit });
        break;
      case 'pending_acceptance':
        fetchPendingAcceptanceOrders({ page, limit });
        break;
      case 'all':
      default:
        fetchOrders({ page, limit });
        break;
    }
  }, [activeTab, fetchOrders, fetchUnclaimedOrders, fetchPendingAcceptanceOrders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchTechnicians({ role: 'technician', limit: 100 });
  }, [fetchTechnicians]);

  const handleAssign = (order: Order) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedOrder(null);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (selectedOrder) {
        await assignTechnician(selectedOrder.id, values.technicianId);
        message.success('技师指派成功');
        handleCancel();
        fetchData(); // Refresh current tab
      }
    } catch (error) {
      message.error('指派失败');
    }
  };

  const onTabChange = (key: string) => {
    setActiveTab(key);
  };

  const renderTable = () => {
    let dataSource: Order[] = [];
    if (activeTab === 'unclaimed') dataSource = unclaimedOrders;
    else if (activeTab === 'pending_acceptance') dataSource = pendingAcceptanceOrders;
    else if (activeTab === 'all') dataSource = orders;

    return (
      <OrderTable
        orders={dataSource}
        loading={isLoading}
        total={pagination.total}
        onAssign={handleAssign}
        onPaginationChange={(page, limit) => fetchData(page, limit)}
        activeTab={activeTab}
      />
    );
  };

  return (
    <div>
      <Title level={3}>订单管理</Title>
      <Tabs defaultActiveKey="unclaimed" onChange={onTabChange}>
        <TabPane tab="接单大厅 (待处理)" key="unclaimed">
          {renderTable()}
        </TabPane>
        <TabPane tab="待技师接收" key="pending_acceptance">
          {renderTable()}
        </TabPane>
        <TabPane tab="所有订单" key="all">
          {renderTable()}
        </TabPane>
      </Tabs>
      <Modal
        title="指派技师"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={isLoading}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="technicianId" label="选择技师" rules={[{ required: true, message: '请选择一位技师' }]}>
            <Select placeholder="请选择技师">
              {technicians.map((tech) => (
                <Option key={tech.id} value={tech.id}>{tech.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderManagement;
