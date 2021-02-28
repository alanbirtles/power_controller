import SchedulerService from '../../services/scheduler.service';
import { Request, Response, NextFunction } from 'express';
import WebSocket, { CloseEvent, MessageEvent } from 'ws';
import { HttpError } from '../../middlewares/error.handler';
import schedulerService from '../../services/scheduler.service';
import { Schedule } from '../../../common/types';

export class Controller {
  async all(req: Request, res: Response, next: NextFunction) {
    try {
      const schedules = await SchedulerService.all();
      res.json(schedules);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const schedule = await SchedulerService.add(req.body);
      await SchedulerService.init();
      res.json(schedule);
    } catch (err) {
      next(err);
    }
  }

  async byId(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params["id"]);
      const schedule = await SchedulerService.byId(id);
      res.json(schedule);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params["id"]);
      const removed = await SchedulerService.remove(id);
      if (removed) {
        await SchedulerService.init();
        res.status(204);
      } else {
        res.status(404);
      }
      res.send();
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const schedule: Schedule = req.body;
      await SchedulerService.update(schedule);
      await SchedulerService.init();
      res.status(204);
      res.send();
    } catch (err) {
      next(err);
    }
  }
}
export default new Controller();
