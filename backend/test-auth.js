const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/auth';

async function testAuth() {
  console.log('🧪 Testing Authentication Endpoints...\n');

  try {
    // Test registration with unique email
    console.log('1. Testing Registration...');
    const timestamp = Date.now();
    const registerData = {
      username: `testuser${timestamp}`,
      email: `test${timestamp}@example.com`,
      password: 'password123'
    };

    const registerResponse = await axios.post(`${API_BASE}/register`, registerData);
    console.log('✅ Registration successful:', registerResponse.data.user.username);
    console.log('   Token received:', registerResponse.data.token ? 'Yes' : 'No');
    console.log('   First login:', registerResponse.data.user.firstLogin);
    console.log('   Balance:', registerResponse.data.user.balance);

    // Test login
    console.log('\n2. Testing Login...');
    const loginData = {
      email: `test${timestamp}@example.com`,
      password: 'password123'
    };

    const loginResponse = await axios.post(`${API_BASE}/login`, loginData);
    console.log('✅ Login successful:', loginResponse.data.user.username);
    console.log('   Token received:', loginResponse.data.token ? 'Yes' : 'No');
    console.log('   First login:', loginResponse.data.user.firstLogin);

    // Test profile with token
    console.log('\n3. Testing Profile (with token)...');
    const token = loginResponse.data.token;
    const profileResponse = await axios.get(`${API_BASE}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile fetch successful:', profileResponse.data.user.username);

    console.log('\n🎉 All tests passed! Authentication system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   cd backend && npm start');
    }
  }
}

testAuth(); 