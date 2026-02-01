
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
    
    // Check if user exists
    const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'A writer with this email already exists' });
    }

    const newUser = {
      email: email.toLowerCase(),
      password, // In a production app, use bcrypt to hash this
      createdAt: new Date(),
    };

    const result = await db.collection('users').insertOne(newUser);
    
    return res.status(201).json({ 
      id: result.insertedId.toString(), 
      email: newUser.email 
    });
  } catch (e: any) {
    console.error('API [signup] Error:', e.message);
    return res.status(500).json({ error: 'Failed to create account', details: e.message });
  }
}
