import L from '../../common/logger'
import { SchedulesTable, dbPool, dbQuery, dbSelect } from '../../common/db';
import { Schedule } from '../../common/types';
import { RowDataPacket } from 'mysql2/promise';
import ControllerService from './controller.service';

const selectScheduleFields = `
  ${SchedulesTable.id},
  UNIX_TIMESTAMP(${SchedulesTable.start}) as ${SchedulesTable.start},
  UNIX_TIMESTAMP(${SchedulesTable.end}) as ${SchedulesTable.end},
  ${SchedulesTable.interval},
  ${SchedulesTable.power},
  ${SchedulesTable.controller_ids}
  FROM ${SchedulesTable.table}`;
export const start = "start";
export const end = "end";
export const interval = "_interval";
export const power = "power";
export const controller_ids = "controller_ids";


export class SchedulerService {

  schedules: Schedule[] = [];
  timer: NodeJS.Timeout = null;
  runningSchedules = false;
  initPending = false;

  async init() {
    this.initPending = true;
    if (this.runningSchedules) {
      return;
    }
    this.schedules = await this.all();
    this.initPending = false;
    await this.processSchedules(true);
  }

  async add(schedule: Schedule): Promise<Schedule> {
    const connection = await dbPool.getConnection();
    try {
      const result = await dbQuery(connection, `INSERT INTO ${SchedulesTable.table} (
        ${SchedulesTable.start},
        ${SchedulesTable.end},
        ${SchedulesTable.interval},
        ${SchedulesTable.power},
        ${SchedulesTable.controller_ids}
        ) VALUES (FROM_UNIXTIME(?), FROM_UNIXTIME(?), ?, ?, ?)`, [
        schedule.start,
        schedule.end,
        schedule.interval,
        schedule.power,
        JSON.stringify(schedule.controllerIds)
      ]);
      return {
        scheduleId: result.insertId,
        start: schedule.start,
        end: schedule.end,
        interval: schedule.interval,
        power: schedule.power,
        controllerIds: schedule.controllerIds
      }
    } finally {
      connection.release();
    }
  }

  async byId(id: number): Promise<Schedule> {
    const connection = await dbPool.getConnection();
    try {
      const rows = await dbSelect(connection, `
        SELECT ${selectScheduleFields}
        WHERE ${SchedulesTable.id} = ?`, [id]);
      if (rows.length !== 1) {
        return null;
      }
      return this.getSchedule(rows[0]);
    } finally {
      connection.release();
    }
  }

  async remove(id: number): Promise<boolean> {
    const connection = await dbPool.getConnection();
    try {
      const result = await dbQuery(connection, `DELETE FROM ${SchedulesTable.table} WHERE ${SchedulesTable.id} = ?`, [id]);
      return result.affectedRows !== 0;
    } finally {
      connection.release();
    }
  }

  async update(schedule: Schedule): Promise<void> {
    const connection = await dbPool.getConnection();
    try {
      const result = await dbQuery(connection, `UPDATE ${SchedulesTable.table} SET
        ${SchedulesTable.start} = FROM_UNIXTIME(?),
        ${SchedulesTable.end} = FROM_UNIXTIME(?),
        ${SchedulesTable.interval} = ?,
        ${SchedulesTable.power} = ?,
        ${SchedulesTable.controller_ids} = ?
        WHERE ${SchedulesTable.id} = ?`, [
        schedule.start,
        schedule.end,
        schedule.interval,
        schedule.power,
        JSON.stringify(schedule.controllerIds),
        schedule.scheduleId
      ]);
    } finally {
      connection.release();
    }
  }

  async all(from: number = 0, limit: number = -1): Promise<Schedule[]> {
    const connection = await dbPool.getConnection();
    try {
      const rows = await dbSelect(connection, `
        SELECT ${selectScheduleFields}
        WHERE ${SchedulesTable.end} IS NULL
        OR ${SchedulesTable.end} > NOW()
        ORDER BY ${SchedulesTable.start} ASC
        LIMIT ?, ?`, [from, limit < 0 ? 0xFFFFFFFFFFFF : limit]);
      const result: Schedule[] = [];
      for (const row of rows) {
        result.push(this.getSchedule(row));
      }
      return result;
    } finally {
      connection.release();
    }
  }

  private getSchedule(row: RowDataPacket): Schedule {
    return {
      scheduleId: row[SchedulesTable.id],
      start: row[SchedulesTable.start],
      end: row[SchedulesTable.end],
      interval: row[SchedulesTable.interval],
      power: row[SchedulesTable.power] != 0,
      controllerIds: JSON.parse(row[SchedulesTable.controller_ids])
    }
  }

  private movePastTime(schedule: Schedule, time: number) {
    if (schedule.start < time) {
      const diff = time - schedule.start;
      const count = Math.floor(diff / (schedule.interval * 60))
      const newStart = schedule.start + count * schedule.interval * 60;
      L.info(`Altering schedule start time from ${new Date(schedule.start * 1000)} to ${new Date(newStart * 1000)}`);
      schedule.start = newStart;
    }
  }

  private async processSchedules(firstRun: boolean) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.runningSchedules || this.initPending) {
      return;
    }
    this.runningSchedules = true;
    try {
      const time = new Date().getTime() / 1000;
      if (firstRun) {
        for (const schedule of this.schedules) {
          this.movePastTime(schedule, time);
        }
      }
      this.schedules = this.schedules.filter((value) => {
        return !value.end || value.start < value.end;
      })
      for (const schedule of this.schedules) {
        if (schedule.start > time) {
          break;
        }
        for (const controller of schedule.controllerIds) {
          L.info(`scheduler setting power to ${schedule.power} for controller ${controller}`);
          await ControllerService.setPower(controller, schedule.power);
        }
        schedule.start = schedule.start + schedule.interval * 60;
      }
      this.schedules = this.schedules.filter((value) => {
        return !value.end || value.start < value.end;
      })
      this.schedules.sort((a, b) => {
        return a.start - b.start;
      });
      if (this.schedules.length > 0) {
        const timeout = this.schedules[0].start - time;
        L.info(`scheduler waiting for ${timeout / 60} minutes until ${new Date(this.schedules[0].start * 1000)}`);
        this.timer = setTimeout(() => { this.processSchedules(false); }, timeout * 1000);
      } else {
        L.info(`no scheduled tasks`);
      }
    } finally {
      this.runningSchedules = false;
      if (this.initPending) {
        await this.init();
      }
    }
  }
}

export default new SchedulerService();