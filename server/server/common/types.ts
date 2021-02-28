export interface Controller {
  controllerId: number,
  name: string,
}

export interface Readings {
  [controllerId: number]: {
    name: string,
    values: {
      time: number,
      min: number,
      max: number,
      avg: number
    }[]
  }
}

export interface Schedule {
  scheduleId: number | null;
  start: number;
  end: number | null;
  interval: number;
  power: boolean;
  controllerIds: number[];
}