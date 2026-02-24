<template>
  <el-dialog
    :model-value="modelValue"
    width="1080px"
    :title="`用户配额详情 - ${userInfo?.userName || ''}`"
    :close-on-click-modal="false"
    @update:modelValue="(val) => emit('update:modelValue', val)"
  >
    <el-card shadow="never" style="margin-bottom: 12px;">
      <template #header>
        <div class="card-header">
          <span>项目线路配额</span>
          <div class="card-actions">
            <el-button size="small" type="primary" @click="openAddQuotaDialog">新增配额</el-button>
            <el-button size="small" @click="loadQuotaList" :loading="quotaLoading">刷新配额</el-button>
          </div>
        </div>
      </template>

      <div class="filter-row">
        <el-select
          v-model="quotaFilter.projectId"
          placeholder="按项目筛选"
          clearable
          filterable
          style="width: 220px"
        >
          <el-option
            v-for="item in quotaProjectOptions"
            :key="item.projectId"
            :label="`[${item.projectId}] ${item.projectName}`"
            :value="item.projectId"
          />
        </el-select>

        <el-select
          v-model="quotaFilter.lineId"
          placeholder="按线路筛选"
          clearable
          filterable
          style="width: 220px"
          :disabled="!quotaFilter.projectId"
        >
          <el-option
            v-for="item in quotaLineOptions"
            :key="`${item.projectId}_${item.lineId}`"
            :label="`[${item.lineId}] ${item.lineName || item.projectName || '未命名线路'}`"
            :value="item.lineId"
          />
        </el-select>

        <el-button type="primary" @click="handleQuotaSearch">查询</el-button>
        <el-button @click="handleQuotaReset">重置</el-button>
      </div>

      <el-table :data="quotaPageList" border height="260" v-loading="quotaLoading">
        <el-table-column prop="projectId" label="项目ID" width="120" align="center" />
        <el-table-column prop="projectName" label="项目名称" min-width="160" />
        <el-table-column prop="lineId" label="线路ID" width="120" align="center" />
        <el-table-column prop="lineName" label="线路名称" min-width="160" />
        <el-table-column prop="availableCount" label="剩余配额" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="Number(row.availableCount || 0) > 0 ? 'success' : 'danger'">
              {{ Number(row.availableCount || 0) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="success" @click="handleQuotaAdjust(row, 'recharge')">充配额</el-button>
            <el-button link type="danger" @click="handleQuotaAdjust(row, 'deduct')">扣配额</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager-row">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="quotaPage.total"
          :current-page="quotaPage.page"
          :page-size="quotaPage.size"
          :page-sizes="[10, 20, 50]"
          @current-change="handleQuotaPageChange"
          @size-change="handleQuotaSizeChange"
        />
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>配额流水</span>
          <div class="card-actions">
            <el-select
              v-model="ledgerFilter.projectId"
              placeholder="项目"
              clearable
              filterable
              style="width: 220px"
              @change="onLedgerProjectChange"
            >
              <el-option
                v-for="item in quotaProjectOptions"
                :key="item.projectId"
                :label="`[${item.projectId}] ${item.projectName}`"
                :value="item.projectId"
              />
            </el-select>

            <el-select
              v-model="ledgerFilter.lineId"
              placeholder="线路"
              clearable
              filterable
              style="width: 220px"
              :disabled="!ledgerFilter.projectId"
            >
              <el-option
                v-for="item in ledgerLineOptions"
                :key="`${item.projectId}_${item.lineId}`"
                :label="`[${item.lineId}] ${item.lineName || item.projectName || '未命名线路'}`"
                :value="item.lineId"
              />
            </el-select>

            <el-button type="primary" @click="handleLedgerSearch" :loading="ledgerLoading">查询流水</el-button>
          </div>
        </div>
      </template>

      <el-table :data="ledgerList" border v-loading="ledgerLoading" height="260">
        <el-table-column prop="timestamp" label="时间" width="170" align="center" />
        <el-table-column prop="projectId" label="项目" width="90" align="center" />
        <el-table-column prop="lineId" label="线路" width="90" align="center" />
        <el-table-column prop="ledgerType" label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.ledgerType === 1 ? 'success' : 'danger'">
              {{ row.ledgerType === 1 ? '入账' : '出账' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="changeCount" label="变动" width="100" align="center" />
        <el-table-column prop="countBefore" label="变动前" width="100" align="center" />
        <el-table-column prop="countAfter" label="变动后" width="100" align="center" />
        <el-table-column prop="operatorName" label="操作人" width="120" align="center" />
        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
      </el-table>

      <div class="pager-row">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="ledgerPage.total"
          :page-size="ledgerPage.size"
          :current-page="ledgerPage.page"
          @current-change="handleLedgerPageChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="addDialogVisible"
      title="新增配额"
      width="460px"
      append-to-body
      :close-on-click-modal="false"
      @close="resetAddForm"
    >
      <el-form ref="addFormRef" :model="addForm" :rules="addFormRules" label-width="90px">
        <el-form-item label="项目ID" prop="projectId">
          <el-select
            v-model="addForm.projectId"
            placeholder="请选择项目"
            filterable
            clearable
            style="width: 100%"
            :loading="grantLoading"
          >
            <el-option
              v-for="item in grantProjectOptions"
              :key="item.projectId"
              :label="`[${item.projectId}] ${item.projectName}`"
              :value="item.projectId"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="线路ID" prop="lineId">
          <el-select
            v-model="addForm.lineId"
            placeholder="请选择线路"
            filterable
            clearable
            style="width: 100%"
            :disabled="!addForm.projectId"
          >
            <el-option
              v-for="item in grantLineOptions"
              :key="`${item.projectId}_${item.lineId}`"
              :label="`[${item.lineId}] ${item.lineName || item.projectName || '未命名线路'}`"
              :value="item.lineId"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="配额数量" prop="count">
          <el-input-number v-model="addForm.count" :precision="0" :step="1" :min="1" style="width: 100%" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="addLoading" @click="handleCreateQuota">确定</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  deductAgentUser,
  getAgentMyQuotas,
  getAgentUserQuotaLedgers,
  getAgentUserQuotas,
  rechargeAgentUser
} from '@/api/agent'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  userInfo: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue', 'updated'])

const quotaLoading = ref(false)
const quotaList = ref([])

const quotaFilter = reactive({
  projectId: '',
  lineId: ''
})

const quotaPage = reactive({
  page: 1,
  size: 10,
  total: 0
})

const ledgerLoading = ref(false)
const ledgerList = ref([])
const ledgerPage = reactive({
  page: 1,
  size: 10,
  total: 0
})

const ledgerFilter = reactive({
  projectId: '',
  lineId: ''
})

const addDialogVisible = ref(false)
const addFormRef = ref(null)
const addLoading = ref(false)
const addForm = reactive({
  projectId: '',
  lineId: '',
  count: 1
})

const addFormRules = reactive({
  projectId: [{ required: true, message: '请选择项目', trigger: 'change' }],
  lineId: [{ required: true, message: '请选择线路', trigger: 'change' }],
  count: [
    { required: true, message: '请输入配额数量', trigger: 'blur' },
    { type: 'number', min: 1, message: '配额数量必须大于0', trigger: 'blur' }
  ]
})

const grantLoading = ref(false)
const grantLineList = ref([])

const quotaProjectOptions = computed(() => {
  const map = new Map()
  quotaList.value.forEach(item => {
    if (!map.has(item.projectId)) {
      map.set(item.projectId, {
        projectId: item.projectId,
        projectName: item.projectName || '未命名项目'
      })
    }
  })
  return Array.from(map.values())
})

const quotaLineOptions = computed(() => {
  if (!quotaFilter.projectId) return []
  return quotaList.value.filter(item => item.projectId === quotaFilter.projectId)
})

const ledgerLineOptions = computed(() => {
  if (!ledgerFilter.projectId) return []
  return quotaList.value.filter(item => item.projectId === ledgerFilter.projectId)
})

const quotaFilteredList = computed(() => {
  return quotaList.value.filter((item) => {
    if (quotaFilter.projectId && item.projectId !== quotaFilter.projectId) return false
    if (quotaFilter.lineId && item.lineId !== quotaFilter.lineId) return false
    return true
  })
})

const quotaPageList = computed(() => {
  const start = (quotaPage.page - 1) * quotaPage.size
  return quotaFilteredList.value.slice(start, start + quotaPage.size)
})

const grantProjectOptions = computed(() => {
  const map = new Map()
  grantLineList.value.forEach(item => {
    if (!map.has(item.projectId)) {
      map.set(item.projectId, {
        projectId: item.projectId,
        projectName: item.projectName || '未命名项目'
      })
    }
  })
  return Array.from(map.values())
})

const grantLineOptions = computed(() => {
  if (!addForm.projectId) return []
  return grantLineList.value.filter(item => item.projectId === addForm.projectId)
})

watch(
  () => quotaFilteredList.value,
  (list) => {
    quotaPage.total = list.length
    const maxPage = Math.max(1, Math.ceil(list.length / quotaPage.size))
    if (quotaPage.page > maxPage) {
      quotaPage.page = maxPage
    }
  },
  { immediate: true }
)

watch(() => quotaFilter.projectId, () => {
  quotaFilter.lineId = ''
})

watch(() => addForm.projectId, () => {
  addForm.lineId = ''
})

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      quotaList.value = []
      quotaFilter.projectId = ''
      quotaFilter.lineId = ''
      quotaPage.page = 1
      quotaPage.total = 0
      ledgerFilter.projectId = ''
      ledgerFilter.lineId = ''
      ledgerPage.page = 1
      ledgerPage.total = 0
      ledgerList.value = []
      grantLineList.value = []
      addDialogVisible.value = false
      resetAddForm()
    }
  }
)

