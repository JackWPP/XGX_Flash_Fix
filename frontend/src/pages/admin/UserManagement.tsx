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
  Space,
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
  const { users, total, isLoading, fetchUsers, updateUser } = useUserStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

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
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
    form.resetFields();
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
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select>
              {Object.entries(roleMap).map(([key, value]) => (
                <Option key={key} value={key}>{value}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;