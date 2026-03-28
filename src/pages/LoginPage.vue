<template>
  <div class="login-container">
    <div class="login-card">
      <div class="title">{{ brandName }}代理登录</div>

      <el-form :model="form" :rules="rules" ref="loginForm" label-position="top" class="login-form">
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" placeholder="请输入代理账号" clearable @keyup.enter="handleLogin" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" placeholder="请输入密码" show-password @keyup.enter="handleLogin" />
        </el-form-item>

        <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">登录</el-button>
      </el-form>

      <!-- 新增的提示语 -->
      <div class="login-tip">
        提示：如果登录后系统提示Token错误或查询无权限，请尝试退出后重新登录。
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { agentLogin } from '@/api/agent'
import { useAgentStore } from '@/store/agentStore'
import { brandName } from '@/config/brand'

const router = useRouter()
const store = useAgentStore()
const loginForm = ref(null)
const loading = ref(false)

const form = reactive({ username: '', password: '' })

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  const valid = await loginForm.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const res = await agentLogin({ username: form.username.trim(), password: form.password })
    console.log(res)
    if (!res.ok) {
      ElMessage.error(res.message || '登录失败，请检查账号或密码')
      return
    }

    const data = res.data || {}
    const token = (typeof data === 'string') ? data : (data.token || data.access_token || data.Authorization || data.auth || '')
    console.log(token)
    if (!token) {
      ElMessage.error('登录成功但未返回令牌')
      return
    }

    // 存储 token 与用户信息（与路由守卫和请求头保持一致的 key）
    store.setToken(token)
    localStorage.setItem('token', (typeof token === 'string') ? token : (token ? String(token) : ''))  
    if (data.user || data.userInfo) store.setUserInfo(data.user || data.userInfo)

    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (e) {
    ElMessage.error('网络异常，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #2b5876, #4e4376);
}
.login-card {
  width: 90%;
  max-width: 360px;
  background: #fff;
  border-radius: 16px;
  padding: 30px 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}
.title { text-align: center; font-size: 20px; font-weight: 600; color: #333; margin-bottom: 20px; }
.login-btn { width: 100%; margin-top: 10px; }
/* 新增的提示语样式 */
.login-tip {
  margin-top: 20px;
  font-size: 12px;
  color: #999;
  text-align: center;
  line-height: 1.5;
}
</style>
