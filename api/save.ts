
import { VercelRequest, VercelResponse } from '@vercel/node';
import getClientPromise from './_db.js';
import { authenticate } from './_auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = authenticate(req);
  res.setHeader('Cache-Control', 'no-store');
  if (!userId) return res.status(401).json({ error: 'Authentication required' });
  const { books } = req.body || {};

  if (!Array.isArray(books) || books.length > 100) {
    return res.status(400).json({ error: 'Valid books array required' });
  }

  try {
    const client = await getClientPromise();
    const dbName = process.env.MONGODB_DB;
    const db = dbName ? client.db(dbName) : client.db();
    
    // Safety check: Never proceed if books is suspiciously empty and user is valid
    // (Optional but good practice)
    
    // Use surgical updates (bulkWrite) instead of destructive deleteMany
    if (books.length > 0) {
      if (books.some((book: any) => !book || typeof book.id !== 'string' || !Array.isArray(book.chapters) || book.chapters.some((ch: any) => typeof ch.id !== 'string' || typeof ch.content !== 'string'))) return res.status(400).json({ error: 'Invalid book data' });
      const operations = books.map((book: any) => {
        const { _id, ...rest } = book;
        return {
          replaceOne: {
            filter: { id: book.id, userId }, // Ensure we match by unique local ID AND userId
            replacement: { ...rest, userId },
            upsert: true
          }
        };
      });
      
      await db.collection('books').bulkWrite(operations);
    } else {
      // If the books array is empty, we only delete if specifically instructed.
      // For now, let's assume an empty array means "delete all" BUT with safety.
      // In a real app, you'd have a specific "delete book" endpoint.
      // await db.collection('books').deleteMany({ userId });
    }
    
    return res.status(200).json({ success: true });
  } catch (e: any) {
    console.error('API [save] Error:', e.name, e.message);
    return res.status(500).json({ 
      error: 'Database operation failed', 
      details: e.message,
      code: e.code
    });
  }
}
