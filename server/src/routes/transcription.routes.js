const express = require('express');
const router = express.Router();
const transcriptionController = require('../controllers/transcriptionController');

// Start transcription for a session
router.post('/:sessionId/start', transcriptionController.startTranscription);

// Process audio chunk
router.post('/:sessionId/process', transcriptionController.processAudioChunk);

// Complete transcription
router.post('/:sessionId/complete', transcriptionController.completeTranscription);

// Get transcript
router.get('/:sessionId', transcriptionController.getTranscript);

module.exports = router; 