import express from 'express';
import livekitService from '../services/livekit.service.js';

const router = express.Router();

/**
 * Create a new room
 * POST /api/rooms
 */
router.post('/', async (req, res) => {
  try {
    const roomDetails = livekitService.createRoom();
    
    // Also generate a token for JAMIE to join
    const aiDetails = livekitService.addAIToRoom(roomDetails.roomName);
    
    res.json({
      ...roomDetails,
      ai: aiDetails
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({
      error: 'Failed to create room',
      details: error.message
    });
  }
});

/**
 * Join an existing room as a guest
 * POST /api/rooms/:roomName/join
 */
router.post('/:roomName/join', async (req, res) => {
  try {
    const { roomName } = req.params;
    const { guestName } = req.body;

    if (!guestName) {
      return res.status(400).json({
        error: 'Guest name is required'
      });
    }

    if (!livekitService.isValidRoomName(roomName)) {
      return res.status(400).json({
        error: 'Invalid room name'
      });
    }

    const guestDetails = livekitService.addGuestToRoom(roomName, guestName);
    res.json(guestDetails);
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({
      error: 'Failed to join room',
      details: error.message
    });
  }
});

/**
 * Validate a room name
 * GET /api/rooms/:roomName/validate
 */
router.get('/:roomName/validate', (req, res) => {
  const { roomName } = req.params;
  const isValid = livekitService.isValidRoomName(roomName);
  
  res.json({
    isValid,
    roomName
  });
});

export default router; 