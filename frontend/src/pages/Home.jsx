import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { excelApi } from '../api'

export default function Home() {
  const [query, setQuery] = useState('')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const { user, logout, isAdmin, isSuperAdmin } = useAuth()
  const navigate = useNavigate()

  const loadAllRecords = useCallback(async () => {
    setLoading(true)
    try {
      const data = await excelApi.getAllRecords()
      setRecords(data)
      setTotalCount(data.length)
    } catch {
      setRecords([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAllRecords()
  }, [loadAllRecords])

  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!query.trim()) {
      loadAllRecords()
      return
    }
    setLoading(true)
    try {
      const data = await excelApi.searchRecords(query.trim())
      setRecords(data)
      setTotalCount(data.length)
    } catch {
      setRecords([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setQuery('')
    loadAllRecords()
  }

  const callPhone = (phone) => {
    if (phone) {
      window.location.href = 'tel:' + phone.replace(/\s/g, '')
    }
  }

  return (
    <div className="home-page">
      <header className="top-bar">
        <div className="top-bar-left">
          <h1 className="app-title">车辆管理</h1>
          {user && (
            <span className="user-badge">
              {user.username}
              {isSuperAdmin && <span className="badge-super">超级管理员</span>}
              {!isSuperAdmin && isAdmin && <span className="badge-admin">管理员</span>}
            </span>
          )}
        </div>
        <div className="top-bar-right">
          {isSuperAdmin && (
            <button className="btn-icon" onClick={() => navigate('/admin')} title="管理员面板">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          )}
          {isAdmin && (
            <button className="btn-icon" onClick={() => navigate('/admin')} title="管理面板">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
            </button>
          )}
          <button className="btn-icon" onClick={logout} title="退出登录">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </header>

      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="搜索 车牌号/姓名/身份证/电话/物流公司..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button type="button" className="search-clear" onClick={clearSearch}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary search-btn">搜索</button>
        </form>
        <div className="search-info">
          {query ? (
            <span>搜索 "{query}" 共找到 <strong>{totalCount}</strong> 条结果</span>
          ) : (
            <span>共 <strong>{totalCount}</strong> 条记录</span>
          )}
        </div>
      </div>

      <div className="records-list">
        {loading ? (
          <div className="loading-screen"><div className="spinner"></div><p>加载中...</p></div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
            </svg>
            <p>暂无数据</p>
            {isAdmin && <p className="text-muted">请联系管理员上传Excel文件</p>}
          </div>
        ) : (
          records.map(record => (
            <div key={record.id} className="record-card" onClick={() => navigate('/detail/' + record.id)}>
              <div className="card-header">
                <span className="plate-number">{record.车牌号 || '无车牌号'}</span>
                {record.file_name && <span className="file-tag">{record.file_name}</span>}
              </div>
              <div className="card-body">
                <div className="card-row">
                  <span className="card-label">驾驶员</span>
                  <span className="card-value">{record.驾驶员姓名 || '-'}</span>
                </div>
                <div className="card-row">
                  <span className="card-label">身份证</span>
                  <span className="card-value text-mono">{record.身份证号码 || '-'}</span>
                </div>
                <div className="card-row">
                  <span className="card-label">联系方式</span>
                  <span
                    className="card-value card-phone"
                    onClick={(e) => {
                      e.stopPropagation()
                      callPhone(record.联系方式)
                    }}
                  >
                    {record.联系方式 ? (
                      <>
                        <svg className="phone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        {record.联系方式}
                      </>
                    ) : '-'}
                  </span>
                </div>
                <div className="card-row">
                  <span className="card-label">物流公司</span>
                  <span className="card-value">{record.物流公司 || '-'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