watch(
  () => [props.modelValue, props.userInfo?.id],
  async ([visible, userId]) => {
    // 对话框可见且用户ID有效时自动加载，避免首次打开需要手动刷新
    if (!visible || !userId) return
    await loadQuotaList()
    await loadGrantLineOptions()
    await handleLedgerSearch()
  },
  { immediate: true }
)

function normalizeQuotaItem(item) {
  return {
    projectId: String(item?.projectId || ''),
    projectName: item?.projectName || '未命名项目',
    lineId: String(item?.lineId || ''),
    lineName: item?.lineName || '',
    availableCount: Number(item?.availableCount || 0)
  }
}

function isAgentRequestSuccess(res) {
  const businessFailed = typeof res?.message === 'string' && res.message.includes('失败')
  return (Boolean(res?.ok) || res?.code === 0 || res?.code === 200) && !businessFailed
}

async function loadQuotaList() {
  const targetUserId = props.userInfo?.id
  if (!targetUserId) return
  quotaLoading.value = true
  try {
    const res = await getAgentUserQuotas(targetUserId)
    if (res.code !== 200 || !Array.isArray(res.data)) {
      ElMessage.error(res.message || '加载用户配额失败')
      quotaList.value = []
      return
    }
    quotaList.value = res.data.map(normalizeQuotaItem)
    quotaPage.page = 1
  } catch (error) {
    console.error('加载用户配额异常:', error)
    ElMessage.error('加载用户配额失败')
    quotaList.value = []
  } finally {
    quotaLoading.value = false
  }
}

