<template>
  <div class="my-quota-page">
    <div class="top-row">
      <el-button type="info" size="small" @click="goBack">返回</el-button>
      <h2>我的项目线路配额</h2>
    </div>

    <el-card shadow="hover" class="filter-card">
      <el-form inline>
        <el-form-item label="项目">
          <el-select
            v-model="filters.projectId"
            placeholder="全部项目"
            clearable
            filterable
            style="width: 260px"
            @change="handleProjectChange"
          >
            <el-option
              v-for="item in projectOptions"
              :key="item.projectId"
              :label="`[${item.projectId}] ${item.projectName}`"
              :value="item.projectId"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="线路">
          <el-select
            v-model="filters.lineId"
            placeholder="全部线路"
            clearable
            filterable
            style="width: 280px"
            :disabled="!filters.projectId"
          >
            <el-option
              v-for="item in lineOptions"
              :key="`${item.projectId}_${item.lineId}`"
              :label="`[${item.lineId}] ${item.lineName || item.projectName || '未命名线路'}`"
              :value="String(item.lineId)"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="loadQuotas">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover">
      <div class="summary-row">
        <div>线路总数：{{ quotaList.length }}</div>
        <div>总剩余配额：{{ totalQuota }}</div>
      </div>

      <el-table :data="quotaList" border stripe v-loading="loading">
        <el-table-column prop="projectId" label="项目ID" width="120" align="center" />
        <el-table-column prop="projectName" label="项目名称" min-width="180" />
        <el-table-column prop="lineId" label="线路ID" width="120" align="center" />
        <el-table-column prop="lineName" label="线路名称" min-width="180" />
        <el-table-column prop="availableCount" label="剩余配额" width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="Number(row.availableCount) > 0 ? 'success' : 'danger'">
              {{ Number(row.availableCount || 0) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getAgentMyQuotas, getProjectList } from '@/api/agent'

const router = useRouter()
const loading = ref(false)

const filters = ref({
  projectId: '',
  lineId: ''
})

const projectLineOptions = ref([])
const quotaList = ref([])

const projectOptions = computed(() => {
  const map = new Map()
  projectLineOptions.value.forEach(item => {
    if (!map.has(item.projectId)) {
      map.set(item.projectId, {
        projectId: item.projectId,
        projectName: item.projectName || '未命名项目'
      })
    }
  })
  return Array.from(map.values())
})

const lineOptions = computed(() => {
  if (!filters.value.projectId) return []
  return projectLineOptions.value.filter(item => item.projectId === filters.value.projectId)
})

const totalQuota = computed(() => {
  return quotaList.value.reduce((sum, item) => sum + Number(item.availableCount || 0), 0)
})

function goBack() {
  router.back()
}

async function loadProjectOptions() {
  try {
    const res = await getProjectList({ pageSize: -1 })
    if (res.code !== 200 || !res.data) {
      ElMessage.error(res.message || '加载项目数据失败')
      return
    }

    const records = Array.isArray(res.data.records) ? res.data.records : []
    projectLineOptions.value = records.map(item => ({
      projectId: String(item.projectId),
      projectName: item.projectName || '未命名项目',
      lineId: String(item.lineId),
      lineName: item.lineName || ''
    }))
  } catch (error) {
    console.error('加载项目线路失败:', error)
    ElMessage.error('加载项目线路失败')
  }
}

function handleProjectChange() {
  filters.value.lineId = ''
}

async function loadQuotas() {
  loading.value = true
  try {
    const params = {}
    if (filters.value.projectId) params.projectId = String(filters.value.projectId)
    if (filters.value.lineId) params.lineId = String(filters.value.lineId)

    const res = await getAgentMyQuotas(params)
    if (res.code !== 200) {
      ElMessage.error(res.message || '查询配额失败')
      quotaList.value = []
      return
    }

    const rows = Array.isArray(res.data) ? res.data : []
    quotaList.value = rows.map(item => ({
      projectId: String(item.projectId || ''),
      projectName: item.projectName || '未命名项目',
      lineId: String(item.lineId || ''),
      lineName: item.lineName || '',
      availableCount: Number(item.availableCount || 0)
    }))
  } catch (error) {
    console.error('查询配额失败:', error)
    ElMessage.error('网络异常，请稍后重试')
    quotaList.value = []
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.value.projectId = ''
  filters.value.lineId = ''
  loadQuotas()
}

onMounted(async () => {
  await loadProjectOptions()
  await loadQuotas()
})
</script>

<style scoped>
.my-quota-page {
  min-height: 100vh;
  padding: 20px;
  background: #f8faff;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.top-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.top-row h2 {
  margin: 0;
}

.filter-card {
  border-radius: 10px;
}

.summary-row {
  margin-bottom: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  color: #303133;
  font-weight: 600;
}
</style>
