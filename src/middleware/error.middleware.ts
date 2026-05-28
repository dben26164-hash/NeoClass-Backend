import type { NextFunction, Request, Response } from 'express-serve-static-core';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err && err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details });
  }

  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}

export default { errorHandler };
