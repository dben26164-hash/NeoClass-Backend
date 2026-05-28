import type { NextFunction, Request, Response } from 'express-serve-static-core';
import * as authService from '../services/auth.service';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization as string | undefined;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  const payload = authService.verifyToken(token);
  if (!payload || !payload.sub) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const user = await authService.getUserById(payload.sub);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  (req as any).user = user;
  next();
}

export function authorizeRoles(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !user.role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
