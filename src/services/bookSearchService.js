import axios from 'axios';

class BookSearchService {
  constructor() {
    this.apiKey = ''; // 如果需要API密钥，可以在这里配置
  }

  // 根据ISBN搜索图书信息
  async searchByISBN(isbn) {
    if (!isbn) {
      throw new Error('ISBN不能为空');
    }

    try {
      // 使用豆瓣API搜索图书（无需API密钥）
      const response = await axios.get(`https://api.douban.com/v2/book/isbn/${isbn}`, {
        timeout: 5000
      });

      return this.parseDoubanBookData(response.data);
    } catch (error) {
      console.error('Book search by ISBN failed:', error);
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
      throw new Error('书名和作者不能同时为空');
    }

    try {
      // 使用豆瓣API搜索图书
      const response = await axios.get('https://api.douban.com/v2/book/search', {
        params: {
          q: `${title} ${author}`,
          count: 5
        },
        timeout: 5000
      });

      return response.data.books.map(book => this.parseDoubanBookData(book));
    } catch (error) {
      console.error('Book search by title and author failed:', error);
      return [];
    }
  }

  // 提取ISBN的辅助方法
  extractISBN(text) {
    if (!text) return '';
    
    // 匹配ISBN格式：978开头的13位数字或10位数字
    const isbnMatch = text.match(/(?:ISBN|isbn)?\s*[:-]?\s*(978[\d\s-]+\d|\d{10})/);
    if (isbnMatch) {
      return isbnMatch[1].replace(/\s|-/g, '');
    }
    return '';
  }
}

export default new BookSearchService();