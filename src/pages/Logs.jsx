import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Row, Col, Select, Typography, Space, message, Modal } from 'antd';
import { DeleteOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import logService from '../services/logService';

const { Title, Text } = Typography;
const { Option } = Select;

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [level, setLevel] = useState('all');
  const [loading, setLoading] = useState(false);
  const [clearModalVisible, setClearModalVisible] = useState(false);

  // 加载日志数据
  const loadLogs = () => {
    setLoading(true);
    try {
      const allLogs = logService.getLogs();
      setLogs(allLogs);
      filterLogs(allLogs, level);
      setLoading(false);
    } catch (error) {
      message.error('加载日志失败');
      setLoading(false);
    }
  };

  // 过滤日志
  const filterLogs = (logData, filterLevel) => {
    if (filterLevel === 'all') {
      setFilteredLogs(logData);
    } else {
      const filtered = logData.filter(log => log.level === filterLevel);
      setFilteredLogs(filtered);
    }
  };

  // 处理级别筛选
  const handleLevelChange = (value) => {
    setLevel(value);
    filterLogs(logs, value);
  };

  // 清空日志
  const handleClearLogs = () => {
    try {
      logService.clearLogs();
      loadLogs();
      message.success('日志已清空');
      setClearModalVisible(false);
    } catch (error) {
      message.error('清空日志失败');
    }
  };

  // 导出日志
  const handleExportLogs = () => {
    try {
      const logsJson = logService.exportLogs();
      const blob = new Blob([logsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${new Date().toISOString().slice(0, 19)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('日志导出成功');
    } catch (error) {
      message.error('导出日志失败');
    }
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 获取日志级别对应的颜色
  const getLevelColor = (logLevel) => {
    switch (logLevel) {
      case 'error':
        return 'red';
      case 'warn':
        return 'orange';
      case 'info':
        return 'blue';
      case 'debug':
        return 'green';
      default:
        return 'black';
    }
  };

  // 表格列配置
  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 200,
      render: (text) => formatTime(text)
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (text) => (
        <Text style={{ color: getLevelColor(text), fontWeight: 'bold' }}>
          {text.toUpperCase()}
        </Text>
      )
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true
    },
    {
      title: '数据',
      dataIndex: 'data',
      key: 'data',
      width: 200,
      render: (data) => {
        if (Object.keys(data).length === 0) {
          return '-';
        }
        return (
          <Text ellipsis={{ tooltip: JSON.stringify(data, null, 2) }}>
            {JSON.stringify(data)}
          </Text>
        );
      }
    }
  ];

  // 初始加载日志
  useEffect(() => {
    loadLogs();
  }, []);

  // 显示最新的6条日志
  const latestLogs = filteredLogs.slice(-6).reverse();

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px', textAlign: 'center' }}>系统日志</Title>
      
      <Card title="日志管理" style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Space>
              <Text>日志级别筛选：</Text>
              <Select
                value={level}
                onChange={handleLevelChange}
                style={{ width: 120 }}
              >
                <Option value="all">全部</Option>
                <Option value="info">信息</Option>
                <Option value="warn">警告</Option>
                <Option value="error">错误</Option>
                <Option value="debug">调试</Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={16} style={{ textAlign: { sm: 'right', xs: 'left' } }}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadLogs}
                loading={loading}
              >
                刷新日志
              </Button>
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={() => setClearModalVisible(true)}
              >
                清空日志
              </Button>
              <Button
                icon={<DownloadOutlined />}
                type="primary"
                onClick={handleExportLogs}
              >
                导出日志
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card title="最新 6 条日志" style={{ marginBottom: '24px' }}>
        <Table
          dataSource={latestLogs}
          columns={columns}
          rowKey="id"
          pagination={false}
          loading={loading}
          size="small"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Card title="完整日志记录">
        <Table
          dataSource={filteredLogs}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `共 ${total} 条日志`
          }}
          loading={loading}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* 清空日志确认模态框 */}
      <Modal
        title="确认清空日志"
        open={clearModalVisible}
        onCancel={() => setClearModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setClearModalVisible(false)}>
            取消
          </Button>,
          <Button key="confirm" type="primary" danger onClick={handleClearLogs}>
            确认清空
          </Button>
        ]}
      >
        <p>确定要清空所有日志记录吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
};

export default Logs;