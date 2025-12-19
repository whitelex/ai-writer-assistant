
export type StorageMode = 'real' | 'simulated';

export interface User {
  id: string;
  email: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  wordCount: number;
}

export interface Book {
  id: string;
  userId: string; // Scoped to a specific user
  title: string;
  author: string;
  createdAt: number;
  chapters: Chapter[];
}

export interface AIResult {
  original: string;
  suggestion: string;
}
