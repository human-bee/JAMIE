import XCTest
@testable import JamieAPIKit

final class APIConnectivityTests: XCTestCase {
    // MARK: - Properties
    
    private var aiService: AIServiceProtocol!
    private var liveKitService: LiveKitServiceProtocol!
    
    // MARK: - Setup & Teardown
    
    override func setUp() {
        super.setUp()
        
        // Initialize services with test configuration
        aiService = OpenAIService(apiKey: TestConfig.openAIKey)
        liveKitService = LiveKitService()
    }
    
    override func tearDown() {
        aiService = nil
        liveKitService = nil
        super.tearDown()
    }
    
    // MARK: - OpenAI Tests
    
    func testOpenAIConnection() async throws {
        let messages = [
            ChatMessage(role: "user", content: "Hello, this is a test message.")
        ]
        
        do {
            let response = try await aiService.sendChatCompletion(
                messages: messages,
                functions: nil,
                temperature: 0.7
            )
            XCTAssertFalse(response.content.isEmpty, "Response should not be empty")
        } catch {
            XCTFail("OpenAI connection failed: \(error)")
        }
    }
    
    func testOpenAIFunctionCalling() async throws {
        let messages = [
            ChatMessage(role: "user", content: "Create a bar chart showing sales data.")
        ]
        
        let functions = [
            AIFunction(
                name: "create_chart",
                description: "Create a chart with the provided data",
                parameters: [
                    "type": "object",
                    "properties": [
                        "chartType": ["type": "string"],
                        "data": ["type": "array"]
                    ]
                ]
            )
        ]
        
        do {
            let response = try await aiService.sendChatCompletion(
                messages: messages,
                functions: functions,
                temperature: 0.7
            )
            XCTAssertNotNil(response.functionCall, "Should receive a function call")
            XCTAssertEqual(response.functionCall?.name, "create_chart", "Function name should match")
        } catch {
            XCTFail("OpenAI function calling failed: \(error)")
        }
    }
    
    // MARK: - LiveKit Tests
    
    func testLiveKitConnection() async throws {
        let url = TestConfig.liveKitURL
        let token = TestConfig.liveKitToken
        
        do {
            try await liveKitService.connect(url: url, token: token, connectOptions: nil)
            XCTAssertEqual(liveKitService.connectionState, .connected)
            XCTAssertNotNil(liveKitService.room)
            
            // Clean up
            liveKitService.disconnect()
            XCTAssertEqual(liveKitService.connectionState, .disconnected)
            XCTAssertNil(liveKitService.room)
        } catch {
            XCTFail("LiveKit connection failed: \(error)")
        }
    }
    
    func testLiveKitMediaPublishing() async throws {
        let url = TestConfig.liveKitURL
        let token = TestConfig.liveKitToken
        
        do {
            // Connect
            try await liveKitService.connect(url: url, token: token, connectOptions: nil)
            
            // Start audio
            try await liveKitService.startAudio(options: AudioCaptureOptions(
                bitrate: 128_000,
                stereo: true
            ))
            
            // Start video
            try await liveKitService.startVideo(options: VideoCaptureOptions(
                dimensions: CGSize(width: 1280, height: 720),
                frameRate: 30,
                maxBitrate: 2_000_000
            ))
            
            // Verify tracks are published
            XCTAssertTrue(liveKitService.room?.localParticipant?.localAudioTracks.count ?? 0 > 0)
            XCTAssertTrue(liveKitService.room?.localParticipant?.localVideoTracks.count ?? 0 > 0)
            
            // Clean up
            liveKitService.stopAudio()
            liveKitService.stopVideo()
            liveKitService.disconnect()
        } catch {
            XCTFail("LiveKit media publishing failed: \(error)")
        }
    }
}

// MARK: - Test Configuration

private enum TestConfig {
    static var openAIKey: String {
        guard let key = ProcessInfo.processInfo.environment["OPENAI_API_KEY"] else {
            fatalError("OPENAI_API_KEY environment variable not set")
        }
        return key
    }
    
    static var liveKitURL: String {
        guard let url = ProcessInfo.processInfo.environment["LIVEKIT_WS_URL"] else {
            fatalError("LIVEKIT_WS_URL environment variable not set")
        }
        return url
    }
    
    static var liveKitToken: String {
        guard let token = ProcessInfo.processInfo.environment["LIVEKIT_TOKEN"] else {
            fatalError("LIVEKIT_TOKEN environment variable not set")
        }
        return token
    }
} 