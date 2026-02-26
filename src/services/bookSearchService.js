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

    // 清理ISBN格式
    const cleanISBN = isbn.replace(/\s|-/g, '');
    
    // 检查是否只包含数字
    if (!/^\d+$/.test(cleanISBN)) {
      logger.warn('ISBN包含非数字字符', { isbn: cleanISBN });
      return {
        title: '',
        author: '',
        publisher: '',
        publishDate: '',
        price: '',
        isbn: cleanISBN,
        description: '搜索失败：ISBN包含非数字字符，请检查条形码是否清晰',
        cover: '',
        error: 'Invalid ISBN format'
      };
    }

    // 放宽ISBN格式验证，允许8位及以上的数字进行搜索尝试
    // 因为有些条形码可能是部分ISBN、UPC码或其他编码
    if (cleanISBN.length < 8) {
      logger.warn('ISBN长度过短', { isbn: cleanISBN, length: cleanISBN.length });
      return {
        title: '',
        author: '',
        publisher: '',
        publishDate: '',
        price: '',
        isbn: cleanISBN,
        description: '搜索失败：识别的条形码过短，可能不是有效的ISBN。建议重新拍照或手动输入ISBN。',
        cover: '',
        error: 'ISBN too short'
      };
    }

    logger.info('开始根据ISBN搜索图书', { isbn: cleanISBN });
    
    // 尝试多个API，确保获取到图书信息
    const apiMethods = [
      () => this.searchFromDouban(cleanISBN),
      () => this.searchFromOpenLibrary(cleanISBN),
      () => this.searchFromGoogleBooks(cleanISBN)
    ];

    // 如果ISBN不是标准10位或13位，添加警告日志
    if (cleanISBN.length !== 10 && cleanISBN.length !== 13) {
      logger.warn('ISBN不是标准格式（10位或13位），但仍尝试搜索', { isbn: cleanISBN, length: cleanISBN.length });
    }

    for (const apiMethod of apiMethods) {
      try {
        logger.info('尝试使用API获取图书信息');
        const result = await apiMethod();
        if (result && !result.error) {
          logger.info('ISBN搜索成功', { isbn: cleanISBN, title: result.title });
          return result;
        }
      } catch (error) {
        logger.error('API调用失败', { error: error.message });
        // 继续尝试下一个API
        continue;
      }
    }
    
    // 所有API都失败时返回错误信息
    logger.error('所有API都失败，无法获取图书信息', { isbn: cleanISBN });
    return {
      title: '',
      author: '',
      publisher: '',
      publishDate: '',
      price: '',
      isbn: cleanISBN,
      description: '搜索失败：所有图书信息服务都不可用，请手动输入完整的ISBN',
      cover: '',
      error: 'All APIs failed'
    };
  }

  // 从豆瓣API搜索图书
  async searchFromDouban(isbn) {
    logger.info('尝试从豆瓣API搜索图书', { isbn });
    try {
      const response = await axios.get(`https://api.douban.com/v2/book/isbn/${isbn}`, {
        timeout: 5000
      });
      const bookData = this.parseDoubanBookData(response.data);
      logger.info('从豆瓣API获取图书信息成功', { isbn, title: bookData.title });
      return bookData;
    } catch (error) {
      logger.error('从豆瓣API搜索失败', { isbn, error: error.message });
      throw error;
    }
  }

  // 从Open Library API搜索图书
  async searchFromOpenLibrary(isbn) {
    logger.info('尝试从Open Library API搜索图书', { isbn });
    try {
      const response = await axios.get(`https://openlibrary.org/isbn/${isbn}.json`, {
        timeout: 5000
      });
      const bookData = this.parseOpenLibraryData(response.data);
      logger.info('从Open Library API获取图书信息成功', { isbn, title: bookData.title });
      return bookData;
    } catch (error) {
      logger.error('从Open Library API搜索失败', { isbn, error: error.message });
      throw error;
    }
  }

  // 从Google Books API搜索图书
  async searchFromGoogleBooks(isbn) {
    logger.info('尝试从Google Books API搜索图书', { isbn });
    try {
      const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
        params: {
          q: `isbn:${isbn}`,
          maxResults: 1
        },
        timeout: 5000
      });
      
      if (response.data.totalItems > 0) {
        const bookData = this.parseGoogleBooksData(response.data.items[0]);
        logger.info('从Google Books API获取图书信息成功', { isbn, title: bookData.title });
        return bookData;
      } else {
        throw new Error('No book found');
      }
    } catch (error) {
      logger.error('从Google Books API搜索失败', { isbn, error: error.message });
      throw error;
    }
  }

  // 解析Open Library API返回的数据
  parseOpenLibraryData(data) {
    return {
      title: data.title || '',
      author: data.authors?.map(author => author.name).join('、') || '',
      publisher: data.publishers?.[0]?.name || '',
      publishDate: data.publish_date || '',
      price: '',
      isbn: data.isbn_13?.[0] || data.isbn_10?.[0] || '',
      description: data.description || '',
      cover: data.covers?.[0] ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg` : ''
    };
  }

  // 解析Google Books API返回的数据
  parseGoogleBooksData(data) {
    const volumeInfo = data.volumeInfo;
    return {
      title: volumeInfo.title || '',
      author: volumeInfo.authors?.join('、') || '',
      publisher: volumeInfo.publisher || '',
      publishDate: volumeInfo.publishedDate || '',
      price: volumeInfo.listPrice?.amount || '',
      isbn: volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier || 
            volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier || '',
      description: volumeInfo.description || '',
      cover: volumeInfo.imageLinks?.thumbnail || ''
    };
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