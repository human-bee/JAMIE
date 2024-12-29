import express from 'express';
import {
  handleChatMessage,
  handleTranscriptionUpdate,
  handleTextToSpeech,
  handleFileInsight
} from '../controllers/ai.controller.js';

const router = express.Router();

// Handle chat messages and generate AI responses
router.post('/chat', handleChatMessage);

// Handle transcription updates and generate insights
router.post('/transcription', handleTranscriptionUpdate);

// Generate text-to-speech audio
router.get('/tts', handleTextToSpeech);

// Generate insights for uploaded files
router.post('/file-insight', handleFileInsight);

export default router; 