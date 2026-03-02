import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload { userId: string; email: string; }

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = req.user as any;
  if (req.isAuthenticated && req.isAuthenticated() && user?.claims?.sub) {
    (req as any).userId = user.dbUserId || user.claims.sub;
    (req as any).email = user.claims.email;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    (req as any).userId = payload.userId;
    (req as any).email = payload.email;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
