import { Application } from 'express';
import powerRouter from './api/controllers/power/router'
import schedulerRouter from './api/controllers/scheduler/router'

export default function routes(app: Application): void {
  app.use('/api/v1/power', powerRouter);
  app.use('/api/v1/scheduler', schedulerRouter);
};