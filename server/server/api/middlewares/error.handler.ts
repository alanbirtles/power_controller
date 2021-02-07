import { Request, Response, NextFunction } from 'express';
import L from '../../common/logger';

// eslint-disable-next-line no-unused-vars, no-shadow
export default function errorHandler(err: { errors?: { message: string; }[]; message?: string; status?: number; }, req: Request, res: Response, next: NextFunction) {
  const errors = err.errors || [{ message: err.message }];
  res.status(err.status || 500).json({ errors })
  L.error(errors);
}

