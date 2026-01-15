import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Button, Select, Tag, Space, Row, Col, Modal, Form, message } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import useBookStore from '../store/bookStore';

const { Option } = Select;
const { Search } = Input;

const ManageBooks = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingBook, setEditingBook] = useState(null);

  // 从状态管理获取图书数据和操作方法
  const books = useBookStore((state) => state.books);
  const updateBook = useBookStore((state) => state.updateBook);
  const deleteBook = useBookStore((state) => state.deleteBook);
  const searchBooks = useBookStore((state) => state.searchBooks);

  // 筛选图书数据
  useEffect(() => {
    let result = books;
    
    // 搜索筛选
    if (searchText) {
      result = searchBooks(searchText);
    }
    
    // 状态筛选
    if (statusFilter !== 'all') {
      result = result.filter(book => book.status === statusFilter);
    }
    
    // 分类筛选
    if (categoryFilter !== 'all') {
      result = result.filter(book => book.category === categoryFilter);
    }
    
    setFilteredBooks(result);
  }, [books, searchText, statusFilter, categoryFilter, searchBooks]);

  // 获取所有唯一分类
  const categories = Array.from(new Set(books.map(book => book.category).filter(Boolean)));

  const statusMap = {
    available: <Tag color="green">可借阅</Tag>,
    borrowed: <Tag color="red">已借出</Tag>,
    maintenance: <Tag color="orange">维护中</Tag>
  };

  const columns = [
    {
      title: '书名',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.author}</div>
        </div>
      )
    },
    {
      title: '出版社',
      dataIndex: 'publisher',
      key: 'publisher',
      ellipsis: true
    },
    {
      title: 'ISBN',
      dataIndex: 'isbn',
      key: 'isbn',
      ellipsis: true
    },
    {
      title: '出版日期',
      dataIndex: 'publishDate',
      key: 'publishDate'
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `¥${price}`
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags) => (
        <Space size="small">
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => statusMap[status]
    },
    {
      title: '存放位置',
      dataIndex: 'location',
      key: 'location'
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

  const handleEdit = (book) => {
    setEditingBook(book);
    form.setFieldsValue({
      ...book,
      tags: book.tags.join(', ')
    });
    setIsModalVisible(true);
  };

  const handleDelete = (bookId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这本图书吗？',
      onOk() {
        deleteBook(bookId);
        message.success('图书删除成功');
      }
    });
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      if (editingBook) {
        // 处理标签，将逗号分隔的字符串转换为数组
        const tags = values.tags?.split(',').map(tag => tag.trim()).filter(tag => tag !== '') || [];
        
        // 处理价格，转换为数字
        const price = parseFloat(values.price) || 0;
        
        updateBook(editingBook.id, {
          ...values,
          tags,
          price,
          updatedAt: new Date().toISOString()
        });
        message.success('图书更新成功');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingBook(null);
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingBook(null);
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
      <h2 style={{ marginBottom: '24px' }}>图书管理</h2>
      
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[8, 16]} align="middle">
          <Col xs={24} md={16}>
            <Search
              placeholder="搜索图书"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={value => setSearchText(value)}
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
            />
          </Col>
          <Col xs={24} md={8}>
            <Row gutter={8}>
              <Col xs={24} sm={8}>
                <Select 
                  placeholder="按状态筛选" 
                  style={{ width: '100%' }} 
                  value={statusFilter}
                  onChange={setStatusFilter}
                >
                  <Option value="all">全部</Option>
                  <Option value="available">可借阅</Option>
                  <Option value="borrowed">已借出</Option>
                  <Option value="maintenance">维护中</Option>
                </Select>
              </Col>
              <Col xs={24} sm={8}>
                <Select 
                  placeholder="按分类筛选" 
                  style={{ width: '100%' }} 
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                >
                  <Option value="all">全部</Option>
                  {categories.map(category => (
                    <Option key={category} value={category}>{category}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={8}>
                <Link to="/add-book">
                  <Button type="primary" icon={<PlusOutlined />} block>
                    新增图书
                  </Button>
                </Link>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>
      
      <Card>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredBooks}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: '暂无图书数据' }}
        />
      </Card>
      
      <Modal
        title="编辑图书信息"
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="title" label="书名">
                <Input />
              </Form.Item>
              <Form.Item name="author" label="作者">
                <Input />
              </Form.Item>
              <Form.Item name="publisher" label="出版社">
                <Input />
              </Form.Item>
              <Form.Item name="isbn" label="ISBN">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="publishDate" label="出版日期">
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item name="price" label="价格">
                <Input prefix="¥" />
              </Form.Item>
              <Form.Item name="category" label="分类">
                <Input />
              </Form.Item>
              <Form.Item name="location" label="存放位置">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="tags" label="标签">
            <Input placeholder="多个标签用逗号分隔" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Option value="available">可借阅</Option>
              <Option value="borrowed">已借出</Option>
              <Option value="maintenance">维护中</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageBooks;