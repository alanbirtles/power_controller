import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Schedule from '../views/Schedule.vue'
import Usage from '../views/Usage.vue'

Vue.use(VueRouter)

export class Names {
  static readonly Schedule = "Schedule";
  static readonly Usage = "Usage";
}

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: Names.Schedule,
    component: Schedule
  },
  {
    path: '/usage',
    name: Names.Usage,
    component: Usage
  }
]

const router = new VueRouter({
  routes
})

export default router
