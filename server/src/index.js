require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const routes = require('./routes');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));  // For handling large audio chunks
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Connect to MongoDB
logger.info('Attempting to connect to MongoDB...');
logger.info(`MongoDB URI: ${process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info('Successfully connected to MongoDB');
    
    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      logger.info(`✨ Server is running on http://localhost:${PORT}`);
      logger.info('Available routes:');
      logger.info('- POST /api/sessions');
      logger.info('- POST /api/sessions/:roomName/join');
      logger.info('- GET /api/sessions/:roomName');
      logger.info('- POST /api/transcriptions/:sessionId/start');
      logger.info('- POST /api/transcriptions/:sessionId/process');
    }).on('error', (err) => {
      logger.error('Failed to start server:', err);
      process.exit(1);
    });
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }); 