import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi, excelApi } from '../api'
import { useAuth } from '../context/AuthContext'

export default function AdminPanel() {
  const { isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  // 用户表单
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' })
  const [formError, setFormError] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      if (tab === 'users' && isSuperAdmin) {
        setUsers(await userApi.list())
      } else if (tab === 'files') {
        setFiles(await excelApi.getFiles())
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [tab])

  // 创建用户
  const handleCreateUser = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!newUser.username || !newUser.password) {
      setFormError('用户名和密码不能为空')
      return
    }
    try {
      await userApi.create(newUser)
      setShowCreate(false)
      setNewUser({ username: '', password: '', role: 'user' })
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  // 删除用户
  const handleDeleteUser = async (id) => {
    if (!confirm('确定要删除该用户吗？')) return
    try {
      await userApi.remove(id)
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  // 上传Excel
  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const result = await excelApi.upload(file)
      alert(`上传成功！共解析 ${result.record_count} 条记录`)
      setShowUpload(false)
      loadData()
    } catch (err) {
      alert(err.message || '上传失败')
    }
    e.target.value = ''
  }

  // 删除文件
  const handleDeleteFile = async (id) => {
    if (!confirm('确定要删除该文件及其所有记录吗？')) return
    try {
      await excelApi.deleteFile(id)
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="admin-page">
      <header className="detail-header">
        <button className="btn btn-back" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          返回
        </button>
        <h2>管理面板</h2>
      </header>

      <div className="admin-tabs">
        {isSuperAdmin && (
          <button className={`tab-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
            用户管理
          </button>
        )}
        <button className={`tab-btn ${tab === 'files' ? 'active' : ''}`} onClick={() => setTab('files')}>
          文件管理
        </button>
      </div>

      <div className="admin-content">
        {/* 用户管理 */}
        {tab === 'users' && isSuperAdmin && (
          <>
            <div className="admin-toolbar">
              <h3>用户列表</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
                + 创建用户
              </button>
            </div>

            {showCreate && (
              <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <h3>创建新用户</h3>
                  <form onSubmit={handleCreateUser}>
                    {formError && <div className="alert alert-error">{formError}</div>}
                    <div className="form-group">
                      <label>用户名</label>
                      <input type="text" value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} placeholder="输入用户名" required />
                    </div>
                    <div className="form-group">
                      <label>密码</label>
                      <input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="输入密码" required />
                    </div>
                    <div className="form-group">
                      <label>角色</label>
                      <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}>
                        <option value="user">普通用户</option>
                        <option value="admin">管理员</option>
                      </select>
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="btn btn-cancel" onClick={() => setShowCreate(false)}>取消</button>
                      <button type="submit" className="btn btn-primary">创建</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {loading ? (
              <div className="loading-screen"><div className="spinner"></div></div>
            ) : (
              <div className="user-list">
                {users.map(u => (
                  <div key={u.id} className="user-card">
                    <div className="user-info">
                      <span className="user-name">{u.username}</span>
                      <span className={`role-tag ${u.role}`}>
                        {u.role === 'super_admin' ? '超级管理员' : u.role === 'admin' ? '管理员' : '普通用户'}
                      </span>
                    </div>
                    <div className="user-meta">创建时间: {u.created_at}</div>
                    {u.role !== 'super_admin' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u.id)}>删除</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 文件管理 */}
        {tab === 'files' && (
          <>
            <div className="admin-toolbar">
              <h3>Excel 文件</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowUpload(true)}>
                + 上传文件
              </button>
            </div>

            {showUpload && (
              <div className="modal-overlay" onClick={() => setShowUpload(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <h3>上传 Excel 文件</h3>
                  <p className="text-muted">支持 .xlsx, .xls 格式，表头需包含：序号、车牌号、驾驶员姓名、身份证号码、联系方式、物流公司、挂板类型</p>
                  <div className="upload-area">
                    <input type="file" accept=".xlsx,.xls" onChange={handleUpload} />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn btn-cancel" onClick={() => setShowUpload(false)}>取消</button>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="loading-screen"><div className="spinner"></div></div>
            ) : files.length === 0 ? (
              <div className="empty-state">
                <p>暂无上传的文件</p>
              </div>
            ) : (
              <div className="file-list">
                {files.map(f => (
                  <div key={f.id} className="file-card">
                    <div className="file-info">
                      <div className="file-name">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        {f.original_name}
                      </div>
                      <div className="file-meta">
                        <span>上传者: {f.uploader_name || '未知'}</span>
                        <span>{f.upload_time}</span>
                      </div>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteFile(f.id)}>删除</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
