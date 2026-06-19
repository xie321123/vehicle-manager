const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb, get, run } = require('../db');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// 登录
router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }
  try {
    const user = await get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (err) {
    next(err);
  }
});

// 获取当前用户信息
router.get('/me', async (req, res, next) => {
  // 这个路由会在 index.js 中挂载到 authMiddleware 之后
  try {
    const user = await get('SELECT id, username, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
