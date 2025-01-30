import SwiftUI
import LiveKit

struct PiPOverlayView: View {
    @ObservedObject var liveKitService: LiveKitService
    @State private var speakingParticipants: Set<String> = []
    
    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .topTrailing) {
                ForEach(Array(liveKitService.participants.enumerated()), id: \.element.sid) { index, participant in
                    if let track = participant.videoTracks.values.first?.track as? RemoteVideoTrack {
                        VideoOverlayView(participant: participant, track: track, index: index)
                            .frame(width: 160, height: 90)
                            .cornerRadius(8)
                            .shadow(radius: 4)
                            .opacity(speakingParticipants.contains(participant.sid) ? 1.0 : 0.7)
                            .animation(.easeInOut(duration: 0.3), value: speakingParticipants.contains(participant.sid))
                            .position(positionForIndex(index, in: geometry.size))
                    }
                }
            }
        }
        .onReceive(liveKitService.$participants) { _ in
            // Update speaking state based on audio levels
            // This will be implemented in LiveKitService
        }
    }
    
    private func positionForIndex(_ index: Int, in size: CGSize) -> CGPoint {
        let padding: CGFloat = 20
        let width: CGFloat = 160
        let height: CGFloat = 90
        
        switch index {
        case 0: return CGPoint(x: size.width - width/2 - padding, y: height/2 + padding)
        case 1: return CGPoint(x: size.width - width/2 - padding, y: height*1.5 + padding*2)
        case 2: return CGPoint(x: size.width - width/2 - padding, y: height*2.5 + padding*3)
        default: return CGPoint(x: size.width - width/2 - padding, y: height*3.5 + padding*4)
        }
    }
}

struct VideoOverlayView: View {
    let participant: RemoteParticipant
    let track: RemoteVideoTrack
    let index: Int
    
    var body: some View {
        ZStack(alignment: .bottomLeading) {
            RemoteVideoView(track: track)
            
            // Participant name label
            Text(participant.identity ?? "Unknown")
                .font(.caption)
                .foregroundColor(.white)
                .padding(4)
                .background(Color.black.opacity(0.5))
                .cornerRadius(4)
                .padding(4)
        }
    }
} 