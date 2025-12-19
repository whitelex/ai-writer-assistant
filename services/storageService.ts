
import { Book, Chapter } from '../types';

const STORAGE_KEY = 'inkwell_books_data';

// Note: In a real Vercel production environment, you would use:
// const MONGODB_URI = process.env.MONGODB_URI;
// And fetch from '/api/books'

export const storageService = {
  getBooks: async (): Promise<Book[]> => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const initial: Book[] = [{
        id: 'default-book',
        title: 'Untitled Masterpiece',
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
      return initial;
    }
    return JSON.parse(data);
  },

  saveBooks: async (books: Book[]): Promise<void> => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  },

  updateChapter: async (bookId: string, chapterId: string, content: string, title?: string): Promise<Book[]> => {
    const books = await storageService.getBooks();
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
    await storageService.saveBooks(newBooks);
    return newBooks;
  },

  addChapter: async (bookId: string): Promise<Book[]> => {
    const books = await storageService.getBooks();
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
    await storageService.saveBooks(newBooks);
    return newBooks;
  },

  addBook: async (title: string): Promise<Book[]> => {
    const books = await storageService.getBooks();
    const newBook: Book = {
      id: `book-${Date.now()}`,
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
    await storageService.saveBooks(newBooks);
    return newBooks;
  }
};
