OpenAI function calls in swift

Function calling allows you to more reliably get structured data back from language models. We've implemented OpenAI's [function calling guide](https://platform.openai.com/docs/guides/function-calling) in Swift to make it easy for Apple ecosystem developers to add function calls to their own applications.

This guide shows how to use function calling with Swift to:
- Define functions that the model can call
- Pass function definitions to the Chat Completions API
- Handle the model's function calls in your code
- Send function outputs back to continue the conversation

OpenAI can't call a native function itself, at least not yet. As an app builder, you are tasked with defining a native function and passing details about that function to the chat completion API. When the model decides that a function call is useful, it communicates the intent by populating a tool call field in the chat completion's response body. In swift, we decode the tool call's function name and arguments, and use those to invoke the native function.

After the native function completes, OpenAI expects you to pass the result back to the model. This helps the model generate a text response in the style that fits the developer-specified instructions, and helps the model understand the history of the conversation for future user-initiated messages to the model.

Below is a full example that follows the get_weather example of the doc. You can use this example to add function calls to your app today with the [AIProxySwift library](https://github.com/lzell/AIProxySwift). The library provides a Swift client for OpenAI and other AI providers, with options to make requests directly or through a secure proxy backend that includes certificate pinning, rate limiting, and other protections. The library is MIT licensed and easy to integrate into any Swift project.
               
import AIProxy

/* Uncomment for BYOK use cases */
// let openAIService = AIProxy.openAIDirectService(
//     unprotectedAPIKey: "your-openai-key"
// )

/* Uncomment for all other production use cases */
// let openAIService = AIProxy.openAIService(
//     partialKey: "partial-key-from-your-developer-dashboard",
//     serviceURL: "service-url-from-your-developer-dashboard"
// )

func getWeather(location: String?) -> String {
    // Fill this with your native function logic.
    // Using a stub for this example.
    return "Sunny and 65 degrees"
}

// We'll start the conversation by asking about the weather.
// There is no prior history, so we only send up a single user message.
//
// You can optionally include a .system message to give the model
// instructions on how it should behave.
let userMessage: OpenAIChatCompletionRequestBody.Message = .user(
    content: .text("What is the weather in SF?")
)

var completion1: OpenAIChatCompletionResponseBody? = nil
do {
    completion1 = try await openAIService.chatCompletionRequest(body: .init(
        model: "gpt-4o-mini",
        messages: [
            userMessage
        ],
        tools: [
            .function(
                name: "get_weather",
                description: "Get current temperature for a given location.",
                parameters: [
                    "type": "object",
                    "properties": [
                        "location": [
                            "type": "string",
                            "description": "City and country e.g. Bogotá, Colombia"
                        ]
                    ],
                    "required": ["location"],
                    "additionalProperties": false
                ],
                strict: true
            )
        ]
    ))
} catch AIProxyError.unsuccessfulRequest(let statusCode, let responseBody) {
    print("Received non-200 status code: \(statusCode) with response body: \(responseBody)")
} catch {
    print("Could not get first chat completion: \(error.localizedDescription)")
}

// Get the contents of the model's first response:
guard let toolCall = completion1?.choices.first?.message.toolCalls?.first else {
    print("Completion1: ChatGPT did not respond with a tool call")
    return
}

// Invoke the function call natively.
guard toolCall.function.name == "get_weather" else {
    print("We only know how to get the weather")
    return
}
let weather = getWeather(location: toolCall.function.arguments?["location"] as? String)

// Pass the results of the function call back to OpenAI.
// We create a second chat completion, note the `messages` array in
// the completion request. It passes back up:
//   1. the original user message
//   2. the response from the assistant, which told us to call the get_weather function
//   3. the result of our `getWeather` invocation
let toolMessage: OpenAIChatCompletionRequestBody.Message = .tool(
    content: .text(weather),
    toolCallID: toolCall.id
)

var completion2: OpenAIChatCompletionResponseBody? = nil
do {
    completion2 = try await openAIService.chatCompletionRequest(
        body: .init(
            model: "gpt-4o-mini",
            messages: [
                userMessage,
                .assistant(
                    toolCalls: [
                        .init(
                            id: toolCall.id,
                            function: .init(
                                name: toolCall.function.name,
                                arguments: toolCall.function.argumentsRaw
                            )
                        )
                    ]
                ),
                toolMessage
            ]
        )
    )
} catch AIProxyError.unsuccessfulRequest(let statusCode, let responseBody) {
    print("Received non-200 status code: \(statusCode) with response body: \(responseBody)")
} catch {
    print("Could not get second chat completion: \(error.localizedDescription)")
}

// Get the contents of the model's second response:
guard let assistantContent2 = completion2?.choices.first?.message.content else {
    print("Completion2: ChatGPT did not respond with any assistant content")
    return
}
print(assistantContent2)
// Prints: "The weather in San Francisco is sunny with a temperature of 65 degrees Fahrenheit."
