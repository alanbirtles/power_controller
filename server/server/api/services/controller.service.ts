import L from '../../common/logger'
import WebSocket, { CloseEvent, MessageEvent } from 'ws';
import { ControllersTable, dbPool, dbQuery, dbSelect, ReadingsTable } from '../../common/db';

class Controller {
  constructor(id: number, mac: string, name: string, conversionFactor: number) {
    L.info("connected mac: " + mac)
    this.id = id;
    this.mac = mac;
    this.name = name;
    this.conversionFactor = conversionFactor;
  }

  setWs(ws: WebSocket) {
    if (this.ws) {
      this.ws.close();
    }
    this.ws = ws;
    this.ws.onclose = () => {
      if (this.ws == ws) {
        L.info(`websocket from ${this.mac} closed`);
        this.saveReadings();
        this.ws = null;
      }
    };
    this.ws.onmessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data as string);
      if (message.current) {
        this.addCurrent(message.current);
      }
    };
    this.setPower(this.power);
  }

  async addCurrent(reading: number) {
    const time = new Date();
    time.setSeconds(0, 0);
    if (this.readingCount !== 0 && time.valueOf() != this.readingTime.valueOf()) {
      L.info(`${time}, ${this.readingTime}`);
      this.saveReadings();
    }
    const current = this.conversionFactor * reading;
    this.readingCount++;
    this.readingTotal += current;
    this.readingMin = Math.min(this.readingMin, current);
    this.readingMax = Math.max(this.readingMax, current);
    this.readingTime = time;
  }

  async saveReadings() {
    if (this.readingCount !== 0) {
      const connection = await dbPool.getConnection()
      try {
        await dbQuery(connection, `INSERT INTO ${ReadingsTable.table} (
            ${ReadingsTable.controller_id},
            ${ReadingsTable.time},
            ${ReadingsTable.avg},
            ${ReadingsTable.min},
            ${ReadingsTable.max}
            ) VALUES (?, ?, ?, ?, ?)`, [
          this.id,
          this.readingTime,
          this.readingTotal / this.readingCount,
          this.readingMin,
          this.readingMax]);
        this.readingCount = 0;
        this.readingTotal = 0;
        this.readingMax = 0;
        this.readingMin = 0xFFFF;
      }
      finally {
        connection.release();
      }
    }
  }

  setPower(value: boolean) {
    this.power = value;
    this.ws.send(JSON.stringify({ power: this.power }));
  }

  id: number;
  mac: string;
  name: string;
  conversionFactor: number;
  ws: WebSocket = null;
  power = true;

  readingMax: number = 0;
  readingMin: number = 0xFFFF;
  readingTotal: number = 0;
  readingCount: number = 0;
  readingTime: Date;
}

export class ControllerService {
  controllers: { [id: number]: Controller } = {};

  async addWebsocket(ws: WebSocket, mac: string) {
    const controller = await this.getController(mac);
    controller.setWs(ws);
  }

  async getController(mac: string): Promise<Controller> {
    const connection = await dbPool.getConnection()
    try {
      const result = await dbSelect(connection, `SELECT * FROM ${ControllersTable.table} WHERE ${ControllersTable.mac} = ?`, [mac]);
      if (result.length === 0) {
        const result = await dbQuery(connection, `INSERT INTO ${ControllersTable.table} (
          ${ControllersTable.mac},
          ${ControllersTable.name},
          ${ControllersTable.conversion_factor})
          VALUES (?, ?, ?)`, [mac, "New", 1]);
        const id = result.insertId;
        const controller = new Controller(id, mac, "New", 1);
        this.controllers[id] = controller;
        return controller;
      }
      else {
        const id = result[0][ControllersTable.id];
        let controller = this.controllers[id];
        if (!controller) {
          controller = new Controller(id, mac, result[0][ControllersTable.name], result[0][ControllersTable.conversion_factor]);
          this.controllers[id] = controller;
        }
        return controller;
      }
    }
    finally {
      connection.release();
    }
  }

}

export default new ControllerService();