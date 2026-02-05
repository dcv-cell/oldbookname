import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Select, Tag, Row, Col, Modal, Pagination, message, Drawer } from 'antd';
import { SearchOutlined, EyeOutlined, ShareAltOutlined, FilterOutlined, PlusOutlined, ExportOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import useBookStore from '../store/bookStore';

const { Option } = Select;
const { Search } = Input;

const Books = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [isBookshelfDrawerVisible, setIsBookshelfDrawerVisible] = useState(false);
  const [bookshelfName, setBookshelfName] = useState('');
  const pageSize = 8;

  // 从状态管理获取图书数据
  const books = useBookStore((state) => state.books);
  const searchBooks = useBookStore((state) => state.searchBooks);

  // 筛选图书数据
  const [filteredBooks, setFilteredBooks] = useState([]);

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

  const showBookDetail = (book) => {
    setSelectedBook(book);
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedBook(null);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 处理图书选择
  const handleBookSelect = (bookId) => {
    setSelectedBooks(prev => {
      if (prev.includes(bookId)) {
        return prev.filter(id => id !== bookId);
      } else {
        return [...prev, bookId];
      }
    });
  };

  // 显示书单生成抽屉
  const showBookshelfDrawer = () => {
    if (selectedBooks.length === 0) {
      message.warning('请先选择图书');
      return;
    }
    setIsBookshelfDrawerVisible(true);
  };

  // 关闭书单生成抽屉
  const handleBookshelfDrawerClose = () => {
    setIsBookshelfDrawerVisible(false);
    setBookshelfName('');
  };

  // 生成书单
  const generateBookshelf = () => {
    if (!bookshelfName.trim()) {
      message.warning('请输入书单名称');
      return;
    }
    
    const selectedBookDetails = books.filter(book => selectedBooks.includes(book.id));
    const bookshelf = {
      name: bookshelfName,
      books: selectedBookDetails,
      createdAt: new Date().toISOString(),
      id: Date.now().toString()
    };
    
    console.log('生成书单:', bookshelf);
    message.success('书单生成成功');
    setIsBookshelfDrawerVisible(false);
    setBookshelfName('');
    setSelectedBooks([]);
  };

  // 分享图书
  const handleShare = (book) => {
    // 这里可以实现分享功能，例如生成分享链接或复制到剪贴板
    navigator.clipboard.writeText(`推荐一本好书：《${book.title}》作者：${book.author}`);
    message.success('分享内容已复制到剪贴板');
  };

  // Pagination logic
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

  return (
    <div>
      <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>图书展示</h2>
      
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[8, 16]} align="middle">
          <Col xs={24} md={16}>
            <Search
              placeholder="搜索图书、作者或出版社"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={value => setSearchText(value)}
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={8}>
            <Row gutter={8}>
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
                <Button icon={<FilterOutlined />} block>高级筛选</Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>
      
      {/* 书单生成按钮 */}
      {selectedBooks.length > 0 && (
        <div style={{ marginBottom: '16px', textAlign: 'center' }}>
          <Button 
            type="primary" 
            icon={<ExportOutlined />} 
            onClick={showBookshelfDrawer}
          >
            生成书单 ({selectedBooks.length})
          </Button>
        </div>
      )}
      
      <Row gutter={[16, 16]}>
        {paginatedBooks.map((book) => (
          <Col key={book.id} xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              cover={
                <div style={{ 
                  height: { xs: '200px', sm: '250px', md: '300px' }, 
                  overflow: 'hidden', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  backgroundColor: '#f5f5f5',
                  position: 'relative'
                }}>
                  {/* 选择复选框 */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '8px', 
                    left: '8px', 
                    zIndex: 10,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '4px',
                    padding: '4px'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedBooks.includes(book.id)}
                      onChange={() => handleBookSelect(book.id)}
                    />
                  </div>
                  <img
                    alt={book.title}
                    src={book.cover || 'https://via.placeholder.com/200x300?text=No+Cover'}
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  />
                </div>
              }
              actions={[
                <Button type="text" icon={<EyeOutlined />} onClick={() => showBookDetail(book)}>
                  详情
                </Button>,
                <Button type="text" icon={<ShareAltOutlined />} onClick={() => handleShare(book)}>
                  分享
                </Button>
              ]}
            >
              <div style={{ height: '40px', overflow: 'hidden', marginBottom: '8px', fontWeight: 'bold' }}>{book.title}</div>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>{book.author}</div>
              <div style={{ fontSize: '14px', color: '#1890ff', marginBottom: '8px' }}>¥{book.price}</div>
              <div style={{ marginBottom: '8px' }}>{statusMap[book.status]}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {book.tags.slice(0, 3).map((tag) => (
                  <Tag key={tag} size="small" style={{ margin: 0 }}>{tag}</Tag>
                ))}
                {book.tags.length > 3 && <Tag size="small" style={{ margin: 0 }}>+{book.tags.length - 3}</Tag>}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={filteredBooks.length}
          onChange={handlePageChange}
          showSizeChanger={false}
          responsive
        />
      </div>
      
      {/* 图书详情模态框 */}
      {selectedBook && (
        <Modal
          title="图书详情"
          visible={isModalVisible}
          onCancel={handleModalCancel}
          footer={null}
          width={{ xs: '90%', sm: 800 }}
        >
          <Row gutter={[16, 24]}>
            <Col xs={24} md={8}>
              <div style={{ height: { xs: '200px', md: '400px' }, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
                <img
                  alt={selectedBook.title}
                  src={selectedBook.cover || 'https://via.placeholder.com/200x300?text=No+Cover'}
                  style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                />
              </div>
            </Col>
            <Col xs={24} md={16}>
              <h3>{selectedBook.title}</h3>
              <p style={{ color: '#999', marginBottom: '24px' }}>作者：{selectedBook.author}</p>
              
              <div style={{ marginBottom: '16px' }}>
                <strong>出版社：</strong>{selectedBook.publisher}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>ISBN：</strong>{selectedBook.isbn}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>出版日期：</strong>{selectedBook.publishDate}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>价格：</strong><span style={{ color: '#1890ff', fontSize: '18px' }}>¥{selectedBook.price}</span>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>分类：</strong>{selectedBook.category}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>存放位置：</strong>{selectedBook.location}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>状态：</strong>{statusMap[selectedBook.status]}
              </div>
              <div style={{ marginBottom: '24px' }}>
                <strong>标签：</strong>
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedBook.tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              </div>
              
              <div>
                <strong>描述：</strong>
                <p style={{ marginTop: '8px', lineHeight: '1.6' }}>
                  {selectedBook.description || '暂无描述'}
                </p>
              </div>
            </Col>
          </Row>
        </Modal>
      )}
      
      {/* 书单生成抽屉 */}
      <Drawer
        title="生成书单"
        placement="right"
        onClose={handleBookshelfDrawerClose}
        open={isBookshelfDrawerVisible}
        width={{ xs: '90%', sm: 400 }}
      >
        <div style={{ padding: '16px 0' }}>
          <h4>已选择 {selectedBooks.length} 本图书</h4>
          <ul style={{ maxHeight: '300px', overflowY: 'auto', padding: '16px 0' }}>
            {selectedBooks.map(bookId => {
              const book = books.find(b => b.id === bookId);
              return book ? (
                <li key={bookId} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  {book.title}
                </li>
              ) : null;
            })}
          </ul>
          
          <div style={{ marginBottom: '16px' }}>
            <Input
              placeholder="请输入书单名称"
              value={bookshelfName}
              onChange={(e) => setBookshelfName(e.target.value)}
              style={{ marginBottom: '16px' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button onClick={handleBookshelfDrawerClose} style={{ flex: 1 }}>取消</Button>
            <Button type="primary" onClick={generateBookshelf} style={{ flex: 1 }}>生成书单</Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default Books;