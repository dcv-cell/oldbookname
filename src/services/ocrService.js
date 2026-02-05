import logService from './logService';

class OCRService {
  constructor() {
    logService.info('OCR Service initialized (mock version)');
  }

  async processImage(image) {
    try {
      logService.info('Processing image for OCR...');
      // 模拟 OCR 处理过程
      await new Promise(resolve => setTimeout(resolve, 1500)); // 模拟处理延迟
      
      // 模拟提取的图书信息
      // 注意：在实际使用中，用户需要手动输入图书信息
      const bookInfo = {
        title: '示例书名',
        author: '示例作者',
        isbn: '',
        rawText: '这是模拟的OCR识别结果。由于当前环境无法加载OCR服务，请手动输入图书信息。'
      };
      
      logService.info('Image processing completed successfully (mock version)');
      logService.debug('Mock OCR result:', { bookInfo });
      
      return bookInfo;
    } catch (error) {
      logService.error('Image Processing Error:', { error: error.message });
      // 即使出错，也返回一个默认的空对象，确保应用不会崩溃
      return {
        title: '',
        author: '',
        isbn: '',
        rawText: ''
      };
    }
  }
}

export default new OCRService();