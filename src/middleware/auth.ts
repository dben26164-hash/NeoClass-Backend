import authService from '../services/authService';

export async function authenticate(req: any, res: any, next: any) {
  const auth = (req.headers as any).authorization;
  if (!auth || !(auth as string).startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  const token = (auth as string).slice('Bearer '.length);
  const payload = authService.verifyToken(token);
  if (!payload || !payload.sub) return res.status(401).json({ error: 'Invalid token' });

  // attach user id to request
  (req as any).userId = payload.sub;
  const user = await authService.getUserById(payload.sub);
  (req as any).user = user;

  next();
}

export function authorizeRoles(allowed: string[]) {
  return (req: any, res: any, next: any) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!allowed.includes(user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

export default { authenticate, authorizeRoles };
