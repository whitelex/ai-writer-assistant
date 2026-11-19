import type { VercelRequest } from '@vercel/node';
import { createHmac, randomBytes, pbkdf2Sync, timingSafeEqual } from 'node:crypto';

const secret = () => {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) throw new Error('AUTH_SECRET must be at least 32 characters');
  return process.env.AUTH_SECRET;
};
const encode = (data: object) => Buffer.from(JSON.stringify(data)).toString('base64url');
export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  return `pbkdf2:${salt}:${pbkdf2Sync(password, salt, 210000, 32, 'sha256').toString('hex')}`;
};
export const verifyPassword = (password: string, stored: string) => {
  if (stored.startsWith('pbkdf2:')) {
    const [, salt, hash] = stored.split(':');
    if (!salt || !/^[0-9a-f]{64}$/.test(hash || '')) return false;
    return timingSafeEqual(Buffer.from(hash, 'hex'), pbkdf2Sync(password, salt, 210000, 32, 'sha256'));
  }
  // Legacy plaintext passwords are upgraded to a hash after successful login.
  const a = Buffer.from(password), b = Buffer.from(stored);
  return a.length === b.length && timingSafeEqual(a, b);
};
export const signToken = (userId: string) => {
  const payload = encode({ sub: userId, exp: Math.floor(Date.now() / 1000) + 86400 * 7 });
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
};
export const authenticate = (req: VercelRequest): string | null => {
  const bearer = /^Bearer (\S+)$/i.exec(String(req.headers.authorization || ''));
  if (!bearer) return null;
  const [payload, signature] = bearer[1].split('.');
  if (!payload || !signature) return null;
  const expected = createHmac('sha256', secret()).update(payload).digest('base64url');
  const a = Buffer.from(signature), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof data.sub === 'string' && data.exp > Date.now() / 1000 ? data.sub : null;
  } catch { return null; }
};
