import React, { useState, useEffect } from 'react';
import { Menu, Layout, Button, Drawer } from 'antd';
import { MenuOutlined, HomeOutlined, PlusOutlined, BookOutlined, ShareAltOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import './ResponsiveNav.css';

const { Header, Sider, Content } = Layout;

const ResponsiveNav = ({ children }) => {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileVisible, setMobileVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">首页</Link>
    },
    {
      key: '/add-book',
      icon: <PlusOutlined />,
      label: <Link to="/add-book">图书录入</Link>
    },
    {
      key: '/manage-books',
      icon: <BookOutlined />,
      label: <Link to="/manage-books">图书管理</Link>
    },
    {
      key: '/books',
      icon: <ShareAltOutlined />,
      label: <Link to="/books">图书展示</Link>
    },
    {
      key: '/locations',
      icon: <EnvironmentOutlined />,
      label: <Link to="/locations">存放管理</Link>
    }
  ];

  const currentKey = location.pathname;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 16px', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setMobileVisible(true)}
          style={{ fontSize: '16px', marginRight: '16px' }}
        />
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>二手书籍电子档案管理系统</div>
      </Header>
      
      {/* 移动端抽屉菜单 */}
      <Drawer
        title="菜单"
        placement="left"
        onClose={() => setMobileVisible(false)}
        open={mobileVisible}
        size={240}
      >
        <Menu
          mode="inline"
          selectedKeys={[currentKey]}
          items={menuItems}
          onClick={() => setMobileVisible(false)}
          style={{ marginTop: 16 }}
        />
      </Drawer>
      
      {/* 桌面端侧边菜单 - 仅在非移动端显示 */}
      {!isMobile && (
        <Sider
          width={200}
          theme="light"
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          breakpoint="md"
          collapsedWidth="0"
        >
          <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px' }} />
          <Menu
            mode="inline"
            selectedKeys={[currentKey]}
            items={menuItems}
          />
        </Sider>
      )}
      
      <Content style={{ margin: '0 16px', padding: 24, background: '#fff', minHeight: 280 }}>
        {children}
      </Content>
    </Layout>
  );
};

export default ResponsiveNav;