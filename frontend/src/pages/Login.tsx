import React from 'react';
import { Form, Input, Button, Card, Typography, Select, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
// 本地类型定义
type UserRole = 'user' | 'technician' | 'admin' | 'service' | 'finance';

const { Title, Text } = Typography;
const { Option } = Select;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [form] = Form.useForm();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (values: { phone: string; password: string; role: UserRole }) => {
    try {
      clearError();
      const user = await login(values);
      message.success('登录成功');
      
      // 根据角色重定向
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'technician') {
        navigate('/technician/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch {
      // 错误已在store中处理
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <Title level={2} className="text-blue-600 mb-2">
            新干线闪修平台
          </Title>
          <Text type="secondary">请登录您的账户</Text>
        </div>

        <Spin spinning={isLoading}>
          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
          >
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
                { min: 6, message: '密码至少6位' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
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
                登录
              </Button>
            </Form.Item>

            <div className="text-center">
              <Text type="secondary" className="text-sm">
                还没有账户？
                <Button type="link" className="p-0 h-auto text-sm" onClick={() => navigate('/register')}>
                  立即注册
                </Button>
              </Text>
            </div>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default Login;