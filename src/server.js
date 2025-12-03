require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// Connect to database
connectDB();

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
    ========================================
    🚀 Server running in ${process.env.NODE_ENV || 'development'} mode
    📡 Port: ${PORT}
    🗄️  Database: ${process.env.MONGODB_URI}
    ========================================
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});
