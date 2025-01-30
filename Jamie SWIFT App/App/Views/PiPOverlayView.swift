import SwiftUI
import LiveKit

struct PiPOverlayView: View {
    @ObservedObject var liveKitService: LiveKitService
    @State private var speakingParticipants: Set<String> = []
    @State private var participantOffsets: [String: CGSize] = [:] // Store custom positions
    private let fadeOutDuration: TimeInterval = 0.6 // Shorter fade duration
    
    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .topTrailing) {
                ForEach(Array(liveKitService.participants.enumerated()), id: \.element.sid) { index, participant in
                    if let track = participant.videoTracks.values.first?.track as? RemoteVideoTrack {
                        VideoOverlayView(participant: participant,
                                       track: track,
                                       index: index,
                                       offset: participantOffsets[participant.sid] ?? .zero,
                                       onDragChanged: { newOffset in
                                           participantOffsets[participant.sid] = newOffset
                                       })
                            .frame(width: 160, height: 90)
                            .cornerRadius(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.white.opacity(0.3), lineWidth: 2)
                            )
                            .shadow(radius: 4)
                            .opacity(speakingParticipants.contains(participant.sid) ? 1.0 : 0.7)
                            .animation(.easeInOut(duration: fadeOutDuration), value: speakingParticipants.contains(participant.sid))
                            .position(calculatePosition(for: index, in: geometry.size, offset: participantOffsets[participant.sid] ?? .zero))
                    }
                }
            }
        }
        .onReceive(liveKitService.$speakingParticipants) { speaking in
            speakingParticipants = speaking
        }
    }
    
    private func calculatePosition(for index: Int, in size: CGSize, offset: CGSize) -> CGPoint {
        let basePosition = positionForIndex(index, in: size)
        return CGPoint(x: basePosition.x + offset.width,
                      y: basePosition.y + offset.height)
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
    let offset: CGSize
    let onDragChanged: (CGSize) -> Void
    
    @GestureState private var dragState = CGSize.zero
    
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
        .offset(x: offset.width + dragState.width, y: offset.height + dragState.height)
        .gesture(
            DragGesture()
                .updating($dragState) { value, state, _ in
                    state = value.translation
                }
                .onEnded { value in
                    let newOffset = CGSize(
                        width: offset.width + value.translation.width,
                        height: offset.height + value.translation.height
                    )
                    onDragChanged(newOffset)
                }
        )
    }
} 