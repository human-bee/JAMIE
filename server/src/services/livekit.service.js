import { AccessToken } from 'livekit-server-sdk';
import { v4 as uuidv4 } from 'uuid';

class LiveKitService {
  constructor() {
    this.apiKey = process.env.LIVEKIT_API_KEY;
    this.apiSecret = process.env.LIVEKIT_API_SECRET;
    this.wsUrl = process.env.LIVEKIT_WS_URL;
  }

  /**
   * Generate a token for a participant to join a room
   * @param {string} roomName - The name of the room to join
   * @param {string} participantIdentity - The unique identifier for the participant
   * @param {object} metadata - Additional metadata about the participant
   * @returns {string} The access token
   */
  generateToken(roomName, participantIdentity, metadata = {}) {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('LiveKit API key and secret must be configured');
    }

    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantIdentity,
      metadata: JSON.stringify(metadata)
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    return at.toJwt();
  }

  /**
   * Create a new room with a unique name
   * @param {string} prefix - Optional prefix for the room name
   * @returns {object} Room details including name and token
   */
  createRoom(prefix = 'jamie') {
    const roomName = `${prefix}-${uuidv4()}`;
    const hostIdentity = `host-${uuidv4()}`;
    
    const token = this.generateToken(roomName, hostIdentity, {
      name: 'Host',
      role: 'host'
    });

    return {
      roomName,
      hostIdentity,
      token,
      wsUrl: this.wsUrl
    };
  }

  /**
   * Generate a token for a guest to join an existing room
   * @param {string} roomName - The name of the room to join
   * @param {string} guestName - The display name for the guest
   * @returns {object} Guest details including identity and token
   */
  addGuestToRoom(roomName, guestName) {
    const guestIdentity = `guest-${uuidv4()}`;
    
    const token = this.generateToken(roomName, guestIdentity, {
      name: guestName,
      role: 'guest'
    });

    return {
      guestIdentity,
      token,
      wsUrl: this.wsUrl
    };
  }

  /**
   * Generate a token for JAMIE AI to join a room
   * @param {string} roomName - The name of the room to join
   * @returns {object} AI details including identity and token
   */
  addAIToRoom(roomName) {
    const aiIdentity = `jamie-${uuidv4()}`;
    
    const token = this.generateToken(roomName, aiIdentity, {
      name: 'JAMIE',
      role: 'ai',
      isAI: true
    });

    return {
      aiIdentity,
      token,
      wsUrl: this.wsUrl
    };
  }

  /**
   * Validate a room name
   * @param {string} roomName - The room name to validate
   * @returns {boolean} Whether the room name is valid
   */
  isValidRoomName(roomName) {
    return typeof roomName === 'string' && 
           roomName.startsWith('jamie-') && 
           roomName.length > 10;
  }
}

// Create and export a singleton instance
const livekitService = new LiveKitService();
export default livekitService; 