const express = require('express');
const router = express.Router();

// Import route modules
const sessionRoutes = require('./session.routes');
const whiteboardRoutes = require('./whiteboard.routes');
const aiRoutes = require('./ai.routes');

// Mount routes
router.use('/sessions', sessionRoutes);
router.use('/whiteboard', whiteboardRoutes);
router.use('/ai', aiRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router; 