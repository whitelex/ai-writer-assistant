import type { VercelRequest, VercelResponse } from '@vercel/node';
import getClientPromise from './_db.js';
import { signToken, verifyPassword, hashPassword } from './_auth.js';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Email and password required' });
  try {
    const db = (await getClientPromise()).db(process.env.MONGODB_DB || undefined);
    const users = db.collection('users');
    const user = await users.findOne({ email: email.trim().toLowerCase() });
    if (!user || typeof user.password !== 'string' || !verifyPassword(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.password.startsWith('pbkdf2:')) await users.updateOne({ _id: user._id, password: user.password }, { $set: { password: hashPassword(password) } });
    return res.status(200).json({ id: String(user._id), email: user.email, token: signToken(String(user._id)) });
  } catch (e) { console.error('Login failed', e); return res.status(500).json({ error: 'Login failed' }); }
}
