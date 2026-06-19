/**
 * 数据库初始化脚本 - 创建超级管理员账户
 * 运行方式: npm run seed
 */
/**
 * 数据库初始化脚本 - 创建超级管理员账户
 * 运行方式: npm run seed
 */
const bcrypt = require('bcryptjs');
const { get, run, ensureInit } = require('./db');

// 允许被 index.js 在启动时调用
async function seed() {
  try {
    await ensureInit();

    // 检查是否已有超级管理员
    const existing = await get("SELECT id FROM users WHERE role = 'super_admin'");
    if (existing) {
      console.log('超级管理员已存在，跳过初始化');
      return false;
    }

    const hash = bcrypt.hashSync('admin123', 10);
    await run(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      ['admin', hash, 'super_admin']
    );

    console.log('超级管理员账户创建成功');
    console.log('用户名: admin');
    console.log('密码: admin123');
    console.log('请立即修改默认密码！');
    return true;
  } catch (err) {
    console.error('初始化失败:', err);
    return false;
  }
}

// 直接运行脚本时执行（npm run seed）
if (require.main === module) {
  seed().then(result => {
    if (!result) process.exit(1);
  }).catch(() => process.exit(1));
}

module.exports = seed;
