import React, { useState } from 'react';
import { Card, Form, Input, Upload, Button, Row, Col, Typography, message, Spin } from 'antd';
import { UploadOutlined, CameraOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import useBookStore from '../store/bookStore';
import ocrService from '../services/ocrService';
import bookSearchService from '../services/bookSearchService';

const { Title } = Typography;

const AddBook = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const addBook = useBookStore((state) => state.addBook);

  const [coverImage, setCoverImage] = useState(null);

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    if (e?.fileList?.[0]) {
      const file = e.fileList[0].originFileObj;
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
    return e?.fileList;
  };

  // 处理OCR识别
  const handleOCR = async () => {
    if (!coverImage) {
      message.warning('请先上传图书封面');
      return;
    }

    setOcrLoading(true);
    try {
      // 使用OCR服务识别图片中的文字
      const ocrResult = await ocrService.processImage(coverImage);
      
      // 提取ISBN并搜索图书信息
      if (ocrResult.isbn) {
        await handleSearchByISBN(ocrResult.isbn);
      } else {
        // 如果未提取到ISBN，只填充识别到的书名和作者
        form.setFieldsValue({
          title: ocrResult.title,
          author: ocrResult.author
        });
        message.success('OCR识别完成，已填充基本信息');
      }
    } catch (error) {
      console.error('OCR识别失败:', error);
      message.error('OCR识别失败，请重试');
    } finally {
      setOcrLoading(false);
    }
  };

  // 根据ISBN搜索图书信息
  const handleSearchByISBN = async (isbn) => {
    setSearchLoading(true);
    try {
      // 使用图书搜索服务获取详细信息
      const bookInfo = await bookSearchService.searchByISBN(isbn);
      
      // 填充表单字段
      form.setFieldsValue(bookInfo);
      message.success('图书信息搜索成功');
    } catch (error) {
      console.error('图书搜索失败:', error);
      message.error('图书搜索失败，请手动输入');
    } finally {
      setSearchLoading(false);
    }
  };

  // 处理表单提交
  const handleSubmit = (values) => {
    setLoading(true);
    try {
      // 处理标签，将逗号分隔的字符串转换为数组
      const tags = values.tags?.split(',').map(tag => tag.trim()).filter(tag => tag !== '') || [];
      
      // 处理价格，转换为数字
      const price = parseFloat(values.price) || 0;
      
      // 准备图书数据
      const bookData = {
        ...values,
        tags,
        price,
        status: 'available',
        cover: coverImage || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 调用状态管理添加图书
      addBook(bookData);
      
      message.success('图书录入成功');
      
      // 重置表单
      form.resetFields();
      setCoverImage(null);
    } catch (error) {
      console.error('图书录入失败:', error);
      message.error('图书录入失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>图书录入</Title>
      
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="封面上传" style={{ marginBottom: '16px' }}>
            <Form.Item
              name="cover"
              valuePropName="fileList"
              getValueFromEvent={normFile}
              rules={[{ required: true, message: '请上传图书封面' }]}
            >
              <Upload.Dragger
                multiple={false}
                accept="image/*"
                listType="picture-card"
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith('image/');
                  if (!isImage) {
                    return Upload.LIST_IGNORE;
                  }
                  return true;
                }}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined style={{ fontSize: 48 }} />
                </p>
                <p className="ant-upload-text">点击或拖拽图片到此处上传</p>
                <p className="ant-upload-hint">支持 JPG、PNG、GIF 等格式</p>
              </Upload.Dragger>
            </Form.Item>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <Button icon={<CameraOutlined />} disabled={true}>拍照上传</Button>
              <Button 
                icon={ocrLoading ? <Spin size="small" /> : <SearchOutlined />} 
                type="primary" 
                onClick={handleOCR}
                loading={ocrLoading}
              >
                {ocrLoading ? '识别中...' : 'OCR识别'}
              </Button>
            </div>
          </Card>
          
          <Card title="ISBN搜索">
            <Row gutter={8}>
              <Col span={16}>
                <Form.Item name="isbn">
                  <Input placeholder="输入ISBN进行搜索" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Button 
                  icon={searchLoading ? <Spin size="small" /> : <SearchOutlined />} 
                  type="primary" 
                  onClick={() => {
                    const isbn = form.getFieldValue('isbn');
                    if (isbn) {
                      handleSearchByISBN(isbn);
                    } else {
                      message.warning('请输入ISBN');
                    }
                  }}
                  loading={searchLoading}
                  block
                >
                  {searchLoading ? '搜索中...' : '搜索'}
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="图书信息">
            <Spin spinning={loading} tip="保存中...">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
              >
                <Form.Item
                  name="title"
                  label="书名"
                  rules={[{ required: true, message: '请输入书名' }]}
                >
                  <Input placeholder="请输入书名" />
                </Form.Item>
                
                <Form.Item
                  name="author"
                  label="作者"
                  rules={[{ required: true, message: '请输入作者' }]}
                >
                  <Input placeholder="请输入作者" />
                </Form.Item>
                
                <Form.Item
                  name="publisher"
                  label="出版社"
                >
                  <Input placeholder="请输入出版社" />
                </Form.Item>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="publishDate"
                      label="出版日期"
                    >
                      <Input placeholder="YYYY-MM-DD" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="price"
                      label="价格"
                    >
                      <Input placeholder="请输入价格" prefix="¥" />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Form.Item
                  name="category"
                  label="分类"
                >
                  <Input placeholder="请输入分类" />
                </Form.Item>
                
                <Form.Item
                  name="tags"
                  label="标签"
                >
                  <Input placeholder="多个标签用逗号分隔" />
                </Form.Item>
                
                <Form.Item
                  name="description"
                  label="描述"
                >
                  <Input.TextArea rows={4} placeholder="请输入图书描述" />
                </Form.Item>
                
                <Form.Item
                  name="location"
                  label="存放位置"
                >
                  <Input placeholder="请输入存放位置" />
                </Form.Item>
                
                <Form.Item>
                  <Button type="primary" htmlType="submit" block loading={loading}>
                    保存图书信息
                  </Button>
                </Form.Item>
              </Form>
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AddBook;