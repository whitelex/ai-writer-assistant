import type { VercelRequest, VercelResponse } from '@vercel/node';
import getClientPromise from './_db.js';
import { hashPassword, signToken } from './_auth.js';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.length < 12 || password.length > 1024)
    return res.status(400).json({ error: 'Valid email and password of at least 12 characters required' });
  try {
    const db = (await getClientPromise()).db(process.env.MONGODB_DB || undefined);
    const users = db.collection('users');
    const normalized = email.trim().toLowerCase();
    if (await users.findOne({ email: normalized })) return res.status(409).json({ error: 'Account already exists' });
    const result = await users.insertOne({ email: normalized, password: hashPassword(password), createdAt: new Date() });
    return res.status(201).json({ id: String(result.insertedId), email: normalized, token: signToken(String(result.insertedId)) });
  } catch (e) { console.error('Signup failed', e); return res.status(500).json({ error: 'Signup failed' }); }
}
