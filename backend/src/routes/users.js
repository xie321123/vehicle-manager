const express = require('express');
const bcrypt = require('bcryptjs');
const { all, get, run } = require('../db');
const { authMiddleware, superAdminOnly } = require('../middleware/auth');

const router = express.Router();

// 所有用户接口都需要登录认证
router.use(authMiddleware);

// 获取用户列表（仅超级管理员）
router.get('/', superAdminOnly, async (req, res, next) => {
  try {
    const users = await all('SELECT id, username, role, created_at FROM users ORDER BY id');
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// 创建新用户（仅超级管理员）
router.post('/', superAdminOnly, async (req, res, next) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  const validRoles = ['admin', 'user'];
  const userRole = validRoles.includes(role) ? role : 'user';

  try {
    const existing = await get('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(409).json({ error: '用户名已存在' });
    }
    const hash = bcrypt.hashSync(password, 10);
    const result = await run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hash, userRole]);
    res.status(201).json({
      id: result.lastInsertRowid,
      username,
      role: userRole,
      message: '用户创建成功'
    });
  } catch (err) {
    next(err);
  }
});

// 更新用户信息（仅超级管理员）
router.put('/:id', superAdminOnly, async (req, res, next) => {
  const { id } = req.params;
  const { username, password, role } = req.body;

  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const updates = [];
    const params = [];

    if (username) {
      // 检查用户名是否已被其他用户使用
      const existing = await get('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
      if (existing) {
        return res.status(409).json({ error: '用户名已存在' });
      }
      updates.push('username = ?');
      params.push(username);
    }
    if (password) {
      const hash = bcrypt.hashSync(password, 10);
      updates.push('password = ?');
      params.push(hash);
    }
    if (role) {
      const validRoles = ['super_admin', 'admin', 'user'];
      if (validRoles.includes(role)) {
        updates.push('role = ?');
        params.push(role);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: '没有需要更新的字段' });
    }

    params.push(id);
    await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ message: '用户更新成功' });
  } catch (err) {
    next(err);
  }
});

// 删除用户（仅超级管理员）
router.delete('/:id', superAdminOnly, async (req, res, next) => {
  const { id } = req.params;

  try {
    // 不允许删除自己
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: '不能删除自己的账户' });
    }
    const result = await run('DELETE FROM users WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json({ message: '用户已删除' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
