import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import getClientPromise from './_db.js';
import { authenticate } from './_auth.js';

// Stateless JSON-RPC 2.0 MCP endpoint. The Bearer token is the same short-lived
// account token used by the web app. OAuth discovery/consent is a later phase.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  const userId = authenticate(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required' });
  const { jsonrpc, id, method, params = {} } = req.body || {};
  if (jsonrpc !== '2.0' || !method) return res.status(400).json({ error: 'Invalid JSON-RPC' });
  const reply = (result: unknown) => res.status(200).json({ jsonrpc: '2.0', id, result });
  const error = (message: string, code = -32602) => res.status(200).json({ jsonrpc: '2.0', id, error: { code, message } });
  if (method === 'notifications/initialized') return res.status(202).end();
  if (method === 'initialize') return reply({ protocolVersion: '2025-03-26', serverInfo: { name: 'inkwell', version: '0.1.0' }, capabilities: { tools: {} } });
  const tools = [
    { name: 'list_books', description: 'List my book titles and IDs', inputSchema: { type: 'object', properties: {} } },
    { name: 'get_book_outline', description: 'Read the chapter outline of a book', inputSchema: { type: 'object', properties: { bookId: { type: 'string' } }, required: ['bookId'] } },
    { name: 'get_chapter', description: 'Read a specific chapter', inputSchema: { type: 'object', properties: { bookId: { type: 'string' }, chapterId: { type: 'string' } }, required: ['bookId', 'chapterId'] } },
    { name: 'list_ideas', description: 'Read a book idea inbox', inputSchema: { type: 'object', properties: { bookId: { type: 'string' } }, required: ['bookId'] } },
    { name: 'capture_idea', description: 'Save an unassigned thought verbatim to the idea inbox. Never rewrite the author original.', inputSchema: { type: 'object', properties: { bookId: { type: 'string' }, content: { type: 'string' }, title: { type: 'string' } }, required: ['bookId', 'content'] } }
  ];
  if (method === 'tools/list') return reply({ tools });
  if (method !== 'tools/call') return error('Unknown method', -32601);
  try {
    const client = await getClientPromise(), db = client.db(process.env.MONGODB_DB || undefined);
    const name = String(params.name || ''), args = params.arguments || {};
    const bookId = String(args.bookId || '');
    const books = db.collection('books');
    const format = (value: unknown) => ({ content: [{ type: 'text', text: JSON.stringify(value) }] });
    if (name === 'list_books') {
      const list = await books.find({ userId }).project({ _id: 0, id: 1, title: 1, author: 1 }).toArray();
      return reply(format(list));
    }
    const book = await books.findOne({ userId, id: bookId });
    if (!book) return error('Book not found');
    if (name === 'get_book_outline') return reply(format({ id: book.id, title: book.title, chapters: (book.chapters || []).map((c: any, index: number) => ({ id: c.id, title: c.title, order: index, wordCount: c.wordCount })) }));
    if (name === 'get_chapter') {
      const chapter = (book.chapters || []).find((c: any) => c.id === args.chapterId);
      return chapter ? reply(format(chapter)) : error('Chapter not found');
    }
    if (name === 'list_ideas') {
      const ideas = await db.collection('ideas').find({ userId, bookId }).project({ _id: 0 }).sort({ createdAt: -1 }).limit(500).toArray();
      return reply(format(ideas));
    }
    if (name === 'capture_idea') {
      const content = String(args.content || '').trim();
      if (!content || content.length > 20000) return error('Idea must be 1–20000 characters');
      const idea = { id: randomUUID(), userId, bookId, title: String(args.title || content.slice(0, 70)).slice(0, 160), content, status: 'inbox', tags: [], chapterIds: [], createdAt: Date.now(), updatedAt: Date.now() };
      await db.collection('ideas').insertOne(idea);
      return reply(format({ id: idea.id, title: idea.title, status: idea.status }));
    }
    return error('Unknown tool');
  } catch (e) { console.error('MCP error', e); return error('Internal server error', -32603); }
}
