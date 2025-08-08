import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Select,
  Upload,
  message,
  Modal,
  Space
} from 'antd';
import type { UploadFile } from 'antd';
import {
  UploadOutlined,
  PhoneOutlined,
  UserOutlined,
  ToolOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/orderStore';
import { useAuthStore } from '../store/authStore';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 设备类型选项
const deviceTypes = [
  { value: 'laptop', label: '笔记本电脑' },
  { value: 'desktop', label: '台式电脑' },
  { value: 'phone', label: '手机' },
  { value: 'tablet', label: '平板电脑' },
  { value: 'printer', label: '打印机' },
  { value: 'other', label: '其他设备' }
];

// 紧急程度选项
const urgencyOptions = [
  { value: 'low', label: '不紧急（3-5天）' },
  { value: 'normal', label: '一般（1-2天）' },
  { value: 'high', label: '紧急（当天）' },
  { value: 'urgent', label: '特急（2小时内）' }
];

interface RepairRequestFormData {
  deviceType: string;
  deviceModel: string;
  issueDescription: string;
  contactName: string;
  contactPhone: string;
  urgencyLevel: string;
  images?: string[];
}

const RepairRequest: React.FC = () => {
  const navigate = useNavigate();
  const { createOrder, isLoading } = useOrderStore();
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // 文件上传配置
  const uploadProps = {
    fileList,
    beforeUpload: (file: File) => {
      const isImage = file.type.startsWith('image/');
      const isLt5M = file.size / 1024 / 1024 < 5;
      
      if (!isImage) {
        message.error('只能上传图片文件！');
        return false;
      }
      if (!isLt5M) {
        message.error('图片大小不能超过5MB！');
        return false;
      }
      
      const uploadFile: UploadFile = {
        uid: Date.now().toString(),
        name: file.name,
        status: 'done'
      };
      setFileList([...fileList, uploadFile]);
      return false; // 阻止自动上传
    },
    onRemove: (file: UploadFile) => {
      setFileList(fileList.filter(item => item.uid !== file.uid));
    },
    maxCount: 5
  };

  // 提交报修请求
  const handleSubmit = async (values: RepairRequestFormData) => {
    try {
      // 构建报修订单数据
      const orderData = {
        serviceId: '00000000-0000-0000-0000-000000000000', // 报修服务使用默认服务ID
        deviceType: values.deviceType,
        deviceModel: values.deviceModel,
        issueDescription: values.issueDescription,
        urgencyLevel: values.urgencyLevel,
        contactPhone: values.contactPhone,
        contactAddress: '待确认', // 默认地址值
        images: fileList.map(file => file.name)
      };

      console.log('提交报修请求:', orderData);
      
      await createOrder(orderData);
      
      message.success({
        content: '报修请求提交成功！',
        duration: 3,
        onClose: () => {
          Modal.confirm({
            title: '报修请求提交成功',
            content: '我们将尽快安排技术员联系您进行初步诊断。您希望接下来做什么？',
            okText: '查看订单',
            cancelText: '返回主页',
            onOk: () => {
              navigate('/order/list');
            },
            onCancel: () => {
              navigate('/');
            }
          });
        }
      });
      
      // 默认4秒后自动返回主页
      setTimeout(() => {
        navigate('/');
      }, 4000);
      
    } catch (error) {
      console.error('报修请求提交失败:', error);
      const errorMsg = error instanceof Error ? error.message : '提交失败，请重试';
      message.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Card className="mb-6">
          <div className="text-center mb-6">
            <Title level={2} className="text-orange-600 mb-2">
              <ToolOutlined className="mr-2" />
              设备报修
            </Title>
            <Paragraph className="text-gray-600">
              描述您的设备故障，我们将安排专业技术员为您诊断并提供解决方案
            </Paragraph>
          </div>
        </Card>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            contactName: user?.name,
            contactPhone: user?.phone,
            urgencyLevel: 'normal'
          }}
        >
          <Card className="mb-6">
            <Title level={4} className="mb-4">
              <ExclamationCircleOutlined className="mr-2 text-orange-500" />
              设备信息
            </Title>
            
            <Form.Item
              name="deviceType"
              label="设备类型"
              rules={[{ required: true, message: '请选择设备类型' }]}
            >
              <Select
                placeholder="请选择您的设备类型"
                size="large"
              >
                {deviceTypes.map(type => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="deviceModel"
              label="设备型号"
              rules={[{ required: true, message: '请输入设备型号' }]}
            >
              <Input
                placeholder="请输入设备型号，如：ThinkPad X1 Carbon、iPhone 14 Pro、HP LaserJet等"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="issueDescription"
              label="故障描述"
              rules={[
                { required: true, message: '请详细描述设备故障' },
                { min: 20, message: '故障描述至少20个字符，以便技术员更好地了解问题' }
              ]}
            >
              <TextArea
                rows={6}
                placeholder="请详细描述设备故障现象，包括：&#10;1. 具体的故障表现（如：开不了机、屏幕花屏、运行缓慢等）&#10;2. 故障发生的时间和频率&#10;3. 故障发生前的操作或环境变化&#10;4. 已尝试的解决方法&#10;&#10;详细的描述有助于技术员快速定位问题并准备相应的工具和配件。"
                showCount
                maxLength={1000}
              />
            </Form.Item>

            <Form.Item label="故障图片">
              <Upload {...uploadProps} listType="picture-card">
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              </Upload>
              <Text type="secondary" className="text-sm">
                支持jpg、png格式，单张图片不超过5MB，最多上传5张。清晰的故障图片有助于技术员提前了解问题。
              </Text>
            </Form.Item>
          </Card>

          <Card className="mb-6">
            <Title level={4} className="mb-4">
              <PhoneOutlined className="mr-2 text-blue-500" />
              联系信息
            </Title>
            
            <Form.Item
              name="contactName"
              label="联系人姓名"
              rules={[{ required: true, message: '请输入联系人姓名' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入联系人姓名"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="contactPhone"
              label="联系电话"
              rules={[
                { required: true, message: '请输入联系电话' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="请输入联系电话"
                size="large"
                maxLength={11}
              />
            </Form.Item>

            <Form.Item
              name="urgencyLevel"
              label="紧急程度"
              rules={[{ required: true, message: '请选择紧急程度' }]}
            >
              <Select size="large">
                {urgencyOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Card>

          <Card>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
              <Title level={5} className="text-blue-800 mb-2">
                📋 报修流程说明
              </Title>
              <div className="text-sm text-blue-700 space-y-1">
                <div>1. 提交报修请求后，我们将在30分钟内联系您</div>
                <div>2. 技术员将通过电话进行初步诊断</div>
                <div>3. 根据故障情况安排上门检修或到店维修</div>
                <div>4. 确定维修方案和费用后开始维修</div>
                <div>5. 维修完成后进行测试并交付设备</div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button size="large" onClick={() => navigate('/')}>
                返回主页
              </Button>
              <Space>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={isLoading}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 border-0"
                >
                  提交报修请求
                </Button>
              </Space>
            </div>
          </Card>
        </Form>
      </div>
    </div>
  );
};

export default RepairRequest;