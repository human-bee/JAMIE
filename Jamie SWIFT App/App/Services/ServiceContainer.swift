import Foundation
import JamieAPIKit

/// A container that manages all service dependencies for the application
public class ServiceContainer {
    // MARK: - Shared Instance
    
    public static let shared = ServiceContainer()
    
    // MARK: - Services
    
    public private(set) lazy var aiService: AIServiceProtocol = {
        #if DEBUG
        if ProcessInfo.processInfo.environment["USE_MOCK_SERVICES"] == "1" {
            return MockAIService()
        }
        #endif
        return OpenAIService()
    }()
    
    public private(set) lazy var liveKitService: LiveKitServiceProtocol = {
        #if DEBUG
        if ProcessInfo.processInfo.environment["USE_MOCK_SERVICES"] == "1" {
            return MockLiveKitService()
        }
        #endif
        return LiveKitService()
    }()
    
    public private(set) lazy var transcriptionService: TranscriptionServiceProtocol = {
        #if DEBUG
        if ProcessInfo.processInfo.environment["USE_MOCK_SERVICES"] == "1" {
            // TODO: Return mock service once implemented
            fatalError("Mock TranscriptionService not yet implemented")
        }
        #endif
        // TODO: Return real service once migrated
        fatalError("TranscriptionService not yet migrated")
    }()
    
    // MARK: - Configuration
    
    private var environment: Environment = .development
    
    // MARK: - Initialization
    
    private init() {}
    
    // MARK: - Public Methods
    
    public func configure(environment: Environment) {
        self.environment = environment
        
        // Configure services based on environment
        switch environment {
        case .development:
            configureForDevelopment()
        case .testing:
            configureForTesting()
        case .production:
            configureForProduction()
        }
    }
    
    // MARK: - Private Methods
    
    private func configureForDevelopment() {
        // Configure services for development environment
        // For example, use local servers, enable logging, etc.
    }
    
    private func configureForTesting() {
        // Configure services for testing environment
        // For example, use mock services, disable network calls, etc.
    }
    
    private func configureForProduction() {
        // Configure services for production environment
        // For example, use production servers, disable logging, etc.
    }
}

// MARK: - Supporting Types

public enum Environment {
    case development
    case testing
    case production
    
    var baseURL: URL {
        switch self {
        case .development:
            return URL(string: "https://dev-api.example.com")!
        case .testing:
            return URL(string: "https://test-api.example.com")!
        case .production:
            return URL(string: "https://api.example.com")!
        }
    }
    
    var liveKitURL: URL {
        switch self {
        case .development:
            return URL(string: "wss://dev-livekit.example.com")!
        case .testing:
            return URL(string: "wss://test-livekit.example.com")!
        case .production:
            return URL(string: "wss://livekit.example.com")!
        }
    }
} 