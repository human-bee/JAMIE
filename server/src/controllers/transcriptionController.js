const { OpenAI } = require('openai');
const { Transcript, Session } = require('../models');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../../temp');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, `audio_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware for handling file upload
const handleAudioUpload = upload.single('file');

/**
 * Start a new transcription session
 */
exports.startTranscription = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Verify session exists
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Create new transcript document
    const transcript = await Transcript.create({
      sessionId,
      status: 'in_progress',
      metadata: {
        language: req.body.language || 'en',
        transcriptionModel: 'whisper-1'
      }
    });

    res.status(201).json({
      success: true,
      data: transcript
    });
  } catch (error) {
    logger.error('Error starting transcription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start transcription'
    });
  }
};

/**
 * Process audio chunk and return transcription
 */
exports.processAudioChunk = async (req, res) => {
  handleAudioUpload(req, res, async (err) => {
    if (err) {
      logger.error('Error uploading file:', err);
      return res.status(400).json({
        success: false,
        error: 'Error uploading audio file',
        details: err.message
      });
    }

    try {
      const { sessionId } = req.params;
      const { timestamp, speaker } = req.body;
      const audioFile = req.file;

      logger.info(`Processing audio chunk for session ${sessionId}`);

      if (!audioFile) {
        logger.warn('No audio file provided');
        return res.status(400).json({
          success: false,
          error: 'Audio file is required'
        });
      }

      // Find existing transcript
      const transcript = await Transcript.findOne({ 
        sessionId, 
        status: 'in_progress' 
      });

      if (!transcript) {
        logger.warn(`No active transcript found for session ${sessionId}`);
        await fs.promises.unlink(audioFile.path);
        return res.status(404).json({
          success: false,
          error: 'Active transcript not found'
        });
      }

      try {
        // Transcribe with Whisper
        logger.info('Sending audio to Whisper API');
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(audioFile.path),
          model: 'whisper-1',
          language: transcript.metadata.language,
          response_format: 'json'
        });

        // Skip if no text was transcribed
        if (!transcription.text || transcription.text.trim() === '') {
          logger.info('No speech detected in audio chunk');
          return res.json({
            success: true,
            data: {
              message: 'No speech detected in audio chunk'
            }
          });
        }

        // Calculate confidence (default to 1 if segments not available)
        const confidence = transcription.segments?.length > 0
          ? transcription.segments.reduce((acc, seg) => acc + (seg.confidence || 0), 0) / transcription.segments.length
          : 1;

        // Create utterance
        const utterance = {
          speaker: speaker || 'unknown',
          text: transcription.text.trim(),
          startTime: new Date(Number(timestamp)),
          endTime: new Date(Number(timestamp) + (transcription.duration || 1) * 1000),
          confidence,
          analysis: {
            topics: [],
            entities: [],
            factChecks: []
          }
        };

        // Add utterance to transcript
        logger.debug('Adding utterance to transcript');
        await transcript.addUtterance(utterance);

        // Update processing stats
        transcript.metadata.processingStats = {
          ...transcript.metadata.processingStats,
          totalDuration: (transcript.metadata.processingStats?.totalDuration || 0) + (transcription.duration || 1),
          wordCount: (transcript.metadata.processingStats?.wordCount || 0) + transcription.text.split(' ').length,
          averageConfidence: confidence
        };
        await transcript.save();

        logger.info('Successfully processed audio chunk');
        res.json({
          success: true,
          data: {
            utterance,
            transcript
          }
        });
      } finally {
        // Clean up temp file
        logger.debug('Cleaning up temporary file');
        await fs.promises.unlink(audioFile.path);
      }
    } catch (error) {
      logger.error('Error processing audio chunk:', {
        error: error.message,
        stack: error.stack,
        details: error.response?.data
      });
      res.status(500).json({
        success: false,
        error: 'Failed to process audio chunk',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
};

/**
 * Complete transcription session
 */
exports.completeTranscription = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const transcript = await Transcript.findOne({ 
      sessionId, 
      status: 'in_progress' 
    });

    if (!transcript) {
      return res.status(404).json({
        success: false,
        error: 'Active transcript not found'
      });
    }

    // Update status and final stats
    await transcript.complete();

    res.json({
      success: true,
      data: transcript
    });
  } catch (error) {
    logger.error('Error completing transcription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete transcription'
    });
  }
};

/**
 * Get transcript
 */
exports.getTranscript = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const transcript = await Transcript.findBySession(sessionId);
    if (!transcript) {
      return res.status(404).json({
        success: false,
        error: 'Transcript not found'
      });
    }

    res.json({
      success: true,
      data: transcript
    });
  } catch (error) {
    logger.error('Error getting transcript:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transcript'
    });
  }
}; 