import React from 'react';
import { Form, Input, Button, Card, Typography, Select, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// 本地类型定义
type UserRole = 'user' | 'technician' | 'admin' | 'service' | 'finance';

interface RegisterFormData {
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

const { Title, Text } = Typography;
const { Option } = Select;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { register, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (values: RegisterFormData) => {
    try {
      clearError();
      
      // 移除确认密码字段，后端不需要
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...registerData } = values;
      
      await register(registerData);
      message.success('注册成功！请登录您的账户');
      navigate('/login');
    } catch {
      // 错误已在store中处理
    }
  };

  const validateConfirmPassword = (_: unknown, value: string) => {
    if (!value) {
      return Promise.reject(new Error('请确认密码'));
    }
    if (value !== form.getFieldValue('password')) {
      return Promise.reject(new Error('两次输入的密码不一致'));
    }
    return Promise.resolve();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <Title level={2} className="text-blue-600 mb-2">
            新干线闪修平台
          </Title>
          <Text type="secondary">创建您的账户</Text>
        </div>

        <Spin spinning={isLoading}>
          <Form
            form={form}
            name="register"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
            scrollToFirstError
          >
            <Form.Item
              name="name"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 2, message: '用户名至少2个字符' },
                { max: 20, message: '用户名最多20个字符' },
                { pattern: /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/, message: '用户名只能包含中文、英文、数字和下划线' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入用户名"
                maxLength={20}
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="请输入手机号"
                maxLength={11}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位' },
                { max: 20, message: '密码最多20位' },
                { pattern: /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/, message: '密码必须包含字母和数字' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码（至少6位，包含字母和数字）"
                maxLength={20}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认密码"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                { validator: validateConfirmPassword }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请再次输入密码"
                maxLength={20}
              />
            </Form.Item>

            <Form.Item
              name="role"
              label="角色类型"
              rules={[{ required: true, message: '请选择角色类型' }]}
            >
              <Select
                placeholder="请选择角色类型"
                suffixIcon={<UserOutlined />}
              >
                <Option value="user">普通用户</Option>
                <Option value="technician">维修员</Option>
                <Option value="admin">管理员</Option>
                <Option value="service">客服人员</Option>
                <Option value="finance">财务人员</Option>
              </Select>
            </Form.Item>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {error}
              </div>
            )}

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full h-12 text-lg font-medium bg-gradient-to-r from-blue-500 to-blue-600 border-0 hover:from-blue-600 hover:to-blue-700"
                loading={isLoading}
              >
                注册
              </Button>
            </Form.Item>

            <div className="text-center">
              <Text type="secondary" className="text-sm">
                已有账户？
                <Button type="link" className="p-0 h-auto text-sm" onClick={() => navigate('/login')}>
                  立即登录
                </Button>
              </Text>
            </div>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default Register;