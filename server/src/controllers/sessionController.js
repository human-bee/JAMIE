const { AccessToken } = require('livekit-server-sdk');
const { Session } = require('../models');
const logger = require('../utils/logger');

/**
 * Create a new session and LiveKit room
 */
exports.createSession = async (req, res) => {
  try {
    const { title, description, tags } = req.body;

    // Generate a unique room name
    const roomName = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create session in database
    const session = await Session.create({
      roomName,
      metadata: {
        title: title || `Session ${new Date().toLocaleDateString()}`,
        description,
        tags
      }
    });

    // Generate LiveKit token for the host
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: req.body.hostIdentity || 'host',
        name: req.body.hostName || 'Host'
      }
    );

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true
    });

    const token = at.toJwt();

    res.status(201).json({
      success: true,
      data: {
        session,
        token,
        roomName
      }
    });
  } catch (error) {
    logger.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session'
    });
  }
};

/**
 * Join an existing session
 */
exports.joinSession = async (req, res) => {
  try {
    const { roomName } = req.params;
    const { identity, participantName, role = 'guest' } = req.body;

    // Find session
    const session = await Session.findOne({ roomName });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Generate LiveKit token
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

    // Add participant to session
    await session.addParticipant({
      identity,
      name: participantName,
      role
    });

    res.json({
      success: true,
      data: {
        token,
        session
      }
    });
  } catch (error) {
    logger.error('Error joining session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join session'
    });
  }
};

/**
 * Get session details
 */
exports.getSession = async (req, res) => {
  try {
    const { roomName } = req.params;
    
    const session = await Session.findOne({ roomName });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    logger.error('Error getting session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session'
    });
  }
};

/**
 * End a session
 */
exports.endSession = async (req, res) => {
  try {
    const { roomName } = req.params;
    
    const session = await Session.findOne({ roomName });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    await session.endSession();

    res.json({
      success: true,
      message: 'Session ended successfully'
    });
  } catch (error) {
    logger.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session'
    });
  }
};

/**
 * List active sessions
 */
exports.listSessions = async (req, res) => {
  try {
    const sessions = await Session.findActive();
    
    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    logger.error('Error listing sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list sessions'
    });
  }
}; 