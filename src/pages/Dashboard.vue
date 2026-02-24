<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="dashboard-page">
    <div class="top-bar">
      <div class="left-title">代理控制面板</div>

      <div class="right-actions">
        <el-button type="primary" size="small" plain @click="handleUser">
          用户端入口
        </el-button>

        <el-button type="danger" size="small" @click="confirmLogout">
          退出登录
        </el-button>
      </div>
    </div>

    <NoticeBar />

    <div class="stat-section">
      <el-card class="stat-item" v-for="(item, index) in stats" :key="index" shadow="hover">
        <div class="stat-content">
          <div class="icon" :class="`icon-${index}`">
            <i :class="item.icon"></i>
          </div>
          <div class="stat-text">
            <div class="stat-title">{{ item.title }}</div>
            <div class="stat-value">{{ item.value }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <el-card class="quick-entry" shadow="hover">
      <div class="quick-title">功能入口</div>
      <div class="quick-buttons">
        <el-button
          v-for="(btn, i) in quickBtns"
          :key="i"
          class="quick-btn"
          type="primary"
          plain
          size="large"
          @click="router.push(btn.path)"
        >
          {{ btn.label }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import NoticeBar from '@/components/NoticeBar.vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { getAgentDashboard } from '@/api/agent'

const router = useRouter()

const quickBtns = ref([
  { label: '下级管理', path: '/reseller/users' },
  { label: '我的项目配额', path: '/reseller/my-quotas' },
  { label: '取号记录', path: '/reseller/records' },
  { label: '用户取号线路统计', path: '/reseller/user-line-stats' },
  { label: '数据报表', path: '/reseller/report' }
])

function confirmLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '退出确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('agent_token')
      localStorage.removeItem('agent_user')
      ElMessage.success('已退出登录')
      router.push('/login')
    })
    .catch(() => {})
}

const stats = ref([])

const handleUser = () => {
  if (typeof window !== 'undefined') {
    window.location.href = 'https://www.huikecode.com/'
  }
}

// 加载代理首页统计，统一改为配额口径展示。
async function loadDashboard() {
  try {
    const res = await getAgentDashboard()
    if (res.ok) {
      stats.value = [
        { title: '我的总配额', value: Number(res.data.myBalance || 0), icon: 'el-icon-wallet' },
        { title: '下级总数', value: Number(res.data.totalSubUsers || 0), icon: 'el-icon-user' },
        { title: '下级回码率（24h）', value: `${res.data.subUsersCodeRate || 0}%`, icon: 'el-icon-pie-chart' }
      ]
    } else {
      ElMessage.error(res.message || '获取仪表盘数据失败')
    }
  } catch (error) {
    console.error('加载仪表盘失败:', error)
    ElMessage.error('网络异常')
  }
}

onMounted(() => loadDashboard())
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: linear-gradient(145deg, #f0f4ff, #ffffff);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.left-title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.right-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.stat-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  padding: 10px 0;
}

.stat-item {
  border-radius: 18px;
  transition: all 0.3s ease;
  padding: 26px 28px;
  height: 140px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.stat-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 18px;
  height: 100%;
}

.icon {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28px;
  flex-shrink: 0;
}

.icon-0 { background: linear-gradient(45deg, #409eff, #66b1ff); }
.icon-1 { background: linear-gradient(45deg, #67c23a, #85ce61); }
.icon-2 { background: linear-gradient(45deg, #f56c6c, #f78989); }

.stat-title {
  font-size: 15px;
  color: #666;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-top: 6px;
}

.quick-entry {
  border-radius: 16px;
  padding: 24px;
  text-align: center;
}

.quick-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.quick-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.quick-btn {
  min-width: 140px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.quick-btn:hover {
  transform: scale(1.05);
}
</style>
