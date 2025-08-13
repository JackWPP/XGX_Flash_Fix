import React, { useState } from 'react';
import { List, Form, Input, Button, Avatar, Upload, message, Space } from 'antd';
import { UserOutlined, PaperClipOutlined, SendOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';

const { TextArea } = Input;

interface OrderLog {
  id: string;
  notes: string;
  images?: string[];
  created_at: string;
  operator_id: string;
}

interface OrderLogListProps {
  logs: OrderLog[];
  onAddLog?: (values: { notes: string; images?: any[] }) => Promise<void>;
}

const OrderLogList: React.FC<OrderLogListProps> = ({ logs, onAddLog }) => {
  const [form] = Form.useForm();
  const { user } = useAuthStore();
  const [fileList, setFileList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values: { notes: string }) => {
    if (!onAddLog) return;
    setLoading(true);
    try {
      await onAddLog({ ...values, images: fileList });
      form.resetFields();
      setFileList([]);
    } catch (e) {
      // Error message is handled in the parent component
    } finally {
      setLoading(false);
    }
  };

  const handleBeforeUpload = (file: any) => {
    // Add file to list but prevent automatic upload
    setFileList(current => [...current, file]);
    return false;
  };

  return (
    <div>
      <List
        itemLayout="horizontal"
        dataSource={logs}
        renderItem={item => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar icon={<UserOutlined />} />}
              title={`操作员: ${item.operator_id}`} // In a real app, you'd fetch user name
              description={
                <div>
                  <p>{item.notes}</p>
                  {item.images && item.images.length > 0 && (
                    <Space>
                      {item.images.map((img, index) => (
                        <a key={index} href={img} target="_blank" rel="noopener noreferrer">
                          <PaperClipOutlined /> 查看附件 {index + 1}
                        </a>
                      ))}
                    </Space>
                  )}
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />
      {onAddLog && (
        <Form form={form} onFinish={handleFinish} layout="vertical" style={{ marginTop: '20px' }}>
          <Form.Item name="notes" rules={[{ required: true, message: '日志内容不能为空' }]}>
            <TextArea rows={3} placeholder={`作为 ${user?.name} 添加一条新的维修日志...`} />
          </Form.Item>
          <Form.Item>
            <Upload
              fileList={fileList}
              beforeUpload={handleBeforeUpload}
              onRemove={(file) => setFileList(current => current.filter(f => f.uid !== file.uid))}
              multiple
            >
              <Button icon={<PaperClipOutlined />}>上传照片</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SendOutlined />}>
              提交日志
            </Button>
          </Form.Item>
        </Form>
      )}
    </div>
  );
};

export default OrderLogList;
