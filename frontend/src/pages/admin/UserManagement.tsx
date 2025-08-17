import React, { useEffect, useState } from 'react';
import {
  Table,
  Typography,
  Input,
  Select,
  Button,
  Modal,
  Form,
  message,
  Tag,
  Row,
  Col,
} from 'antd';
import { useUserStore } from '../../store/userStore';
import type { User } from '../../store/userStore';
import type { TableProps } from 'antd';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

type UserRole = 'user' | 'technician' | 'admin' | 'service' | 'finance';

const roleMap: Record<UserRole, string> = {
  user: '普通用户',
  technician: '维修员',
  admin: '管理员',
  service: '客服',
  finance: '财务',
};

const roleColor: Record<UserRole, string> = {
  user: 'blue',
  technician: 'green',
  admin: 'red',
  service: 'orange',
  finance: 'purple',
};

const UserManagement: React.FC = () => {
  const { users, total, isLoading, fetchUsers, updateUser, createUser, resetUserPassword } = useUserStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [pwdForm] = Form.useForm();

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    role: '',
  });

  useEffect(() => {
    fetchUsers(filters);
  }, [fetchUsers, filters]);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
  role: user.role,
  email: user.email,
  avatar: (user as any).avatar,
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
    form.resetFields();
  };

  const handleCreateCancel = () => {
    setIsCreateModalVisible(false);
    createForm.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        await updateUser(editingUser.id, values);
        message.success('用户更新成功');
        handleCancel();
        fetchUsers(filters); // Refresh data
      }
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleResetPassword = async () => {
    try {
      const { newPassword } = await pwdForm.validateFields();
      if (editingUser) {
        await resetUserPassword(editingUser.id, newPassword);
        message.success('密码已重置');
        pwdForm.resetFields();
      }
    } catch {
      // 校验错误或接口错误已在全局提示
    }
  };

  const handleCreateOk = async () => {
    try {
      const values = await createForm.validateFields();
      await createUser(values);
      message.success('用户创建成功');
      handleCreateCancel();
      // 刷新列表并跳到第一页，便于看到新用户
      setFilters((prev) => ({ ...prev, page: 1 }));
      fetchUsers({ ...filters, page: 1 });
    } catch (error: any) {
      message.error(error?.response?.data?.message || '创建失败');
    }
  };

  const columns: TableProps<User>['columns'] = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (email) => email || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => (
        <Tag color={roleColor[role]}>{roleMap[role]}</Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => handleEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>用户管理</Title>
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} md={8}>
          <Search
            placeholder="按姓名或手机号搜索"
            onSearch={(value) => setFilters({ ...filters, search: value, page: 1 })}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="按角色筛选"
            style={{ width: '100%' }}
            onChange={(value) => setFilters({ ...filters, role: value, page: 1 })}
            allowClear
          >
            {Object.entries(roleMap).map(([key, value]) => (
              <Option key={key} value={key}>{value}</Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={12} md={6} className="text-right">
          <Button type="primary" onClick={() => setIsCreateModalVisible(true)}>
            新建用户
          </Button>
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: filters.page,
          pageSize: filters.limit,
          total: total,
          onChange: (page, limit) => {
            setFilters({ ...filters, page, limit });
          },
        }}
      />
      <Modal
        title="编辑用户"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={isLoading}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="手机号">
            <Input value={editingUser?.phone} disabled />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '邮箱格式不正确' }] }>
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select>
              {Object.entries(roleMap).map(([key, value]) => (
                <Option key={key} value={key}>{value}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="avatar" label="头像URL">
            <Input placeholder="可选：头像图片链接" />
          </Form.Item>
          <div className="mt-4 p-3 bg-gray-50 border rounded">
            <Title level={5}>重置密码</Title>
            <Form form={pwdForm} layout="vertical">
              <Form.Item name="newPassword" label="新密码" rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '至少6位' }]}>
                <Input.Password placeholder="至少6位" />
              </Form.Item>
              <Button onClick={handleResetPassword} loading={isLoading}>确认重置</Button>
            </Form>
          </div>
        </Form>
      </Modal>

      <Modal
        title="新建用户"
        visible={isCreateModalVisible}
        onOk={handleCreateOk}
        onCancel={handleCreateCancel}
        confirmLoading={isLoading}
      >
        <Form form={createForm} layout="vertical" initialValues={{ role: 'user' }}>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
          ]}>
            <Input placeholder="11位手机号" maxLength={11} />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[
            { type: 'email', message: '邮箱格式不正确' }
          ]}>
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item name="password" label="初始密码" rules={[{ required: true, message: '请输入初始密码' }, { min: 6, message: '至少6位' }]}>
            <Input.Password placeholder="至少6位" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select>
              {Object.entries(roleMap).map(([key, value]) => (
                <Option key={key} value={key}>{value}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="avatar" label="头像URL">
            <Input placeholder="可选：头像图片链接" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;