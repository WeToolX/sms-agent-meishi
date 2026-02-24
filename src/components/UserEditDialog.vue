<template>
  <el-dialog
    :title="isEdit ? '编辑下级' : '新增下级'"
    :model-value="modelValue"
    @update:modelValue="onUpdate"
    @open="handleOpen"
    width="760px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form :model="form" ref="formRef" :rules="rules" label-width="110px" v-loading="loading">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              :disabled="isEdit"
            />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              :placeholder="isEdit ? '不修改请留空' : '请输入密码'"
              show-password
            />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="是否代理">
            <el-switch v-model="form.isAgent" active-text="是" inactive-text="否" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="用户状态" v-if="isEdit">
            <el-radio-group v-model="form.status">
              <el-radio :label="0">正常启用</el-radio>
              <el-radio :label="1">禁用账户</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider>项目线路黑名单</el-divider>

      <el-form-item label="禁用线路">
        <el-select
          v-model="form.blacklistedProjects"
          multiple
          filterable
          collapse-tags
          collapse-tags-tooltip
          placeholder="选择要禁用的项目线路（可为空）"
          style="width: 100%"
        >
          <el-option
            v-for="item in projectLineOptions"
            :key="item.key"
            :label="item.label"
            :value="item.key"
          />
        </el-select>
        <div style="margin-top: 6px; color: #909399; font-size: 12px;">
          说明：选择后将禁止该下级使用对应项目线路。
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="onUpdate(false)" :disabled="saving">取消</el-button>
      <el-button type="primary" @click="save" :loading="saving">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createAgentUser,
  updateAgentUser,
  getProjectList,
  getAgentSubUserConfig
} from '@/api/agent'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  user: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'updated'])

const formRef = ref()
const loading = ref(false)
const saving = ref(false)

const form = ref({
  id: null,
  username: '',
  password: '',
  isAgent: false,
  status: 0,
  blacklistedProjects: []
})

const projectLineOptions = ref([])

const isEdit = computed(() => !!(props.user && props.user.id))

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    {
      validator: (rule, value, callback) => {
        if (!isEdit.value && !value) {
          callback(new Error('请输入密码'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ]
}

// 弹窗打开时统一初始化：基础表单 + 可选项目线路 + 已有黑名单。
async function handleOpen() {
  loading.value = true
  try {
    await loadProjectLineOptions()
    if (isEdit.value) {
      form.value = {
        id: props.user.id,
        username: props.user.userName || props.user.username || '',
        password: '',
        isAgent: !!props.user.isAgent,
        status: Number(props.user.status ?? 0),
        blacklistedProjects: []
      }
      await loadUserBlacklist(props.user.id)
    } else {
      form.value = {
        id: null,
        username: '',
        password: '',
        isAgent: false,
        status: 0,
        blacklistedProjects: []
      }
    }
  } catch (error) {
    console.error('初始化编辑弹窗失败:', error)
    ElMessage.error('初始化失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

async function loadProjectLineOptions() {
  const res = await getProjectList({ pageSize: -1 })
  if (res.code !== 200 || !res.data) {
    throw new Error(res.message || '加载项目线路失败')
  }

  const records = Array.isArray(res.data.records) ? res.data.records : []
  projectLineOptions.value = records.map(item => {
    const projectId = String(item.projectId)
    const lineId = String(item.lineId)
    return {
      key: `${projectId}-${lineId}`,
      label: `[${projectId}] ${item.projectName || '未命名项目'} / [${lineId}] ${item.lineName || '未命名线路'}`
    }
  })
}

async function loadUserBlacklist(userId) {
  const res = await getAgentSubUserConfig(userId)
  const blacklist = res?.data?.blacklist
  if (!blacklist) {
    form.value.blacklistedProjects = []
    return
  }
  form.value.blacklistedProjects = String(blacklist)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

async function save() {
  if (!formRef.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    if (isEdit.value) {
      const payload = {
        id: Number(form.value.id),
        username: form.value.username.trim(),
        password: form.value.password ? form.value.password.trim() : undefined,
        isAgent: !!form.value.isAgent,
        status: Number(form.value.status),
        blacklistedProjects: form.value.blacklistedProjects || []
      }
      const res = await updateAgentUser(payload)
      if (res.code !== 200) {
        throw new Error(res.message || '更新失败')
      }
    } else {
      const payload = {
        username: form.value.username.trim(),
        password: form.value.password,
        isAgent: !!form.value.isAgent,
        blacklistedProjects: form.value.blacklistedProjects || []
      }
      const res = await createAgentUser(payload)
      if (res.code !== 200) {
        throw new Error(res.message || '创建失败')
      }
    }

    ElMessage.success('保存成功')
    emit('update:modelValue', false)
    emit('updated')
  } catch (error) {
    console.error('保存下级失败:', error)
    ElMessage.error(error.message || '操作失败')
  } finally {
    saving.value = false
  }
}

function onUpdate(val) {
  emit('update:modelValue', val)
}
</script>
