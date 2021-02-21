import { Store } from 'vuex'
import { getModule } from 'vuex-module-decorators'
import Usage from '@/store/modules/usage'

// Each store is the singleton instance of its module class
// Use these -- they have methods for state/getters/mutations/actions
// (result from getModule(...))
export let usageModule: Usage;

// initializer plugin: sets up state/getters/mutations/actions for each store
export function initializeStores(store: Store<any>): void {
  usageModule = getModule(Usage, store);
}

export const modules = {
  'usage': Usage,
}