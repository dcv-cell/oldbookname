import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Input, Modal, Form, Select, Space, Tree, Row, Col, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import useLocationStore from '../store/locationStore';
import useBookStore from '../store/bookStore';

const { Option } = Select;
const { Search } = Input;

const Locations = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [editingLocation, setEditingLocation] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredLocations, setFilteredLocations] = useState([]);

  // 从位置状态管理获取数据和操作方法
  const locations = useLocationStore((state) => state.locations);
  const addLocation = useLocationStore((state) => state.addLocation);
  const updateLocation = useLocationStore((state) => state.updateLocation);
  const deleteLocation = useLocationStore((state) => state.deleteLocation);
  const searchLocations = useLocationStore((state) => state.searchLocations);

  // 从图书状态管理获取图书数据，用于计算位置使用率
  const books = useBookStore((state) => state.books);

  // 筛选位置数据
  useEffect(() => {
    let result = locations;
    if (searchText) {
      result = searchLocations(searchText);
    }
    setFilteredLocations(result);
  }, [locations, searchText, searchLocations]);

  // 计算每个位置的图书数量
  const calculateBooksCount = (locationName) => {
    return books.filter(book => book.location === locationName).length;
  };

  // Generate tree data for display
  const generateTreeData = () => {
    const rootNodes = locations.filter(node => !node.parent);
    const buildTree = (nodes) => {
      return nodes.map(node => {
        const children = locations.filter(child => child.parent === node.name);
        return {
          title: node.name,
          key: node.id,
          description: node.description,
          children: buildTree(children)
        };
      });
    };
    return buildTree(rootNodes);
  };

  const treeData = generateTreeData();

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.description}</div>
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type'
    },
    {
      title: '容量',
      dataIndex: 'capacity',
      key: 'capacity'
    },
    {
      title: '已存放图书',
      dataIndex: 'name',
      key: 'booksCount',
      render: (name) => calculateBooksCount(name)
    },
    {
      title: '使用率',
      dataIndex: ['capacity', 'name'],
      key: 'usage',
      render: (_, record) => {
        const booksCount = calculateBooksCount(record.name);
        const usage = Math.round((booksCount / record.capacity) * 100);
        return `${usage}%`;
      }
    },
    {
      title: '父级位置',
      dataIndex: 'parent',
      key: 'parent',
      render: (parent) => parent || '无'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      )
    }
  ];

  const handleEdit = (location) => {
    setEditingLocation(location);
    form.setFieldsValue(location);
    setIsModalVisible(true);
  };

  const handleDelete = (locationId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个存放位置吗？',
      onOk() {
        deleteLocation(locationId);
        message.success('存放位置删除成功');
      }
    });
  };

  const showModal = () => {
    setEditingLocation(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      if (editingLocation) {
        updateLocation(editingLocation.id, values);
        message.success('存放位置更新成功');
      } else {
        // 计算初始图书数量
        const initialBooksCount = calculateBooksCount(values.name);
        addLocation({
          ...values,
          booksCount: initialBooksCount
        });
        message.success('存放位置添加成功');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingLocation(null);
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingLocation(null);
  };

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange
  };

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>存放区域管理</h2>
      
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col xs={24} lg={12}>
          <Card title="位置树形结构">
            <Tree
              treeData={treeData}
              defaultExpandAll
              showLine
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="位置列表" extra={<Button type="primary" icon={<PlusOutlined />} onClick={showModal}>新增位置</Button>}>
            <div style={{ marginBottom: '16px' }}>
              <Search
                placeholder="搜索位置"
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                onSearch={value => setSearchText(value)}
                onChange={(e) => setSearchText(e.target.value)}
                value={searchText}
              />
            </div>
            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={filteredLocations}
              rowKey="id"
              pagination={{ pageSize: 8 }}
              scroll={{ y: 400 }}
              locale={{ emptyText: '暂无存放位置数据' }}
            />
          </Card>
        </Col>
      </Row>
      
      <Modal
        title={editingLocation ? "编辑存放位置" : "新增存放位置"}
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入位置名称' }]}
          >
            <Input placeholder="例如：书架A、书架A-1层" />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择位置类型' }]}
          >
            <Select placeholder="请选择位置类型">
              <Option value="书架">书架</Option>
              <Option value="层">层</Option>
              <Option value="区域">区域</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="parent"
            label="父级位置"
          >
            <Select placeholder="选择父级位置">
              <Option value={null}>无</Option>
              {locations.filter(loc => loc.type === '书架' || loc.type === '区域').map(loc => (
                <Option key={loc.id} value={loc.name}>{loc.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={3} placeholder="请输入位置描述" />
          </Form.Item>
          
          <Form.Item
            name="capacity"
            label="容量"
            rules={[{ required: true, message: '请输入容量', type: 'number', min: 1 }]}
          >
            <Input type="number" placeholder="请输入可存放图书数量" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Locations;