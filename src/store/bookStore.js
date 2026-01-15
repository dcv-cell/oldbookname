import { create } from 'zustand';

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
  addBook: (book) => set((state) => ({
    books: [...state.books, { ...book, id: Date.now().toString() }]
  })),

  // 更新图书
  updateBook: (bookId, updates) => set((state) => ({
    books: state.books.map((book) =>
      book.id === bookId ? { ...book, ...updates } : book
    )
  })),

  // 删除图书
  deleteBook: (bookId) => set((state) => ({
    books: state.books.filter((book) => book.id !== bookId)
  })),

  // 设置当前编辑的图书
  setCurrentBook: (book) => set({ currentBook: book }),

  // 清空当前编辑的图书
  clearCurrentBook: () => set({ currentBook: null }),

  // 设置加载状态
  setLoading: (loading) => set({ loading }),

  // 设置错误信息
  setError: (error) => set({ error }),

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