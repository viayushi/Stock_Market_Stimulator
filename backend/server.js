// Suppress specific deprecation warnings from dependencies
process.noDeprecation = false;
process.env.NODE_NO_WARNINGS = '0';

// Enhanced deprecation warning handler with detailed logging
const originalEmitWarning = process.emitWarning;
process.emitWarning = function(warning, ...args) {
  if (warning && typeof warning === 'string' && warning.includes('util._extend')) {
    console.log('🔍 Deprecation warning detected:', warning);
    console.log('📍 Warning args:', args);
    
    // Get stack trace to identify the source
    const stack = new Error().stack;
    console.log('📍 Stack trace:', stack);
    
    // Still suppress the warning but log the details
    return;
  }
  return originalEmitWarning.call(this, warning, ...args);
};

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
let PORT = process.env.PORT || 5000;

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stocksim?directConnection=true';
    console.log('Attempting to connect to MongoDB at:', mongoURI);
    
    const options = {
      // Remove deprecated options
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
      directConnection: true,
      // Enhanced connection pool settings
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      // Heartbeat configuration
      heartbeatFrequencyMS: 10000,
      // Write concern configuration
      w: 'majority',
      wtimeoutMS: 2500, // Use wtimeoutMS instead of wtimeout
      // Read concern configuration
      readConcern: { level: 'local' },
      retryWrites: true
    };

    await mongoose.connect(mongoURI, options);
    
    // Test the connection and check server status
    const adminDb = mongoose.connection.db.admin();
    const serverStatus = await adminDb.serverStatus();
    console.log('MongoDB connected successfully - Server version:', serverStatus.version);
    console.log('Active connections:', serverStatus.connections.current);
    
    // Start heartbeat monitoring
    setInterval(async () => {
      try {
        await mongoose.connection.db.admin().ping();
      } catch (error) {
        console.error('Heartbeat check failed:', error);
        if (!dbConnected) {
          tryConnect();
        }
      }
    }, 30000);

    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.log('\nDetailed error information:');
    console.log('Error name:', error.name);
    console.log('Error code:', error.code);
    
    if (error.name === 'MongoServerSelectionError') {
      console.log('\nMongoDB server is not running. Please follow these steps:');
      console.log('1. Install MongoDB if not installed:');
      console.log('   - Download from: https://www.mongodb.com/try/download/community');
      console.log('   - Run installer and choose "Complete" installation');
      console.log('   - Make sure to install MongoDB Compass');
      console.log('\n2. Start MongoDB:');
      console.log('   Method 1 - Using MongoDB Compass:');
      console.log('   - Open MongoDB Compass');
      console.log('   - Click "Connect"');
      console.log('\n   Method 2 - Using Command Line:');
      console.log('   - Open Command Prompt as Administrator');
      console.log('   - Run: "C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe" --dbpath="C:\\data\\db"');
    }
    return false;
  }
};

// Connect to MongoDB
let dbConnected = false;
let connectionRetries = 0;
const maxRetries = 3;

const tryConnect = async () => {
  try {
    const connected = await connectDB();
    if (connected) {
      dbConnected = true;
      console.log('MongoDB connection established successfully');
    } else {
      connectionRetries++;
      if (connectionRetries < maxRetries) {
        console.log(`Connection attempt ${connectionRetries} failed. Retrying in 5 seconds...`);
        setTimeout(tryConnect, 5000);
      } else {
        console.log('Failed to connect to MongoDB after multiple attempts.');
      }
    }
  } catch (error) {
    console.error('Error in connection retry:', error);
  }
};

tryConnect();

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
  dbConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
  dbConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
  dbConnected = false;
});

// Handle process termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB disconnection:', err);
    process.exit(1);
  }
});

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5002',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5002',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['set-cookie'],
  optionsSuccessStatus: 200,
};

// Apply middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Request body:', req.body);
  next();
});

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const portfolioRoutes = require('./src/routes/portfolio.routes');
const upstoxRoutes = require('./src/routes/upstox.routes');
const watchlistRoutes = require('./src/routes/watchlist.routes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/upstox', upstoxRoutes);
app.use('/api/watchlist', watchlistRoutes);

// Test endpoint to verify server is running
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend server is running!', 
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

// Yahoo Finance proxy endpoint
app.get('/api/yahoo-stocks', async (req, res) => {
  const symbols = req.query.symbols || 'AAPL,MSFT,GOOGL,AMZN,TSLA,META,NVDA,NFLX,AMD,INTC';
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Yahoo Finance data' });
  }
});

