const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function fixPassword() {
  // 生成正确的密码哈希
  const password = '123213';
  const hash = await bcrypt.hash(password, 12);
  console.log('Generated hash:', hash);
  console.log('Hash length:', hash.length);
  
  // 连接数据库
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'SE2025',
    password: 'Cs22032025',
    database: 'xgx_flash_fix'
  });
  
  try {
    // 更新密码哈希
    const [result] = await connection.execute(
      'UPDATE users SET password_hash = ? WHERE phone = ?',
      [hash, '13111111111']
    );
    
    console.log('Update result:', result);
    
    // 验证更新结果
    const [rows] = await connection.execute(
      'SELECT phone, LENGTH(password_hash) as hash_length, LEFT(password_hash, 20) as hash_preview FROM users WHERE phone = ?',
      ['13111111111']
    );
    
    console.log('Verification:', rows[0]);
    
    // 测试密码验证
    const [user] = await connection.execute(
      'SELECT password_hash FROM users WHERE phone = ?',
      ['13111111111']
    );
    
    if (user.length > 0) {
      const isValid = await bcrypt.compare(password, user[0].password_hash);
      console.log('Password validation test:', isValid);
    }
    
  } finally {
    await connection.end();
  }
}

fixPassword().catch(console.error);