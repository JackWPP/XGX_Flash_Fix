import React from 'react';
import { Form, Input, Button, Card, Typography, message, Spin, Alert } from 'antd';
import { LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

// 管理端登录：不选择角色，后端根据手机号返回用户真实角色
const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [form] = Form.useForm();

  const handleSubmit = async (values: { phone: string; password: string }) => {
    try {
      clearError();
      const loggedUser = await login({ ...values }); // 不传 role
      message.success('登录成功');
      // 根据角色跳转
      switch (loggedUser.role) {
        case 'admin':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'technician':
          navigate('/technician/dashboard', { replace: true });
          break;
        case 'service':
        case 'finance':
          navigate('/admin/dashboard', { replace: true });
          break;
        default:
          // 普通用户不应从此处登录，回到首页
          navigate('/', { replace: true });
      }
    } catch {
      // 统一错误处理
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <Title level={2} className="text-blue-600 mb-2">
            后台管理登录
          </Title>
          <Text type="secondary">管理员/维修师/客服/财务</Text>
        </div>

        <Spin spinning={isLoading}>
          <Form form={form} name="admin-login" onFinish={handleSubmit} layout="vertical" size="large">
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

            {error && <Alert type="error" message={error} className="mb-4" />}

            <Form.Item>
              <Button type="primary" htmlType="submit" className="w-full h-12 text-lg" loading={isLoading}>
                登录
              </Button>
            </Form.Item>

            <div className="text-center text-sm">
              <a href="/login">返回用户登录</a>
            </div>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default AdminLogin;
