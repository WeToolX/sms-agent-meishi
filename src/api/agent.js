import { request } from '@/utils/request'

// ==================== 登录与首页 ====================
// 代理登录
export const agentLogin = (data) => request(1, '/api/agent/login', data)
// 公告
export const agentNotice = (params = {}) => request(0, '/api/agent/notice', params)
// 仪表盘
export const getAgentDashboard = () => request(0, '/api/agent/dashboard-stats', {}, true)

// ==================== 下级用户管理 ====================
// 分页查询下级用户
export const listAgentUsers = (params) => request(0, '/api/agent/listUsers', params, true)
// 创建下级用户
export const createAgentUser = (data) => request(1, '/api/agent/createUser', data)
// 更新下级用户
export const updateAgentUser = (data) => request(1, '/api/agent/updateUser', data)
// 批量删除下级用户
export const deleteAgentUsers = (data) => request(1, '/api/agent/deleteUsers', data)
// 查询下级用户配置（黑名单）
export const getAgentSubUserConfig = (userId) => request(0, '/api/agent/user/config-info', { userId }, true)

// ==================== 配额操作 ====================
// 代理给下级充值同项目同线路配额
export const rechargeAgentUser = (targetUserId, projectId, lineId, count) =>
  request(1, '/api/agent/rechargeUser', { targetUserId, projectId, lineId, count }, true)

// 代理从下级扣回同项目同线路配额
export const deductAgentUser = (targetUserId, projectId, lineId, count) =>
  request(1, '/api/agent/deductUser', { targetUserId, projectId, lineId, count }, true)

// 查询代理本人项目线路剩余配额
export const getAgentMyQuotas = (params = {}) => request(0, '/api/agent/my/quotas', params, true)

// 查询下级用户项目线路配额明细
export const getAgentUserQuotas = (targetUserId, params = {}) =>
  request(0, '/api/agent/user/quotas', { targetUserId, ...params }, true)

// 查询下级用户项目线路配额流水（支持项目+线路筛选）
export const getAgentUserQuotaLedgers = (params = {}) =>
  request(0, '/api/agent/user/quota-ledgers', params, true)

// ==================== 项目基础数据 ====================
// 查询项目线路列表（用于下拉选项）
export const getProjectList = (params = {}) => request(0, '/api/project/find/all', params, true)

// ==================== 取号记录与统计 ====================
// 下级取号记录
export const getAgentSubordinateNumberRecords = (data) =>
  request(1, '/api/agent/subordinate-number-records', data)

// 代理下级线路统计
export const getUserLineStats = (data) => request(1, '/api/agent/stats/user-line', data)

// 代理报表（保留取号/来码统计）
export const getAgentReportData = (params = {}) => {
  const query = {
    current: params.current ?? 1,
    size: params.size ?? 10,
    projectName: params.projectName || '',
    projectId: params.projectId || '',
    lineId: params.lineId || '',
    startTime: params.startTime || '',
    endTime: params.endTime || ''
  }
  return request(1, '/api/agent/get/data', query)
}

// ==================== 清理接口 ====================
// 清理代理自己的历史号码记录
export const numberClear = () => request(1, '/api/agent/number/clear')
