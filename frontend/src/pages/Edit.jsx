import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { excelApi } from '../api'

export default function Edit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    excelApi.getRecord(id)
      .then(data => {
        setForm({
          序号: data.序号 || '',
          车牌号: data.车牌号 || '',
          驾驶员姓名: data.驾驶员姓名 || '',
          身份证号码: data.身份证号码 || '',
          联系方式: data.联系方式 || '',
          物流公司: data.物流公司 || '',
          挂板类型: data.挂板类型 || ''
        })
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await excelApi.updateRecord(id, form)
      navigate(`/detail/${id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner"></div><p>加载中...</p></div>
  if (!form) return null

  return (
    <div className="edit-page">
      <header className="detail-header">
        <button className="btn btn-back" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          返回
        </button>
        <h2>编辑记录</h2>
      </header>

      <form onSubmit={handleSubmit} className="edit-form">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label>车牌号</label>
          <input type="text" value={form.车牌号} onChange={handleChange('车牌号')} placeholder="请输入车牌号" />
        </div>
        <div className="form-group">
          <label>序号</label>
          <input type="text" value={form.序号} onChange={handleChange('序号')} placeholder="请输入序号" />
        </div>
        <div className="form-group">
          <label>驾驶员姓名</label>
          <input type="text" value={form.驾驶员姓名} onChange={handleChange('驾驶员姓名')} placeholder="请输入驾驶员姓名" />
        </div>
        <div className="form-group">
          <label>身份证号码</label>
          <input type="text" value={form.身份证号码} onChange={handleChange('身份证号码')} placeholder="请输入身份证号码" />
        </div>
        <div className="form-group">
          <label>联系方式</label>
          <input type="text" value={form.联系方式} onChange={handleChange('联系方式')} placeholder="请输入手机号码" />
        </div>
        <div className="form-group">
          <label>物流公司</label>
          <input type="text" value={form.物流公司} onChange={handleChange('物流公司')} placeholder="请输入物流公司名称" />
        </div>
        <div className="form-group">
          <label>挂板类型</label>
          <input type="text" value={form.挂板类型} onChange={handleChange('挂板类型')} placeholder="请输入挂板类型" />
        </div>

        <div className="edit-actions">
          <button type="button" className="btn btn-cancel" onClick={() => navigate(-1)}>取消</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </form>
    </div>
  )
}
