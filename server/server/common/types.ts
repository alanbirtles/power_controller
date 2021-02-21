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