// Error handling middleware with specific error codes
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  
  let statusCode = 500;
  let errorMessage = 'Internal server error';
  
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = 'Validation error';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorMessage = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorMessage = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    errorMessage = 'Resource not found';
  }

  res.status(statusCode).json({
    message: errorMessage,
    error: process.env.NODE_ENV === 'development' ? err.message : errorMessage,
    code: err.code || 'INTERNAL_ERROR'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Enhanced server startup with graceful shutdown
const startServer = () => {
  try {
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: corsOptions.origin,
        credentials: true
      }
    });

    // --- Socket.IO Real-Time Price Relay ---
    const WebSocket = require('ws');
    const UPSTOX_WS_URL = process.env.UPSTOX_WS_URL || 'wss://ws-api.upstox.com/index/ddf/stream/v1';
    // --- Upstox API Credentials ---
    const UPSTOX_API_KEY = process.env.UPSTOX_API_KEY || '';
    const UPSTOX_API_SECRET = process.env.UPSTOX_API_SECRET || '';
    const UPSTOX_ACCESS_TOKEN = process.env.UPSTOX_ACCESS_TOKEN || '';
    let upstoxWS = null;
    let wsConnected = false;
    let symbolSubscriptions = {};
    let restPollingInterval = null;

    function emitPriceUpdateREST(symbols) {
      if (!symbols.length) return;
      axios.get('https://api-v2.upstox.com/market/quote', {
        headers: {
          'Authorization': `Bearer ${UPSTOX_ACCESS_TOKEN}`,
          'Api-Version': '2.0'
        },
        params: { symbol: symbols.join(',') }
      }).then(res => {
        const data = res.data.data || [];
        data.forEach(q => {
          io.to(q.symbol).emit('priceUpdate', {
            instrument: q.symbol,
            last_price: q.last_price || q.close,
            open: q.open,
            close: q.close,
            high: q.high,
            low: q.low,
            volume: q.volume
          });
        });
      }).catch(() => {});
    }

    function connectUpstoxWS() {
      upstoxWS = new WebSocket(UPSTOX_WS_URL);
      upstoxWS.on('open', () => {
        wsConnected = true;
        console.log('Connected to Upstox WebSocket');
        // Authenticate
        upstoxWS.send(JSON.stringify({
          guid: 'auth',
          method: 'authenticate',
          data: { access_token: UPSTOX_ACCESS_TOKEN }
        }));
      });
      upstoxWS.on('message', (msg) => {
        try {
          const data = JSON.parse(msg);
          if (data.method === 'authenticated') {
            console.log('Upstox WebSocket authenticated');
            // Subscribe to all currently requested symbols
            const symbols = Object.keys(symbolSubscriptions);
            if (symbols.length > 0) {
              upstoxWS.send(JSON.stringify({
                guid: 'sub',
                method: 'subscribe',
                data: { instruments: symbols }
              }));
            }
          } else if (data.method === 'quote') {
            // Broadcast price update to all clients subscribed to this symbol
            const symbol = data.data.instrument;
            io.to(symbol).emit('priceUpdate', data.data);
          }
        } catch (e) {
          // Ignore parse errors
        }
      });
      upstoxWS.on('close', () => {
        wsConnected = false;
        console.log('Upstox WebSocket closed, switching to REST polling fallback.');
        // Start REST polling fallback
        if (!restPollingInterval) {
          restPollingInterval = setInterval(() => {
            const symbols = Object.keys(symbolSubscriptions);
            emitPriceUpdateREST(symbols);
          }, 5000);
        }
        setTimeout(connectUpstoxWS, 60000); // Try to reconnect WebSocket every 60s
      });
      upstoxWS.on('error', (err) => {
        wsConnected = false;
        console.error('Upstox WebSocket error:', err.message);
        upstoxWS.close();
      });
    }
    connectUpstoxWS();

    io.on('connection', (socket) => {
      console.log('Socket.IO client connected:', socket.id);
      socket.on('subscribe', (symbol) => {
        if (!symbolSubscriptions[symbol]) {
          symbolSubscriptions[symbol] = 0;
        }
        symbolSubscriptions[symbol]++;
        socket.join(symbol);
        // Subscribe to symbol on Upstox if not already
        if (wsConnected && symbolSubscriptions[symbol] === 1) {
          upstoxWS.send(JSON.stringify({
            guid: 'sub-' + symbol,
            method: 'subscribe',
            data: { instruments: [symbol] }
          }));
        }
      });
      socket.on('unsubscribe', (symbol) => {
        if (symbolSubscriptions[symbol]) {
          symbolSubscriptions[symbol]--;
          if (symbolSubscriptions[symbol] <= 0) {
            delete symbolSubscriptions[symbol];
            // Unsubscribe from symbol on Upstox
            if (wsConnected) {
              upstoxWS.send(JSON.stringify({
                guid: 'unsub-' + symbol,
                method: 'unsubscribe',
                data: { instruments: [symbol] }
              }));
            }
          }
        }
        socket.leave(symbol);
      });
      socket.on('disconnect', () => {
        console.log('Socket.IO client disconnected:', socket.id);
        // Clean up subscriptions
        for (const symbol of Object.keys(symbolSubscriptions)) {
          if (socket.rooms.has(symbol)) {
            symbolSubscriptions[symbol]--;
            if (symbolSubscriptions[symbol] <= 0) {
              delete symbolSubscriptions[symbol];
              if (wsConnected) {
                upstoxWS.send(JSON.stringify({
                  guid: 'unsub-' + symbol,
                  method: 'unsubscribe',
                  data: { instruments: [symbol] }
                }));
              }
            }
          }
        }
      });
    });
    // --- End Socket.IO Real-Time Price Relay ---

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`MongoDB connection status: ${dbConnected ? 'Connected' : 'Not connected'}`);
      if (!dbConnected) {
        console.log('WARNING: MongoDB is not connected. Registration and login will not work.');
        console.log('Please follow the instructions above to set up MongoDB.');
      }
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} signal received. Starting graceful shutdown...`);
      
      // Set a timeout for forceful shutdown
      const forceExit = setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
      
      server.close(async () => {
        console.log('HTTP server closed');
        try {
          await mongoose.connection.close();
          console.log('MongoDB connection closed');
          clearTimeout(forceExit);
          process.exit(0);
        } catch (err) {
          console.error('Error during shutdown:', err);
          process.exit(1);
        }
      });
    };

    // Handle various shutdown signals
    ['SIGTERM', 'SIGINT', 'SIGUSR2'].forEach(signal => {
      process.on(signal, () => gracefulShutdown(signal));
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Trying port ${PORT + 1}`);
        PORT++;
        startServer();
      } else {
        console.error('Server error:', error);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer(); 