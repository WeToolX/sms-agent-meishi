<template>
  <div class="report-page">
    <div class="back-row">
      <el-button type="info" size="small" @click="goBack">⬅ 返回</el-button>
    </div>

    <div class="page-header">
      <h2>代理取号数据报表</h2>
      <el-button type="primary" size="small" @click="loadReport" :loading="loading">
        刷新数据
      </el-button>
    </div>

    <div class="filter-bar">
      <el-input
        v-model="filters.projectName"
        placeholder="项目名称"
        clearable
        size="small"
        style="width: 180px"
      />
      <el-input
        v-model="filters.projectId"
        placeholder="项目ID"
        clearable
        size="small"
        style="width: 160px"
      />
      <el-input
        v-model="filters.lineId"
        placeholder="线路ID"
        clearable
        size="small"
        style="width: 140px"
      />

      <el-date-picker
        v-model="filters.dateRange"
        type="datetimerange"
        value-format="YYYY-MM-DD HH:mm:ss"
        format="YYYY-MM-DD HH:mm:ss"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        size="small"
        style="width: 320px"
      />

      <el-button type="success" size="small" @click="loadReport">查询</el-button>
    </div>

    <el-card class="table-card" shadow="hover">
      <el-table
        :data="reportData"
        border
        stripe
        v-loading="loading"
        row-key="projectId"
        style="width: 100%"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-box">
              <h4>线路明细 - {{ row.projectName }}</h4>
              <el-table :data="row.lineDetails" border size="small">
                <el-table-column prop="lineId" label="线路ID" width="120" align="center" />
                <el-table-column prop="totalRequests" label="取号数量" width="120" align="center" />
                <el-table-column prop="successCount" label="取码数量" width="120" align="center" />
                <el-table-column label="回码率 (%)" width="120" align="center">
                  <template #default="{ row: detail }">
                    {{ formatRate(detail.successRate) }}
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="projectId" label="项目ID" width="120" align="center" />
        <el-table-column prop="projectName" label="项目名称" min-width="180" />
        <el-table-column prop="lineCount" label="线路数量" width="100" align="center" />
        <el-table-column prop="totalRequests" label="总取号数" width="120" align="center" />
        <el-table-column prop="successCount" label="成功取码数" width="120" align="center" />
        <el-table-column label="回码率 (%)" width="120" align="center">
          <template #default="{ row }">
            {{ formatRate(row.successRate) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-box">
        <el-pagination
          background
          layout="prev, pager, next, total"
          :current-page="pagination.current"
          :page-size="pagination.size"
          :total="pagination.total"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAgentReportData } from '@/api/agent'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const reportData = ref([])

const filters = ref({
  projectName: '',
  projectId: '',
  lineId: '',
  dateRange: []
})

const pagination = ref({
  current: 1,
  size: 10,
  total: 0
})

const goBack = () => router.back()

// 仅保留取号/取码/回码率统计，去除金额统计口径。
async function loadReport() {
  try {
    loading.value = true

    const params = {
      current: pagination.value.current,
      size: pagination.value.size,
      projectName: filters.value.projectName,
      projectId: filters.value.projectId,
      lineId: filters.value.lineId
    }

    if (filters.value.dateRange && filters.value.dateRange.length === 2) {
      params.startTime = filters.value.dateRange[0]
      params.endTime = filters.value.dateRange[1]
    }

    const res = await getAgentReportData(params)

    if (res.code === 200 && res.data) {
      reportData.value = res.data.records || []
      pagination.value.total = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取代理报表异常:', error)
    ElMessage.error('网络异常')
  } finally {
    loading.value = false
  }
}

function handlePageChange(page) {
  pagination.value.current = page
  loadReport()
}

function formatRate(value) {
  if (value == null || isNaN(value)) return '--'
  return `${Number(value).toFixed(2)}%`
}

onMounted(() => {
  loadReport()
})
</script>

<style scoped>
.report-page {
  min-height: 100vh;
  padding: 20px;
  background: #f8faff;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.back-row {
  display: flex;
  justify-content: flex-start;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 14px 20px;
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.05);
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  padding: 12px 18px;
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.05);
}

.table-card {
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding-bottom: 10px;
}

.expand-box {
  padding: 10px 20px;
  background: #fafafa;
  border-radius: 8px;
}

.expand-box h4 {
  margin-bottom: 10px;
  color: #333;
}

.pagination-box {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
