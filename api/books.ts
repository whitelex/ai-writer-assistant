
import { VercelRequest, VercelResponse } from '@vercel/node';
import clientPromise from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const client = await clientPromise;
    // If MONGODB_DB is not set, client.db() uses the database from the connection string
    const db = process.env.MONGODB_DB ? client.db(process.env.MONGODB_DB) : client.db();
    const books = await db.collection('books').find({ userId }).toArray();
    
    return res.status(200).json(books);
  } catch (e: any) {
    console.error('MongoDB Fetch Error:', e);
    return res.status(500).json({ error: e.message || 'Internal Server Error' });
  }
}
