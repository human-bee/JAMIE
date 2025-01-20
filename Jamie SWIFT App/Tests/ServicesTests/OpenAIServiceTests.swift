import XCTest
@testable import JamieCanvasApp

final class OpenAIServiceTests: XCTestCase {
    var openAIService: OpenAIService!
    
    override func setUpWithError() throws {
        openAIService = OpenAIService()
    }
    
    override func tearDownWithError() throws {
        openAIService = nil
    }
    
    func testProcessTextWithChartFunction() async throws {
        let text = "Create a bar chart showing sales data: January: 100, February: 150, March: 200"
        let functions = ["add_chart_element"]
        
        let result = try await openAIService.processText(text: text, context: [], functions: functions)
        
        // Verify we got a function call back
        XCTAssertNotNil(result.functionCall)
        if let functionCall = result.functionCall {
            XCTAssertEqual(functionCall.name, "add_chart_element")
            
            // Verify the chart data structure
            let data = functionCall.arguments["data"] as? [String: Any]
            XCTAssertNotNil(data)
            
            // Try to decode it into our ChartPayload
            if let jsonData = try? JSONSerialization.data(withJSONObject: data ?? [:]) {
                let payload = try? JSONDecoder().decode(ChartPayload.self, from: jsonData)
                XCTAssertNotNil(payload)
                XCTAssertEqual(payload?.type, .bar)
                XCTAssertEqual(payload?.data.count, 3)
            }
        }
    }
    
    func testProcessTextWithFactCheck() async throws {
        let text = "The Earth is flat."
        let functions = ["fact_check"]
        
        let result = try await openAIService.processText(text: text, context: [], functions: functions)
        
        // Verify we got a function call back
        XCTAssertNotNil(result.functionCall)
        if let functionCall = result.functionCall {
            XCTAssertEqual(functionCall.name, "fact_check")
            XCTAssertNotNil(functionCall.arguments["text"])
        }
    }
    
    func testProcessTextWithSummarize() async throws {
        let text = """
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
            ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
            ullamco laboris nisi ut aliquip ex ea commodo consequat.
            """
        let functions = ["summarize"]
        
        let result = try await openAIService.processText(text: text, context: [], functions: functions)
        
        // Verify we got a function call back
        XCTAssertNotNil(result.functionCall)
        if let functionCall = result.functionCall {
            XCTAssertEqual(functionCall.name, "summarize")
            XCTAssertNotNil(functionCall.arguments["text"])
        }
    }
} 