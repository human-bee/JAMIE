import SwiftUI

struct ContentView: View {
    @StateObject private var transcriptionManager = TranscriptionManager()
    @StateObject private var liveKitService: LiveKitService
    @State private var showingConnectionSheet = false
    @State private var roomURL = ""
    @State private var token = ""
    @State private var showCanvas = false
    @State private var premiumMode = false
    @State private var showError = false
    @State private var errorMessage = ""
    
    init() {
        let transcriptionManager = TranscriptionManager()
        _transcriptionManager = StateObject(wrappedValue: transcriptionManager)
        _liveKitService = StateObject(wrappedValue: LiveKitService(transcriptionManager: transcriptionManager))
    }
    
    var body: some View {
        NavigationView {
            VStack {
                // LiveKit Connection Status
                HStack {
                    if liveKitService.isConnected {
                        Label(premiumMode ? "Premium Session" : "Connected", 
                              systemImage: premiumMode ? "star.fill" : "circle.fill")
                            .foregroundColor(premiumMode ? .yellow : .green)
                        Button(premiumMode ? "End Premium" : "Disconnect") {
                            liveKitService.disconnect()
                            premiumMode = false
                        }
                        .buttonStyle(.bordered)
                        .tint(premiumMode ? .yellow : .blue)
                    } else {
                        Label("Disconnected", systemImage: "circle.fill")
                            .foregroundColor(.red)
                        
                        // Premium Session Button
                        Button(action: {
                            Task {
                                do {
                                    try await liveKitService.startPremiumSession()
                                    premiumMode = true
                                } catch {
                                    errorMessage = error.localizedDescription
                                    showError = true
                                }
                            }
                        }) {
                            Label("Start Premium Session", systemImage: "star.fill")
                                .padding(.horizontal)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.yellow)
                        
                        // Keep the regular connect button for development
                        Button("Connect") {
                            showingConnectionSheet = true
                        }
                        .buttonStyle(.bordered)
                    }
                }
                .padding()
                
                // Participants List
                if !liveKitService.participants.isEmpty {
                    VStack(alignment: .leading) {
                        Text("Participants:")
                            .font(.headline)
                        ForEach(liveKitService.participants, id: \.sid) { participant in
                            Label(participant.identity ?? "Unknown", systemImage: "person")
                        }
                    }
                    .padding()
                }
                
                // Transcription Controls
                HStack {
                    if transcriptionManager.isRecording {
                        Button("Stop Recording") {
                            transcriptionManager.stopRecording()
                        }
                        .buttonStyle(.bordered)
                        .tint(.red)
                    } else {
                        Button("Start Recording") {
                            transcriptionManager.startRecording()
                        }
                        .buttonStyle(.bordered)
                        .tint(.green)
                    }
                }
                .padding()
                
                // Transcript Display
                ScrollView {
                    Text(transcriptionManager.transcript)
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                
                // Canvas Toggle
                Toggle("Show Canvas", isOn: $showCanvas)
                    .padding()
                
                if showCanvas {
                    ZStack {
                        CanvasView()
                        
                        if premiumMode {
                            PiPOverlayView(liveKitService: liveKitService)
                        }
                    }
                }
            }
            .sheet(isPresented: $showingConnectionSheet) {
                ConnectionSheet(roomURL: $roomURL, token: $token, isPresented: $showingConnectionSheet) { url, token in
                    Task {
                        if let url = URL(string: url) {
                            await liveKitService.connect(url: url, token: token)
                        }
                    }
                }
            }
            .alert("Connection Error", isPresented: $showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage)
            }
        }
    }
}

struct ConnectionSheet: View {
    @Binding var roomURL: String
    @Binding var token: String
    @Binding var isPresented: Bool
    let onConnect: (String, String) -> Void
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("LiveKit Connection")) {
                    TextField("Room URL", text: $roomURL)
                    TextField("Token", text: $token)
                }
                
                Button("Connect") {
                    onConnect(roomURL, token)
                    isPresented = false
                }
                .disabled(roomURL.isEmpty || token.isEmpty)
            }
            .navigationTitle("Connect to Room")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        isPresented = false
                    }
                }
            }
        }
    }
}

#Preview {
    ContentView()
} 