async function loadGrantLineOptions() {
  grantLoading.value = true
  try {
    const res = await getAgentMyQuotas()
    if (res.code !== 200 || !Array.isArray(res.data)) {
      ElMessage.error(res.message || '加载可用项目线路失败')
      grantLineList.value = []
      return
    }

    const lineMap = new Map()
    res.data.forEach((item) => {
      const projectId = String(item?.projectId || '')
      const lineId = String(item?.lineId || '')
      const availableCount = Number(item?.availableCount || 0)
      if (!projectId || !lineId || availableCount <= 0) return
      const key = `${projectId}_${lineId}`
      if (!lineMap.has(key)) {
        lineMap.set(key, {
          projectId,
          projectName: item?.projectName || '未命名项目',
          lineId,
          lineName: item?.lineName || '',
          availableCount
        })
      }
    })
    grantLineList.value = Array.from(lineMap.values())
  } catch (error) {
    console.error('加载可用项目线路异常:', error)
    ElMessage.error('加载可用项目线路失败')
    grantLineList.value = []
  } finally {
    grantLoading.value = false
  }
}

function handleQuotaSearch() {
  quotaPage.page = 1
}

function handleQuotaReset() {
  quotaFilter.projectId = ''
  quotaFilter.lineId = ''
  quotaPage.page = 1
}

