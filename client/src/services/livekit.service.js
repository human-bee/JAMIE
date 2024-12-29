import {
  Room,
  RoomEvent,
  RemoteParticipant,
  LocalParticipant,
  RemoteTrack,
  createLocalTracks,
  VideoPresets
} from 'livekit-client';

class LiveKitService {
  constructor() {
    this.room = null;
    this.localParticipant = null;
    this.onParticipantConnected = null;
    this.onParticipantDisconnected = null;
    this.onTrackSubscribed = null;
    this.onTrackUnsubscribed = null;
    this.onError = null;
  }

  async connect(url, token, options = {}) {
    try {
      // Create a new room instance
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: VideoPresets.h720.resolution,
        },
        ...options
      });

      // Set up room event handlers
      this.room
        .on(RoomEvent.ParticipantConnected, this.handleParticipantConnected.bind(this))
        .on(RoomEvent.ParticipantDisconnected, this.handleParticipantDisconnected.bind(this))
        .on(RoomEvent.TrackSubscribed, this.handleTrackSubscribed.bind(this))
        .on(RoomEvent.TrackUnsubscribed, this.handleTrackUnsubscribed.bind(this))
        .on(RoomEvent.ConnectionStateChanged, this.handleConnectionStateChanged.bind(this))
        .on(RoomEvent.Disconnected, this.handleDisconnected.bind(this))
        .on(RoomEvent.MediaDevicesError, this.handleError.bind(this));

      // Connect to the room
      await this.room.connect(url, token);
      this.localParticipant = this.room.localParticipant;

      // Create and publish local tracks
      const tracks = await createLocalTracks({
        audio: true,
        video: false // We only need audio for JAMIE
      });

      await Promise.all(
        tracks.map(track => this.localParticipant.publishTrack(track))
      );

      return this.room;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async disconnect() {
    if (this.room) {
      this.room.disconnect();
      this.room = null;
      this.localParticipant = null;
    }
  }

  // Event handlers
  handleParticipantConnected(participant) {
    console.log('Participant connected:', participant.identity);
    if (this.onParticipantConnected) {
      this.onParticipantConnected(participant);
    }
  }

  handleParticipantDisconnected(participant) {
    console.log('Participant disconnected:', participant.identity);
    if (this.onParticipantDisconnected) {
      this.onParticipantDisconnected(participant);
    }
  }

  handleTrackSubscribed(track, publication, participant) {
    console.log('Track subscribed:', track.kind, 'from', participant.identity);
    if (this.onTrackSubscribed) {
      this.onTrackSubscribed(track, publication, participant);
    }
  }

  handleTrackUnsubscribed(track, publication, participant) {
    console.log('Track unsubscribed:', track.kind, 'from', participant.identity);
    if (this.onTrackUnsubscribed) {
      this.onTrackUnsubscribed(track, publication, participant);
    }
  }

  handleConnectionStateChanged(state) {
    console.log('Connection state changed:', state);
  }

  handleDisconnected() {
    console.log('Disconnected from room');
  }

  handleError(error) {
    console.error('LiveKit error:', error);
    if (this.onError) {
      this.onError(error);
    }
  }

  // Audio control methods
  async muteMicrophone() {
    if (this.localParticipant) {
      await this.localParticipant.setMicrophoneEnabled(false);
    }
  }

  async unmuteMicrophone() {
    if (this.localParticipant) {
      await this.localParticipant.setMicrophoneEnabled(true);
    }
  }

  isMicrophoneMuted() {
    return this.localParticipant ? !this.localParticipant.isMicrophoneEnabled : true;
  }

  // Room state methods
  getParticipants() {
    return this.room ? Array.from(this.room.participants.values()) : [];
  }

  getLocalParticipant() {
    return this.localParticipant;
  }

  isConnected() {
    return this.room ? this.room.state === 'connected' : false;
  }
}

// Create and export a singleton instance
const livekitService = new LiveKitService();
export default livekitService; 