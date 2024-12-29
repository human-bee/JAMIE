import express from 'express';
import uploadRoutes from './upload.routes.js';
import whiteboardRoutes from './whiteboard.routes.js';
import roomRoutes from './room.routes.js';
import aiRoutes from './ai.routes.js';

const router = express.Router();

// File upload routes
router.use('/upload', uploadRoutes);

// Whiteboard routes (for transcription, etc.)
router.use('/whiteboard', whiteboardRoutes);

// Room management routes
router.use('/rooms', roomRoutes);

// AI interaction routes
router.use('/ai', aiRoutes);

export default router; 