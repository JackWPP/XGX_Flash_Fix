import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  UnorderedListOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ToolOutlined,
  BellOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const TechnicianLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/technician/dashboard',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
    {
      key: '/technician/orders',
      icon: <UnorderedListOutlined />,
      label: '我的订单',
    },
    {
      key: '/technician/profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/technician/profile'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout className="min-h-screen">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className="bg-blue-900"
        theme="dark"
      >
        <div className="h-16 flex items-center justify-center border-b border-blue-800">
          <div className="flex items-center space-x-2">
            <ToolOutlined className="text-white text-xl" />
            {!collapsed && (
              <span className="text-white font-bold text-lg">维修员工作台</span>
            )}
          </div>
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="bg-blue-900 border-r-0"
        />
      </Sider>
      
      <Layout>
        <Header className="bg-white px-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-gray-600 hover:text-blue-600"
            />
            <div>
              <Text className="text-gray-600">当前位置：</Text>
              <Text strong className="text-gray-800">
                {menuItems.find(item => item.key === location.pathname)?.label || '维修员工作台'}
              </Text>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              type="text" 
              icon={<BellOutlined />} 
              className="text-gray-600 hover:text-blue-600"
            >
              通知
            </Button>
            
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded">
                <Avatar 
                  size="small" 
                  icon={<UserOutlined />} 
                  className="bg-blue-600"
                />
                <div className="flex flex-col">
                  <Text className="text-sm font-medium text-gray-800">
                    {user?.name || '维修员'}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    维修技师
                  </Text>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        
        <Content className="bg-gray-50">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default TechnicianLayout;