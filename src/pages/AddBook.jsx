import React, { useState, useRef, useEffect } from 'react';
import { Card, Form, Input, Upload, Button, Row, Col, Typography, message, Spin, Modal } from 'antd';
import { UploadOutlined, CameraOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import useBookStore from '../store/bookStore';
import ocrService from '../services/ocrService';
import bookSearchService from '../services/bookSearchService';
import barcodeService from '../services/barcodeService';
import logger from '../services/logService';
import apiConfig from '../config/apiConfig';

const { Title } = Typography;

const AddBook = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const addBook = useBookStore((state) => state.addBook);

  const [coverImage, setCoverImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    logger.info('AddBook component loaded');
    
    // 初始化AI服务
    try {
      if (apiConfig.doubao?.apiKey) {
        logger.info('初始化豆包大模型AI服务');
        barcodeService.enableAI('doubao', apiConfig.doubao.apiKey);
        logger.info('AI服务初始化成功');
      } else if (apiConfig.baidu?.apiKey) {
        logger.info('初始化百度文心一言AI服务');
        barcodeService.enableAI('baidu', apiConfig.baidu.apiKey);
        logger.info('AI服务初始化成功');
      } else {
        logger.warn('AI服务API密钥未配置，AI功能将不可用');
      }
    } catch (error) {
      logger.error('AI服务初始化失败', { error: error.message });
    }
  }, []);

  // 当摄像头模态框打开时自动启动摄像头
  useEffect(() => {
    if (cameraVisible) {
      logger.info('摄像头模态框已打开，准备启动摄像头');
      startCamera();
    }
  }, [cameraVisible]);

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

  // 处理AI识别
  const handleAIIdentify = async () => {
    if (!coverImage) {
      logger.warn('AI识别：未上传封面图片');
      message.warning('请先上传图书封面');
      return;
    }

    setOcrLoading(true);
    try {
      // 使用AI服务识别图片中的完整图书信息
      logger.info('开始AI识别流程');
      
      // 直接使用AI图像服务进行识别
      const aiResult = await barcodeService.recognizeBookInfo(coverImage);
      
      if (aiResult) {
        logger.info('AI识别成功，提取到图书信息', { info: aiResult });
        
        // 填充表单字段
        form.setFieldsValue(aiResult);
        
        // 如果提取到了ISBN，也可以尝试搜索更详细的信息
        if (aiResult.isbn) {
          logger.info('AI识别到ISBN，尝试搜索更详细的图书信息', { isbn: aiResult.isbn });
          try {
            await handleSearchByISBN(aiResult.isbn);
          } catch (searchError) {
            logger.warn('ISBN搜索失败，使用AI直接识别的信息', { error: searchError.message });
            // 即使搜索失败，也已经填充了AI识别的信息
          }
        }
        
        message.success('AI识别成功，已填充图书信息');
      } else {
        logger.warn('AI识别未提取到图书信息');
        message.info('AI识别未找到图书信息，请尝试以下方法：\n1. 调整图片角度和光线\n2. 确保封面文字清晰可见\n3. 尝试手动输入图书信息\n4. 检查网络连接');
      }
    } catch (error) {
      logger.error('AI识别失败', { error: error.message });
      message.error('AI识别失败，请尝试手动输入图书信息或检查网络连接');
    } finally {
      setOcrLoading(false);
    }
  };

  // 根据ISBN搜索图书信息
  const handleSearchByISBN = async (isbn) => {
    setSearchLoading(true);
    try {
      // 使用图书搜索服务获取详细信息
      logger.info('开始根据ISBN搜索图书信息', { isbn });
      const bookInfo = await bookSearchService.searchByISBN(isbn);
      
      // 检查是否有错误
      if (bookInfo.error) {
        logger.error('图书搜索返回错误', { isbn, error: bookInfo.error, description: bookInfo.description });
        message.error(bookInfo.description || '图书搜索失败，请手动输入');
      } else {
        // 填充表单字段
        form.setFieldsValue(bookInfo);
        logger.info('图书信息搜索成功', { title: bookInfo.title, author: bookInfo.author });
        message.success('图书信息搜索成功');
      }
    } catch (error) {
      logger.error('图书搜索异常', { isbn, error: error.message });
      message.error('图书搜索失败，请手动输入');
    } finally {
      setSearchLoading(false);
    }
  };

  // 根据书名和作者搜索图书信息
  const handleSearchByTitleAndAuthor = async (title, author) => {
    setSearchLoading(true);
    try {
      // 使用图书搜索服务获取详细信息
      logger.info('开始根据书名和作者搜索图书信息', { title, author });
      const books = await bookSearchService.searchByTitleAndAuthor(title, author);
      
      if (books && books.length > 0) {
        // 填充第一本图书的信息
        const bookInfo = books[0];
        form.setFieldsValue(bookInfo);
        logger.info('图书信息搜索成功', { title: bookInfo.title, author: bookInfo.author });
        message.success(`找到 ${books.length} 本相关图书，已填充第一本`);
      } else {
        logger.info('未找到相关图书', { title, author });
        message.info('未找到相关图书，请尝试其他关键词或手动输入');
      }
    } catch (error) {
      logger.error('图书搜索失败', { title, author, error: error.message });
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
      
      logger.info('提交图书信息', { title: bookData.title, author: bookData.author });
      // 调用状态管理添加图书
      addBook(bookData);
      
      logger.info('图书录入成功', { title: bookData.title });
      message.success('图书录入成功');
      
      // 重置表单
      form.resetFields();
      setCoverImage(null);
    } catch (error) {
      logger.error('图书录入失败', { error: error.message });
      message.error('图书录入失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理拍照上传
  const handleCameraUpload = () => {
    logger.info('打开拍照上传模态框');
    setCameraVisible(true);
  };

  // 开始摄像头
  const startCamera = () => {
    logger.info('开始摄像头');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            logger.info('摄像头启动成功');
          }
        })
        .catch(err => {
          logger.error('无法访问后置摄像头，尝试使用前置摄像头', { error: err.message });
          // 如果后置摄像头不可用，尝试使用前置摄像头
          navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
            .then(stream => {
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                logger.info('前置摄像头启动成功');
                message.info('后置摄像头不可用，已切换到前置摄像头');
              }
            })
            .catch(err2 => {
              logger.error('无法访问摄像头', { error: err2.message });
              message.error('无法访问摄像头，请检查设备权限');
            });
        });
    } else {
      logger.warn('浏览器不支持摄像头功能');
      message.error('浏览器不支持摄像头功能');
    }
  };

  // 拍照
  const capturePhoto = () => {
    logger.info('开始拍照');
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // 停止摄像头
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
      }
      
      // 转换为base64
      const imageData = canvas.toDataURL('image/jpeg');
      setCoverImage(imageData);
      setCameraVisible(false);
      logger.info('拍照成功，已设置封面图片');
      message.success('拍照成功');
    } else {
      logger.error('拍照失败：视频或画布元素未找到');
      message.error('拍照失败，请重试');
    }
  };

  // 关闭摄像头
  const closeCamera = () => {
    logger.debug('关闭摄像头');
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      logger.info('摄像头已停止');
    }
    setCameraVisible(false);
  };





  return (
    <div style={{ padding: '16px' }}>
      <Title level={2} style={{ marginBottom: '24px', textAlign: 'center' }}>图书录入</Title>
      
      <Card title="封面上传" style={{ marginBottom: '20px' }}>
        <Form form={form} layout="vertical">
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
              style={{ maxWidth: '100%' }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ fontSize: 48 }} />
              </p>
              <p className="ant-upload-text">点击或拖拽图片到此处上传</p>
              <p className="ant-upload-hint">支持 JPG、PNG、GIF 等格式</p>
            </Upload.Dragger>
          </Form.Item>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button 
              icon={<CameraOutlined />} 
              type="default" 
              onClick={handleCameraUpload}
              block
              size="large"
            >
              拍照上传
            </Button>
            <Button 
              icon={ocrLoading ? <Spin size="small" /> : <SearchOutlined />} 
              type="primary" 
              onClick={handleAIIdentify}
              loading={ocrLoading}
              block
              size="large"
            >
              {ocrLoading ? 'AI识别中...' : 'AI识别'}
            </Button>
          </div>
        </Form>
      </Card>
      
      <Card title="图书搜索" style={{ marginBottom: '20px' }}>
        <Form form={form} layout="vertical">
          {/* ISBN搜索 */}
          <Row gutter={8} style={{ marginBottom: '16px' }}>
            <Col xs={24}>
              <Form.Item name="isbn">
                <Input placeholder="输入ISBN进行搜索" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24}>
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
                size="large"
              >
                {searchLoading ? '搜索中...' : '搜索ISBN'}
              </Button>
            </Col>
          </Row>
          
          {/* 书名和作者搜索 */}
          <Row gutter={8} style={{ marginBottom: '16px' }}>
            <Col xs={24} style={{ marginBottom: '8px' }}>
              <Form.Item name="searchTitle">
                <Input placeholder="输入书名" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} style={{ marginBottom: '8px' }}>
              <Form.Item name="searchAuthor">
                <Input placeholder="输入作者" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Button 
                icon={searchLoading ? <Spin size="small" /> : <SearchOutlined />} 
                type="default" 
                onClick={() => {
                  const title = form.getFieldValue('searchTitle');
                  const author = form.getFieldValue('searchAuthor');
                  if (title || author) {
                    handleSearchByTitleAndAuthor(title, author);
                  } else {
                    message.warning('请输入书名或作者');
                  }
                }}
                loading={searchLoading}
                block
                size="large"
              >
                搜索图书
              </Button>
            </Col>
          </Row>
          
          {/* 搜索提示 */}
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px', marginBottom: '8px' }}>
            <p>• 方法1：直接输入ISBN码进行搜索（推荐，最准确）</p>
            <p>• 方法2：输入书名和作者进行搜索</p>
            <p>• 方法3：上传图书封面后点击"AI识别"按钮（智能识别）</p>
          </div>
        </Form>
      </Card>
      
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
              <Input placeholder="请输入书名" size="large" />
            </Form.Item>
            
            <Form.Item
              name="author"
              label="作者"
              rules={[{ required: true, message: '请输入作者' }]}
            >
              <Input placeholder="请输入作者" size="large" />
            </Form.Item>
            
            <Form.Item
              name="publisher"
              label="出版社"
            >
              <Input placeholder="请输入出版社" size="large" />
            </Form.Item>
            
            <Row gutter={16}>
              <Col xs={24} style={{ marginBottom: '16px' }}>
                <Form.Item
                  name="publishDate"
                  label="出版日期"
                >
                  <Input placeholder="YYYY-MM-DD" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  name="price"
                  label="价格"
                >
                  <Input placeholder="请输入价格" prefix="¥" size="large" />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item
              name="category"
              label="分类"
            >
              <Input placeholder="请输入分类" size="large" />
            </Form.Item>
            
            <Form.Item
              name="tags"
              label="标签"
            >
              <Input placeholder="多个标签用逗号分隔" size="large" />
            </Form.Item>
            
            <Form.Item
              name="location"
              label="存放位置"
            >
              <Input placeholder="请输入存放位置" size="large" />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="描述"
            >
              <Input.TextArea rows={3} placeholder="请输入图书描述" size="large" />
            </Form.Item>
            
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading} size="large">
                保存图书信息
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
      
      {/* 拍照上传模态框 */}
      <Modal
        title="拍照上传"
        open={cameraVisible}
        onCancel={closeCamera}
        footer={[
          <Button key="cancel" onClick={closeCamera} size="large">取消</Button>,
          <Button key="submit" type="primary" onClick={capturePhoto} size="large">拍照</Button>
        ]}
        width="95%"
        style={{ maxWidth: '400px' }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '16px' }}>
            <Button type="primary" onClick={startCamera} size="large">开始摄像头</Button>
          </div>
          <video
            ref={videoRef}
            style={{ width: '100%', border: '1px solid #d9d9d9', borderRadius: '4px' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </Modal>
      
    </div>
  );
};

export default AddBook;