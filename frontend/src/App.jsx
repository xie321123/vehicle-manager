import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Detail from './pages/Detail'
import Edit from './pages/Edit'
import AdminPanel from './pages/AdminPanel'

function ProtectedRoute({ children, requireAdmin }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner"></div><p>加载中...</p></div>
  if (!user) return <Navigate to="/login" replace />
  if (requireAdmin && user.role !== 'super_admin' && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  const { user } = useAuth()
  return (
    <div className="app-container">
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/detail/:id" element={<ProtectedRoute><Detail /></ProtectedRoute>} />
        <Route path="/edit/:id" element={<ProtectedRoute><Edit /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
