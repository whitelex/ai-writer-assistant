
import { VercelRequest, VercelResponse } from '@vercel/node';
import clientPromise from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, books } = req.body;

  if (!userId || !Array.isArray(books)) {
    return res.status(400).json({ error: 'userId and books array are required' });
  }

  try {
    const client = await clientPromise;
    // If MONGODB_DB is not set, client.db() uses the database from the connection string
    const db = process.env.MONGODB_DB ? client.db(process.env.MONGODB_DB) : client.db();
    
    // Simple sync strategy: replace user's books
    await db.collection('books').deleteMany({ userId });
    if (books.length > 0) {
      // Ensure we don't carry over MongoDB _id if it's already present in the incoming data
      const booksToInsert = books.map(({ _id, ...b }: any) => ({ ...b, userId }));
      await db.collection('books').insertMany(booksToInsert);
    }
    
    return res.status(200).json({ success: true });
  } catch (e: any) {
    console.error('MongoDB Save Error:', e);
    return res.status(500).json({ error: e.message || 'Internal Server Error' });
  }
}
