import Foundation
import LiveKit
import Combine
import AVFoundation

class LiveKitService: ObservableObject {
    @Published var isConnected: Bool = false
    @Published var room: Room?
    @Published var participants: [Participant] = []
    
    private var cancellables = Set<AnyCancellable>()
    private let transcriptionManager: TranscriptionManager
    
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
    
    func connect(url: URL, token: String) async {
        let newRoom = Room()
        self.room = newRoom
        
        newRoom.delegate = self
        
        do {
            try await newRoom.connect(url.absoluteString, token)
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
        // Optional: Handle audio level updates for UI feedback
    }
    
    func audioTrack(_ track: AudioTrack, didReceive audioFrame: AudioFrame) {
        // Convert audio frame to format expected by TranscriptionManager
        let participantId = (track as? RemoteAudioTrack)?.participant?.identity ?? "Unknown"
        
        // Process remote audio through transcription
        // Note: This is a placeholder - you'll need to implement the actual audio processing
        // transcriptionManager.processRemoteAudio(audioFrame.data, sampleRate: audioFrame.sampleRate, participantId: participantId)
    }
} 