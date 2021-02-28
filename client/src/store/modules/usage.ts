import api from '@/api';
import { Readings } from '@/types';
import { Module, VuexModule, Mutation, Action, MutationAction } from 'vuex-module-decorators'
import { usageModule } from "@/store/modules";

@Module({ name: "usage", namespaced: true })
export default class Usage extends VuexModule {
  private loadingTimer!: NodeJS.Timeout;

  readings: Readings = {};
  loading = false;
  loadErrors: string[] = [];
  to: Date = new Date();
  from: Date = new Date();

  @Mutation
  setFrom(value: Date) {
    this.from = value;
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
    }
    this.loadingTimer = setTimeout(() => {
      usageModule.loadUsage();
    }, 1000);
  }

  @Mutation
  setTo(value: Date) {
    this.to = value;
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
    }
    this.loadingTimer = setTimeout(() => {
      usageModule.loadUsage();
    }, 1000);
  }

  @Mutation
  setReadings(value: Readings) {
    this.readings = value;
  }

  @Mutation
  setLoading(value: boolean) {
    this.loading = value;
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
  async loadUsage() {
    if (this.loading) {
      return;
    }
    this.setLoading(true);
    this.clearLoadErrors();
    try {
      const readings = await api.getUsage(this.from, this.to);
      this.setReadings(readings);
    }
    catch (err) {
      this.addLoadError(err);
    }
    finally {
      this.setLoading(false);
    }
  }
}