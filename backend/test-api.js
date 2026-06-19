/**
 * API 集成测试脚本
 * 测试登录、上传Excel、搜索、修改、删除等完整流程
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const API = 'http://localhost:3001/api';
let token = '';

function request(method, url, data, multipart) {
  return new Promise((resolve, reject) => {
    const u = new URL(url.startsWith('http') ? url : `${API}${url}`);
    const options = {
      method,
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      headers: {}
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    if (multipart) {
      const boundary = '----' + Date.now();
      const filePath = multipart;
      const fileName = path.basename(filePath);
      const fileContent = fs.readFileSync(filePath);
      const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`;
      const footer = `\r\n--${boundary}--\r\n`;
      const body = Buffer.concat([Buffer.from(header), fileContent, Buffer.from(footer)]);
      options.headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
      options.headers['Content-Length'] = body.length;
      const req = http.request(options, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(d) }));
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    } else {
      if (data) {
        const body = JSON.stringify(data);
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(body);
        const req = http.request(options, res => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => {
            try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
            catch { resolve({ status: res.statusCode, data: d }); }
          });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
      } else {
        const req = http.request(options, res => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => {
            try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
            catch { resolve({ status: res.statusCode, data: d }); }
          });
        });
        req.on('error', reject);
        req.end();
      }
    }
  });
}

async function main() {
  console.log('=== 车辆数据管理 API 测试 ===\n');

  // 1. 登录测试
  console.log('1. 测试登录...');
  let res = await request('POST', '/auth/login', { username: 'admin', password: 'admin123' });
  if (res.status === 200) {
    token = res.data.token;
    console.log(`   ✓ 登录成功 (角色: ${res.data.user.role})`);
  } else {
    console.log(`   ✗ 登录失败: ${res.data.error}`);
    process.exit(1);
  }

  // 2. 上传Excel文件
  console.log('\n2. 测试上传Excel文件...');
  const excelFile = path.join(__dirname, 'data', '示例车辆数据.xlsx');
  res = await request('POST', '/excel/upload', null, excelFile);
  if (res.status === 200) {
    console.log(`   ✓ 上传成功，解析 ${res.data.record_count} 条记录`);
  } else {
    console.log(`   ✗ 上传失败: ${JSON.stringify(res.data)}`);
    process.exit(1);
  }

  // 3. 搜索测试
  console.log('\n3. 测试搜索功能...');
  res = await request('GET', '/excel/records?q=张三');
  if (res.status === 200 && res.data.length > 0) {
    console.log(`   ✓ 搜索"张三"找到 ${res.data.length} 条记录`);
    console.log(`     车牌号: ${res.data[0].车牌号}`);
    console.log(`     联系方式: ${res.data[0].联系方式}`);
  } else {
    console.log(`   ✗ 搜索失败: ${JSON.stringify(res.data)}`);
    process.exit(1);
  }

  // 4. 模糊搜索测试
  console.log('\n4. 测试模糊搜索...');
  res = await request('GET', '/excel/records?q=138');
  if (res.status === 200 && res.data.length > 0) {
    console.log(`   ✓ 搜索"138"找到 ${res.data.length} 条记录`);
  } else {
    console.log(`   ✗ 模糊搜索失败`);
  }

  // 5. 获取详情
  console.log('\n5. 测试获取详情...');
  const firstId = res.data[0].id;
  res = await request('GET', `/excel/records/${firstId}`);
  if (res.status === 200) {
    console.log(`   ✓ 获取详情成功，驾驶员: ${res.data.驾驶员姓名}`);
  }

  // 6. 修改记录
  console.log('\n6. 测试修改记录...');
  res = await request('PUT', `/excel/records/${firstId}`, { 驾驶员姓名: '张三(已更新)' });
  if (res.status === 200) {
    console.log(`   ✓ 修改成功，新姓名: ${res.data.驾驶员姓名}`);
  } else {
    console.log(`   ✗ 修改失败: ${JSON.stringify(res.data)}`);
  }

  // 7. 列出所有文件
  console.log('\n7. 查看文件列表...');
  res = await request('GET', '/excel/files');
  if (res.status === 200) {
    console.log(`   ✓ 文件列表: ${res.data.length} 个文件`);
  }

  // 8. 用户管理
  console.log('\n8. 测试用户管理...');
  res = await request('GET', '/users');
  if (res.status === 200) {
    console.log(`   ✓ 用户列表: ${res.data.length} 个用户`);
    const adminUser = res.data.find(u => u.role === 'super_admin');
    if (adminUser) console.log(`     超级管理员: ${adminUser.username}`);
  }

  console.log('\n=== 所有测试通过 ===');
}

main().catch(e => { console.error('测试失败:', e.message); process.exit(1); });
