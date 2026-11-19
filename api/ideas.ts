import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import getClientPromise from './_db.js';
import { authenticate } from './_auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const userId = authenticate(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required' });
  if (!['GET', 'POST', 'PATCH'].includes(req.method || '')) return res.status(405).json({ error: 'Method not allowed' });
  try {
    const client = await getClientPromise();
    const db = client.db(process.env.MONGODB_DB || undefined);
    const ideas = db.collection('ideas');
    const bookId = String(req.method === 'GET' ? req.query.bookId || '' : req.body?.bookId || '');
    if (!bookId) return res.status(400).json({ error: 'bookId is required' });
    const book = await db.collection('books').findOne({ id: bookId, userId });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    if (req.method === 'GET') {
      const items = await ideas.find({ userId, bookId }).sort({ createdAt: -1 }).limit(500).toArray();
      return res.status(200).json(items.map(({ _id, ...item }) => item));
    }
    if (req.method === 'POST') {
      const content = String(req.body?.content || '').trim();
      if (!content || content.length > 20000) return res.status(400).json({ error: 'Idea must be 1–20000 characters' });
      const title = String(req.body?.title || content.slice(0, 70)).trim().slice(0, 160);
      const idea = { id: randomUUID(), userId, bookId, title, content, status: 'inbox', tags: [], chapterIds: [], createdAt: Date.now(), updatedAt: Date.now() };
      await ideas.insertOne(idea);
      return res.status(201).json(idea);
    }
    const id = String(req.body?.id || '');
    const allowed = ['inbox', 'proposed', 'assigned', 'incorporated'];
    const status = String(req.body?.status || '');
    const chapterIds: string[] = req.body?.chapterIds;
    if (!id || !allowed.includes(status) || !Array.isArray(chapterIds) || chapterIds.some(x => typeof x !== 'string')) return res.status(400).json({ error: 'Invalid update' });
    const validIds = new Set((book.chapters as Array<{ id: string }>).map(c => c.id));
    if (chapterIds.some(id => !validIds.has(id))) return res.status(400).json({ error: 'Unknown chapter' });
    const result = await ideas.updateOne({ id, userId, bookId }, { $set: { status, chapterIds, updatedAt: Date.now() } });
    return result.matchedCount ? res.status(200).json({ success: true }) : res.status(404).json({ error: 'Idea not found' });
  } catch (error) {
    console.error('Ideas error', error);
    return res.status(500).json({ error: 'Unable to process ideas' });
  }
}
