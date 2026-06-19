const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('./middleware/auth');
const { ensureInit } = require('./db');
const seed = require('./seed');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

// 中间件
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 用于前端预览（本地开发用）
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// 路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const excelRoutes = require('./routes/excel');

// 公开接口
app.use('/api/auth', authRoutes);

// 需要认证的接口
app.use('/api/users', userRoutes);
app.use('/api/excel', excelRoutes);

// 获取当前用户信息（需要认证）
app.get('/api/auth/me', authMiddleware, (req, res, next) => {
  const authRoute = require('./routes/auth');
  authRoute.handle({ method: 'GET', url: '/me', user: req.user }, res, next);
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 前端单页应用路由支持（非 API 请求返回 index.html）
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const indexPath = path.join(frontendDist, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    }
  }
});

// 启动服务（先初始化数据库，再监听端口）
async function start() {
  try {
    await ensureInit();
    console.log('数据库初始化完成');

    // 自动创建超级管理员（如果不存在）
    await seed();

    app.listen(PORT, '0.0.0.0', () => {
      console.log('车辆数据管理后端服务已启动 - 端口: ' + PORT);
      console.log('API 基础路径: http://localhost:' + PORT + '/api');
    });
  } catch (err) {
    console.error('后端服务启动失败:', err);
    process.exit(1);
  }
}

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('请求处理错误:', err);
  res.status(500).json({ error: '服务器内部错误: ' + err.message });
});

start();
