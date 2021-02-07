import ControllerService from '../../services/controller.service';
import { Request, Response, NextFunction } from 'express';
import WebSocket, { CloseEvent, MessageEvent } from 'ws';

export class Controller {
  async controller(ws: WebSocket, req: Request, next: NextFunction) {
    try {
      await ControllerService.addWebsocket(ws, req.query.mac as string);
    } catch (err) {
      next(err);
    }
  }
}
export default new Controller();
