import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: err.flatten() });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  const prismaCode = (err as { code?: string })?.code;
  if (prismaCode === 'P2002') {
    return res.status(409).json({ error: 'A record with these unique fields already exists' });
  }
  if (prismaCode === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}
