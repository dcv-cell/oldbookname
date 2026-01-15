import React from 'react';
import { Card, Button, Row, Col } from 'antd';
import { PlusOutlined, BookOutlined, ShareAltOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const Home = () => {
  const modules = [
    {
      title: '图书录入',
      icon: <PlusOutlined style={{ fontSize: 24 }} />,
      description: '上传图书封面，自动识别信息，快速录入系统',
      link: '/add-book',
      color: '#1890ff'
    },
    {
      title: '图书管理',
      icon: <BookOutlined style={{ fontSize: 24 }} />,
      description: '管理图书信息，分类标签，状态追踪',
      link: '/manage-books',
      color: '#52c41a'
    },
    {
      title: '展示分享',
      icon: <ShareAltOutlined style={{ fontSize: 24 }} />,
      description: '浏览图书列表，搜索筛选，生成书单',
      link: '/books',
      color: '#faad14'
    },
    {
      title: '存放管理',
      icon: <EnvironmentOutlined style={{ fontSize: 24 }} />,
      description: '配置书架位置，管理图书存放区域',
      link: '/locations',
      color: '#f5222d'
    }
  ];

  return (
    <Row gutter={[16, 16]}>
      {modules.map((module, index) => (
        <Col key={index} xs={24} sm={12} md={8} lg={6}>
          <Link to={module.link} style={{ textDecoration: 'none' }}>
            <Card
              hoverable
              style={{ height: '100%', cursor: 'pointer' }}
              cover={
                <div 
                  style={{ 
                    height: '120px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    backgroundColor: `${module.color}15` 
                  }}
                >
                  <div style={{ color: module.color }}>{module.icon}</div>
                </div>
              }
            >
              <Card.Meta 
                title={<div style={{ color: module.color, fontWeight: 'bold' }}>{module.title}</div>} 
                description={module.description} 
              />
            </Card>
          </Link>
        </Col>
      ))}
    </Row>
  );
};

export default Home;