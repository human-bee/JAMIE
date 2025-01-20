import Foundation

enum APIKeys: String {
    case openAI = "OpenAI"
    case liveKit = "LiveKit"
    case anthropic = "Anthropic"
    case stability = "Stability"
    
    enum APIError: Error {
        case missingCredentials
        case invalidConfiguration
        case keychainError
        
        var localizedDescription: String {
            switch self {
            case .missingCredentials:
                return "Required API credentials are missing"
            case .invalidConfiguration:
                return "Invalid API configuration"
            case .keychainError:
                return "Failed to access keychain"
            }
        }
    }
    
    struct Credentials: Codable {
        let apiKey: String
        let apiSecret: String?
        let wsURL: String?
        let organizationId: String?
        let model: String?
        
        init(apiKey: String, 
             apiSecret: String? = nil, 
             wsURL: String? = nil,
             organizationId: String? = nil,
             model: String? = nil) {
            self.apiKey = apiKey
            self.apiSecret = apiSecret
            self.wsURL = wsURL
            self.organizationId = organizationId
            self.model = model
        }
    }
    
    static func loadFromEnvironment() throws {
        let keychain = KeychainHelper.shared
        var loadedKeys = false
        
        // OpenAI
        if let openAIKey = ProcessInfo.processInfo.environment["OPENAI_API_KEY"],
           let orgId = ProcessInfo.processInfo.environment["OPENAI_ORG_ID"] {
            keychain.saveAPICredentials(
                Credentials(
                    apiKey: openAIKey,
                    organizationId: orgId,
                    model: ProcessInfo.processInfo.environment["OPENAI_MODEL"] ?? "gpt-4-1106-preview"
                ),
                for: .openAI
            )
            loadedKeys = true
        }
        
        // LiveKit
        if let livekitKey = ProcessInfo.processInfo.environment["LIVEKIT_API_KEY"],
           let livekitSecret = ProcessInfo.processInfo.environment["LIVEKIT_API_SECRET"],
           let livekitURL = ProcessInfo.processInfo.environment["LIVEKIT_WS_URL"] {
            keychain.saveAPICredentials(
                Credentials(
                    apiKey: livekitKey,
                    apiSecret: livekitSecret,
                    wsURL: livekitURL
                ),
                for: .liveKit
            )
            loadedKeys = true
        }
        
        // Anthropic
        if let anthropicKey = ProcessInfo.processInfo.environment["ANTHROPIC_API_KEY"] {
            keychain.saveAPICredentials(
                Credentials(
                    apiKey: anthropicKey,
                    model: ProcessInfo.processInfo.environment["ANTHROPIC_MODEL"] ?? "claude-2.1"
                ),
                for: .anthropic
            )
            loadedKeys = true
        }
        
        // Stability AI
        if let stabilityKey = ProcessInfo.processInfo.environment["STABILITY_API_KEY"] {
            keychain.saveAPICredentials(
                Credentials(
                    apiKey: stabilityKey,
                    model: ProcessInfo.processInfo.environment["STABILITY_MODEL"] ?? "stable-diffusion-xl-1024-v1-0"
                ),
                for: .stability
            )
            loadedKeys = true
        }
        
        if !loadedKeys {
            throw APIError.missingCredentials
        }
    }
    
    func getCredentials() throws -> Credentials {
        guard let credentials = KeychainHelper.shared.getAPICredentials(for: self) else {
            throw APIError.missingCredentials
        }
        return credentials
    }
    
    static func validateConfiguration() throws {
        // Validate required services
        guard let openAICredentials = try? APIKeys.openAI.getCredentials(),
              !openAICredentials.apiKey.isEmpty else {
            throw APIError.missingCredentials
        }
        
        // Validate LiveKit if video/audio features are enabled
        #if ENABLE_LIVEKIT
        guard let livekitCredentials = try? APIKeys.liveKit.getCredentials(),
              let wsURL = livekitCredentials.wsURL,
              !livekitCredentials.apiKey.isEmpty,
              !livekitCredentials.apiSecret!.isEmpty,
              !wsURL.isEmpty else {
            throw APIError.missingCredentials
        }
        #endif
    }
    
    static func clearAllCredentials() {
        let keychain = KeychainHelper.shared
        [APIKeys.openAI, .liveKit, .anthropic, .stability].forEach { service in
            keychain.delete(service: service.rawValue, account: "APICredentials")
        }
    }
} 