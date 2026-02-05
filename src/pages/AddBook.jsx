import React, { useState, useRef, useEffect } from 'react';
import { Card, Form, Input, Upload, Button, Row, Col, Typography, message, Spin, Modal } from 'antd';
import { UploadOutlined, CameraOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import useBookStore from '../store/bookStore';
import ocrService from '../services/ocrService';
import bookSearchService from '../services/bookSearchService';
import logger from '../services/logService';

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
  }, []);

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
      logger.warn('OCR识别：未上传封面图片');
      message.warning('请先上传图书封面');
      return;
    }

    setOcrLoading(true);
    try {
      // 使用OCR服务识别图片中的文字
      logger.info('开始OCR识别流程');
      const ocrResult = await ocrService.processImage(coverImage);
      
      // 提取ISBN并搜索图书信息
      if (ocrResult.isbn) {
        logger.info('OCR识别成功，提取到ISBN', { isbn: ocrResult.isbn });
        await handleSearchByISBN(ocrResult.isbn);
      } else {
        // 如果未提取到ISBN，只填充识别到的书名和作者
        logger.info('OCR识别完成，未提取到ISBN，填充基本信息', { title: ocrResult.title, author: ocrResult.author });
        form.setFieldsValue({
          title: ocrResult.title,
          author: ocrResult.author
        });
        message.success('OCR识别完成，已填充基本信息');
      }
    } catch (error) {
      logger.error('OCR识别失败', { error: error.message });
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
      logger.info('开始根据ISBN搜索图书信息', { isbn });
      const bookInfo = await bookSearchService.searchByISBN(isbn);
      
      // 填充表单字段
      form.setFieldsValue(bookInfo);
      logger.info('图书信息搜索成功', { title: bookInfo.title, author: bookInfo.author });
      message.success('图书信息搜索成功');
    } catch (error) {
      logger.error('图书搜索失败', { isbn, error: error.message });
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
    <div>
      <Title level={2} style={{ marginBottom: '24px', textAlign: 'center' }}>图书录入</Title>
      
      <Row gutter={[16, 24]}>
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
                style={{ maxWidth: '100%' }}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined style={{ fontSize: 48 }} />
                </p>
                <p className="ant-upload-text">点击或拖拽图片到此处上传</p>
                <p className="ant-upload-hint">支持 JPG、PNG、GIF 等格式</p>
              </Upload.Dragger>
            </Form.Item>
            <div style={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: '8px', justifyContent: 'center' }}>
              <Button 
                icon={<CameraOutlined />} 
                type="default" 
                onClick={handleCameraUpload}
              >
                拍照上传
              </Button>
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
      
      {/* 拍照上传模态框 */}
      <Modal
        title="拍照上传"
        open={cameraVisible}
        onCancel={closeCamera}
        footer={[
          <Button key="cancel" onClick={closeCamera}>取消</Button>,
          <Button key="submit" type="primary" onClick={capturePhoto}>拍照</Button>
        ]}
        width={{ xs: '90%', sm: 500 }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '16px' }}>
            <Button type="primary" onClick={startCamera}>开始摄像头</Button>
          </div>
          <video
            ref={videoRef}
            style={{ width: '100%', maxWidth: '400px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </Modal>
    </div>
  );
};

export default AddBook;