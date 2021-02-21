import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Home from '../views/Home.vue'
import Usage from '../views/Usage.vue'

Vue.use(VueRouter)

export class Names {
  static readonly Home = "Home";
  static readonly Usage = "Usage";
}

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: Names.Home,
    component: Home
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
