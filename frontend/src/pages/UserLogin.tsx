import React from 'react';
import { Form, Input, Button, Card, Typography, message, Spin } from 'antd';
import { LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

const UserLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [form] = Form.useForm();

  const from = (location.state as { from?: { pathname: string; search?: string } })?.from?.pathname || '/';
  const fromSearch = (location.state as { from?: { pathname: string; search?: string } })?.from?.search || '';

  const handleSubmit = async (values: { phone: string; password: string }) => {
    try {
      clearError();
  await login({ ...values, role: 'user' });
      message.success('登录成功');
      // 普通用户登录后：回到来源页或到创建订单
      if (from && from !== '/') {
        navigate(`${from}${fromSearch || ''}`, { replace: true });
      } else {
        navigate('/order/create', { replace: true });
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
          <Text type="secondary">用户登录</Text>
        </div>

        <Spin spinning={isLoading}>
          <Form form={form} name="user-login" onFinish={handleSubmit} layout="vertical" size="large">
            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
              ]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" maxLength={11} />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
            </Form.Item>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">{error}</div>
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

            <div className="text-center text-sm">
              <Text type="secondary">
                还没有账户？
                <Button type="link" className="p-0 h-auto text-sm" onClick={() => navigate('/register')}>
                  立即注册
                </Button>
              </Text>
              <div className="mt-2">
                <Text type="secondary">
                  管理员 / 维修师？ <Link to="/admin/login">前往管理员登录</Link>
                </Text>
              </div>
            </div>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default UserLogin;
