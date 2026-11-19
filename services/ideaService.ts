import { authService } from './authService';
import type { Idea } from '../types';
const request = async (method: string, body?: object, bookId?: string): Promise<any> => {
  const response = await fetch('/api/ideas' + (bookId ? '?bookId=' + encodeURIComponent(bookId) : ''), {
    method, headers: { 'Content-Type': 'application/json', ...authService.authHeaders() },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Idea request failed');
  return response.json();
};
export const ideaService = {
  list: (bookId: string): Promise<Idea[]> => request('GET', undefined, bookId),
  capture: (bookId: string, content: string, title?: string): Promise<Idea> => request('POST', { bookId, content, title }),
  assign: (bookId: string, id: string, status: Idea['status'], chapterIds: string[]): Promise<void> => request('PATCH', { bookId, id, status, chapterIds })
};
