<template>
  <div class="sub-users-page">
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 10px;">
        <el-button type="info" size="small" @click="goBack">返回</el-button>
        <h2>下级管理</h2>
      </div>

      <div style="display: flex; align-items: center; gap: 10px;">
        <el-input
          v-model="searchUserName"
          placeholder="根据用户名模糊查询"
          clearable
          size="small"
          style="width: 160px"
          @keyup.enter="getUserList"
        />
        <el-button type="primary" size="small" @click="getUserList">查询</el-button>
        <el-button type="success" size="small" @click="() => { searchUserName = ''; getUserList(); }">刷新</el-button>
        <el-button type="primary" size="small" @click="openEditDialog()">新增下级</el-button>
      </div>
    </div>

    <el-table :data="tableData" border style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" sortable />
      <el-table-column prop="userName" label="用户名" min-width="140" />
      <el-table-column prop="createTime" label="注册时间" width="180" />
      <el-table-column label="黑名单线路数" width="130" align="center">
        <template #default="{ row }">
          {{ getBlacklistCount(row) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'info' : 'success'">
            {{ row.status === 1 ? '禁用' : '启用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="totalGetCount" label="取号数" width="90" align="center" />
      <el-table-column label="回码率" width="100" align="center">
        <template #default="{ row }">
          {{ formatRate(row.totalCodeRate) }}
        </template>
      </el-table-column>
      <el-table-column label="代理" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.isAgent ? 'success' : 'info'">
            {{ row.isAgent ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="210" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-button size="small" type="info" @click="openQuotaDialog(row)">配额详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-bar">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[10, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
      />
    </div>

    <UserEditDialog
      v-model="editDialogVisible"
      :user="currentUser"
      @updated="getUserList"
    />

    <UserQuotaDialog
      v-if="quotaDialogVisible"
      v-model="quotaDialogVisible"
      :user-info="currentUser"
      @updated="getUserList"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import UserEditDialog from '../components/UserEditDialog.vue'
import UserQuotaDialog from '../components/UserQuotaDialog.vue'
import { listAgentUsers } from '@/api/agent'

const router = useRouter()
const searchUserName = ref('')
const loading = ref(false)
const tableData = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const editDialogVisible = ref(false)
const quotaDialogVisible = ref(false)
const currentUser = ref(null)

function goBack() {
  router.back()
}

async function getUserList() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      size: pageSize.value,
      userName: searchUserName.value.trim() || ''
    }
    const res = await listAgentUsers(params)

    if (res.code === 200 && res.data) {
      tableData.value = res.data.records || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '加载数据失败')
    }
  } catch (error) {
    ElMessage.error('加载数据失败，请检查网络')
    console.error('请求失败', error)
  } finally {
    loading.value = false
  }
}

watch(page, () => {
  getUserList()
})

watch(pageSize, () => {
  if (page.value === 1) {
    getUserList()
  } else {
    page.value = 1
  }
})

function formatRate(value) {
  if (value == null || isNaN(value)) return '--'
  const rate = value <= 1 ? value * 100 : value
  return `${rate.toFixed(0)}%`
}

function getBlacklistCount(row) {
  if (!row || !row.projectBlacklist) return 0
  return row.projectBlacklist
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .length
}

onMounted(() => {
  getUserList()
})

function openEditDialog(user = null) {
  currentUser.value = user
  editDialogVisible.value = true
}

function openQuotaDialog(row) {
  currentUser.value = row
  quotaDialogVisible.value = true
}
</script>

<style scoped>
.sub-users-page {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
