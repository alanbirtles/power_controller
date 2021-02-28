import api from '@/api';
import { Controller } from '@/types';
import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'

@Module({ name: "controller", namespaced: true })
export default class ControllerModule extends VuexModule {
  controllers: Controller[] = [];
  loading = false;
  loadErrors: string[] = [];

  @Mutation
  setControllers(value: Controller[]) {
    this.controllers = value;
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
  async loadControllers() {
    if (this.loading) {
      return;
    }
    this.setLoading(true);
    this.clearLoadErrors();
    try {
      const controllers = await api.getControllers();
      this.setControllers(controllers);
    }
    catch (err) {
      this.addLoadError(err);
    }
    finally {
      this.setLoading(false);
    }
  }
}