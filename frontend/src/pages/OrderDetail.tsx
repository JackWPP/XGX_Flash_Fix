import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Descriptions, Card, Spin, Alert, Row, Col, Typography, Tag, Divider, message } from 'antd';
import { useOrderStore } from '../store/orderStore';
import type { Order } from '../types';
import { useAuthStore } from '../store/authStore';
import TechnicianActions from '../components/technician/TechnicianActions';
import OrderLogList from '../components/technician/OrderLogList';

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

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { currentOrder, isLoading, error, fetchOrderById, addOrderLog, updateOrderDetails, transferOrder } = useOrderStore();
  
  useEffect(() => {
    if (id) {
      fetchOrderById(id);
    }
  }, [id, fetchOrderById]);

  const handleAddLog = async (values: { notes: string; images?: any[] }) => {
    if (!id) return;
    // 注意：实际项目中，图片需要先上传到服务器获取URL，这里仅为示例
    const imageUrls = values.images?.map(file => file.name) || [];
    try {
      await addOrderLog(id, { notes: values.notes, images: imageUrls });
      message.success('日志添加成功');
    } catch (e: any) {
      message.error(e.message || '日志添加失败');
    }
  };

  const handleUpdateDetails = async (values: { diagnosis: string; actual_price: number }) => {
    if (!id) return;
    try {
      await updateOrderDetails(id, values);
      message.success('订单详情更新成功');
    } catch (e: any) {
      message.error(e.message || '更新失败');
    }
  };

  const handleTransfer = async (newTechnicianId?: string) => {
    if (!id) return;
    try {
      await transferOrder(id, newTechnicianId);
      message.success(newTechnicianId ? '转单成功' : '订单已放弃');
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  if (isLoading && !currentOrder) return <div className="p-8 text-center"><Spin size="large" /></div>;
  if (error) return <Alert message="加载失败" description={error} type="error" showIcon className="m-8" />;
  if (!currentOrder) return <Alert message="未找到订单" type="warning" showIcon className="m-8" />;

  const isTechnicianOwner = user?.role === 'technician' && user.userId === currentOrder.technician_id;

  return (
    <div className="p-6 bg-gray-50">
      <Title level={2}>订单详情 - {currentOrder.order_number}</Title>
      
      {/* 技师操作面板 */}
      {isTechnicianOwner && currentOrder.status === 'in_progress' && (
        <Card className="mb-6">
          <TechnicianActions
            order={currentOrder}
            onUpdateDetails={handleUpdateDetails}
            onTransfer={handleTransfer}
          />
        </Card>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card title="基本信息" className="mb-6">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="状态">
                <Tag color={statusColor[currentOrder.status as keyof typeof statusColor]}>
                  {statusMap[currentOrder.status as keyof typeof statusMap]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="服务类型">{currentOrder.services.name}</Descriptions.Item>
              <Descriptions.Item label="设备型号">{currentOrder.device_type} - {currentOrder.device_model}</Descriptions.Item>
              <Descriptions.Item label="问题描述">{currentOrder.issue_description}</Descriptions.Item>
              <Descriptions.Item label="诊断内容">{currentOrder.diagnosis || '暂无'}</Descriptions.Item>
              <Descriptions.Item label="预估/最终报价">
                ¥{currentOrder.estimated_price} / ¥{currentOrder.actual_price || '---'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="维修日志">
            <OrderLogList logs={currentOrder.order_logs || []} onAddLog={isTechnicianOwner ? handleAddLog : undefined} />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="客户信息" className="mb-6">
            <Text strong>{currentOrder.users.name}</Text>
            <p>{currentOrder.contact_phone}</p>
            <p>{currentOrder.contact_address}</p>
          </Card>
          {currentOrder.technicians && (
            <Card title="负责技师">
              <Text strong>{currentOrder.technicians.name}</Text>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default OrderDetail;
