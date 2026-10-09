import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, type DBUser } from './db.ts';

interface Session {
  token: string;
  userId: string;
  email: string;
  role: 'owner' | 'admin';
  expiresAt: number;
}

const sessions = new Map<string, Session>();

// Session timeout: 8 hours
const SESSION_DURATION = 8 * 60 * 60 * 1000;

export function createSession(user: DBUser): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_DURATION;
  
  sessions.set(token, {
    token,
    userId: user.id,
    email: user.email,
    role: user.role,
    expiresAt
  });

  return token;
}

export function revokeSession(token: string): boolean {
  return sessions.delete(token);
}

export function getSession(token: string): Session | null {
  const session = sessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }

  return session;
}

export interface AuthenticatedRequest extends Request {
  user?: DBUser;
  sessionToken?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : (req.cookies?.admin_token as string | undefined);

  if (!token) {
    res.status(401).json({ success: false, message: 'غير مصرح بالدخول: يلزم تسجيل الدخول كمالك أو مدير' });
    return;
  }

  const session = getSession(token);
  if (!session) {
    res.status(401).json({ success: false, message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً' });
    return;
  }

  const user = db.getUser(session.userId);
  if (!user || !user.isActive) {
    res.status(403).json({ success: false, message: 'الحساب غير موجود أو تم تعطيله من قبل المالك' });
    return;
  }

  req.user = user;
  req.sessionToken = token;
  next();
}

export function requireOwner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'owner') {
      res.status(403).json({ success: false, message: 'عذراً، هذا الإجراء مخصص لحساب المالك الأساسي (Owner) فقط' });
      return;
    }
    next();
  });
}
