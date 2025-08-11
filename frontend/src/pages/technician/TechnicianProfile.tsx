import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Form, 
  Input, 
  Button, 
  Avatar, 
  Upload, 
  message, 
  Statistic, 
  Divider,
  Tag,
  Timeline,
  Progress
} from 'antd';
import {
  UserOutlined,
  CameraOutlined,
  PhoneOutlined,
  MailOutlined,
  LockOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import type { Order } from '../../types';

const TechnicianProfile: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const { orders } = useOrderStore();
  const [loading, setLoading] = useState(false);
  const [passwordForm] = Form.useForm();
  const [profileForm] = Form.useForm();

  // 获取技师的订单统计
  const technicianOrders = orders.filter(order => order.technician_id === user?.id);
  const completedOrders = technicianOrders.filter(order => order.status === 'completed');
  const inProgressOrders = technicianOrders.filter(order => order.status === 'in_progress');
  
  // 计算评分（模拟数据）
  const averageRating = 4.8;
  const totalRatings = completedOrders.length;
  
  // 最近完成的订单
  const recentCompletedOrders = completedOrders
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 5);

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        name: user.name,
        phone: user.phone,
        email: user.email,
      });
    }
  }, [user, profileForm]);

  // 更新个人信息
  const handleProfileUpdate = async (values: any) => {
    try {
      setLoading(true);
      await updateProfile(values);
      message.success('个人信息更新成功');
    } catch (error) {
      message.error('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handlePasswordChange = async (values: any) => {
    try {
      setLoading(true);
      // 这里应该调用修改密码的API
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error) {
      message.error('密码修改失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 头像上传
  const handleAvatarChange = (info: any) => {
    if (info.file.status === 'done') {
      message.success('头像上传成功');
    } else if (info.file.status === 'error') {
      message.error('头像上传失败');
    }
  };

  // 获取技能标签
  const getSkillTags = () => {
    const skills = ['手机维修', '电脑维修', '数据恢复', '系统重装', '硬件更换'];
    return skills.map(skill => (
      <Tag key={skill} color="blue">{skill}</Tag>
    ));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">个人中心</h1>
        <p className="text-gray-600">管理您的个人信息和查看工作统计</p>
      </div>

      <Row gutter={24}>
        {/* 左侧个人信息 */}
        <Col xs={24} lg={8}>
          {/* 基本信息卡片 */}
          <Card className="mb-6">
            <div className="text-center mb-6">
              <Avatar 
                size={80} 
                icon={<UserOutlined />} 
                className="bg-blue-600 mb-4"
              />
              <Upload
                showUploadList={false}
                beforeUpload={() => false}
                onChange={handleAvatarChange}
              >
                <Button icon={<CameraOutlined />} size="small">
                  更换头像
                </Button>
              </Upload>
              <h3 className="text-lg font-semibold mt-4 mb-2">{user?.name}</h3>
              <Tag color="blue">维修技师</Tag>
            </div>
            
            <Divider />
            
            <div className="space-y-3">
              <div className="flex items-center">
                <PhoneOutlined className="text-gray-500 mr-2" />
                <span>{user?.phone}</span>
              </div>
              <div className="flex items-center">
                <MailOutlined className="text-gray-500 mr-2" />
                <span>{user?.email || '未设置邮箱'}</span>
              </div>
            </div>
            
            <Divider />
            
            <div>
              <h4 className="font-medium mb-3">专业技能</h4>
              <div className="space-y-2">
                {getSkillTags()}
              </div>
            </div>
          </Card>

          {/* 工作统计 */}
          <Card title="工作统计" className="mb-6">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="完成订单"
                  value={completedOrders.length}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="进行中"
                  value={inProgressOrders.length}
                  prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="平均评分"
                  value={averageRating}
                  precision={1}
                  prefix={<StarOutlined style={{ color: '#faad14' }} />}
                  suffix="/ 5.0"
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="评价数量"
                  value={totalRatings}
                  prefix={<TrophyOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>
            
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">完成率</span>
                <span className="text-sm font-medium">95%</span>
              </div>
              <Progress percent={95} size="small" />
            </div>
          </Card>
        </Col>

        {/* 右侧表单和活动 */}
        <Col xs={24} lg={16}>
          {/* 个人信息编辑 */}
          <Card title="个人信息" className="mb-6">
            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleProfileUpdate}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="name"
                    label="姓名"
                    rules={[{ required: true, message: '请输入姓名' }]}
                  >
                    <Input placeholder="请输入姓名" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="phone"
                    label="手机号"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                    ]}
                  >
                    <Input placeholder="请输入手机号" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { type: 'email', message: '请输入正确的邮箱格式' }
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  更新信息
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* 修改密码 */}
          <Card title="修改密码" className="mb-6">
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordChange}
            >
              <Form.Item
                name="currentPassword"
                label="当前密码"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined />}
                  placeholder="请输入当前密码" 
                />
              </Form.Item>
              
              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码至少6位' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />}
                  placeholder="请输入新密码" 
                />
              </Form.Item>
              
              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />}
                  placeholder="请确认新密码" 
                />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* 最近活动 */}
          <Card title="最近完成的订单">
            {recentCompletedOrders.length > 0 ? (
              <Timeline>
                {recentCompletedOrders.map((order) => (
                  <Timeline.Item
                    key={order.id}
                    dot={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {order.service_name} - {order.customer_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.device_type} {order.device_model}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(order.updated_at || order.created_at).toLocaleString()}
                        </div>
                      </div>
                      <Tag color="green">已完成</Tag>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <CheckCircleOutlined className="text-4xl mb-4" />
                <p>暂无完成的订单</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TechnicianProfile;