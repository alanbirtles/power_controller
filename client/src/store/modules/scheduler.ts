import api from '@/api';
import { Schedule } from '@/types';
import { Module, VuexModule, Mutation, Action, MutationAction } from 'vuex-module-decorators'

@Module({ name: "scheduler", namespaced: true })
export default class Scheduler extends VuexModule {
  private loadingTimer!: NodeJS.Timeout;

  schedules: Schedule[] = [];
  loading = false;
  loadErrors: string[] = [];

  @Mutation
  setLoading(value: boolean) {
    this.loading = value;
  }

  @Mutation
  setSchedules(values: Schedule[]) {
    this.schedules = values;
    this.loading = false;
  }

  @Mutation
  addLoadError(err: any) {
    this.loadErrors.push(err);
  }

  @Mutation
  clearLoadErrors() {
    this.loadErrors = [];
  }

  @Action
  async loadSchedules() {
    if (this.loading) {
      return;
    }
    this.setLoading(true);
    this.clearLoadErrors();
    try {
      const schedules = await api.getSchedules();
      this.setSchedules(schedules);
    }
    catch (err) {
      this.addLoadError(err);
    }
    finally {
      this.setLoading(false);
    }
  }

  @Action
  async save(value: Schedule) {
    try {
      if (value.scheduleId !== null) {
        await api.updateSchedule(value);
      } else {
        await api.addSchedule(value);
      }
      this.loadSchedules();
    }
    catch (err) {
      console.error(err);
    }
  }

  @Action
  async deleted(id: number) {
    try {
      await api.deleteSchedule(id);
      this.loadSchedules();
    }
    catch (err) {
      console.error(err);
    }
  }
}