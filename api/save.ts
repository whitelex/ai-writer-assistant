import { VercelRequest, VercelResponse } from '@vercel/node';
import getClientPromise from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, books } = req.body;

  if (!userId || !Array.isArray(books)) {
    return res.status(400).json({ error: 'userId and books array are required' });
  }

  try {
    const client = await getClientPromise();
    const dbName = process.env.MONGODB_DB;
    const db = dbName ? client.db(dbName) : client.db();
    
    // Replace user's books
    await db.collection('books').deleteMany({ userId });
    if (books.length > 0) {
      const booksToInsert = books.map(({ _id, ...b }: any) => {
        const { _id: id, ...rest } = b;
        return { ...rest, userId };
      });
      await db.collection('books').insertMany(booksToInsert);
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