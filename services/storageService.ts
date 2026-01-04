
import { Book, Chapter, StorageMode } from '../types';

const STORAGE_KEY = 'inkwell_books_data';
const API_BASE = '/api';

export const storageService = {
  mode: 'simulated' as StorageMode,

  async getBooks(userId: string): Promise<{ books: Book[], mode: StorageMode }> {
    try {
      const response = await fetch(`${API_BASE}/books?userId=${userId}`);
      if (response.ok) {
        const books = await response.json();
        this.mode = 'real';
        return { books, mode: 'real' };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn(`Storage API Error (${response.status}):`, errorData.details || errorData.error || 'Unknown error');
      }
    } catch (e: any) {
      console.error('Network error connecting to Storage API:', e.message);
    }

    // Fallback to simulation
    this.mode = 'simulated';
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const initial: Book[] = [{
        id: 'default-book',
        userId,
        title: 'My First Masterpiece (Simulated)',
        author: 'Author',
        createdAt: Date.now(),
        chapters: [{
          id: 'ch-1',
          title: 'Chapter 1: The Beginning',
          content: 'The story starts here...',
          wordCount: 4
        }]
      }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return { books: initial, mode: 'simulated' };
    }
    const allBooks: Book[] = JSON.parse(data);
    return { books: allBooks.filter(book => book.userId === userId), mode: 'simulated' };
  },

  async saveBooks(books: Book[], userId: string): Promise<StorageMode> {
    try {
      const response = await fetch(`${API_BASE}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, books })
      });
      if (response.ok) {
        this.mode = 'real';
        return 'real';
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn(`Storage Save API Error (${response.status}):`, errorData.details || errorData.error || 'Unknown error');
      }
    } catch (e: any) {
      console.error('Network error during save to Storage API:', e.message);
    }

    this.mode = 'simulated';
    const data = localStorage.getItem(STORAGE_KEY);
    let allBooks: Book[] = data ? JSON.parse(data) : [];
    allBooks = allBooks.filter(b => b.userId !== userId).concat(books);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allBooks));
    return 'simulated';
  },

  async updateChapter(bookId: string, chapterId: string, content: string, userId: string, title?: string): Promise<{ books: Book[], mode: StorageMode }> {
    const { books } = await this.getBooks(userId);
    const newBooks = books.map(book => {
      if (book.id === bookId) {
        return {
          ...book,
          chapters: book.chapters.map(ch => {
            if (ch.id === chapterId) {
              return { 
                ...ch, 
                content, 
                title: title || ch.title,
                wordCount: content.trim() ? content.trim().split(/\s+/).length : 0
              };
            }
            return ch;
          })
        };
      }
      return book;
    });
    const mode = await this.saveBooks(newBooks, userId);
    return { books: newBooks, mode };
  },

  async addChapter(bookId: string, userId: string): Promise<{ books: Book[], mode: StorageMode }> {
    const { books } = await this.getBooks(userId);
    const newBooks = books.map(book => {
      if (book.id === bookId) {
        const newChapter: Chapter = {
          id: `ch-${Date.now()}`,
          title: `New Chapter ${book.chapters.length + 1}`,
          content: '',
          wordCount: 0
        };
        return { ...book, chapters: [...book.chapters, newChapter] };
      }
      return book;
    });
    const mode = await this.saveBooks(newBooks, userId);
    return { books: newBooks, mode };
  },

  async addBook(title: string, userId: string): Promise<{ books: Book[], mode: StorageMode }> {
    const { books } = await this.getBooks(userId);
    const newBook: Book = {
      id: `book-${Date.now()}`,
      userId,
      title,
      author: 'Author',
      createdAt: Date.now(),
      chapters: [{
        id: `ch-${Date.now()}`,
        title: 'Chapter 1',
        content: '',
        wordCount: 0
      }]
    };
    const newBooks = [...books, newBook];
    const mode = await this.saveBooks(newBooks, userId);
    return { books: newBooks, mode };
  }
};
