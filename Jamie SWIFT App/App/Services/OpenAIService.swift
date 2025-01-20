import Foundation

class OpenAIService {
    private let apiKey: String
    private let baseURL = URL(string: "https://api.openai.com/v1/chat/completions")!
    
    init() {
        if let keyData = KeychainHelper.shared.read(service: "OpenAI", account: "apiKey"),
           let keyString = String(data: keyData, encoding: .utf8) {
            self.apiKey = keyString
        } else {
            // Fallback to environment variable, but log a warning
            self.apiKey = ProcessInfo.processInfo.environment["OPENAI_API_KEY"] ?? ""
            print("Warning: OpenAI API key not found in Keychain. Using environment variable.")
            
            // Store in keychain for next time if available
            if !self.apiKey.isEmpty {
                if let data = self.apiKey.data(using: .utf8) {
                    KeychainHelper.shared.save(data, service: "OpenAI", account: "apiKey")
                }
            }
        }
    }
    
    struct OpenAIResponse: Codable {
        let id: String
        let choices: [Choice]
        
        struct Choice: Codable {
            let message: Message
            let finishReason: String
            
            enum CodingKeys: String, CodingKey {
                case message
                case finishReason = "finish_reason"
            }
        }
        
        struct Message: Codable {
            let role: String
            let content: String?
            let functionCall: FunctionCallResponse?
            
            enum CodingKeys: String, CodingKey {
                case role
                case content
                case functionCall = "function_call"
            }
        }
        
        struct FunctionCallResponse: Codable {
            let name: String
            let arguments: String
        }
    }
    
    func processText(text: String, context: [String], functions: [String]) async throws -> (text: String?, functionCall: FunctionCall?) {
        var request = URLRequest(url: baseURL)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Prepare the messages
        let messages: [[String: String]] = [
            ["role": "system", "content": "You are an AI assistant helping with podcast transcription and visualization."],
            ["role": "user", "content": text]
        ]
        
        // Prepare the functions
        let functionDefinitions = prepareFunctionDefinitions(functions)
        
        let requestBody: [String: Any] = [
            "model": "gpt-4",
            "messages": messages,
            "functions": functionDefinitions,
            "temperature": 0.7
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(OpenAIResponse.self, from: data)
        
        guard let choice = response.choices.first else {
            throw NSError(domain: "OpenAIService", code: -1, userInfo: [NSLocalizedDescriptionKey: "No response choices available"])
        }
        
        if let functionCall = choice.message.functionCall {
            let arguments = try JSONSerialization.jsonObject(with: Data(functionCall.arguments.utf8)) as? [String: Any] ?? [:]
            return (nil, FunctionCall(name: functionCall.name, arguments: arguments))
        }
        
        return (choice.message.content, nil)
    }
    
    private func prepareFunctionDefinitions(_ functions: [String]) -> [[String: Any]] {
        let functionDefinitions: [String: [String: Any]] = [
            "add_text_element": [
                "name": "add_text_element",
                "description": "Add a text element to the canvas",
                "parameters": [
                    "type": "object",
                    "properties": [
                        "text": ["type": "string"],
                        "position": [
                            "type": "object",
                            "properties": [
                                "x": ["type": "number"],
                                "y": ["type": "number"]
                            ]
                        ]
                    ],
                    "required": ["text"]
                ]
            ],
            "add_chart_element": [
                "name": "add_chart_element",
                "description": "Add a chart element to the canvas",
                "parameters": [
                    "type": "object",
                    "properties": [
                        "type": ["type": "string", "enum": ["bar", "line", "pie"]],
                        "title": ["type": "string"],
                        "data": [
                            "type": "array",
                            "items": [
                                "type": "object",
                                "properties": [
                                    "label": ["type": "string"],
                                    "value": ["type": "number"]
                                ],
                                "required": ["label", "value"]
                            ]
                        ]
                    ],
                    "required": ["type", "data"]
                ]
            ],
            "fact_check": [
                "name": "fact_check",
                "description": "Verify the accuracy of a statement",
                "parameters": [
                    "type": "object",
                    "properties": [
                        "text": ["type": "string"],
                        "sources": ["type": "array", "items": ["type": "string"]]
                    ],
                    "required": ["text"]
                ]
            ],
            "summarize": [
                "name": "summarize",
                "description": "Generate a concise summary of the provided text",
                "parameters": [
                    "type": "object",
                    "properties": [
                        "text": ["type": "string"],
                        "maxLength": ["type": "number"]
                    ],
                    "required": ["text"]
                ]
            ]
        ]
        
        return functions.compactMap { functionDefinitions[$0] }
    }
} 