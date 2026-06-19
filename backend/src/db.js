const path = require('path');

// 数据库适配器 - 通过 DATABASE_URL 环境变量自动切换
// 设了 DATABASE_URL → PostgreSQL（云端生产环境）
// 没设 DATABASE_URL → SQLite（本地开发环境）

let db;

async function init() {
  if (process.env.DATABASE_URL) {
    // 云端 PostgreSQL 模式
    const { Pool } = require('pg');
    db = {
      pool: new Pool({ connectionString: process.env.DATABASE_URL }),
      mode: 'pg'
    };
    await initPgTables();
  } else {
    // 本地 SQLite 模式
    const Database = require('better-sqlite3');
    const DB_PATH = path.join(__dirname, '..', 'data', 'app.db');
    db = {
      instance: new Database(DB_PATH),
      mode: 'sqlite'
    };
    db.instance.pragma('journal_mode = WAL');
    db.instance.pragma('foreign_keys = ON');
    initSqliteTables();
  }
}

// PostgreSQL 建表
async function initPgTables() {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('super_admin', 'admin', 'user')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS excel_files (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      uploaded_by INTEGER REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS vehicle_records (
      id SERIAL PRIMARY KEY,
      file_id INTEGER REFERENCES excel_files(id) ON DELETE CASCADE,
      序号 TEXT,
      车牌号 TEXT,
      驾驶员姓名 TEXT,
      身份证号码 TEXT,
      联系方式 TEXT,
      物流公司 TEXT,
      挂板类型 TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await db.pool.query(sql);
}

// SQLite 建表
function initSqliteTables() {
  db.instance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('super_admin', 'admin', 'user')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS excel_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      uploaded_by INTEGER REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS vehicle_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER REFERENCES excel_files(id) ON DELETE CASCADE,
      序号 TEXT,
      车牌号 TEXT,
      驾驶员姓名 TEXT,
      身份证号码 TEXT,
      联系方式 TEXT,
      物流公司 TEXT,
      挂板类型 TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// 将 SQLite 的问号占位符 ? 转换为 PostgreSQL 的 $1, $2, $3...
function toPgParams(sql, params) {
  let idx = 0;
  const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
  return { sql: pgSql, params };
}

// 统一查询接口 - 返回所有匹配行
async function all(sql, params = []) {
  if (db.mode === 'pg') {
    const { sql: pgSql, params: pgParams } = toPgParams(sql, params);
    const result = await db.pool.query(pgSql, pgParams);
    return result.rows;
  } else {
    return db.instance.prepare(sql).all(...params);
  }
}

// 统一查询接口 - 返回单行
async function get(sql, params = []) {
  if (db.mode === 'pg') {
    const { sql: pgSql, params: pgParams } = toPgParams(sql, params);
    const result = await db.pool.query(pgSql, pgParams);
    return result.rows[0] || null;
  } else {
    return db.instance.prepare(sql).get(...params);
  }
}

// 统一写入接口
async function run(sql, params = []) {
  if (db.mode === 'pg') {
    const { sql: pgSql, params: pgParams } = toPgParams(sql, params);
    const result = await db.pool.query(pgSql, pgParams);
    return { changes: result.rowCount, lastInsertRowid: result.rows?.[0]?.id || null };
  } else {
    const stmt = db.instance.prepare(sql);
    const info = stmt.run(...params);
    return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
  }
}

// PostgreSQL 专用：返回 RETURNING 子句结果
async function runReturning(sql, params = []) {
  if (db.mode === 'pg') {
    const { sql: pgSql, params: pgParams } = toPgParams(sql, params);
    const result = await db.pool.query(pgSql, pgParams);
    return result.rows[0] || null;
  } else {
    const stmt = db.instance.prepare(sql);
    const info = stmt.run(...params);
    return { id: info.lastInsertRowid };
  }
}

// 事务执行
async function transaction(fn) {
  if (db.mode === 'pg') {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    const trx = db.instance.transaction(fn);
    return trx();
  }
}

// 延迟初始化（等待 init 完成）
let initPromise;
function ensureInit() {
  if (!initPromise) {
    initPromise = init();
  }
  return initPromise;
}

module.exports = { getDb: () => db, all, get, run, runReturning, transaction, ensureInit };
