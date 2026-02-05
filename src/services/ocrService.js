import { createWorker } from 'tesseract.js';

class OCRService {
  constructor() {
    this.worker = null;
  }

  async init() {
    if (!this.worker) {
      try {
        console.log('Initializing OCR worker...');
        this.worker = await createWorker('chi_sim+eng', 1, {
          logger: (m) => console.log('OCR Progress:', m),
          errorHandler: (err) => console.error('OCR Error:', err)
        });
        console.log('OCR worker initialized successfully');
      } catch (error) {
        console.error('Failed to initialize OCR worker:', error);
        throw new Error('OCR服务初始化失败');
      }
    }
  }

  async recognizeImage(image) {
    try {
      console.log('Recognizing image...');
      await this.init();
      
      const { data: { text } } = await this.worker.recognize(image);
      console.log('OCR result:', text);
      return text;
    } catch (error) {
      console.error('OCR Recognition Error:', error);
      throw new Error('OCR识别失败');
    }
  }

  async extractBookInfoFromText(text) {
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
    
    return {
      title,
      author,
      isbn,
      rawText: text
    };
  }

  async processImage(image) {
    try {
      console.log('Processing image for OCR...');
      const text = await this.recognizeImage(image);
      const bookInfo = this.extractBookInfoFromText(text);
      console.log('Extracted book info:', bookInfo);
      return bookInfo;
    } catch (error) {
      console.error('Image Processing Error:', error);
      throw error;
    }
  }

  async destroy() {
    if (this.worker) {
      try {
        await this.worker.terminate();
        this.worker = null;
        console.log('OCR worker destroyed successfully');
      } catch (error) {
        console.error('Failed to destroy OCR worker:', error);
      }
    }
  }
}

export default new OCRService();