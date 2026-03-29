import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/index'
  },
  {
    path: '/index',
    name: 'Index',
    component: () => import('@/pages/index/index.vue'),
    meta: { title: '首页', icon: '🏠' }
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('@/pages/stats/stats.vue'),
    meta: { title: '统计', icon: '📊' }
  },
  {
    path: '/record',
    name: 'Record',
    component: () => import('@/pages/record/record.vue'),
    meta: { title: '补录', icon: '➕' }
  },
  {
    path: '/exchange',
    name: 'Exchange',
    component: () => import('@/pages/exchange/exchange.vue'),
    meta: { title: '兑换', icon: '🎁' }
  },
  {
    path: '/mine',
    name: 'Mine',
    component: () => import('@/pages/mine/mine.vue'),
    meta: { title: '我的', icon: '👤' }
  },
  {
    path: '/rule/list',
    name: 'RuleList',
    component: () => import('@/pages/rule/list.vue'),
    meta: { title: '规则管理' }
  },
  {
    path: '/rule/edit',
    name: 'RuleEdit',
    component: () => import('@/pages/rule/edit.vue'),
    meta: { title: '编辑规则' }
  },
  {
    path: '/reward/form',
    name: 'RewardForm',
    component: () => import('@/pages/reward/form.vue'),
    meta: { title: '兑换商品' }
  },
  {
    path: '/reward/list',
    name: 'RewardList',
    component: () => import('@/pages/reward/list.vue'),
    meta: { title: '兑换商品管理' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
