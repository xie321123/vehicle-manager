// 环境变量配置：打包 APK 时指向云端后端，开发时用本地代理
const API_BASE = import.meta.env.VITE_API_URL || '/api'

// 从 localStorage 获取令牌
function getToken() {
  return localStorage.getItem('token')
}

// 通用请求封装
async function request(url, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || '请求失败')
  }
  return data
}

// 认证相关
export const authApi = {
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
  getMe: () => request('/auth/me')
}

// 用户管理（超级管理员）
export const userApi = {
  list: () => request('/users'),
  create: (data) =>
    request('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  update: (id, data) =>
    request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  remove: (id) =>
    request(`/users/${id}`, { method: 'DELETE' })
}

// Excel 文件管理
export const excelApi = {
  getFiles: () => request('/excel/files'),
  upload: (file) => {
    const token = getToken()
    const formData = new FormData()
    formData.append('file', file)
    return fetch(`${API_BASE}/excel/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    }).then(res => res.json())
  },
  getRecords: (fileId) => request(`/excel/files/${fileId}/records`),
  searchRecords: (q) => request(`/excel/records?q=${encodeURIComponent(q)}`),
  getAllRecords: () => request('/excel/records'),
  getRecord: (id) => request(`/excel/records/${id}`),
  updateRecord: (id, data) =>
    request(`/excel/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteRecord: (id) =>
    request(`/excel/records/${id}`, { method: 'DELETE' }),
  deleteFile: (id) =>
    request(`/excel/files/${id}`, { method: 'DELETE' })
}
