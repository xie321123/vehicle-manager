const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { all, get, run, transaction } = require('../db');
const { authMiddleware, adminOrAbove } = require('../middleware/auth');

const router = express.Router();

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const upload = multer({ dest: path.join(DATA_DIR, 'uploads') });

// 确保上传目录存在
if (!fs.existsSync(path.join(DATA_DIR, 'uploads'))) {
  fs.mkdirSync(path.join(DATA_DIR, 'uploads'), { recursive: true });
}

// 所有 Excel 相关接口都需要登录
router.use(authMiddleware);

// 获取 Excel 文件列表
router.get('/files', async (req, res, next) => {
  try {
    const files = await all(`
      SELECT f.*, u.username as uploader_name
      FROM excel_files f
      LEFT JOIN users u ON f.uploaded_by = u.id
      ORDER BY f.upload_time DESC
    `);
    res.json(files);
  } catch (err) {
    next(err);
  }
});

// 上传并解析 Excel 文件（管理员及以上权限）
router.post('/upload', adminOrAbove, upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: '请选择要上传的文件' });
  }

  try {
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (data.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Excel文件为空' });
    }

    // 用事务批量插入记录
    const result = await transaction(async () => {
      // 保存文件记录
      const fileResult = await run(
        'INSERT INTO excel_files (filename, original_name, uploaded_by) VALUES (?, ?, ?)',
        [req.file.filename, req.file.originalname, req.user.id]
      );
      const fileId = fileResult.lastInsertRowid;

      // 批量插入记录
      for (const row of data) {
        await run(
          `INSERT INTO vehicle_records (file_id, 序号, 车牌号, 驾驶员姓名, 身份证号码, 联系方式, 物流公司, 挂板类型)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            fileId,
            String(row['序号'] || ''),
            String(row['车牌号'] || ''),
            String(row['驾驶员姓名'] || ''),
            String(row['身份证号码'] || ''),
            String(row['联系方式'] || ''),
            String(row['物流公司'] || ''),
            String(row['挂板类型'] || '')
          ]
        );
      }

      return { fileId, count: data.length };
    });

    res.json({
      file_id: result.fileId,
      filename: req.file.originalname,
      record_count: result.count,
      message: '文件上传并解析成功'
    });
  } catch (err) {
    // 清理上传的临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Excel 解析错误:', err);
    res.status(500).json({ error: 'Excel 文件解析失败: ' + err.message });
  }
});

// 获取指定文件的所有记录
router.get('/files/:id/records', async (req, res, next) => {
  try {
    const records = await all(
      'SELECT * FROM vehicle_records WHERE file_id = ? ORDER BY id',
      [req.params.id]
    );
    res.json(records);
  } catch (err) {
    next(err);
  }
});

// 获取所有车辆记录（支持搜索）
router.get('/records', async (req, res, next) => {
  const { q } = req.query;
  try {
    let records;
    if (q && q.trim()) {
      const keyword = `%${q.trim()}%`;
      records = await all(`
        SELECT v.*, f.original_name as file_name
        FROM vehicle_records v
        LEFT JOIN excel_files f ON v.file_id = f.id
        WHERE v.车牌号 LIKE ? OR v.驾驶员姓名 LIKE ? OR v.身份证号码 LIKE ?
           OR v.联系方式 LIKE ? OR v.物流公司 LIKE ? OR v.挂板类型 LIKE ?
        ORDER BY v.id DESC
      `, [keyword, keyword, keyword, keyword, keyword, keyword]);
    } else {
      records = await all(`
        SELECT v.*, f.original_name as file_name
        FROM vehicle_records v
        LEFT JOIN excel_files f ON v.file_id = f.id
        ORDER BY v.id DESC
      `);
    }
    res.json(records);
  } catch (err) {
    next(err);
  }
});

// 获取单条记录详情
router.get('/records/:id', async (req, res, next) => {
  try {
    const record = await get(`
      SELECT v.*, f.original_name as file_name
      FROM vehicle_records v
      LEFT JOIN excel_files f ON v.file_id = f.id
      WHERE v.id = ?
    `, [req.params.id]);
    if (!record) {
      return res.status(404).json({ error: '记录不存在' });
    }
    res.json(record);
  } catch (err) {
    next(err);
  }
});

// 修改单条记录
router.put('/records/:id', async (req, res, next) => {
  const { id } = req.params;
  const { 序号, 车牌号, 驾驶员姓名, 身份证号码, 联系方式, 物流公司, 挂板类型 } = req.body;

  try {
    const existing = await get('SELECT * FROM vehicle_records WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: '记录不存在' });
    }

    await run(`
      UPDATE vehicle_records SET
        序号 = ?, 车牌号 = ?, 驾驶员姓名 = ?, 身份证号码 = ?,
        联系方式 = ?, 物流公司 = ?, 挂板类型 = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      序号 ?? existing.序号,
      车牌号 ?? existing.车牌号,
      驾驶员姓名 ?? existing.驾驶员姓名,
      身份证号码 ?? existing.身份证号码,
      联系方式 ?? existing.联系方式,
      物流公司 ?? existing.物流公司,
      挂板类型 ?? existing.挂板类型,
      id
    ]);

    const updated = await get('SELECT * FROM vehicle_records WHERE id = ?', [id]);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// 删除记录（管理员及以上权限）
router.delete('/records/:id', adminOrAbove, async (req, res, next) => {
  try {
    const result = await run('DELETE FROM vehicle_records WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }
    res.json({ message: '记录已删除' });
  } catch (err) {
    next(err);
  }
});

// 删除 Excel 文件及其所有记录（管理员及以上权限）
router.delete('/files/:id', adminOrAbove, async (req, res, next) => {
  try {
    const file = await get('SELECT * FROM excel_files WHERE id = ?', [req.params.id]);
    if (!file) {
      return res.status(404).json({ error: '文件不存在' });
    }

    // 删除物理文件
    const filePath = path.join(DATA_DIR, 'uploads', file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 删除数据库记录（vehicle_records 通过外键级联删除）
    await run('DELETE FROM excel_files WHERE id = ?', [req.params.id]);
    res.json({ message: '文件及关联记录已删除' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
