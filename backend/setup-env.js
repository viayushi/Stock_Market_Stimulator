const fs = require('fs');
const path = require('path');

const envContent = `# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/stocksim?directConnection=true

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Twelve Data API (optional)
TWELVE_DATA_API_KEY=your_twelve_data_api_key_here
`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('📁 Location:', envPath);
  console.log('⚠️  Please change the JWT_SECRET to a secure random string in production!');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('📝 Please create a .env file manually in the backend directory with the following content:');
  console.log('\n' + envContent);
} 