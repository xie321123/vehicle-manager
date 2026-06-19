import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { excelApi } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Detail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    excelApi.getRecord(id)
      .then(setRecord)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const callPhone = (phone) => {
    if (phone) window.location.href = `tel:${phone.replace(/\s/g, '')}`
  }

  if (loading) return <div className="loading-screen"><div className="spinner"></div><p>加载中...</p></div>
  if (!record) return null

  return (
    <div className="detail-page">
      <header className="detail-header">
        <button className="btn btn-back" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          返回
        </button>
        <h2>详细信息</h2>
        {isAdmin && (
          <Link to={`/edit/${id}`} className="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            编辑
          </Link>
        )}
      </header>

      <div className="detail-content">
        <div className="detail-field">
          <label>车牌号</label>
          <span className="plate-number-large">{record.车牌号 || '-'}</span>
        </div>

        <div className="detail-grid">
          <div className="detail-field">
            <label>序号</label>
            <span>{record.序号 || '-'}</span>
          </div>
          <div className="detail-field">
            <label>驾驶员姓名</label>
            <span>{record.驾驶员姓名 || '-'}</span>
          </div>
        </div>

        <div className="detail-field">
          <label>身份证号码</label>
          <span className="text-mono">{record.身份证号码 || '-'}</span>
        </div>

        <div className="detail-field">
          <label>联系方式</label>
          {record.联系方式 ? (
            <span className="phone-link" onClick={() => callPhone(record.联系方式)}>
              <svg className="phone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              {record.联系方式}
            </span>
          ) : <span>-</span>}
        </div>

        <div className="detail-field">
          <label>物流公司</label>
          <span>{record.物流公司 || '-'}</span>
        </div>

        <div className="detail-field">
          <label>挂板类型</label>
          <span>{record.挂板类型 || '-'}</span>
        </div>

        {record.file_name && (
          <div className="detail-field">
            <label>来源文件</label>
            <span className="text-muted">{record.file_name}</span>
          </div>
        )}
      </div>
    </div>
  )
}
