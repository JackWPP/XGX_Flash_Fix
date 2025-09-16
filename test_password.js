const bcrypt = require('bcryptjs');

const hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL8B9H7aG';

// 测试常见密码
const passwords = ['admin123', 'password', '123456', 'admin', 'test123'];

async function testPasswordHashes() {
  console.log('Testing passwords against hash:', hash);
  
  for (const password of passwords) {
    try {
      const isMatch = await bcrypt.compare(password, hash);
      console.log(`Password "${password}": ${isMatch ? 'MATCH' : 'NO MATCH'}`);
    } catch (error) {
      console.log(`Error testing password "${password}":`, error.message);
    }
  }
}

testPasswordHashes();