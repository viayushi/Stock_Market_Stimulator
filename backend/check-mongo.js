const mongoose = require('mongoose');
require('dotenv').config();

async function checkMongoConnection() {
  try {
    console.log('Checking MongoDB connection...');
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stocksim';
    console.log('MongoDB URI:', mongoURI);
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('MongoDB connection successful!');
    console.log('Database name:', mongoose.connection.name);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check if users collection exists
    const hasUsers = collections.some(c => c.name === 'users');
    console.log('Users collection exists:', hasUsers);
    
    if (hasUsers) {
      const User = mongoose.model('User', new mongoose.Schema({}));
      const count = await User.countDocuments();
      console.log('Number of users in database:', count);
    }
    
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.log('Please ensure MongoDB is running on your system');
    console.log('If you are using MongoDB locally, make sure the MongoDB service is started');
    console.log('\nTry these steps:');
    console.log('1. Open Command Prompt as Administrator');
    console.log('2. Run: net start MongoDB');
    console.log('3. If that fails, install MongoDB:');
    console.log('   - Download: https://www.mongodb.com/try/download/community');
    console.log('   - Run installer');
    console.log('   - Choose "Complete" installation');
    console.log('   - Install MongoDB Compass when prompted');
    process.exit(1);
  }
}

checkMongoConnection(); 