import { createRouter, createWebHistory } from 'vue-router'

// 页面组件
const LoginPage = () => import('@/pages/LoginPage.vue')
const Dashboard = () => import('@/pages/Dashboard.vue')
const SubUsers = () => import('@/pages/SubUsers.vue')
const ReportPage = () => import('@/pages/ReportPage.vue')
const UserNumberRecords = () => import('@/pages/UserNumberRecords.vue')
const UserProjectLineStates = () => import('@/pages/userProjectLineStates.vue')
const MyQuota = () => import('@/pages/MyQuota.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginPage },
    { path: '/dashboard', component: Dashboard },
    { path: '/reseller/users', component: SubUsers, meta: { title: '下级管理' } },
    { path: '/reseller/my-quotas', component: MyQuota, meta: { title: '我的项目配额' } },
    { path: '/reseller/report', component: ReportPage, meta: { title: '数据报表' } },
    { path: '/reseller/records', component: UserNumberRecords, meta: { title: '下级用户取号记录' } },
    { path: '/reseller/user-line-stats', component: UserProjectLineStates, meta: { title: '用户取号线路统计' } }
  ]
})

// 登录拦截逻辑
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token') || localStorage.getItem('agent_token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
