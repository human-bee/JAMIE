import Foundation
import AVFoundation
import Speech

class TranscriptionManager: NSObject, ObservableObject {
    @Published var isRecording = false
    @Published var transcript = ""
    @Published var canStartNewSession = true
    
    private var audioEngine = AVAudioEngine()
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private var restartTimer: Timer?
    
    // Remote audio processing
    private var remoteAudioConverter: AVAudioConverter?
    private var remoteAudioFormat: AVAudioFormat?
    
    override init() {
        super.init()
        requestPermissions()
        setupRemoteAudioProcessing()
    }
    
    private func setupRemoteAudioProcessing() {
        // Setup format for remote audio processing
        guard let format = AVAudioFormat(commonFormat: .pcmFormatFloat32,
                                       sampleRate: 48000,
                                       channels: 1,
                                       interleaved: false) else {
            print("Failed to create audio format")
            return
        }
        remoteAudioFormat = format
    }
    
    private func requestPermissions() {
        SFSpeechRecognizer.requestAuthorization { status in
            DispatchQueue.main.async {
                switch status {
                case .authorized:
                    print("Speech recognition authorized")
                case .denied:
                    print("Speech recognition authorization denied")
                case .restricted:
                    print("Speech recognition restricted on this device")
                case .notDetermined:
                    print("Speech recognition not yet authorized")
                @unknown default:
                    print("Unknown authorization status")
                }
            }
        }
        
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
            DispatchQueue.main.async {
                if granted {
                    print("Microphone access granted")
                } else {
                    print("Microphone access denied")
                }
            }
        }
    }
    
    func startRecording() {
        guard !isRecording && canStartNewSession else { return }
        canStartNewSession = false
        
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
            
            recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
            guard let recognitionRequest = recognitionRequest else { return }
            
            recognitionRequest.shouldReportPartialResults = true
            
            let inputNode = audioEngine.inputNode
            recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { [weak self] result, error in
                guard let self = self else { return }
                
                if let result = result {
                    DispatchQueue.main.async {
                        self.transcript = result.bestTranscription.formattedString
                    }
                }
                
                if error != nil || result?.isFinal == true {
                    self.stopRecording()
                    
                    // Schedule a restart after a short delay if we're in continuous mode
                    DispatchQueue.main.async {
                        self.restartTimer?.invalidate()
                        self.restartTimer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: false) { [weak self] _ in
                            self?.canStartNewSession = true
                            self?.startRecording()
                        }
                    }
                }
            }
            
            let recordingFormat = inputNode.outputFormat(forBus: 0)
            inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
                recognitionRequest.append(buffer)
            }
            
            audioEngine.prepare()
            try audioEngine.start()
            
            isRecording = true
        } catch {
            print("Recording failed to start: \(error.localizedDescription)")
            canStartNewSession = true
        }
    }
    
    func stopRecording() {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        restartTimer?.invalidate()
        restartTimer = nil
        
        isRecording = false
        canStartNewSession = true
        
        do {
            try AVAudioSession.sharedInstance().setActive(false)
        } catch {
            print("Failed to deactivate audio session: \(error.localizedDescription)")
        }
    }
    
    // Handle remote audio from LiveKit
    func processRemoteAudio(_ audioData: Data, sampleRate: Double, participantId: String) {
        guard let format = remoteAudioFormat else { return }
        
        // Convert audio data to buffer
        let frameCount = audioData.count / MemoryLayout<Float>.size
        let audioBuffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(frameCount))
        
        audioData.withUnsafeBytes { ptr in
            if let floatPtr = ptr.baseAddress?.assumingMemoryBound(to: Float.self) {
                audioBuffer?.floatChannelData?[0].assign(from: floatPtr, count: frameCount)
                audioBuffer?.frameLength = AVAudioFrameCount(frameCount)
            }
        }
        
        // Create a new recognition request for remote audio if needed
        if recognitionRequest == nil {
            recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
            recognitionRequest?.shouldReportPartialResults = true
            
            recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest!) { [weak self] result, error in
                guard let self = self else { return }
                
                if let result = result {
                    DispatchQueue.main.async {
                        // Append participant ID to transcript
                        let newTranscript = "(\(participantId)): \(result.bestTranscription.formattedString)"
                        self.transcript = newTranscript
                    }
                }
                
                if error != nil || result?.isFinal == true {
                    self.recognitionRequest = nil
                    self.recognitionTask = nil
                }
            }
        }
        
        // Append the audio buffer to the recognition request
        if let buffer = audioBuffer {
            recognitionRequest?.append(buffer)
        }
    }
    
    deinit {
        stopRecording()
    }
} 