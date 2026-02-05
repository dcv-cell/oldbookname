import { createWorker } from 'tesseract.js';
import logService from './logService';

class OCRService {
  constructor() {
    this.worker = null;
    this.isInitializing = false;
  }

  async init() {
    if (!this.worker && !this.isInitializing) {
      this.isInitializing = true;
      try {
        logService.info('Initializing OCR worker...');
        // 使用 Tesseract.js v7 正确的参数格式
        // 简化配置，让 Tesseract.js 自动处理 worker 加载
        this.worker = await createWorker({
          logger: (m) => logService.debug('OCR Progress:', m),
          errorHandler: (err) => logService.error('OCR Error:', { error: err })
        });
        // 单独加载语言包
        await this.worker.loadLanguage('chi_sim+eng');
        await this.worker.initialize('chi_sim+eng');
        logService.info('OCR worker initialized successfully');
      } catch (error) {
        logService.error('Failed to initialize OCR worker:', { error: error.message || error });
        throw new Error('OCR服务初始化失败');
      } finally {
        this.isInitializing = false;
      }
    }
  }

  async recognizeImage(image) {
    try {
      logService.info('Recognizing image...');
      await this.init();
      
      const { data: { text } } = await this.worker.recognize(image);
      logService.info('OCR recognition completed', { textLength: text.length });
      logService.debug('OCR result:', { text });
      return text;
    } catch (error) {
      logService.error('OCR Recognition Error:', { error: error.message });
      throw new Error('OCR识别失败');
    }
  }

  async extractBookInfoFromText(text) {
    try {
      logService.info('Extracting book info from OCR text');
      // 简单的文本解析，提取可能的图书信息
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      // 尝试提取书名（通常是第一行）
      const title = lines[0] || '';
      
      // 尝试提取作者（通常在第二行或包含"著"、"作者"等关键词）
      let author = '';
      for (const line of lines) {
        if (line.includes('著') || line.includes('作者') || line.includes('by')) {
          author = line.replace(/[著作者by]/gi, '').trim();
          break;
        }
      }
      
      // 尝试提取ISBN（查找包含ISBN或978开头的行）
      let isbn = '';
      for (const line of lines) {
        const isbnMatch = line.match(/(ISBN|isbn)?\s*[:-]?\s*(978[\d\s-]+\d)/);
        if (isbnMatch) {
          isbn = isbnMatch[2].replace(/\s|-/g, '');
          break;
        }
      }
      
      const bookInfo = {
        title,
        author,
        isbn,
        rawText: text
      };
      
      logService.info('Book info extracted successfully', {
        title: bookInfo.title,
        author: bookInfo.author,
        isbn: bookInfo.isbn
      });
      
      return bookInfo;
    } catch (error) {
      logService.error('Failed to extract book info:', { error: error.message });
      return {
        title: '',
        author: '',
        isbn: '',
        rawText: text
      };
    }
  }

  async processImage(image) {
    try {
      logService.info('Processing image for OCR...');
      const text = await this.recognizeImage(image);
      const bookInfo = await this.extractBookInfoFromText(text);
      logService.info('Image processing completed successfully');
      return bookInfo;
    } catch (error) {
      logService.error('Image Processing Error:', { error: error.message });
      throw error;
    }
  }

  async destroy() {
    if (this.worker) {
      try {
        await this.worker.terminate();
        this.worker = null;
        logService.info('OCR worker destroyed successfully');
      } catch (error) {
        logService.error('Failed to destroy OCR worker:', { error: error.message });
      }
    }
  }
}

export default new OCRService();