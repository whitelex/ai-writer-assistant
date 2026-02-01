
import { VercelRequest, VercelResponse } from '@vercel/node';
import getClientPromise from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const client = await getClientPromise();
    const dbName = process.env.MONGODB_DB;
    const db = dbName ? client.db(dbName) : client.db();
    
    const user = await db.collection('users').findOne({ 
      email: email.toLowerCase(), 
      password: password 
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return res.status(200).json({ 
      id: user._id.toString(), 
      email: user.email 
    });
  } catch (e: any) {
    console.error('API [login] Error:', e.message);
    return res.status(500).json({ error: 'Authentication failed', details: e.message });
  }
}
