require('dotenv').config();
require('./config/database');

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Import routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const problemsetRoutes = require('./routes/problemsetRoutes');
const contestRoutes = require('./routes/contestRoutes');

// Import jobs
const { initializeRatingJob } = require('./jobs/ratingJob');

// Initialize Express app
const app = express();

// ==================== CORS Configuration ====================
if (process.env.NODE_ENV === 'production') {
  app.use(cors({
    origin: 'https://one-profile-client.vercel.app',
    credentials: true,
  }));
} else {
  app.use(cors({
    origin: true,
    credentials: true,
  }));
}

// ==================== Middleware ====================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined'));

// ==================== Health Check ====================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'OneProfile Server is running',
    timestamp: new Date().toISOString(),
  });
});

// ==================== API Routes ====================
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/problemset', problemsetRoutes);
app.use('/api/contests', contestRoutes);

// ==================== Error Handling Middleware ====================
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err.message);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err,
  });
});

// ==================== 404 Handler ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ==================== Initialize Scheduled Jobs ====================
initializeRatingJob();

// ==================== Start Server ====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`OneProfile Server started successfully`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`${'='.repeat(60)}\n`);
});

module.exports = app;
