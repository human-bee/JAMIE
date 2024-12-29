import express from 'express';
import uploadRoutes from './upload.routes.js';
import whiteboardRoutes from './whiteboard.routes.js';

const router = express.Router();

// File upload routes
router.use('/upload', uploadRoutes);

// Whiteboard routes (for transcription, etc.)
router.use('/whiteboard', whiteboardRoutes);

export default router; 