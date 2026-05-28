export class AppError extends Error {
  statusCode: number;
  details?: any;
  constructor(message: string, statusCode = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: any, _req: any, res: any, _next: any) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}

export default { AppError, errorHandler };
