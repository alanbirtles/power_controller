import express, { Application } from 'express';
import expressWs from 'express-ws';
import path from 'path';
import bodyParser from 'body-parser';
import http from 'http';
import os from 'os';
import cookieParser from 'cookie-parser';
import L from './logger';
import WebSocket from 'ws';
import cors from 'cors';

import installValidator from './openapi';
import { databaseInit } from './db';

const ews = expressWs(express());
const app = ews.app;
const exit = process.exit;

interface AliveWS extends WebSocket {
  isAlive: boolean;
}

export default class ExpressServer {
  private routes: (app: Application) => void;
  constructor() {
    const root = path.normalize(__dirname + '/../..');
    app.set('appPath', root + 'client');
    app.use(bodyParser.json({ limit: process.env.REQUEST_LIMIT || '100kb' }));
    app.use(bodyParser.urlencoded({ extended: true, limit: process.env.REQUEST_LIMIT || '100kb' }));
    app.use(bodyParser.text({ limit: process.env.REQUEST_LIMIT || '100kb' }));
    app.use(cookieParser(process.env.SESSION_SECRET));
    app.use(express.static(`${root}/public`));
    this.addWsHeartbeat(ews.getWss());
    if (process.env.NODE_ENV == 'development') {
      let allowedHeaders = ["X-Content-Range", "Content-Type"];
      app.use(cors({ exposedHeaders: allowedHeaders, allowedHeaders: allowedHeaders, credentials: true, origin: "*" }));
      L.info("CORS enabled");
    }
  }

  addWsHeartbeat(wss: WebSocket.Server) {
    wss.on('connection', (ws: AliveWS) => {
      ws.isAlive = true;
      ws.on('pong', () => ws.isAlive = true);
    });

    const interval = setInterval(() => {
      wss.clients.forEach((ws: AliveWS) => {
        if (ws.isAlive === false) {
          L.error(`websocket didn't respond to ping, closing`);
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping(undefined, undefined, (err) => {
          if (err) {
            L.error(`error sending ping to websocket ${err}`);
            ws.terminate();
          }
        });
      });
    }, 30000);
  }

  router(routes: (app: Application) => void): ExpressServer {
    this.routes = routes;
    return this;
  }

  listen(port: number): Application {
    const welcome = (p: number) => () =>
      L.info(
        `up and running in ${process.env.NODE_ENV ||
        'development'} @: ${os.hostname()} on port: ${p}}`
      );
    databaseInit().then(() => {
      installValidator(app, this.routes).then(() => {
        app.listen(port, welcome(port));
      }).catch(e => {
        L.error(e);
        exit(1)
      });
    });

    return app;
  }
}