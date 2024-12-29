const express = require('express');
const router = express.Router();
const { AccessToken } = require('livekit-server-sdk');
const logger = require('../utils/logger');

// Create a new session token
router.post('/token', (req, res) => {
  try {
    const { roomName, participantName } = req.body;
    
    if (!roomName || !participantName) {
      return res.status(400).json({ 
        error: 'Room name and participant name are required' 
      });
    }

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: participantName,
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

// Get active session info
router.get('/:roomName', (req, res) => {
  const { roomName } = req.params;
  // TODO: Implement room status check with LiveKit API
  res.json({ 
    roomName,
    status: 'active',
    participantCount: 0
  });
});

module.exports = router; 