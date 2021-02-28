import ControllerService from '../../services/controller.service';
import { Request, Response, NextFunction } from 'express';
import WebSocket, { CloseEvent, MessageEvent } from 'ws';
import { HttpError } from '../../middlewares/error.handler';

export class Controller {
  async controller(ws: WebSocket, req: Request, next: NextFunction) {
    try {
      await ControllerService.addWebsocket(ws, req.query.mac as string);
    } catch (err) {
      next(err);
    }
  }

  async usage(req: Request, res: Response, next: NextFunction) {
    try {
      const from = parseInt(req.query["from"] as string);
      const to = parseInt(req.query["to"] as string);
      if (!from || !to) {
        throw HttpError.BadRequest("from and to required");
      }
      let controller = undefined;
      if (req.query["controller"] !== undefined) {
        controller = parseInt(req.query["controller"] as string);
        if (isNaN(controller)) {
          controller = undefined;
        }
      }
      const usage = await ControllerService.getUsage(from, to, controller);
      res.json(usage);
    } catch (err) {
      next(err);
    }
  }

  async all(req: Request, res: Response, next: NextFunction) {
    try {
      const controllers = await ControllerService.all();
      res.json(controllers);
    } catch (err) {
      next(err);
    }
  }
}
export default new Controller();
