import { Application } from 'express';
import powerRouter from './api/controllers/power/router'

export default function routes(app: Application): void {
  app.use('/api/v1/power', powerRouter);
};