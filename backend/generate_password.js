import bcrypt from 'bcryptjs';

// 生成正确的密码哈希
async function generatePasswordHash() {
  const passwords = ['admin123', 'password', '123456', 'admin', 'test123'];
  
  console.log('生成密码哈希:');
  for (const password of passwords) {
    const hash = await bcrypt.hash(password, 12);
    console.log(`密码: ${password} -> 哈希: ${hash}`);
  }
}

generatePasswordHash().catch(console.error);