
export interface Chapter {
  id: string;
  title: string;
  content: string;
  wordCount: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  createdAt: number;
  chapters: Chapter[];
}

export interface AIResult {
  original: string;
  suggestion: string;
}
