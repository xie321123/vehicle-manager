const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'vehicle-data-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

// 生成令牌
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// 验证令牌中间件
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '令牌无效或已过期' });
  }
}

// 超级管理员权限中间件
function superAdminOnly(req, res, next) {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: '仅超级管理员可执行此操作' });
  }
  next();
}

// 管理员及以上权限中间件（超级管理员和管理员）
function adminOrAbove(req, res, next) {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: '权限不足，需要管理员权限' });
  }
  next();
}

module.exports = { generateToken, authMiddleware, superAdminOnly, adminOrAbove, JWT_SECRET };
