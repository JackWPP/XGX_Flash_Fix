import bcrypt from 'bcryptjs';

// 测试密码验证
async function testLogin() {
  const testCases = [
    {
      phone: '13800000001',
      password: 'admin123',
      hash: '$2b$12$cR3HDzDbOVneCoH/NzzSqebAI7JwUqbF9rIrf.FChyOSsM76KJuIG'
    },
    {
      phone: '13800000002', 
      password: 'password',
      hash: '$2b$12$LVhDt3WLhxImiM.KRZnRae/r.dFym38L3OY2ZxMgbJHoUk62YLhJK'
    },
    {
      phone: '13800000003',
      password: '123456',
      hash: '$2b$12$nUoCVdQ.fRJXMwkkAx9bTuRehrJXSh/TqXbbI73nFgUGZRJXBXRnO'
    }
  ];

  console.log('测试登录验证:');
  for (const testCase of testCases) {
    const isValid = await bcrypt.compare(testCase.password, testCase.hash);
    console.log(`手机号: ${testCase.phone}, 密码: ${testCase.password}, 验证结果: ${isValid ? '✓ 成功' : '✗ 失败'}`);
  }
}

testLogin().catch(console.error);