function handleQuotaPageChange(page) {
  quotaPage.page = page
}

function handleQuotaSizeChange(size) {
  quotaPage.size = size
  quotaPage.page = 1
}

function openAddQuotaDialog() {
  addDialogVisible.value = true
  loadGrantLineOptions()
}

function resetAddForm() {
  if (addFormRef.value) {
    addFormRef.value.resetFields()
  }
  addForm.projectId = ''
  addForm.lineId = ''
  addForm.count = 1
}

async function handleCreateQuota() {
  const targetUserId = props.userInfo?.id
  if (!targetUserId || !addFormRef.value) return

  await addFormRef.value.validate(async (valid) => {
    if (!valid) return
    addLoading.value = true
    try {
      const res = await rechargeAgentUser(targetUserId, addForm.projectId, addForm.lineId, Number(addForm.count))
      if (!isAgentRequestSuccess(res)) {
        const detail = typeof res?.data === 'string' && res.data ? res.data : ''
        ElMessage.error(detail || res?.message || '新增配额失败')
        return
      }
      ElMessage.success(res?.message || '新增配额成功')
      addDialogVisible.value = false
      emit('updated')
      await loadQuotaList()
      await loadGrantLineOptions()
      await handleLedgerSearch()
    } catch (error) {
      console.error('新增配额异常:', error)
      ElMessage.error('新增配额失败')
    } finally {
      addLoading.value = false
    }
  })
}

async function handleQuotaAdjust(row, action) {
  const targetUserId = props.userInfo?.id
  if (!targetUserId) return

  try {
    const title = action === 'recharge' ? '充值配额' : '扣减配额'
    const { value } = await ElMessageBox.prompt(`请输入${title}数量`, title, {
      inputPlaceholder: '请输入大于0的整数',
      inputPattern: /^\d+$/,
      inputErrorMessage: '请输入正整数',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })

    const count = Number(value)
    if (!count || count <= 0) {
      ElMessage.warning('数量必须大于0')
      return
    }

    const res = action === 'recharge'
      ? await rechargeAgentUser(targetUserId, row.projectId, row.lineId, count)
      : await deductAgentUser(targetUserId, row.projectId, row.lineId, count)

    if (isAgentRequestSuccess(res)) {
      ElMessage.success(res?.message || '操作成功')
      emit('updated')
      await loadQuotaList()
      await loadGrantLineOptions()
      await handleLedgerSearch()
      return
    }
    const detail = typeof res?.data === 'string' && res.data ? res.data : ''
    ElMessage.error(detail || res?.message || '操作失败')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('调整配额异常:', error)
      ElMessage.error('操作失败')
    }
  }
}

function onLedgerProjectChange() {
  ledgerFilter.lineId = ''
}

async function handleLedgerSearch() {
  ledgerPage.page = 1
  await loadLedgerList()
}

async function loadLedgerList() {
  const targetUserId = props.userInfo?.id
  if (!targetUserId) return

  ledgerLoading.value = true
  try {
    const params = {
      targetUserId,
      page: ledgerPage.page,
      size: ledgerPage.size
    }
    if (ledgerFilter.projectId) params.projectId = ledgerFilter.projectId
    if (ledgerFilter.lineId) params.lineId = ledgerFilter.lineId

    const res = await getAgentUserQuotaLedgers(params)
    if (res.code !== 200 || !res.data) {
      ElMessage.error(res.message || '加载配额流水失败')
      ledgerList.value = []
      ledgerPage.total = 0
      return
    }
    ledgerList.value = res.data.records || []
    ledgerPage.total = Number(res.data.total || 0)
  } catch (error) {
    console.error('加载配额流水异常:', error)
    ElMessage.error('加载配额流水失败')
    ledgerList.value = []
    ledgerPage.total = 0
  } finally {
    ledgerLoading.value = false
  }
}

function handleLedgerPageChange(page) {
  ledgerPage.page = page
  loadLedgerList()
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.card-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.pager-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
