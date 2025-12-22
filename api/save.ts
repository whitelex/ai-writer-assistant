
import { VercelRequest, VercelResponse } from '@vercel/node';
import clientPromise from './_db';

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
    const db = client.db('inkwell');
    
    // We replace the user's entire collection of books for simplicity in this version
    // In a larger app, you'd update individual documents
    await db.collection('books').deleteMany({ userId });
    if (books.length > 0) {
      await db.collection('books').insertMany(books.map(b => ({ ...b, userId })));
    }
    
    return res.status(200).json({ success: true });
  } catch (e: any) {
    console.error('MongoDB Save Error:', e);
    return res.status(500).json({ error: e.message });
  }
}
