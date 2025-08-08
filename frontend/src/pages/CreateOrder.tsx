import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Select,
  Upload,
  message,
  Steps,
  Space
} from 'antd';
import type { UploadFile } from 'antd';
import {
  UploadOutlined,
  PhoneOutlined,
  UserOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrderStore } from '../store/orderStore';
import { useAuthStore } from '../store/authStore';
// 本地类型定义
interface CreateOrderRequest {
  serviceType: string;
  deviceModel?: string;
  description: string;
  images?: string[];
  urgency?: string;
  contactName?: string;
  contactPhone?: string;
  address?: string;
  estimatedPrice?: number;
}

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

// 服务项目配置
const serviceOptions = [
  { value: 'system-reinstall', label: '系统重装', basePrice: 50 },
  { value: 'cleaning', label: '清灰服务', basePrice: 30 },
  { value: 'software-install', label: '软件安装', basePrice: 20 },
  { value: 'water-damage', label: '电脑进水', basePrice: 100 },
  { value: 'battery-replacement', label: '手机电池更换', basePrice: 80 },
  { value: 'screen-replacement', label: '手机屏幕更换', basePrice: 150 }
];

// 紧急程度选项
const urgencyOptions = [
  { value: 'low', label: '不紧急（3-5天）', multiplier: 1 },
  { value: 'medium', label: '一般（1-2天）', multiplier: 1.2 },
  { value: 'high', label: '紧急（当天）', multiplier: 1.5 },
  { value: 'urgent', label: '特急（2小时内）', multiplier: 2 }
];

const CreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createOrder, isLoading } = useOrderStore();
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // 从URL参数获取预选服务
  useEffect(() => {
    const serviceParam = searchParams.get('service');
    if (serviceParam) {
      form.setFieldsValue({ serviceType: serviceParam });
      calculatePrice(serviceParam, 'medium');
    }
  }, [searchParams, form]);

  // 计算预估价格
  const calculatePrice = (serviceType?: string, urgency?: string) => {
    const service = serviceOptions.find(s => s.value === serviceType);
    const urgencyOption = urgencyOptions.find(u => u.value === urgency);
    
    if (service && urgencyOption) {
      const price = service.basePrice * urgencyOption.multiplier;
      setEstimatedPrice(Math.round(price));
    }
  };

  // 表单值变化时重新计算价格
  const handleFormChange = (_changedFields: unknown, allFields: { serviceType?: string; urgency?: string }) => {
    const { serviceType, urgency } = allFields;
    if (serviceType && urgency) {
      calculatePrice(serviceType, urgency);
    }
  };

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
    }
  };

  // 提交订单
  const handleSubmit = async (values: CreateOrderRequest & { contactName: string; contactPhone: string; address: string }) => {
    try {
      const orderData: CreateOrderRequest = {
        serviceType: values.serviceType,
        description: values.description,
        urgency: values.urgency,
        contactName: values.contactName,
        contactPhone: values.contactPhone,
        address: values.address,
        images: fileList.map(file => file.name), // 实际项目中需要先上传图片获取URL
        estimatedPrice
      };

      await createOrder(orderData);
      message.success('订单创建成功！');
      navigate('/order/list');
    } catch {
      message.error('订单创建失败，请重试');
    }
  };

  // 步骤内容
  const steps = [
    {
      title: '选择服务',
      content: (
        <Card>
          <Form.Item
            name="serviceType"
            label="服务类型"
            rules={[{ required: true, message: '请选择服务类型' }]}
          >
            <Select
              placeholder="请选择需要的服务类型"
              size="large"
              onChange={(value) => {
                const urgency = form.getFieldValue('urgency') || 'medium';
                calculatePrice(value, urgency);
              }}
            >
              {serviceOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <div className="flex justify-between items-center">
                    <span>{option.label}</span>
                    <span className="text-orange-600 font-medium">
                      {option.basePrice}元起
                    </span>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="urgency"
            label="紧急程度"
            rules={[{ required: true, message: '请选择紧急程度' }]}
            initialValue="medium"
          >
            <Select
              size="large"
              onChange={(value) => {
                const serviceType = form.getFieldValue('serviceType');
                if (serviceType) {
                  calculatePrice(serviceType, value);
                }
              }}
            >
              {urgencyOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <div className="flex justify-between items-center">
                    <span>{option.label}</span>
                    <span className="text-blue-600 text-sm">
                      {option.multiplier}x
                    </span>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          {estimatedPrice > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <Text strong>预估价格：</Text>
                <Text className="text-2xl font-bold text-orange-600">
                  ¥{estimatedPrice}
                </Text>
              </div>
              <Text type="secondary" className="text-sm">
                *最终价格以技术员现场评估为准
              </Text>
            </div>
          )}
        </Card>
      )
    },
    {
      title: '问题描述',
      content: (
        <Card>
          <Form.Item
            name="description"
            label="问题描述"
            rules={[
              { required: true, message: '请描述您遇到的问题' },
              { min: 10, message: '问题描述至少10个字符' }
            ]}
          >
            <TextArea
              rows={6}
              placeholder="请详细描述您设备遇到的问题，包括故障现象、发生时间等信息，这将帮助技术员更好地为您服务"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item label="问题图片">
            <Upload {...uploadProps} listType="picture-card">
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传图片</div>
              </div>
            </Upload>
            <Text type="secondary" className="text-sm">
              支持jpg、png格式，单张图片不超过5MB，最多上传5张
            </Text>
          </Form.Item>
        </Card>
      )
    },
    {
      title: '联系信息',
      content: (
        <Card>
          <Form.Item
            name="contactName"
            label="联系人姓名"
            rules={[{ required: true, message: '请输入联系人姓名' }]}
            initialValue={user?.name}
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
            initialValue={user?.phone}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="请输入联系电话"
              size="large"
              maxLength={11}
            />
          </Form.Item>

          <Form.Item
            name="address"
            label="服务地址"
            rules={[
              { required: true, message: '请输入服务地址' },
              { min: 5, message: '地址至少5个字符' }
            ]}
          >
            <TextArea
              placeholder="请输入详细的服务地址，包括省市区、街道、门牌号等"
              rows={3}
              showCount
              maxLength={200}
            />
          </Form.Item>
        </Card>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="mb-6">
          <div className="text-center mb-6">
            <Title level={2} className="text-blue-600 mb-2">
              <FileTextOutlined className="mr-2" />
              创建维修订单
            </Title>
            <Paragraph className="text-gray-600">
              请按照步骤填写订单信息，我们将为您安排专业的技术员
            </Paragraph>
          </div>

          <Steps current={currentStep} className="mb-8">
            {steps.map((step, index) => (
              <Step key={index} title={step.title} />
            ))}
          </Steps>
        </Card>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={handleFormChange}
        >
          <div className="mb-6">
            {steps[currentStep].content}
          </div>

          <Card>
            <div className="flex justify-between">
              <Space>
                {currentStep > 0 && (
                  <Button size="large" onClick={() => setCurrentStep(currentStep - 1)}>
                    上一步
                  </Button>
                )}
              </Space>
              <Space>
                {currentStep < steps.length - 1 ? (
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => {
                      form.validateFields().then(() => {
                        setCurrentStep(currentStep + 1);
                      }).catch(() => {
                        message.warning('请完善当前步骤的信息');
                      });
                    }}
                  >
                    下一步
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="large"
                    htmlType="submit"
                    loading={isLoading}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 border-0"
                  >
                    提交订单
                  </Button>
                )}
              </Space>
            </div>
          </Card>
        </Form>
      </div>
    </div>
  );
};

export default CreateOrder;