import Vue from 'vue'
import Vuex from 'vuex'
import { initializeStores, modules } from './modules'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
  },
  mutations: {
  },
  actions: {
  },
  plugins: [
    initializeStores
  ],
  modules
})
