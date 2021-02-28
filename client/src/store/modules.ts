import { Store } from 'vuex'
import { getModule } from 'vuex-module-decorators'
import Usage from '@/store/modules/usage'
import Scheduler from '@/store/modules/scheduler'
import Controller from '@/store/modules/controller'

// Each store is the singleton instance of its module class
// Use these -- they have methods for state/getters/mutations/actions
// (result from getModule(...))
export let usageModule: Usage;
export let schedulerModule: Scheduler;
export let controllerModule: Controller;

// initializer plugin: sets up state/getters/mutations/actions for each store
export function initializeStores(store: Store<any>): void {
  usageModule = getModule(Usage, store);
  schedulerModule = getModule(Scheduler, store);
  controllerModule = getModule(Controller, store);
}

export const modules = {
  'usage': Usage,
  'scheduler': Scheduler,
  'controller': Controller,
}