import { Request, Response, NextFunction } from 'express';
import L from '../../common/logger';

export class HttpError extends Error {
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }

  status: number;

  static BadRequest(message: string) {
    return new HttpError(message, 400);
  }
}

// eslint-disable-next-line no-unused-vars, no-shadow
export default function errorHandler(err: { errors?: { message: string; }[]; message?: string; status?: number; }, req: Request, res: Response, next: NextFunction) {
  const errors = err.errors || [{ message: err.message }];
  res.status(err.status || 500).json({ errors })
  L.error(errors);
}

