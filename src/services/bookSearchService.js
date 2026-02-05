import axios from 'axios';
import logger from './logService';

class BookSearchService {
  constructor() {
    this.apiKey = ''; // 如果需要API密钥，可以在这里配置
  }

  // 根据ISBN搜索图书信息
  async searchByISBN(isbn) {
    if (!isbn) {
      logger.error('ISBN搜索失败：ISBN不能为空');
      throw new Error('ISBN不能为空');
    }

    logger.info('开始根据ISBN搜索图书', { isbn });
    try {
      // 使用豆瓣API搜索图书（无需API密钥）
      const response = await axios.get(`https://api.douban.com/v2/book/isbn/${isbn}`, {
        timeout: 5000
      });

      const bookData = this.parseDoubanBookData(response.data);
      logger.info('ISBN搜索成功', { isbn, title: bookData.title });
      return bookData;
    } catch (error) {
      logger.error('ISBN搜索失败', { isbn, error: error.message });
      // 搜索失败时返回空对象，允许手动输入
      return {
        title: '',
        author: '',
        publisher: '',
        publishDate: '',
        price: '',
        isbn: isbn,
        description: '',
        cover: ''
      };
    }
  }

  // 解析豆瓣API返回的图书数据
  parseDoubanBookData(data) {
    return {
      title: data.title || '',
      author: data.author?.join('、') || '',
      publisher: data.publisher || '',
      publishDate: data.pubdate || '',
      price: data.price?.replace('元', '') || '',
      isbn: data.isbn13 || data.isbn10 || '',
      description: data.summary || '',
      cover: data.image || ''
    };
  }

  // 根据书名和作者搜索图书
  async searchByTitleAndAuthor(title, author) {
    if (!title && !author) {
      logger.error('图书搜索失败：书名和作者不能同时为空');
      throw new Error('书名和作者不能同时为空');
    }

    logger.info('开始根据书名和作者搜索图书', { title, author });
    try {
      // 使用豆瓣API搜索图书
      const response = await axios.get('https://api.douban.com/v2/book/search', {
        params: {
          q: `${title} ${author}`,
          count: 5
        },
        timeout: 5000
      });

      const books = response.data.books.map(book => this.parseDoubanBookData(book));
      logger.info('图书搜索成功', { title, author, count: books.length });
      return books;
    } catch (error) {
      logger.error('图书搜索失败', { title, author, error: error.message });
      return [];
    }
  }

  // 提取ISBN的辅助方法
  extractISBN(text) {
    if (!text) {
      logger.debug('ISBN提取：文本为空');
      return '';
    }
    
    logger.debug('开始提取ISBN', { text });
    // 匹配ISBN格式：978开头的13位数字或10位数字
    const isbnMatch = text.match(/(?:ISBN|isbn)?\s*[:-]?\s*(978[\d\s-]+\d|\d{10})/);
    if (isbnMatch) {
      const isbn = isbnMatch[1].replace(/\s|-/g, '');
      logger.info('ISBN提取成功', { isbn });
      return isbn;
    }
    logger.debug('ISBN提取失败：未找到匹配的ISBN格式');
    return '';
  }
}

export default new BookSearchService();