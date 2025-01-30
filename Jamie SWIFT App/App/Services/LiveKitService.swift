import Foundation
import LiveKit
import Combine
import AVFoundation

class LiveKitService: ObservableObject {
    @Published var isConnected: Bool = false
    @Published var room: Room?
    @Published var participants: [Participant] = []
    @Published var speakingParticipants: Set<String> = []
    
    private var cancellables = Set<AnyCancellable>()
    private let transcriptionManager: TranscriptionManager
    private let audioLevelThreshold: Float = 0.1 // Adjust this value to change speaking detection sensitivity
    
    init(transcriptionManager: TranscriptionManager) {
        self.transcriptionManager = transcriptionManager
        setupAudioSession()
    }
    
    private func setupAudioSession() {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetooth, .defaultToSpeaker])
            try audioSession.setActive(true)
        } catch {
            print("Failed to setup audio session: \(error.localizedDescription)")
        }
    }
    
    func startPremiumSession() async throws {
        // Get LiveKit credentials from keychain
        guard let credentials = try? APIKeys.liveKit.getCredentials(),
              let wsURL = credentials.wsURL,
              !credentials.apiKey.isEmpty,
              !credentials.apiSecret!.isEmpty else {
            throw APIError.missingCredentials
        }
        
        // Generate a random room name for the premium session
        let roomName = "premium-\(UUID().uuidString)"
        
        // Create a token with the room name
        let token = try generateToken(roomName: roomName, apiKey: credentials.apiKey, apiSecret: credentials.apiSecret!)
        
        // Connect to the room
        guard let url = URL(string: wsURL) else {
            throw URLError(.badURL)
        }
        
        try await connect(url: url, token: token, isPremium: true)
    }
    
    private func generateToken(roomName: String, apiKey: String, apiSecret: String) throws -> String {
        // This is a placeholder - you would typically use a JWT library to generate the token
        // For now, we'll use a backend endpoint or the LiveKit server's token generation
        return "YOUR_GENERATED_TOKEN" // Replace with actual token generation
    }
    
    func connect(url: URL, token: String, isPremium: Bool = false) async {
        let newRoom = Room()
        self.room = newRoom
        
        newRoom.delegate = self
        
        do {
            try await newRoom.connect(url.absoluteString, token)
            
            if isPremium {
                // Configure premium quality settings
                try await configurePremiumQuality()
            }
            
            await MainActor.run {
                self.isConnected = true
                self.subscribeToAudioTracks()
            }
        } catch {
            print("Failed to connect: \(error.localizedDescription)")
            await MainActor.run {
                self.isConnected = false
                self.room = nil
            }
        }
    }
    
    private func configurePremiumQuality() async throws {
        guard let room = room else { return }
        
        // Configure video quality
        let videoConfig = VideoPublishOptions(
            dimensions: .init(width: 1920, height: 1080),
            maxBitrate: 4_000_000, // 4 Mbps for high quality
            maxFrameRate: 30
        )
        
        // Configure audio quality
        let audioConfig = AudioPublishOptions(
            name: "premium-audio",
            bitrate: 128_000, // 128 kbps for high quality audio
            dtx: false, // Disable discontinuous transmission for better quality
            stereo: true
        )
        
        // Apply configurations
        try await room.localParticipant?.setVideoPublishOptions(videoConfig)
        try await room.localParticipant?.setAudioPublishOptions(audioConfig)
    }
    
    func disconnect() {
        room?.disconnect()
        room = nil
        isConnected = false
        participants.removeAll()
    }
    
    private func subscribeToAudioTracks() {
        guard let room = room else { return }
        
        // Subscribe to existing participants
        for participant in room.remoteParticipants.values {
            handleNewParticipant(participant)
        }
    }
    
    private func handleNewParticipant(_ participant: RemoteParticipant) {
        participant.delegate = self
        
        // Subscribe to audio tracks
        for publication in participant.audioTracks.values {
            publication.subscribe()
            if let track = publication.track as? RemoteAudioTrack {
                track.add(delegate: self)
            }
        }
        
        // Add to participants list
        DispatchQueue.main.async {
            self.participants.append(participant)
        }
    }
}

extension LiveKitService: RoomDelegate {
    func room(_ room: Room, participant: RemoteParticipant, didSubscribe publication: RemoteTrackPublication, track: Track) {
        if track is RemoteAudioTrack {
            track.add(delegate: self)
        }
    }
    
    func room(_ room: Room, didConnect connectionInfo: ConnectionInfo) {
        print("Connected to room: \(connectionInfo.room)")
    }
    
    func room(_ room: Room, didDisconnect error: Error?) {
        DispatchQueue.main.async {
            self.isConnected = false
            self.room = nil
            self.participants.removeAll()
        }
    }
    
    func room(_ room: Room, participant: RemoteParticipant, didPublish publication: RemoteTrackPublication) {
        if publication.kind == .audio {
            publication.subscribe()
        }
    }
    
    func room(_ room: Room, didAdd participant: RemoteParticipant) {
        handleNewParticipant(participant)
    }
    
    func room(_ room: Room, didRemove participant: RemoteParticipant, reason: DisconnectReason) {
        DispatchQueue.main.async {
            self.participants.removeAll { $0.sid == participant.sid }
        }
    }
}

extension LiveKitService: ParticipantDelegate {
    func participant(_ participant: Participant, didUpdate publication: TrackPublication) {
        if let audioTrack = publication.track as? RemoteAudioTrack {
            audioTrack.add(delegate: self)
        }
    }
}

extension LiveKitService: AudioTrackDelegate {
    func track(_ track: Track, didUpdate audioLevel: Float) {
        if audioLevel > audioLevelThreshold {
            if let participant = (track as? RemoteAudioTrack)?.participant {
                DispatchQueue.main.async {
                    self.speakingParticipants.insert(participant.sid)
                    
                    // Remove participant from speaking list after a delay
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                        self.speakingParticipants.remove(participant.sid)
                    }
                }
            }
        }
    }
    
    func audioTrack(_ track: AudioTrack, didReceive audioFrame: AudioFrame) {
        // Convert audio frame to format expected by TranscriptionManager
        let participantId = (track as? RemoteAudioTrack)?.participant?.identity ?? "Unknown"
        
        // Process remote audio through transcription
        // Note: This is a placeholder - you'll need to implement the actual audio processing
        // transcriptionManager.processRemoteAudio(audioFrame.data, sampleRate: audioFrame.sampleRate, participantId: participantId)
    }
} 