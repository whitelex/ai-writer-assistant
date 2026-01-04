
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
    // Explicitly wait for connection with a timeout check
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB;
    const db = dbName ? client.db(dbName) : client.db();
    
    const books = await db.collection('books').find({ userId }).toArray();
    
    return res.status(200).json(books);
  } catch (e: any) {
    console.error('API [books] Error:', e.name, e.message);
    return res.status(500).json({ 
      error: 'Database connection failed', 
      details: e.message,
      code: e.code 
    });
  }
}
