import { create } from 'zustand';
import logger from '../services/logService';

const useBookStore = create((set, get) => ({
  // 图书列表
  books: [],
  // 当前编辑的图书
  currentBook: null,
  // 加载状态
  loading: false,
  // 错误信息
  error: null,

  // 添加图书
  addBook: (book) => set((state) => {
    const newBook = { ...book, id: Date.now().toString() };
    logger.info('添加图书', { title: newBook.title, id: newBook.id });
    return {
      books: [...state.books, newBook]
    };
  }),

  // 更新图书
  updateBook: (bookId, updates) => set((state) => {
    const book = state.books.find(b => b.id === bookId);
    logger.info('更新图书', { id: bookId, title: book?.title, updates: Object.keys(updates) });
    return {
      books: state.books.map((book) =>
        book.id === bookId ? { ...book, ...updates } : book
      )
    };
  }),

  // 删除图书
  deleteBook: (bookId) => set((state) => {
    const book = state.books.find(b => b.id === bookId);
    logger.info('删除图书', { id: bookId, title: book?.title });
    return {
      books: state.books.filter((book) => book.id !== bookId)
    };
  }),

  // 设置当前编辑的图书
  setCurrentBook: (book) => {
    logger.debug('设置当前编辑的图书', { id: book?.id, title: book?.title });
    set({ currentBook: book });
  },

  // 清空当前编辑的图书
  clearCurrentBook: () => {
    logger.debug('清空当前编辑的图书');
    set({ currentBook: null });
  },

  // 设置加载状态
  setLoading: (loading) => {
    logger.debug('设置加载状态', { loading });
    set({ loading });
  },

  // 设置错误信息
  setError: (error) => {
    logger.error('设置错误信息', { error });
    set({ error });
  },

  // 根据ID获取图书
  getBookById: (bookId) => get().books.find((book) => book.id === bookId),

  // 搜索图书
  searchBooks: (query) => {
    const lowerQuery = query.toLowerCase();
    return get().books.filter((book) =>
      book.title.toLowerCase().includes(lowerQuery) ||
      book.author.toLowerCase().includes(lowerQuery) ||
      book.isbn.includes(lowerQuery) ||
      book.publisher.toLowerCase().includes(lowerQuery) ||
      book.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }
}));

export default useBookStore;