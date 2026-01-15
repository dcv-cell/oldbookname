import { createWorker } from 'tesseract.js';

class OCRService {
  constructor() {
    this.worker = null;
  }

  async init() {
    if (!this.worker) {
      this.worker = await createWorker('chi_sim+eng', 1, {
        logger: (m) => console.log('OCR Progress:', m),
        errorHandler: (err) => console.error('OCR Error:', err)
      });
    }
  }

  async recognizeImage(image) {
    try {
      await this.init();
      
      const { data: { text } } = await this.worker.recognize(image);
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
      const text = await this.recognizeImage(image);
      return this.extractBookInfoFromText(text);
    } catch (error) {
      console.error('Image Processing Error:', error);
      throw error;
    }
  }

  async destroy() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export default new OCRService();