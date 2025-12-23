const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const statsRoutes = require('./routes/statsRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middleware
app.use(morgan('dev'));
const allowedOrigins = [
  'https://munjiz-jo.online',
  'https://www.munjiz-jo.online',
  'http://localhost:3000',
];

app.use(cors({
  origin(origin, callback) {
    // Allow mobile / tools (no Origin or null)
    if (!origin || origin === 'null') {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth/', authRoutes);
app.use('/api/users/', userRoutes);
app.use('/api/products/', productRoutes);
app.use('/api/orders/', orderRoutes);
app.use('/api/super-admin/', superAdminRoutes);
app.use('/api/upload/', uploadRoutes);
app.use('/api/stats/', statsRoutes);
app.use('/api/subscription/', subscriptionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
