import Foundation

actor AIOrchestrator {
    static let shared = AIOrchestrator()
    
    private let openAIService = OpenAIService()
    private var context: [String] = []
    
    func handleTranscription(text: String, speaker: String) async {
        // Add to context
        context.append("\(speaker): \(text)")
        
        // Keep context window manageable
        if context.count > 10 {
            context.removeFirst()
        }
        
        do {
            // Process with OpenAI
            let response = try await openAIService.processText(
                text: text,
                context: context,
                functions: [
                    "add_text_element",
                    "add_chart_element",
                    "add_image_element",
                    "fact_check",
                    "summarize"
                ]
            )
            
            // Handle the response
            await MainActor.run {
                if let functionCall = response.functionCall {
                    handleFunctionCall(functionCall)
                }
            }
        } catch {
            print("Error processing text: \(error.localizedDescription)")
        }
    }
    
    private func handleFunctionCall(_ functionCall: FunctionCall) {
        switch functionCall.name {
        case "add_text_element":
            if let text = functionCall.arguments["text"] as? String {
                CanvasViewModel.shared.addTextElement(text: text)
            }
        case "add_chart_element":
            if let data = functionCall.arguments["data"] as? [String: Any] {
                CanvasViewModel.shared.addChartElement(data: data)
            }
        case "add_image_element":
            if let url = functionCall.arguments["url"] as? String {
                CanvasViewModel.shared.addImageElement(url: url)
            }
        case "fact_check":
            Task {
                await factCheck(text: functionCall.arguments["text"] as? String ?? "")
            }
        case "summarize":
            Task {
                await summarize(text: functionCall.arguments["text"] as? String ?? "")
            }
        default:
            print("Unknown function call: \(functionCall.name)")
        }
    }
    
    private func factCheck(text: String) async {
        do {
            let systemPrompt = """
                You are a fact-checking assistant. Analyze the following statement and:
                1. Determine if it's accurate
                2. Provide evidence or corrections
                3. Rate confidence in your assessment (High/Medium/Low)
                Be concise but thorough.
                """
            
            let response = try await openAIService.processText(
                text: text,
                context: [systemPrompt],
                functions: ["add_text_element"]
            )
            
            if let factCheckResult = response.text {
                await MainActor.run {
                    let formattedResult = """
                        📋 Fact Check Results:
                        Statement: "\(text)"
                        
                        \(factCheckResult)
                        """
                    
                    CanvasViewModel.shared.addTextElement(
                        text: formattedResult,
                        position: CGPoint(x: 150, y: 150)
                    )
                }
            }
        } catch {
            print("Error during fact check: \(error.localizedDescription)")
        }
    }
    
    private func summarize(text: String) async {
        do {
            let systemPrompt = """
                You are a summarization assistant. Create a clear, concise summary that:
                1. Captures the main points
                2. Maintains key details
                3. Is easily digestible
                Aim for brevity while preserving meaning.
                """
            
            let response = try await openAIService.processText(
                text: text,
                context: [systemPrompt],
                functions: ["add_text_element"]
            )
            
            if let summary = response.text {
                await MainActor.run {
                    let formattedSummary = """
                        📝 Summary:
                        Original: "\(text.prefix(100))..."
                        
                        \(summary)
                        """
                    
                    CanvasViewModel.shared.addTextElement(
                        text: formattedSummary,
                        position: CGPoint(x: 150, y: 150)
                    )
                }
            }
        } catch {
            print("Error during summarization: \(error.localizedDescription)")
        }
    }
}

struct FunctionCall {
    let name: String
    let arguments: [String: Any]
} 