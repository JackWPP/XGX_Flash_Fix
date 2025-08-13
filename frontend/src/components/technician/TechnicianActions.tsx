import React, { useState } from 'react';
import { Button, Space, Tooltip } from 'antd';
import { EditOutlined, SwapOutlined } from '@ant-design/icons';
import type { Order } from '../../types';
import UpdateDetailsModal from './UpdateDetailsModal'; 
import TransferOrderModal from './TransferOrderModal';

interface TechnicianActionsProps {
  order: Order;
  onUpdateDetails: (values: { diagnosis: string; actual_price: number }) => Promise<void>;
  onTransfer: (newTechnicianId?: string) => Promise<void>;
}

const TechnicianActions: React.FC<TechnicianActionsProps> = ({ order, onUpdateDetails, onTransfer }) => {
  const [isUpdateModalVisible, setUpdateModalVisible] = useState(false);
  const [isTransferModalVisible, setTransferModalVisible] = useState(false);

  return (
    <>
      <Space>
        <Tooltip title="补充诊断内容或填写最终报价">
          <Button icon={<EditOutlined />} onClick={() => setUpdateModalVisible(true)}>
            更新详情
          </Button>
        </Tooltip>
        <Tooltip title="将此订单转交给其他技师或放弃回公海">
          <Button icon={<SwapOutlined />} onClick={() => setTransferModalVisible(true)} danger>
            转单/放弃
          </Button>
        </Tooltip>
      </Space>

      <UpdateDetailsModal
        visible={isUpdateModalVisible}
        onCancel={() => setUpdateModalVisible(false)}
        onOk={onUpdateDetails}
        order={order}
      />
      <TransferOrderModal
        visible={isTransferModalVisible}
        onCancel={() => setTransferModalVisible(false)}
        onOk={onTransfer}
      />
    </>
  );
};

export default TechnicianActions;
