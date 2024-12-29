const express = require('express');
const router = express.Router();
const { AccessToken } = require('livekit-server-sdk');
const sessionController = require('../controllers/sessionController');
const logger = require('../utils/logger');

// Create a new session
router.post('/', sessionController.createSession);

// Join an existing session
router.post('/:roomName/join', sessionController.joinSession);

// Get session details
router.get('/:roomName', sessionController.getSession);

// End a session
router.post('/:roomName/end', sessionController.endSession);

// List active sessions
router.get('/', sessionController.listSessions);

// Get session token (for rejoining)
router.post('/:roomName/token', (req, res) => {
  try {
    const { roomName } = req.params;
    const { identity, participantName } = req.body;
    
    if (!roomName || !identity || !participantName) {
      return res.status(400).json({ 
        error: 'Room name, identity, and participant name are required' 
      });
    }

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity,
        name: participantName
      }
    );

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true
    });

    const token = at.toJwt();
    res.json({ token });
  } catch (error) {
    logger.error('Error creating session token:', error);
    res.status(500).json({ error: 'Failed to create session token' });
  }
});

module.exports = router; 