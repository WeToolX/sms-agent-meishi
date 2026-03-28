// src/utils/request.js

import router from '../router'
import { apiBaseUrl } from '@/config/brand'

const baseURL = apiBaseUrl
/**
 * 处理 401 跳转逻辑
 */
function handleUnauthorized() {
  localStorage.removeItem('token');
  localStorage.removeItem('agent_token');
  router.replace('/login').catch(err => {
      console.warn('路由跳转异常:', err)
  });
}


export async function request(methodFlag, url, jsonData = {}, isquery = false) {
  try {
    let finalUrl = baseURL.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url)

    if ((methodFlag === 0 && Object.keys(jsonData).length > 0) || (methodFlag === 1 && isquery)) {
      const query = Object.entries(jsonData)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')
      finalUrl += (finalUrl.includes('?') ? '&' : '?') + query
    }

    // ✅ 自动附加 Token（兼容多命名）
   
  const headers = { 'Content-Type': 'application/json' }
    const token = localStorage.getItem('token') || localStorage.getItem('agent_token')
    if (token) {
      headers['Account-token'] = token  // 使用后端要求的字段名
    }
    console.log('🔑 使用的 Token:', token)

    const options = {
      method: methodFlag === 1 ? 'POST' : 'GET',
      headers
    }

    if (methodFlag === 1 && !isquery) {
      options.body = JSON.stringify(jsonData)
    }

    console.log('📡 请求:', options.method, finalUrl)

    const response = await fetch(finalUrl, options)
    if (!response.ok) {
      console.error('❌ HTTP 状态错误:', response.status, finalUrl)
      return { ok: false, code: response.status, message: `HTTP错误 ${response.status}`, data: null }
    }

    const text = await response.text()
    if (!text) {
      console.warn('⚠️ 空响应体:', finalUrl)
      return { ok: false, code: 0, message: '服务器未返回数据', data: null }
    }

    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      console.error('JSON 解析失败:', text)
      return { ok: false, code: 0, message: '返回数据不是 JSON 格式', data: text }
    }
    if (data.code === 401) {
        console.warn('Token 失效，跳转登录页...');
        handleUnauthorized();
        return { ok: false, code: 401, message: data.message || '登录失效', data: null };
    }

    return {
      ok: data.code === 200 || data.ok === true,
      code: data.code || 0,
      message: data.message || '',
      data: data.data || null
    }
  } catch (err) {
    console.error('🌐 网络或解析异常:', err)
    return { ok: false, code: -1, message: '网络异常或服务器错误', data: null }
  }
}
