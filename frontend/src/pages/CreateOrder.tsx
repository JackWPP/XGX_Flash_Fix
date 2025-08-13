import React, { useState, useEffect, useCallback } from 'react';
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
  Space,
  Modal
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
import { getDatabaseServiceId, getServiceOptions } from '../utils/serviceMapping';
// 本地类型定义 - 前端表单字段
interface CreateOrderFormData {
  serviceType: string;
  deviceModel?: string;
  description: string;
  images?: string[];
  urgency?: string;
  contactName?: string;
  contactPhone?: string;
  estimatedPrice?: number;
}

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

// 使用映射配置获取服务选项
const serviceOptions = getServiceOptions();

// 紧急程度选项
const urgencyOptions = [
  { value: 'low', label: '不紧急（3-5天）', multiplier: 1 },
  { value: 'normal', label: '正常（2-3天）', multiplier: 1.1 },
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
  
  // 调试状态
  const [debugInfo, setDebugInfo] = useState<{
    formValues?: Record<string, unknown>;
    serviceMapping?: string | null;
    timestamp?: string;
    submitData?: Record<string, unknown>;
    submitTime?: string;
    finalOrderData?: Record<string, unknown>;
    requiredFieldsCheck?: Record<string, unknown>;
    missingFields?: string[];
    errorMessage?: string;
    validationErrors?: unknown[];
    stepValidationError?: unknown;
    finalValidationError?: unknown;
    error?: unknown;
    currentStepFields?: string[];
    allRequiredFields?: string[];
    validationFailedTime?: string;
    receivedValues?: Record<string, unknown>;
    formInstanceValues?: Record<string, unknown>;
    mergedValues?: Record<string, unknown>;
    debugTimestamp?: string;
    fieldValidationDetails?: Array<{
      field: string;
      inValues: boolean;
      inFormInstance: boolean;
      inMerged: boolean;
      value?: unknown;
    }>;
  }>({});
  const [submitStatus, setSubmitStatus] = useState<string>('未提交');
  const [formData, setFormData] = useState<Partial<CreateOrderFormData & { contactName: string; contactPhone: string }>>({});
  const [stepCompletionStatus, setStepCompletionStatus] = useState<boolean[]>([false, false, false]);

  // 从URL参数获取预选服务和恢复表单数据
  useEffect(() => {
    // 首先尝试从localStorage恢复表单数据
    const savedFormData = localStorage.getItem('createOrderFormData');
    let initialValues: Partial<CreateOrderFormData & { contactName: string; contactPhone: string }> = {};
    
    if (savedFormData) {
      try {
        initialValues = JSON.parse(savedFormData);
      } catch (e) {
        console.warn('Failed to parse saved form data:', e);
      }
    }
    
    // 如果有URL参数，优先使用URL参数
    const serviceParam = searchParams.get('service');
    if (serviceParam) {
      initialValues = { 
        ...initialValues,
        serviceType: serviceParam, 
        urgency: initialValues.urgency || 'medium' 
      };
    }
    
    // 如果有初始值，设置到表单并触发变化处理
    if (Object.keys(initialValues).length > 0) {
      form.setFieldsValue(initialValues);
      if (initialValues.serviceType && initialValues.urgency) {
        calculatePrice(initialValues.serviceType, initialValues.urgency);
      }
      
      // 直接设置formData状态，避免重复处理
      setFormData(prevData => ({ ...prevData, ...initialValues }));
      
      // 手动触发handleFormChange来更新状态
      handleFormChange([], initialValues);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const handleFormChange = useCallback((_changedFields: unknown, allFields: { serviceType?: string; urgency?: string; deviceModel?: string; description?: string; contactName?: string; contactPhone?: string }) => {
    const { serviceType, urgency } = allFields;
    if (serviceType && urgency) {
      calculatePrice(serviceType, urgency);
    }
    
    // 从localStorage获取现有数据并合并更新
    const existingData = localStorage.getItem('createOrderFormData');
    let savedData = {};
    if (existingData) {
      try {
        savedData = JSON.parse(existingData);
      } catch (e) {
        console.warn('Failed to parse existing form data:', e);
      }
    }
    
    // 合并现有数据和新数据
    const mergedData = { ...savedData, ...allFields };
    
    // 持久化合并后的表单数据到localStorage
    localStorage.setItem('createOrderFormData', JSON.stringify(mergedData));
    
    // 更新调试信息 - 使用合并后的数据
      setFormData(prevData => ({ ...prevData, ...allFields }));
      setDebugInfo(prevDebug => ({
        ...prevDebug,
        formValues: mergedData as Record<string, unknown>,
        serviceMapping: mergedData.serviceType ? getDatabaseServiceId(mergedData.serviceType as string) : null,
        timestamp: new Date().toLocaleTimeString()
      }));
    
    // 检查每个步骤的完成状态 - 使用合并后的数据
    const newStepStatus = [...stepCompletionStatus];
    
    // 第一步：服务类型和紧急程度
    newStepStatus[0] = !!(mergedData.serviceType && mergedData.urgency);
    
    // 第二步：设备型号和问题描述
    newStepStatus[1] = !!(mergedData.deviceModel && mergedData.description && mergedData.description.length >= 10);
    
    // 第三步：联系信息
    newStepStatus[2] = !!(mergedData.contactName && mergedData.contactPhone && /^1[3-9]\d{9}$/.test(mergedData.contactPhone));
    
    setStepCompletionStatus(newStepStatus);
  }, [stepCompletionStatus]);

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

  // 同步当前form数据到localStorage
  const syncFormToStorage = useCallback(() => {
    const currentFormValues = form.getFieldsValue();
    const existingData = localStorage.getItem('createOrderFormData');
    let savedData: Record<string, unknown> = {};
    if (existingData) {
      try {
        savedData = JSON.parse(existingData);
      } catch (e) {
        console.warn('Failed to parse existing form data:', e);
      }
    }
    const mergedData = { ...savedData, ...currentFormValues };
    localStorage.setItem('createOrderFormData', JSON.stringify(mergedData));
    return mergedData;
  }, [form]);

  // 从localStorage恢复所有数据到form实例
  const restoreFormFromStorage = useCallback(() => {
    const savedFormData = localStorage.getItem('createOrderFormData');
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        form.setFieldsValue(parsedData);
        return parsedData;
      } catch (e) {
        console.warn('Failed to parse saved form data:', e);
      }
    }
    return {};
  }, [form]);

  // 提交订单
  const handleSubmit = async (values: CreateOrderFormData & { contactName: string; contactPhone: string }) => {
    try {
      setSubmitStatus('开始提交...');
      
      // 优先从localStorage获取完整数据
      const savedFormData = localStorage.getItem('createOrderFormData');
      let localStorageData: Record<string, unknown> = {};
      
      if (savedFormData) {
        try {
          localStorageData = JSON.parse(savedFormData);
        } catch (e) {
          console.warn('Failed to parse saved form data:', e);
        }
      }
      
      // 从form实例获取当前值作为备用
      const formValues = form.getFieldsValue();
      
      // 最终合并：优先使用localStorage数据，然后合并form实例数据和values参数
      const finalValues = { ...localStorageData, ...formValues, ...values };
      
      // 添加详细调试信息
      console.log('handleSubmit接收到的values参数:', values);
      console.log('从localStorage获取的数据:', localStorageData);
      console.log('从form实例获取的完整数据:', formValues);
      console.log('最终合并后的完整数据:', finalValues);
      
      alert('提交按钮被点击！\n接收到的values: ' + JSON.stringify(values, null, 2) + '\n\nLocalStorage数据: ' + JSON.stringify(localStorageData, null, 2) + '\n\nform实例数据: ' + JSON.stringify(formValues, null, 2) + '\n\n最终合并数据: ' + JSON.stringify(finalValues, null, 2));
      
      setDebugInfo(prev => ({
        ...prev,
        receivedValues: values as unknown as Record<string, unknown>,
        localStorageValues: localStorageData,
        formInstanceValues: formValues as Record<string, unknown>,
        mergedValues: finalValues as Record<string, unknown>,
        debugTimestamp: new Date().toLocaleTimeString()
      }));
      
      // 最终验证所有必填字段 - 使用最终合并后的完整数据
      const requiredFields = ['serviceType', 'urgency', 'deviceModel', 'description', 'contactName', 'contactPhone'];
      const missingFields = requiredFields.filter(field => !finalValues[field as keyof typeof finalValues]);
      
      if (missingFields.length > 0) {
        const errorMsg = `缺少必填字段: ${missingFields.join(', ')}`;
        setSubmitStatus(`错误：${errorMsg}`);
        setDebugInfo(prev => ({
          ...prev,
          missingFields,
          errorMessage: errorMsg,
          fieldValidationDetails: requiredFields.map(field => ({
            field,
            inValues: !!values[field as keyof typeof values],
            inLocalStorage: !!localStorageData[field as keyof typeof localStorageData],
            inFormInstance: !!formValues[field as keyof typeof formValues],
            inMerged: !!finalValues[field as keyof typeof finalValues],
            value: finalValues[field as keyof typeof finalValues]
          }))
        }));
        message.error(errorMsg);
        return;
      }
      
      // 验证问题描述长度 - 使用合并后的数据
      if (finalValues.description && typeof finalValues.description === 'string' && finalValues.description.length < 10) {
        const errorMsg = '问题描述至少需要10个字符';
        setSubmitStatus(`错误：${errorMsg}`);
        message.error(errorMsg);
        return;
      }
      
      // 验证手机号格式 - 使用合并后的数据
      if (finalValues.contactPhone && typeof finalValues.contactPhone === 'string' && !/^1[3-9]\d{9}$/.test(finalValues.contactPhone)) {
        const errorMsg = '请输入正确的手机号格式';
        setSubmitStatus(`错误：${errorMsg}`);
        message.error(errorMsg);
        return;
      }
      
      setSubmitStatus('字段验证通过，开始处理服务类型映射...');
      
      // 获取数据库中的实际服务ID - 使用合并后的数据
      const databaseServiceId = getDatabaseServiceId(finalValues.serviceType as string);
      console.log('服务类型映射:', { serviceType: finalValues.serviceType, databaseServiceId });
      
      setDebugInfo(prev => ({
        ...prev,
        submitData: finalValues,
        serviceMapping: databaseServiceId,
        submitTime: new Date().toLocaleTimeString()
      }));
      
      if (!databaseServiceId) {
        setSubmitStatus('错误：无效的服务类型');
        message.error('无效的服务类型，请重新选择');
        return;
      }

      setSubmitStatus('服务类型映射成功，准备构建订单数据...');

      // 映射前端urgency值到数据库接受的urgencyLevel值
      const mapUrgencyLevel = (frontendUrgency: string): string => {
        const urgencyMapping: Record<string, string> = {
          'low': 'low',
          'medium': 'normal', // 前端的medium映射为数据库的normal
          'high': 'high',
          'urgent': 'urgent'
        };
        return urgencyMapping[frontendUrgency] || 'normal';
      };

      // 映射前端字段到后端期望的字段 - 使用合并后的数据
      const orderData = {
        serviceId: databaseServiceId, // 使用数据库中的实际服务UUID
        deviceType: 'computer', // 默认设备类型
        deviceModel: (finalValues.deviceModel as string) || 'unknown', // 设备型号
        issueDescription: finalValues.description as string, // 映射description到issueDescription
        urgencyLevel: mapUrgencyLevel((finalValues.urgency as string) || 'medium'), // 映射紧急程度
        contactPhone: finalValues.contactPhone as string, // 联系电话
        contactAddress: '待确认', // 默认地址值，后续可以从表单中获取
        images: fileList.map(file => file.name) // 图片列表
      };

      console.log('发送给后端的订单数据:', orderData);
      console.log('必填字段检查:', {
        serviceId: !!orderData.serviceId,
        deviceType: !!orderData.deviceType,
        issueDescription: !!orderData.issueDescription,
        contactPhone: !!orderData.contactPhone
      });
      
      setDebugInfo(prev => ({
        ...prev,
        finalOrderData: orderData,
        requiredFieldsCheck: {
          serviceId: !!orderData.serviceId,
          deviceType: !!orderData.deviceType,
          issueDescription: !!orderData.issueDescription,
          contactPhone: !!orderData.contactPhone
        }
      }));
      
      setSubmitStatus('订单数据构建完成，发送到服务器...');
      await createOrder(orderData);
      setSubmitStatus('提交成功！');
      
      // 清除localStorage中的表单数据
      localStorage.removeItem('createOrderFormData');
      
      message.success({
        content: '订单创建成功！',
        duration: 3,
        onClose: () => {
          // 显示选择对话框
          Modal.confirm({
            title: '订单创建成功',
            content: '您希望接下来做什么？',
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
      
      // 默认3秒后自动返回主页（如果用户没有选择）
      setTimeout(() => {
        navigate('/');
      }, 4000);
    } catch (error) {
      console.error('订单创建失败:', error);
      const errorMsg = error instanceof Error ? error.message : '订单创建失败，请重试';
      setSubmitStatus('提交失败: ' + errorMsg);
      setDebugInfo(prev => ({
        ...prev,
        error: error,
        errorMessage: errorMsg
      }));
      message.error(errorMsg);
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
            name="deviceModel"
            label="设备型号"
            rules={[{ required: true, message: '请输入设备型号' }]}
          >
            <Input
              placeholder="请输入设备型号，如：ThinkPad X1 Carbon、MacBook Pro 13寸等"
              size="large"
            />
          </Form.Item>

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
        
        {/* 调试信息显示区域 */}
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <Title level={4} className="text-yellow-800 mb-4">🐛 调试信息</Title>
          <div className="space-y-2 text-sm">
            <div><strong>当前步骤:</strong> <span className="text-blue-600">第{currentStep + 1}步</span></div>
            <div><strong>步骤完成状态:</strong> 
              <div className="flex space-x-2 mt-1">
                {stepCompletionStatus.map((completed, index) => (
                  <span key={index} className={`px-2 py-1 rounded text-xs ${
                    completed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    第{index + 1}步: {completed ? '✓ 完成' : '✗ 未完成'}
                  </span>
                ))}
              </div>
            </div>
            <div><strong>提交状态:</strong> <span className="text-blue-600">{submitStatus}</span></div>
            <div><strong>当前表单数据:</strong> <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">{JSON.stringify(formData, null, 2)}</pre></div>
            {debugInfo.receivedValues && (
              <div><strong>提交时接收到的values参数:</strong> <pre className="bg-blue-100 p-2 rounded text-xs overflow-auto">{JSON.stringify(debugInfo.receivedValues, null, 2)}</pre></div>
            )}
            {debugInfo.formInstanceValues && (
              <div><strong>form实例中的完整数据:</strong> <pre className="bg-green-100 p-2 rounded text-xs overflow-auto">{JSON.stringify(debugInfo.formInstanceValues, null, 2)}</pre></div>
            )}
            {debugInfo.mergedValues && (
              <div><strong>合并后的完整数据:</strong> <pre className="bg-purple-100 p-2 rounded text-xs overflow-auto">{JSON.stringify(debugInfo.mergedValues, null, 2)}</pre></div>
            )}
            {debugInfo.fieldValidationDetails && (
              <div><strong>字段验证详情:</strong> 
                <div className="bg-orange-100 p-2 rounded text-xs overflow-auto mt-1">
                  {debugInfo.fieldValidationDetails.map((detail, index: number) => (
                    <div key={index} className="mb-1">
                      <strong>{detail.field}:</strong> 
                      <span className={detail.inMerged ? 'text-green-600' : 'text-red-600'}>
                        {detail.inMerged ? '✓' : '✗'}
                      </span>
                      <span className="ml-2 text-gray-600">值: {JSON.stringify(detail.value)}</span>
                      <span className="ml-2 text-xs">
                        (values: {detail.inValues ? '✓' : '✗'}, form: {detail.inFormInstance ? '✓' : '✗'})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {debugInfo.serviceMapping && (
              <div><strong>服务ID映射:</strong> <span className="text-green-600">{debugInfo.serviceMapping}</span></div>
            )}
            {debugInfo.finalOrderData && (
              <div><strong>最终发送数据:</strong> <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">{JSON.stringify(debugInfo.finalOrderData, null, 2)}</pre></div>
            )}
            {debugInfo.requiredFieldsCheck && (
              <div><strong>必填字段检查:</strong> <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">{JSON.stringify(debugInfo.requiredFieldsCheck, null, 2)}</pre></div>
            )}
            {debugInfo.validationErrors && (
               <div><strong>表单验证错误:</strong> <pre className="bg-red-100 p-2 rounded text-xs overflow-auto text-red-800">{JSON.stringify(debugInfo.validationErrors, null, 2)}</pre></div>
             )}
             {debugInfo.stepValidationError != null && (
               <div><strong>步骤验证错误:</strong> <pre className="bg-red-100 p-2 rounded text-xs overflow-auto text-red-800">{typeof debugInfo.stepValidationError === 'object' ? JSON.stringify(debugInfo.stepValidationError, null, 2) : String(debugInfo.stepValidationError)}</pre></div>
             )}
             {debugInfo.finalValidationError != null && (
               <div><strong>最终验证错误:</strong> <pre className="bg-red-100 p-2 rounded text-xs overflow-auto text-red-800">{typeof debugInfo.finalValidationError === 'object' ? JSON.stringify(debugInfo.finalValidationError, null, 2) : String(debugInfo.finalValidationError)}</pre></div>
             )}
             {(debugInfo.error || debugInfo.errorMessage) && (
                 <div><strong>错误信息:</strong> <span className="text-red-600">{String(debugInfo.errorMessage || debugInfo.error || '')}</span></div>
               )}
          </div>
        </Card>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={handleFormChange}
          onFinishFailed={(errorInfo) => {
            console.log('表单验证失败:', errorInfo);
            alert('表单验证失败！错误: ' + JSON.stringify(errorInfo.errorFields, null, 2));
            setSubmitStatus('表单验证失败');
            setDebugInfo(prev => ({
              ...prev,
              validationErrors: errorInfo.errorFields,
              validationFailedTime: new Date().toLocaleTimeString()
            }));
          }}
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
                      // 根据当前步骤验证对应的字段
                      let fieldsToValidate: string[] = [];
                      
                      if (currentStep === 0) {
                        fieldsToValidate = ['serviceType', 'urgency'];
                      } else if (currentStep === 1) {
                        fieldsToValidate = ['deviceModel', 'description'];
                      } else if (currentStep === 2) {
                        fieldsToValidate = ['contactName', 'contactPhone'];
                      }
                      
                      form.validateFields(fieldsToValidate).then(() => {
                        // 在切换步骤前，同步当前form数据到localStorage
                        const syncedData = syncFormToStorage();
                        console.log('步骤切换前同步数据:', syncedData);
                        
                        // 切换到下一步
                        setCurrentStep(currentStep + 1);
                        setSubmitStatus(`第${currentStep + 1}步验证通过，进入第${currentStep + 2}步`);
                        
                        // 在下一步加载后，恢复所有数据到form实例
                        setTimeout(() => {
                          const restoredData = restoreFormFromStorage();
                          console.log('步骤切换后恢复数据:', restoredData);
                          
                          // 更新formData状态以反映完整数据
                          setFormData(restoredData);
                        }, 100);
                      }).catch((errorInfo) => {
                        console.log('当前步骤验证失败:', errorInfo);
                        message.warning(`请完善第${currentStep + 1}步的必填信息`);
                        setSubmitStatus(`第${currentStep + 1}步验证失败`);
                        setDebugInfo(prev => ({
                          ...prev,
                          stepValidationError: errorInfo,
                          currentStepFields: fieldsToValidate
                        }));
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
                    onClick={() => {
                      console.log('提交按钮被点击！');
                      setSubmitStatus('按钮已点击，准备验证所有字段...');
                      
                      // 验证所有必填字段
                      const allRequiredFields = ['serviceType', 'urgency', 'deviceModel', 'description', 'contactName', 'contactPhone'];
                      form.validateFields(allRequiredFields).then(() => {
                        setSubmitStatus('所有字段验证通过，准备提交...');
                      }).catch((errorInfo) => {
                        console.log('最终验证失败:', errorInfo);
                        setSubmitStatus('最终验证失败，请检查所有必填字段');
                        setDebugInfo(prev => ({
                          ...prev,
                          finalValidationError: errorInfo,
                          allRequiredFields
                        }));
                      });
                    }}
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