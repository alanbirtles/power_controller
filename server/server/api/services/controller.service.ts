import L from '../../common/logger'
import WebSocket, { CloseEvent, MessageEvent } from 'ws';
import { ControllersTable, dbPool, dbQuery, dbSelect, ReadingsTable } from '../../common/db';
import { Readings, Controller } from '../../common/types';

class ControllerImpl {
  constructor(id: number, mac: string, name: string, conversionFactor: number) {
    this.id = id;
    this.mac = mac;
    this.name = name;
    this.conversionFactor = conversionFactor;
  }

  setWs(ws: WebSocket) {
    L.info("connected mac: " + this.mac)
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
    if (this.ws) {
      this.ws.send(JSON.stringify({ power: this.power }));
    }
  }

  id: number;
  mac: string;
  name: string;
  /**
    * reading to milliamps
    * sensor outputs 100mV/Amp
    * divided by resistors r1 and r2 where r1 is approx 2 * r2
    * reading is 0-2^12 for 0-3.3v
    * reading * conversion factor = value in mA
    * conversion factor = 3.3*10000*(r1+r2)/r1/4096
    */
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
  controllers: { [id: number]: ControllerImpl } = {};

  async addWebsocket(ws: WebSocket, mac: string) {
    const controller = await this.getController(mac);
    controller.setWs(ws);
  }

  async getController(mac: string): Promise<ControllerImpl> {
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
        const controller = new ControllerImpl(id, mac, "New", 1);
        this.controllers[id] = controller;
        return controller;
      }
      else {
        const id = result[0][ControllersTable.id];
        let controller = this.controllers[id];
        if (!controller) {
          controller = new ControllerImpl(id, mac, result[0][ControllersTable.name], result[0][ControllersTable.conversion_factor]);
          this.controllers[id] = controller;
        }
        return controller;
      }
    } finally {
      connection.release();
    }
  }

  async setPower(id: number, power: boolean) {
    let controller = this.controllers[id];
    if (!controller) {
      const connection = await dbPool.getConnection()
      try {
        const result = await dbSelect(connection, `SELECT * FROM ${ControllersTable.table} WHERE ${ControllersTable.id} = ?`, [id]);
        controller = new ControllerImpl(id, result[0][ControllersTable.mac], result[0][ControllersTable.name], result[0][ControllersTable.conversion_factor]);
      } finally {
        connection.release();
      }
      this.controllers[id] = controller;
    }
    controller.setPower(power);
  }

  async getUsage(from: number, to: number, controller?: number): Promise<Readings> {
    const connection = await dbPool.getConnection()
    try {
      let query = `SELECT * FROM ${ControllersTable.table}`;
      const params = [];
      if (controller !== undefined) {
        query += ` WHERE ${ControllersTable.id} = ?`;
        params.push(controller);
      }
      let queryResult = await dbSelect(connection, query, params);
      const result: Readings = {};
      for (const row of queryResult) {
        result[row[ControllersTable.id]] = { name: row[ControllersTable.name] as string, values: [] };
      }
      query = `SELECT ${ReadingsTable.controller_id},
        ${ReadingsTable.min},
        ${ReadingsTable.max},
        ${ReadingsTable.avg},
        UNIX_TIMESTAMP(${ReadingsTable.time}) as ${ReadingsTable.time}
        FROM ${ReadingsTable.table}
        WHERE ${ReadingsTable.time} >= FROM_UNIXTIME(?)
        AND ${ReadingsTable.time} < FROM_UNIXTIME(?)
        ORDER BY ${ReadingsTable.time} ASC`;
      queryResult = await dbSelect(connection, query, [from, to]);
      for (const row of queryResult) {
        result[row[ReadingsTable.controller_id]].values.push({
          min: row[ReadingsTable.min],
          max: row[ReadingsTable.max],
          avg: row[ReadingsTable.avg],
          time: row[ReadingsTable.time]
        });
      }
      return result;
    } finally {
      connection.release();
    }
  }

  async all(): Promise<Controller[]> {
    const connection = await dbPool.getConnection()
    try {
      let query = `SELECT * FROM ${ControllersTable.table}`;
      let queryResult = await dbSelect(connection, query);
      const result: Controller[] = [];
      for (const row of queryResult) {
        result.push({ name: row[ControllersTable.name], controllerId: row[ControllersTable.id] });
      }
      return result;
    } finally {
      connection.release();
    }
  }

}

export default new ControllerService();