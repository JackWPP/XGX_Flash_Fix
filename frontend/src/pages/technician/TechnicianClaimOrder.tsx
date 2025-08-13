import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Typography, Button, message, Tag, Space, Tooltip } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useOrderStore } from '../../store/orderStore';
import type { Order } from '../../types';
import type { TableProps } from 'antd';

const { Title, Text } = Typography;

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

const TechnicianClaimOrder: React.FC = () => {
  const navigate = useNavigate();
  const {
    unclaimedOrders,
    pagination,
    isLoading,
    fetchUnclaimedOrders,
    claimOrder,
  } = useOrderStore();

  useEffect(() => {
    fetchUnclaimedOrders({});
  }, [fetchUnclaimedOrders]);

  const handleClaim = async (orderId: string) => {
    try {
      await claimOrder(orderId);
      message.success('接单成功！订单已进入您的处理列表。');
    } catch (error: any) {
      message.error(error.message || '接单失败，请重试');
    }
  };

  const columns: TableProps<Order>['columns'] = [
    { title: '订单号', dataIndex: 'order_number', key: 'order_number' },
    { title: '用户', dataIndex: ['users', 'name'], key: 'user_name' },
    { title: '服务类型', dataIndex: ['services', 'name'], key: 'service_name' },
    { title: '设备型号', dataIndex: 'device_model', key: 'device_model' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof statusMap) => (
        <Tag color={statusColor[status]}>{statusMap[status]}</Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (text) => new Date(text).toLocaleString() },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/order/detail/${record.id}`)}>详情</Button>
          <Tooltip title="将此订单分配给自己并开始处理">
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleClaim(record.id)}
              size="small"
            >
              接单
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>接单大厅</Title>
      <Text type="secondary">这里是所有等待处理的订单，您可以选择适合的订单进行承接。</Text>
      <Table
        columns={columns}
        dataSource={unclaimedOrders}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          onChange: (page, limit) => {
            fetchUnclaimedOrders({ page, limit });
          },
        }}
        style={{ marginTop: 24 }}
      />
    </div>
  );
};

export default TechnicianClaimOrder;
