Token Usage:
GitHub Tokens: 70401
LLM Input Tokens: 0
LLM Output Tokens: 0
Total Tokens: 70401

FileTree:
editorExtensions/inlineDiffs.ts
components/chat.tsx
deploy.sh
LICENSE.md
caret_canvas.ts
README.md
.github/workflows/release.yml
.gitignore
.prettierrc.json
llm_calls.ts
main.css
manifest.json
main.ts
modals/addCustomModel.ts
modals/convertTextToNoteModal.ts
modals/inlineEditingModal.ts
modals/insertNoteModal.ts
modals/systemPromptModal.ts
modals/removeCustomModel.ts
package.json
prettier.config.js
settings.ts
tsconfig.json
styles.css
types.ts
versions.json
views/sidebarChat.ts
views/workflowEditor.ts
views/chat.ts
views.ts

Analysis:
editorExtensions/inlineDiffs.ts

import { Extension, RangeSetBuilder, StateField, Transaction } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
export const redBackgroundField = StateField.define<DecorationSet>({
    create(state): DecorationSet {
        return Decoration.none;
    },
    update(oldState: DecorationSet, transaction: Transaction): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();
        const docText = transaction.state.doc.toString();
        // @ts-ignore
        const delete_regex = /\|-(.*?)-\|/gs; // Changed to match across lines
        // @ts-ignore
        const add_regex = /\|\+(.*?)\+\|/gs; // Changed to match across lines
        let delete_match;
        let add_match;
        let ranges = [];

        while ((delete_match = delete_regex.exec(docText)) !== null) {
            const start = delete_match.index;
            const end = delete_regex.lastIndex;
            ranges.push({ start, end, style: "background-color: #f56c62;" });
        }

        while ((add_match = add_regex.exec(docText)) !== null) {
            const start = add_match.index;
            const end = add_regex.lastIndex;
            ranges.push({ start, end, style: "background-color: #64f562;" });
        }
        // Sort ranges by start position
        ranges.sort((a, b) => a.start - b.start);

        // Add sorted ranges to the builder
        ranges.forEach((range) => {
            builder.add(
                range.start,
                range.end,
                Decoration.mark({
                    attributes: { style: range.style },
                })
            );
        });

        return builder.finish();
    },
    provide(field: StateField<DecorationSet>): Extension {
        return EditorView.decorations.from(field);
    },
});
components/chat.tsx

import { streamText, StreamTextResult, CoreTool, generateText, generateObject } from "ai";
import { ai_sdk_streaming, isEligibleProvider, sdk_provider, get_provider, ai_sdk_completion } from "../llm_calls";
import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Clipboard } from "lucide-react";
import { NotebookPen } from "lucide-react";
import remarkGfm from "remark-gfm";
import CaretPlugin from "../main";

interface ChatComponentProps {
    plugin: CaretPlugin;
    chat_id: string;
    initialConversation: Message[];
    onSubmitMessage: (message: string) => Promise<void>;
    onSave: () => void; // Add this line
    onBulkConvert: (checkedContents: string[]) => void;
    onNewChat: () => void;
    onInsertNote: (callback: (note: string) => void) => void; // Update this line
}

interface Message {
    content: string;
    role: "user" | "assistant";
}

const CodeBlock: React.FC<{ language: string; value: string }> = ({ language, value }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset the copied state after 2 seconds
    };

    return (
        <div style={{ position: "relative", borderRadius: "12px" }}>
            <SyntaxHighlighter language={language} style={materialDark}>
                {value}
            </SyntaxHighlighter>
            <div style={{ padding: "0 4px" }}>
                <Clipboard
                    size={24}
                    onClick={copyToClipboard}
                    className="caret-chat-copy-icon" // Apply the CSS class here
                />
                {copied && (
                    <span
                        style={{
                            position: "absolute",
                            top: "2px",
                            right: "40px",
                            color: "white",
                            backgroundColor: "black",
                            padding: "2px 5px",
                            borderRadius: "12px",
                        }}
                    >
                        Code copied
                    </span>
                )}
            </div>
        </div>
    );
};

const ReactView: React.FC<{ markdown: string }> = ({ markdown }) => {
    return (
        <ReactMarkdown
            className="caret-markdown-body" // Add a proper class for styling
            remarkPlugins={[remarkGfm]}
            components={{
                code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                        <CodeBlock language={match[1]} value={String(children).replace(/\n$/, "")} />
                    ) : (
                        <code className={className} {...props}>
                            {children}
                        </code>
                    );
                },
            }}
        >
            {markdown}
        </ReactMarkdown>
    );
};
const ChatComponent = forwardRef<
    {
        addMessage: (message: Message) => void;
        updateLastMessage: (content: string) => void;
        submitMessage: (userMessage: string) => Promise<void>;
    },
    ChatComponentProps
>(({ plugin, initialConversation, onSubmitMessage, onSave, onBulkConvert, onNewChat, onInsertNote }, ref) => {
    const convertToNote = (messageContent: string) => {
        onBulkConvert([messageContent]);
    };
    const bulkConvert = () => {
        const checkedContents = conversation.filter((_, i) => checkedMessages[i]).map((message) => message.content);
        onBulkConvert(checkedContents);
    };
    const insertNoteModal = () => {
        onInsertNote((note) => {
            insert_text_into_user_message(note);
        });
    };
    const insert_text_into_user_message = (text: string) => {
        setTextBoxValue(textBoxValue + text.trim() + " ");
    };

    const handleCheckboxChange = (index: number) => {
        setCheckedMessages((prev) => {
            const newCheckedMessages = { ...prev, [index]: !prev[index] };
            const checkedContents = conversation
                .filter((_, i) => newCheckedMessages[i])
                .map((message) => message.content);
            return newCheckedMessages;
        });
    };

    const handleSave = () => {
        onSave(); // Call the onSave prop
    };
    const handleNewChat = async () => {
        onNewChat();
    };
    const [conversation, setConversation] = useState(initialConversation);
    const [isGenerating, setIsGenerating] = useState(false);
    const [textBoxValue, setTextBoxValue] = useState("");
    const [checkedMessages, setCheckedMessages] = useState<{ [key: number]: boolean }>({});

    // Inside your component
    const isGeneratingRef = useRef(isGenerating);

    useEffect(() => {
        isGeneratingRef.current = isGenerating;
    }, [isGenerating]);

    useImperativeHandle(ref, () => ({
        addMessage: (message: Message) => {
            setConversation((prev) => [...prev, message]);
        },
        updateLastMessage: (content: string) => {
            setConversation((prev) => {
                const updated = [...prev];
                updated[updated.length - 1].content = content;
                return updated;
            });
        },
        submitMessage: async (userMessage: string) => {
            // if (isGenerating) {
            //   console.error("Message submission blocked: already generating.");
            //   return;
            // }
            // if (isGeneratingRef.current) {
            //   console.error("Message submission blocked: already generating. From ref");
            //   return;
            // }
            // setIsGenerating(true);
            const user_message_tokens = plugin.encoder.encode(userMessage).length;
            if (user_message_tokens > plugin.settings.context_window) {
                console.error(
                    `Single message exceeds model context window. Can't submit. Please shorten message and try again`
                );
                setIsGenerating(false);
                return;
            }

            // Update the conversation state with the new user message
            setConversation((prev: any) => {
                const newConversation = [...prev, { content: userMessage, role: "user" }];
                handleConversationUpdate(newConversation);
                return newConversation;
            });
        },
        getConversation: () => conversation, // Add this line
    }));

    const handleConversationUpdate = async (newConversation: any) => {
        let total_context_length = 0;
        let valid_conversation = [];

        for (let i = 0; i < newConversation.length; i++) {
            let message = newConversation[i];
            let modified_content = message.content;
            if (modified_content.length === 0) {
                continue;
            }
            if (plugin.settings.include_nested_block_refs) {
                const block_ref_content = await plugin.getRefBlocksContent(modified_content);
                if (block_ref_content.length > 0) {
                    modified_content += `Referenced content:\n${block_ref_content}`;
                }
            }

            const encoded_message = plugin.encoder.encode(modified_content);
            const message_length = encoded_message.length;
            if (total_context_length + message_length > plugin.settings.context_window) {
                break;
            }
            total_context_length += message_length;
            valid_conversation.push({ ...message, content: modified_content });
        }
        const provider = plugin.settings.llm_provider;
        const model = plugin.settings.model;
        const temperature = plugin.settings.temperature;

        // await this.update_node_content_streaming(node_id, stream, this.settings.llm_provider);
        if (!isEligibleProvider(provider)) {
            throw new Error(`Invalid provider: ${provider}`);
        }

        let sdk_provider: sdk_provider = get_provider(plugin, provider);

        if (plugin.settings.llm_provider_options[plugin.settings.llm_provider][plugin.settings.model].streaming) {
            console.log({ model, temperature, provider });
            const stream = await ai_sdk_streaming(sdk_provider, model, valid_conversation, temperature, provider);

            setConversation((prev) => [...prev, { content: "", role: "assistant" }]);
            await streamMessage(stream);
            setIsGenerating(false);
            handleSave();
        } else {
            const content = await ai_sdk_completion(sdk_provider, model, valid_conversation, temperature, provider);
            setConversation((prev) => [...prev, { content, role: "assistant" }]);
            setIsGenerating(false);
            handleSave();
        }
    };

    const streamMessage = async (stream_response: StreamTextResult<Record<string, CoreTool<any, any>>, never>) => {
        try {
            for await (const textPart of stream_response.textStream) {
                setConversation((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1].content += textPart;
                    return updated;
                });
            }
        } catch (error) {
            console.error("Error in streamMessage:", error);
            throw new Error("Error processing stream response");
        }
    };

    const handleSubmit = async () => {
        if (!isGeneratingRef.current && textBoxValue.length > 0) {
            await setIsGenerating(true);
            await onSubmitMessage(textBoxValue);
            setTextBoxValue("");
        }
    };

    useEffect(() => {
        // Update conversation state when new messages are added
        setConversation(initialConversation);
    }, [initialConversation]);

    return (
        <div className="caret-chat-container" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            <div className="caret-messages-container" style={{ flex: 1, overflowY: "auto" }}>
                {conversation.map((message, index) => (
                    <div className="caret-message-container" key={index}>
                        <div className={`caret-message ${message.role}`}>
                            <ReactView markdown={message.content} />
                        </div>
                        <div className="caret-chat-message-actions">
                            <NotebookPen
                                size={14}
                                onClick={() => convertToNote(message.content)}
                                className="caret-chat-message-convert-to-note"
                            />
                            <div>
                                <span className="caret-bulk-convert-label">Bulk convert</span>
                                <input
                                    type="checkbox"
                                    checked={!!checkedMessages[index]}
                                    onChange={() => handleCheckboxChange(index)}
                                    className="caret-chat-message-checkbox"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="caret-input-container" style={{ position: "sticky", bottom: 0, padding: "10px" }}>
                <textarea
                    className="caret-full_width_text_container"
                    placeholder="Type something..."
                    value={textBoxValue}
                    onChange={(e) => setTextBoxValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "@") {
                            e.preventDefault();
                            setTextBoxValue(textBoxValue + "@");
                            // new InsertNoteModal(plugin.app, plugin, this).open();
                            insertNoteModal();
                        } else if (e.key === "Enter") {
                            if (plugin.settings.chat_send_chat_shortcut === "enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            } else if (plugin.settings.chat_send_chat_shortcut === "shift_enter" && e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }
                    }}
                    style={{ width: "100%", boxSizing: "border-box" }}
                />
                <div
                    className="caret-button-container"
                    style={{ textAlign: "right", marginTop: "10px", marginBottom: "4px" }}
                >
                    <button onClick={handleSubmit}>Submit</button>
                    <div className="caret-right-button-container">
                        <button onClick={handleNewChat} style={{ marginRight: "4px" }}>
                            New Chat
                        </button>
                        {/* <button onClick={handleSave}>Save</button> */}
                        <button onClick={bulkConvert}>Bulk convert to note</button>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ChatComponent;
deploy.sh

#!/bin/bash

# Ask the user for the version number
echo "Enter the version number (e.g. 1.0.1):"
read version

# Validate the input as a semver version number
if ! [[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Invalid version number format. Please use semver (e.g. 1.0.1)"
    exit 1
fi

# Git add and commit
git add .
echo "Enter commit message:"
read commit_message
git commit -m "$commit_message"

# Push to main branch
git push origin main

# Create and push tag
git tag -a $version -m "$version"
git push origin $version

echo "Deployment completed for version $version"
LICENSE.md
MIT License

Copyright (c) 2024 Jacob Colling

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
caret_canvas.ts

import CaretPlugin from "main";
import { View } from "obsidian";

import { CaretPluginSettings, Edge, Node, SparkleConfig } from "./types";

export class CaretCanvas {
    nodes: Node[];
    edges: Edge[];
    canvas: any;
    canvasKeybinds: {
        [command: string]: {
            keybind: string;
            description: string;
            enabled: boolean;
        };
    };
    constructor(readonly canvas_view: View) {
        this.canvasKeybinds = {
            NavigateUp: {
                keybind: "ArrowUp",
                description: "Move up in the canvas",
                enabled: true,
            },
            NavigateDown: {
                keybind: "ArrowDown",
                description: "Move down in the canvas",
                enabled: true,
            },
            NavigateLeft: {
                keybind: "ArrowLeft",
                description: "Move left in the canvas",
                enabled: true,
            },
            NavigateRight: {
                keybind: "ArrowRight",
                description: "Move right in the canvas",
                enabled: true,
            },
        };
        // @ts-ignore
        if (!canvas_view || !canvas_view.canvas) {
            return;
        }
        // @ts-ignore
        const canvas = canvas_view.canvas;
        this.canvas = canvas;

        // node.unknownData.role = "user";

        const canvas_data = canvas.getData();
        const { edges, nodes } = canvas_data;
        this.nodes = nodes;
        this.edges = edges;
    }

    textById() {
        const res: { [k: string]: string } = {};
        this.nodes.forEach((node) => {
            res[node.id] = node.text;
        });
        return res;
    }

    getNode(nodeId: string) {
        const [res] = this.nodes.filter((node) => node.id === nodeId);
        return new CaretNode(res, this);
    }

    getLongestLineage(node_id: string) {
        return CaretPlugin.getLongestLineage(this.nodes, this.edges, node_id);
    }

    static fromPlugin(plugin: CaretPlugin) {
        return new CaretCanvas(plugin.app.workspace.getMostRecentLeaf()!.view);
    }
}

export function mergeSettingsAndSparkleConfig(
    settings: CaretPluginSettings,
    sparkle_config: SparkleConfig
): SparkleConfig {
    let model = settings.model;
    let provider = settings.llm_provider;
    let temperature = settings.temperature;
    let context_window: string | number = settings.context_window;
    if (sparkle_config.model !== "default") {
        model = sparkle_config.model;
    }
    if (sparkle_config.provider !== "default") {
        provider = sparkle_config.provider;
    }
    if (sparkle_config.temperature !== settings.temperature) {
        temperature = sparkle_config.temperature;
    }
    if (sparkle_config.context_window !== "default") {
        context_window = sparkle_config.context_window;
    }
    return { model, provider, temperature, context_window };
}

export class CaretNode {
    constructor(readonly node: Node, readonly canvas_nodes: CaretCanvas) {}

    outgoingNodes() {
        return this.canvas_nodes.edges
            .filter((edge) => edge.fromNode === this.node.id)
            .map((edge) => this.canvas_nodes.getNode(edge.toNode));
    }

    get id() {
        return this.node.id;
    }

    getLongestLineage() {
        return this.canvas_nodes.getLongestLineage(this.node.id);
    }
}
README.md

[!note]
Throughout this document:

"Caret OP" refers to this Obsidian plugin
"Caret" refers to a separate paid SaaS product (see note at bottom)
Caret Obsidian Plugin

Caret OP is an Obsidian plugin that brings the power of LLMs into your Obsidian Vault. Caret OP follows all the main Obsidian philosophies. It's local-first, privacy preserving and stores all generated data as local files.

Features:

AI Canvas: Use LLMs in the Obsidian Canvas for non-linear chat and more.
Chat: Chat directly in Obsidian. Reference other files in your vault. All chat logs are stored as vault files.
Use Any LLMs: Use Caret OP with local or remote LLMs. Caret OP has built in support for Ollama, OpenAI, Anthropic, Groq, OpenRouter and you can add any additional models yourself.
Discord

Come hang in the Discord! Everyone's welcome! Targeted for people using Obsidian, LLMs and AI tools.

https://discord.gg/8FyGfcH24N

The discord is for people to:

Hang
Ask questions
Talk shop
Show what they're working on
Discuss development of Caret OP
Good vibes only. Strongly enforced.

[!note]
Please note that this discord is also for my paid product, Caret.

Docs

The full docs for the plugin will be on the site:
https://www.caretplugin.ai/

Design Principles

These are the principles that guide the design and development of Caret. If a potential feature doesn't follow these then it probably won't be included in Caret OP.

Keep to local-first
No external services outside of LLM providers. No external APIs, DBs, RAG providers etc. All Caret OP functionality should come from just Caret OP.
All Caret OP data is should be stored as markdown files within the users vault. Anything that Caret creates or consumes should be savable as a local file.
Contributing

PRs welcome! More guidelines to come on this. But essentially if it's good, readable code that fits the Caret OP design principles then I'll try my best to incorporate it.

Big emphasis on "follows Caret OP's design principles". Please don't start working on something that violates a design principle without running it past me first. I don't want you to possibly waste time if it's a feature that I won't be able to incorporate.

Supporting Caret OP and Caret

Caret OP is free and open source and it always will be. You can support Caret OP by checking out https://www.caretai.app/.

This is a standalone web app created by me! Caret OP and Caret (the web app) are fully separate products, but they are thematically similar. Really Caret grew out of this plugin. If you are enjoying the plugin, I would love it if you would checkout my web app as well.
.github/workflows/release.yml

name: Release Obsidian plugin
on:
    push:
        tags:
            - "*"

jobs:
    build:
        runs-on: ubuntu-latest

        steps:
            - uses: actions/checkout@v3

            - name: Use Node.js
              uses: actions/setup-node@v3
              with:
                  node-version: "18.x"

            - name: Build plugin
              run: |
                  npm install
                  npm run build

            - name: Create release
              env:
                  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
              run: |
                  tag="${GITHUB_REF#refs/tags/}"

                  gh release create "$tag" \
                    --title="$tag" \
                    --draft \
                    main.js manifest.json styles.css
.gitignore

*.env
node_modules/
dist/
*.log
data.json
generate_uuids.ts
*.code-workspace
main.js
.aider*
.prettierrc.json

{
  "printWidth": 120,
  "tabWidth": 4,
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5",
  "bracketSpacing": true
}
llm_calls.ts

import { createGoogleGenerativeAI, google, GoogleGenerativeAIProvider } from "@ai-sdk/google";
import { Notice } from "obsidian";
import { streamText, StreamTextResult, CoreTool, generateText, generateObject } from "ai";
import { OpenAIProvider } from "@ai-sdk/openai";
import { AnthropicProvider } from "@ai-sdk/anthropic";
import { GroqProvider, createGroq } from "@ai-sdk/groq";
import { createOllama, OllamaProvider, ollama } from "ollama-ai-provider";
import { createOpenRouter, OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import { createOpenAICompatible, OpenAICompatibleProvider } from "@ai-sdk/openai-compatible";

import { z } from "zod";
import CaretPlugin from "main";

export type sdk_provider =
    | GoogleGenerativeAIProvider
    | OpenAIProvider
    | AnthropicProvider
    | GroqProvider
    | OllamaProvider
    | OpenRouterProvider
    | OpenAICompatibleProvider;
export type eligible_provider =
    | "google"
    | "openai"
    | "anthropic"
    | "groq"
    | "ollama"
    | "openrouter"
    | "custom"
    | "perplexity";

const refactored_providers = ["openai", "google", "anthropic", "groq", "ollama", "openrouter", "custom", "perplexity"];
export const isEligibleProvider = (provider: string): provider is eligible_provider => {
    return refactored_providers.includes(provider);
};
export function get_provider(plugin: CaretPlugin, provider: eligible_provider): sdk_provider {
    switch (provider) {
        case "openai":
            return plugin.openai_client;
        case "google":
            return plugin.google_client;
        case "anthropic":
            return plugin.anthropic_client;
        case "groq":
            return plugin.groq_client;
        case "ollama":
            return plugin.ollama_client;
        case "openrouter":
            return plugin.openrouter_client;
        case "perplexity":
            return plugin.perplexity_client;
        case "custom":
            const settings = plugin.settings;
            const current_model = settings.model;
            const custom_endpoint = settings.custom_endpoints[current_model];

            if (!custom_endpoint) {
                throw new Error(`No custom endpoint configuration found for model: ${current_model}`);
            }

            const sdk_provider = createOpenAICompatible({
                baseURL: custom_endpoint.endpoint,
                apiKey: custom_endpoint.api_key,
                name: provider,
            });

            plugin.custom_client = sdk_provider;
            return plugin.custom_client;
        default:
            throw new Error(
                `Invalid provider: ${provider}. Must be one of: openai, google, anthropic, groq, ollama, openrouter, custom`
            );
    }
}
export async function ai_sdk_streaming(
    provider: sdk_provider,
    model: string,
    conversation: Array<{ role: string; content: string }>,
    temperature: number,
    provider_name: eligible_provider
): Promise<StreamTextResult<Record<string, CoreTool<any, any>>, never>> {
    new Notice(`Calling ${provider_name[0].toUpperCase() + provider_name.slice(1)}`);
    const formattedPrompt = conversation.map((msg) => `${msg.role}: ${msg.content}`).join("\n");

    if (provider_name === "openrouter") {
        const openrouter_provider = provider as OpenRouterProvider;
        return await streamText({
            model: openrouter_provider.chat(model),
            prompt: formattedPrompt,
            temperature,
        });
    }

    const final_provider = provider as Exclude<sdk_provider, OpenRouterProvider>;
    const stream = await streamText({
        model: final_provider(model),
        prompt: formattedPrompt,
        temperature,
    });

    return stream;
}
export async function ai_sdk_completion(
    provider: sdk_provider,
    model: string,
    conversation: Array<{ role: string; content: string }>,
    temperature: number,
    provider_name: eligible_provider
): Promise<string> {
    new Notice(`Calling ${provider_name[0].toUpperCase() + provider_name.slice(1)}`);
    const formattedPrompt = conversation.map((msg) => `${msg.role}: ${msg.content}`).join("\n");
    console.log({ model });

    if (provider_name === "openrouter") {
        const openrouter_provider = provider as OpenRouterProvider;
        const response = await generateText({
            model: openrouter_provider.chat(model),
            prompt: formattedPrompt,
            temperature,
        });
        return response.text;
    }

    const final_provider = provider as Exclude<sdk_provider, OpenRouterProvider>;
    const response = await generateText({
        model: final_provider(model),
        prompt: formattedPrompt,
        temperature,
    });

    return response.text;
}
export async function ai_sdk_structured<T extends z.ZodType>(
    provider: sdk_provider,
    model: string,
    conversation: Array<{ role: string; content: string }>,
    temperature: number,
    provider_name: eligible_provider,
    schema: T
): Promise<z.infer<T>> {
    new Notice(`Calling ${provider_name[0].toUpperCase() + provider_name.slice(1)}`);
    const formattedPrompt = conversation.map((msg) => `${msg.role}: ${msg.content}`).join("\n");

    if (provider_name === "openrouter") {
        const openrouter_provider = provider as OpenRouterProvider;
        const response = await generateObject({
            model: openrouter_provider.chat(model),
            schema,
            prompt: formattedPrompt,
            temperature,
        });
        return response;
    }
    console.log({ schema, conversation });

    const final_provider = provider as Exclude<sdk_provider, OpenRouterProvider>;
    const response = await generateObject({
        model: final_provider(model),
        schema,
        prompt: formattedPrompt,
        temperature,
    });
    console.log(response);

    return response.object;
}
main.css

/* node_modules/@xyflow/react/dist/style.css */
.react-flow {
  direction: ltr;
  --xy-edge-stroke-default: #b1b1b7;
  --xy-edge-stroke-width-default: 1;
  --xy-edge-stroke-selected-default: #555;
  --xy-connectionline-stroke-default: #b1b1b7;
  --xy-connectionline-stroke-width-default: 1;
  --xy-attribution-background-color-default: rgba(255, 255, 255, 0.5);
  --xy-minimap-background-color-default: #fff;
  --xy-minimap-mask-background-color-default: rgb(240, 240, 240, 0.6);
  --xy-minimap-mask-stroke-color-default: transparent;
  --xy-minimap-mask-stroke-width-default: 1;
  --xy-minimap-node-background-color-default: #e2e2e2;
  --xy-minimap-node-stroke-color-default: transparent;
  --xy-minimap-node-stroke-width-default: 2;
  --xy-background-color-default: transparent;
  --xy-background-pattern-dots-color-default: #91919a;
  --xy-background-pattern-lines-color-default: #eee;
  --xy-background-pattern-cross-color-default: #e2e2e2;
  background-color: var(--xy-background-color, var(--xy-background-color-default));
  --xy-node-color-default: inherit;
  --xy-node-border-default: 1px solid #1a192b;
  --xy-node-background-color-default: #fff;
  --xy-node-group-background-color-default: rgba(240, 240, 240, 0.25);
  --xy-node-boxshadow-hover-default: 0 1px 4px 1px rgba(0, 0, 0, 0.08);
  --xy-node-boxshadow-selected-default: 0 0 0 0.5px #1a192b;
  --xy-node-border-radius-default: 3px;
  --xy-handle-background-color-default: #1a192b;
  --xy-handle-border-color-default: #fff;
  --xy-selection-background-color-default: rgba(0, 89, 220, 0.08);
  --xy-selection-border-default: 1px dotted rgba(0, 89, 220, 0.8);
  --xy-controls-button-background-color-default: #fefefe;
  --xy-controls-button-background-color-hover-default: #f4f4f4;
  --xy-controls-button-color-default: inherit;
  --xy-controls-button-color-hover-default: inherit;
  --xy-controls-button-border-color-default: #eee;
  --xy-controls-box-shadow-default: 0 0 2px 1px rgba(0, 0, 0, 0.08);
  --xy-edge-label-background-color-default: #ffffff;
  --xy-edge-label-color-default: inherit;
  --xy-resize-background-color-default: #3367d9;
}
.react-flow.dark {
  --xy-edge-stroke-default: #3e3e3e;
  --xy-edge-stroke-width-default: 1;
  --xy-edge-stroke-selected-default: #727272;
  --xy-connectionline-stroke-default: #b1b1b7;
  --xy-connectionline-stroke-width-default: 1;
  --xy-attribution-background-color-default: rgba(150, 150, 150, 0.25);
  --xy-minimap-background-color-default: #141414;
  --xy-minimap-mask-background-color-default: rgb(60, 60, 60, 0.6);
  --xy-minimap-mask-stroke-color-default: transparent;
  --xy-minimap-mask-stroke-width-default: 1;
  --xy-minimap-node-background-color-default: #2b2b2b;
  --xy-minimap-node-stroke-color-default: transparent;
  --xy-minimap-node-stroke-width-default: 2;
  --xy-background-color-default: #141414;
  --xy-background-pattern-dots-color-default: #777;
  --xy-background-pattern-lines-color-default: #777;
  --xy-background-pattern-cross-color-default: #777;
  --xy-node-color-default: #f8f8f8;
  --xy-node-border-default: 1px solid #3c3c3c;
  --xy-node-background-color-default: #1e1e1e;
  --xy-node-group-background-color-default: rgba(240, 240, 240, 0.25);
  --xy-node-boxshadow-hover-default: 0 1px 4px 1px rgba(255, 255, 255, 0.08);
  --xy-node-boxshadow-selected-default: 0 0 0 0.5px #999;
  --xy-handle-background-color-default: #bebebe;
  --xy-handle-border-color-default: #1e1e1e;
  --xy-selection-background-color-default: rgba(200, 200, 220, 0.08);
  --xy-selection-border-default: 1px dotted rgba(200, 200, 220, 0.8);
  --xy-controls-button-background-color-default: #2b2b2b;
  --xy-controls-button-background-color-hover-default: #3e3e3e;
  --xy-controls-button-color-default: #f8f8f8;
  --xy-controls-button-color-hover-default: #fff;
  --xy-controls-button-border-color-default: #5b5b5b;
  --xy-controls-box-shadow-default: 0 0 2px 1px rgba(0, 0, 0, 0.08);
  --xy-edge-label-background-color-default: #141414;
  --xy-edge-label-color-default: #f8f8f8;
}
.react-flow__background {
  background-color: var(--xy-background-color, var(--xy-background-color-props, var(--xy-background-color-default)));
  pointer-events: none;
  z-index: -1;
}
.react-flow__container {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}
.react-flow__pane {
  z-index: 1;
}
.react-flow__pane.draggable {
  cursor: grab;
}
.react-flow__pane.dragging {
  cursor: grabbing;
}
.react-flow__pane.selection {
  cursor: pointer;
}
.react-flow__viewport {
  transform-origin: 0 0;
  z-index: 2;
  pointer-events: none;
}
.react-flow__renderer {
  z-index: 4;
}
.react-flow__selection {
  z-index: 6;
}
.react-flow__nodesselection-rect:focus,
.react-flow__nodesselection-rect:focus-visible {
  outline: none;
}
.react-flow__edge-path {
  stroke: var(--xy-edge-stroke, var(--xy-edge-stroke-default));
  stroke-width: var(--xy-edge-stroke-width, var(--xy-edge-stroke-width-default));
  fill: none;
}
.react-flow__connection-path {
  stroke: var(--xy-connectionline-stroke, var(--xy-connectionline-stroke-default));
  stroke-width: var(--xy-connectionline-stroke-width, var(--xy-connectionline-stroke-width-default));
  fill: none;
}
.react-flow .react-flow__edges {
  position: absolute;
}
.react-flow .react-flow__edges svg {
  overflow: visible;
  position: absolute;
  pointer-events: none;
}
.react-flow__edge {
  pointer-events: visibleStroke;
}
.react-flow__edge.selectable {
  cursor: pointer;
}
.react-flow__edge.animated path {
  stroke-dasharray: 5;
  animation: dashdraw 0.5s linear infinite;
}
.react-flow__edge.animated path.react-flow__edge-interaction {
  stroke-dasharray: none;
  animation: none;
}
.react-flow__edge.inactive {
  pointer-events: none;
}
.react-flow__edge.selected,
.react-flow__edge:focus,
.react-flow__edge:focus-visible {
  outline: none;
}
.react-flow__edge.selected .react-flow__edge-path,
.react-flow__edge.selectable:focus .react-flow__edge-path,
.react-flow__edge.selectable:focus-visible .react-flow__edge-path {
  stroke: var(--xy-edge-stroke-selected, var(--xy-edge-stroke-selected-default));
}
.react-flow__edge-textwrapper {
  pointer-events: all;
}
.react-flow__edge .react-flow__edge-text {
  pointer-events: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
}
.react-flow__connection {
  pointer-events: none;
}
.react-flow__connection .animated {
  stroke-dasharray: 5;
  animation: dashdraw 0.5s linear infinite;
}
svg.react-flow__connectionline {
  z-index: 1001;
  overflow: visible;
  position: absolute;
}
.react-flow__nodes {
  pointer-events: none;
  transform-origin: 0 0;
}
.react-flow__node {
  position: absolute;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  pointer-events: all;
  transform-origin: 0 0;
  box-sizing: border-box;
  cursor: default;
}
.react-flow__node.selectable {
  cursor: pointer;
}
.react-flow__node.draggable {
  cursor: grab;
  pointer-events: all;
}
.react-flow__node.draggable.dragging {
  cursor: grabbing;
}
.react-flow__nodesselection {
  z-index: 3;
  transform-origin: left top;
  pointer-events: none;
}
.react-flow__nodesselection-rect {
  position: absolute;
  pointer-events: all;
  cursor: grab;
}
.react-flow__handle {
  position: absolute;
  pointer-events: none;
  min-width: 5px;
  min-height: 5px;
  width: 6px;
  height: 6px;
  background-color: var(--xy-handle-background-color, var(--xy-handle-background-color-default));
  border: 1px solid var(--xy-handle-border-color, var(--xy-handle-border-color-default));
  border-radius: 100%;
}
.react-flow__handle.connectingfrom {
  pointer-events: all;
}
.react-flow__handle.connectionindicator {
  pointer-events: all;
  cursor: crosshair;
}
.react-flow__handle-bottom {
  top: auto;
  left: 50%;
  bottom: 0;
  transform: translate(-50%, 50%);
}
.react-flow__handle-top {
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
}
.react-flow__handle-left {
  top: 50%;
  left: 0;
  transform: translate(-50%, -50%);
}
.react-flow__handle-right {
  top: 50%;
  right: 0;
  transform: translate(50%, -50%);
}
.react-flow__edgeupdater {
  cursor: move;
  pointer-events: all;
}
.react-flow__panel {
  position: absolute;
  z-index: 5;
  margin: 15px;
}
.react-flow__panel.top {
  top: 0;
}
.react-flow__panel.bottom {
  bottom: 0;
}
.react-flow__panel.left {
  left: 0;
}
.react-flow__panel.right {
  right: 0;
}
.react-flow__panel.center {
  left: 50%;
  transform: translateX(-50%);
}
.react-flow__attribution {
  font-size: 10px;
  background: var(--xy-attribution-background-color, var(--xy-attribution-background-color-default));
  padding: 2px 3px;
  margin: 0;
}
.react-flow__attribution a {
  text-decoration: none;
  color: #999;
}
@keyframes dashdraw {
  from {
    stroke-dashoffset: 10;
  }
}
.react-flow__edgelabel-renderer {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  left: 0;
  top: 0;
}
.react-flow__viewport-portal {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
}
.react-flow__minimap {
  background: var( --xy-minimap-background-color-props, var(--xy-minimap-background-color, var(--xy-minimap-background-color-default)) );
}
.react-flow__minimap-svg {
  display: block;
}
.react-flow__minimap-mask {
  fill: var( --xy-minimap-mask-background-color-props, var(--xy-minimap-mask-background-color, var(--xy-minimap-mask-background-color-default)) );
  stroke: var( --xy-minimap-mask-stroke-color-props, var(--xy-minimap-mask-stroke-color, var(--xy-minimap-mask-stroke-color-default)) );
  stroke-width: var( --xy-minimap-mask-stroke-width-props, var(--xy-minimap-mask-stroke-width, var(--xy-minimap-mask-stroke-width-default)) );
}
.react-flow__minimap-node {
  fill: var( --xy-minimap-node-background-color-props, var(--xy-minimap-node-background-color, var(--xy-minimap-node-background-color-default)) );
  stroke: var( --xy-minimap-node-stroke-color-props, var(--xy-minimap-node-stroke-color, var(--xy-minimap-node-stroke-color-default)) );
  stroke-width: var( --xy-minimap-node-stroke-width-props, var(--xy-minimap-node-stroke-width, var(--xy-minimap-node-stroke-width-default)) );
}
.react-flow__background-pattern.dots {
  fill: var( --xy-background-pattern-color-props, var(--xy-background-pattern-color, var(--xy-background-pattern-dots-color-default)) );
}
.react-flow__background-pattern.lines {
  stroke: var( --xy-background-pattern-color-props, var(--xy-background-pattern-color, var(--xy-background-pattern-lines-color-default)) );
}
.react-flow__background-pattern.cross {
  stroke: var( --xy-background-pattern-color-props, var(--xy-background-pattern-color, var(--xy-background-pattern-cross-color-default)) );
}
.react-flow__controls {
  display: flex;
  flex-direction: column;
  box-shadow: var(--xy-controls-box-shadow, var(--xy-controls-box-shadow-default));
}
.react-flow__controls.horizontal {
  flex-direction: row;
}
.react-flow__controls-button {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 26px;
  width: 26px;
  padding: 4px;
  border: none;
  background: var(--xy-controls-button-background-color, var(--xy-controls-button-background-color-default));
  border-bottom: 1px solid var( --xy-controls-button-border-color-props, var(--xy-controls-button-border-color, var(--xy-controls-button-border-color-default)) );
  color: var( --xy-controls-button-color-props, var(--xy-controls-button-color, var(--xy-controls-button-color-default)) );
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
}
.react-flow__controls-button svg {
  width: 100%;
  max-width: 12px;
  max-height: 12px;
  fill: currentColor;
}
.react-flow__edge.updating .react-flow__edge-path {
  stroke: #777;
}
.react-flow__edge-text {
  font-size: 10px;
}
.react-flow__node.selectable:focus,
.react-flow__node.selectable:focus-visible {
  outline: none;
}
.react-flow__node-input,
.react-flow__node-default,
.react-flow__node-output,
.react-flow__node-group {
  padding: 10px;
  border-radius: var(--xy-node-border-radius, var(--xy-node-border-radius-default));
  width: 150px;
  font-size: 12px;
  color: var(--xy-node-color, var(--xy-node-color-default));
  text-align: center;
  border: var(--xy-node-border, var(--xy-node-border-default));
  background-color: var(--xy-node-background-color, var(--xy-node-background-color-default));
}
.react-flow__node-input.selectable:hover,
.react-flow__node-default.selectable:hover,
.react-flow__node-output.selectable:hover,
.react-flow__node-group.selectable:hover {
  box-shadow: var(--xy-node-boxshadow-hover, var(--xy-node-boxshadow-hover-default));
}
.react-flow__node-input.selectable.selected,
.react-flow__node-input.selectable:focus,
.react-flow__node-input.selectable:focus-visible,
.react-flow__node-default.selectable.selected,
.react-flow__node-default.selectable:focus,
.react-flow__node-default.selectable:focus-visible,
.react-flow__node-output.selectable.selected,
.react-flow__node-output.selectable:focus,
.react-flow__node-output.selectable:focus-visible,
.react-flow__node-group.selectable.selected,
.react-flow__node-group.selectable:focus,
.react-flow__node-group.selectable:focus-visible {
  box-shadow: var(--xy-node-boxshadow-selected, var(--xy-node-boxshadow-selected-default));
}
.react-flow__node-group {
  background-color: var(--xy-node-group-background-color, var(--xy-node-group-background-color-default));
}
.react-flow__nodesselection-rect,
.react-flow__selection {
  background: var(--xy-selection-background-color, var(--xy-selection-background-color-default));
  border: var(--xy-selection-border, var(--xy-selection-border-default));
}
.react-flow__nodesselection-rect:focus,
.react-flow__nodesselection-rect:focus-visible,
.react-flow__selection:focus,
.react-flow__selection:focus-visible {
  outline: none;
}
.react-flow__controls-button:hover {
  background: var( --xy-controls-button-background-color-hover-props, var(--xy-controls-button-background-color-hover, var(--xy-controls-button-background-color-hover-default)) );
  color: var( --xy-controls-button-color-hover-props, var(--xy-controls-button-color-hover, var(--xy-controls-button-color-hover-default)) );
}
.react-flow__controls-button:disabled {
  pointer-events: none;
}
.react-flow__controls-button:disabled svg {
  fill-opacity: 0.4;
}
.react-flow__controls-button:last-child {
  border-bottom: none;
}
.react-flow__resize-control {
  position: absolute;
}
.react-flow__resize-control.left,
.react-flow__resize-control.right {
  cursor: ew-resize;
}
.react-flow__resize-control.top,
.react-flow__resize-control.bottom {
  cursor: ns-resize;
}
.react-flow__resize-control.top.left,
.react-flow__resize-control.bottom.right {
  cursor: nwse-resize;
}
.react-flow__resize-control.bottom.left,
.react-flow__resize-control.top.right {
  cursor: nesw-resize;
}
.react-flow__resize-control.handle {
  width: 4px;
  height: 4px;
  border: 1px solid #fff;
  border-radius: 1px;
  background-color: var(--xy-resize-background-color, var(--xy-resize-background-color-default));
  transform: translate(-50%, -50%);
}
.react-flow__resize-control.handle.left {
  left: 0;
  top: 50%;
}
.react-flow__resize-control.handle.right {
  left: 100%;
  top: 50%;
}
.react-flow__resize-control.handle.top {
  left: 50%;
  top: 0;
}
.react-flow__resize-control.handle.bottom {
  left: 50%;
  top: 100%;
}
.react-flow__resize-control.handle.top.left {
  left: 0;
}
.react-flow__resize-control.handle.bottom.left {
  left: 0;
}
.react-flow__resize-control.handle.top.right {
  left: 100%;
}
.react-flow__resize-control.handle.bottom.right {
  left: 100%;
}
.react-flow__resize-control.line {
  border-color: var(--xy-resize-background-color, var(--xy-resize-background-color-default));
  border-width: 0;
  border-style: solid;
}
.react-flow__resize-control.line.left,
.react-flow__resize-control.line.right {
  width: 1px;
  transform: translate(-50%, 0);
  top: 0;
  height: 100%;
}
.react-flow__resize-control.line.left {
  left: 0;
  border-left-width: 1px;
}
.react-flow__resize-control.line.right {
  left: 100%;
  border-right-width: 1px;
}
.react-flow__resize-control.line.top,
.react-flow__resize-control.line.bottom {
  height: 1px;
  transform: translate(0, -50%);
  left: 0;
  width: 100%;
}
.react-flow__resize-control.line.top {
  top: 0;
  border-top-width: 1px;
}
.react-flow__resize-control.line.bottom {
  border-bottom-width: 1px;
  top: 100%;
}
.react-flow__edge-textbg {
  fill: var(--xy-edge-label-background-color, var(--xy-edge-label-background-color-default));
}
.react-flow__edge-text {
  fill: var(--xy-edge-label-color, var(--xy-edge-label-color-default));
}
/*# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibm9kZV9tb2R1bGVzL0B4eWZsb3cvcmVhY3QvZGlzdC9zdHlsZS5jc3MiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qIHRoaXMgZ2V0cyBleHBvcnRlZCBhcyBzdHlsZS5jc3MgYW5kIGNhbiBiZSB1c2VkIGZvciB0aGUgZGVmYXVsdCB0aGVtaW5nICovXG4vKiB0aGVzZSBhcmUgdGhlIG5lY2Vzc2FyeSBzdHlsZXMgZm9yIFJlYWN0L1N2ZWx0ZSBGbG93LCB0aGV5IGdldCB1c2VkIGJ5IGJhc2UuY3NzIGFuZCBzdHlsZS5jc3MgKi9cbi5yZWFjdC1mbG93IHtcbiAgZGlyZWN0aW9uOiBsdHI7XG5cbiAgLS14eS1lZGdlLXN0cm9rZS1kZWZhdWx0OiAjYjFiMWI3O1xuICAtLXh5LWVkZ2Utc3Ryb2tlLXdpZHRoLWRlZmF1bHQ6IDE7XG4gIC0teHktZWRnZS1zdHJva2Utc2VsZWN0ZWQtZGVmYXVsdDogIzU1NTtcblxuICAtLXh5LWNvbm5lY3Rpb25saW5lLXN0cm9rZS1kZWZhdWx0OiAjYjFiMWI3O1xuICAtLXh5LWNvbm5lY3Rpb25saW5lLXN0cm9rZS13aWR0aC1kZWZhdWx0OiAxO1xuXG4gIC0teHktYXR0cmlidXRpb24tYmFja2dyb3VuZC1jb2xvci1kZWZhdWx0OiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuNSk7XG5cbiAgLS14eS1taW5pbWFwLWJhY2tncm91bmQtY29sb3ItZGVmYXVsdDogI2ZmZjtcbiAgLS14eS1taW5pbWFwLW1hc2stYmFja2dyb3VuZC1jb2xvci1kZWZhdWx0OiByZ2IoMjQwLCAyNDAsIDI0MCwgMC42KTtcbiAgLS14eS1taW5pbWFwLW1hc2stc3Ryb2tlLWNvbG9yLWRlZmF1bHQ6IHRyYW5zcGFyZW50O1xuICAtLXh5LW1pbmltYXAtbWFzay1zdHJva2Utd2lkdGgtZGVmYXVsdDogMTtcbiAgLS14eS1taW5pbWFwLW5vZGUtYmFja2dyb3VuZC1jb2xvci1kZWZhdWx0OiAjZTJlMmUyO1xuICAtLXh5LW1pbmltYXAtbm9kZS1zdHJva2UtY29sb3ItZGVmYXVsdDogdHJhbnNwYXJlbnQ7XG4gIC0teHktbWluaW1hcC1ub2RlLXN0cm9rZS13aWR0aC1kZWZhdWx0OiAyO1xuXG4gIC0teHktYmFja2dyb3VuZC1jb2xvci1kZWZhdWx0OiB0cmFuc3BhcmVudDtcbiAgLS14eS1iYWNrZ3JvdW5kLXBhdHRlcm4tZG90cy1jb2xvci1kZWZhdWx0OiAjOTE5MTlhO1xuICAtLXh5LWJhY2tncm91bmQtcGF0dGVybi1saW5lcy1jb2xvci1kZWZhdWx0OiAjZWVlO1xuICAtLXh5LWJhY2tncm91bmQtcGF0dGVybi1jcm9zcy1jb2xvci1kZWZhdWx0OiAjZTJlMmUyO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS14eS1iYWNrZ3JvdW5kLWNvbG9yLCB2YXIoLS14eS1iYWNrZ3JvdW5kLWNvbG9yLWRlZmF1bHQpKTtcbiAgLS14eS1ub2RlLWNvbG9yLWRlZmF1bHQ6IGluaGVyaXQ7XG4gIC0teHktbm9kZS1ib3JkZXItZGVmYXVsdDogMXB4IHNvbGlkICMxYTE5MmI7XG4gIC0teHktbm9kZS1iYWNrZ3JvdW5kLWNvbG9yLWRlZmF1bHQ6ICNmZmY7XG4gIC0teHktbm9kZS1ncm91cC1iYWNrZ3JvdW5kLWNvbG9yLWRlZmF1bHQ6IHJnYmEoMjQwLCAyNDAsIDI0MCwgMC4yNSk7XG4gIC0teHktbm9kZS1ib3hzaGFkb3ctaG92ZXItZGVmYXVsdDogMCAxcHggNHB4IDFweCByZ2JhKDAsIDAsIDAsIDAuMDgpO1xuICAtLXh5LW5vZGUtYm94c2hhZG93LXNlbGVjdGVkLWRlZmF1bHQ6IDAgMCAwIDAuNXB4ICMxYTE5MmI7XG4gIC0teHktbm9kZS1ib3JkZXItcmFkaXVzLWRlZmF1bHQ6IDNweDtcblxuICAtLXh5LWhhbmRsZS1iYWNrZ3JvdW5kLWNvbG9yLWRlZmF1bHQ6ICMxYTE5MmI7XG4gIC0teHktaGFuZGxlLWJvcmRlci1jb2xvci1kZWZhdWx0OiAjZmZmO1xuXG4gIC0teHktc2VsZWN0aW9uLWJhY2tncm91bmQtY29sb3ItZGVmYXVsdDogcmdiYSgwLCA4OSwgMjIwLCAwLjA4KTtcbiAgLS14eS1zZWxlY3Rpb24tYm9yZGVyLWRlZmF1bHQ6IDFweCBkb3R0ZWQgcmdiYSgwLCA4OSwgMjIwLCAwLjgpO1xuXG4gIC0teHktY29udHJvbHMtYnV0dG9uLWJhY2tncm91bmQtY29sb3ItZGVmYXVsdDogI2ZlZmVmZTtcbiAgLS14eS1jb250cm9scy1idXR0b24tYmFja2dyb3VuZC1jb2xvci1ob3Zlci1kZWZhdWx0OiAjZjRmNGY0O1xuICAtLXh5LWNvbnRyb2xzLWJ1dHRvbi1jb2xvci1kZWZhdWx0OiBpbmhlcml0O1xuICAtLXh5LWNvbnRyb2xzLWJ1dHRvbi1jb2xvci1ob3Zlci1kZWZhdWx0OiBpbmhlcml0O1xuICAtLXh5LWNvbnRyb2xzLWJ1dHRvbi1ib3JkZXItY29sb3ItZGVmYXVsdDogI2VlZTtcbiAgLS14eS1jb250cm9scy1ib3gtc2hhZG93LWRlZmF1bHQ6IDAgMCAycHggMXB4IHJnYmEoMCwgMCwgMCwgMC4wOCk7XG5cbiAgLS14eS1lZGdlLWxhYmVsLWJhY2tncm91bmQtY29sb3ItZGVmYXVsdDogI2ZmZmZmZjtcbiAgLS14eS1lZGdlLWxhYmVsLWNvbG9yLWRlZmF1bHQ6IGluaGVyaXQ7XG4gIC0teHktcmVzaXplLWJhY2tncm91bmQtY29sb3ItZGVmYXVsdDogIzMzNjdkOTtcbn1cbi5yZWFjdC1mbG93LmRhcmsge1xuICAtLXh5LWVkZ2Utc3Ryb2tlLWRlZmF1bHQ6ICMzZTNlM2U7XG4gIC0teHktZWRnZS1zdHJva2Utd2lkdGgtZGVmYXVsdDogMTtcbiAgLS14eS1lZGdlLXN0cm9rZS1zZWxlY3RlZC1kZWZhdWx0OiAjNzI3MjcyO1xuXG4gIC0teHktY29ubmVjdGlvbmxpbmUtc3Ryb2tlLWRlZmF1bHQ6ICNiMWIxYjc7XG4gIC0teHktY29ubmVjdGlvbmxpbmUtc3Ryb2tlLXdpZHRoLWRlZmF1bHQ6IDE7XG5cbiAgLS14eS1hdHRyaWJ1dGlvbi1iYWNrZ3JvdW5kLWNvbG9yLWRlZmF1bHQ6IHJnYmEoMTUwLCAxNTAsIDE1MCwgMC4yNSk7XG5cbiAgLS14eS1taW5pbWFwLWJhY2tncm91bmQtY29sb3ItZGVmYXVsdDogIzE0MTQxNDtcbiAgLS14eS1taW5pbWFwLW1hc2stYmFja2dyb3VuZC1jb2xvci1kZWZhdWx0OiByZ2IoNjAsIDYwLCA2MCwgMC42KTtcbiAgLS14eS1taW5pbWFwLW1hc2stc3Ryb2tlLWNvbG9yLWRlZmF1bHQ6IHRyYW5zcGFyZW50O1xuICAtLXh5LW1pbmltYXAtbWFzay1zdHJva2Utd2lkdGgtZGVmYXVsdDogMTtcbiAgLS14eS1taW5pbWFwLW5vZGUtYmFja2dyb3VuZC1jb2xvci1kZWZhdWx0OiAjMmIyYjJiO1xuICAtLXh5LW1pbmltYXAtbm9kZS1zdHJva2UtY29sb3ItZGVmYXVsdDogdHJhbnNwYXJlbnQ7XG4gIC0teHktbWluaW1hcC1ub2RlLXN0cm9rZS13aWR0aC1kZWZhdWx0OiAyO1xuXG4gIC0teHktYmFja2dyb3VuZC1jb2xvci1kZWZhdWx0OiAjMTQxNDE0O1xuICAtLXh5LWJhY2tncm91bmQtcGF0dGVybi1kb3RzLWNvbG9yLWRlZmF1bHQ6ICM3Nzc7XG4gIC0teHktYmFja2dyb3VuZC1wYXR0ZXJuLWxpbmVzLWNvbG9yLWRlZmF1bHQ6ICM3Nzc7XG4gIC0teHktYmFja2dyb3VuZC1wYXR0ZXJuLWNyb3NzLWNvbG9yLWRlZmF1bHQ6ICM3Nzc7XG4gIC0teHktbm9kZS1jb2xvci1kZWZhdWx0OiAjZjhmOGY4O1xuICAtLXh5LW5vZGUtYm9yZGVyLWRlZmF1bHQ6IDFweCBzb2xpZCAjM2MzYzNjO1xuICAtLXh5LW5vZGUtYmFja2dyb3VuZC1jb2xvci1kZWZhdWx0OiAjMWUxZTFlO1xuICAtLXh5LW5vZGUtZ3JvdXAtYmFja2dyb3VuZC1jb2xvci1kZWZhdWx0OiByZ2JhKDI0MCwgMjQwLCAyNDAsIDAuMjUpO1xuICAtLXh5LW5vZGUtYm94c2hhZG93LWhvdmVyLWRlZmF1bHQ6IDAgMXB4IDRweCAxcHggcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA4KTtcbiAgLS14eS1ub2RlLWJveHNoYWRvdy1zZWxlY3RlZC1kZWZhdWx0OiAwIDAgMCAwLjVweCAjOTk5O1xuXG4gIC0teHktaGFuZGxlLWJhY2tncm91bmQtY29sb3ItZGVmYXVsdDogI2JlYmViZTtcbiAgLS14eS1oYW5kbGUtYm9yZGVyLWNvbG9yLWRlZmF1bHQ6ICMxZTFlMWU7XG5cbiAgLS14eS1zZWxlY3Rpb24tYmFja2dyb3VuZC1jb2xvci1kZWZhdWx0OiByZ2JhKDIwMCwgMjAwLCAyMjAsIDAuMDgpO1xuICAtLXh5LXNlbGVjdGlvbi1ib3JkZXItZGVmYXVsdDogMXB4IGRvdHRlZCByZ2JhKDIwMCwgMjAwLCAyMjAsIDAuOCk7XG5cbiAgLS14eS1jb250cm9scy1idXR0b24tYmFja2dyb3VuZC1jb2xvci1kZWZhdWx0OiAjMmIyYjJiO1xuICAtLXh5LWNvbnRyb2xzLWJ1dHRvbi1iYWNrZ3JvdW5kLWNvbG9yLWhvdmVyLWRlZmF1bHQ6ICMzZTNlM2U7XG4gIC0teHktY29udHJvbHMtYnV0dG9uLWNvbG9yLWRlZmF1bHQ6ICNmOGY4Zjg7XG4gIC0teHktY29udHJvbHMtYnV0dG9uLWNvbG9yLWhvdmVyLWRlZmF1bHQ6ICNmZmY7XG4gIC0teHktY29udHJvbHMtYnV0dG9uLWJvcmRlci1jb2xvci1kZWZhdWx0OiAjNWI1YjViO1xuICAtLXh5LWNvbnRyb2xzLWJveC1zaGFkb3ctZGVmYXVsdDogMCAwIDJweCAxcHggcmdiYSgwLCAwLCAwLCAwLjA4KTtcblxuICAtLXh5LWVkZ2UtbGFiZWwtYmFja2dyb3VuZC1jb2xvci1kZWZhdWx0OiAjMTQxNDE0O1xuICAtLXh5LWVkZ2UtbGFiZWwtY29sb3ItZGVmYXVsdDogI2Y4ZjhmODtcbn1cbi5yZWFjdC1mbG93X19iYWNrZ3JvdW5kIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0teHktYmFja2dyb3VuZC1jb2xvciwgdmFyKC0teHktYmFja2dyb3VuZC1jb2xvci1wcm9wcywgdmFyKC0teHktYmFja2dyb3VuZC1jb2xvci1kZWZhdWx0KSkpO1xuICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgei1pbmRleDogLTE7XG59XG4ucmVhY3QtZmxvd19fY29udGFpbmVyIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB3aWR0aDogMTAwJTtcbiAgaGVpZ2h0OiAxMDAlO1xuICB0b3A6IDA7XG4gIGxlZnQ6IDA7XG59XG4ucmVhY3QtZmxvd19fcGFuZSB7XG4gIHotaW5kZXg6IDE7XG59XG4ucmVhY3QtZmxvd19fcGFuZS5kcmFnZ2FibGUge1xuICAgIGN1cnNvcjogZ3JhYjtcbiAgfVxuLnJlYWN0LWZsb3dfX3BhbmUuZHJhZ2dpbmcge1xuICAgIGN1cnNvcjogZ3JhYmJpbmc7XG4gIH1cbi5yZWFjdC1mbG93X19wYW5lLnNlbGVjdGlvbiB7XG4gICAgY3Vyc29yOiBwb2ludGVyO1xuICB9XG4ucmVhY3QtZmxvd19fdmlld3BvcnQge1xuICB0cmFuc2Zvcm0tb3JpZ2luOiAwIDA7XG4gIHotaW5kZXg6IDI7XG4gIHBvaW50ZXItZXZlbnRzOiBub25lO1xufVxuLnJlYWN0LWZsb3dfX3JlbmRlcmVyIHtcbiAgei1pbmRleDogNDtcbn1cbi5yZWFjdC1mbG93X19zZWxlY3Rpb24ge1xuICB6LWluZGV4OiA2O1xufVxuLnJlYWN0LWZsb3dfX25vZGVzc2VsZWN0aW9uLXJlY3Q6Zm9jdXMsXG4ucmVhY3QtZmxvd19fbm9kZXNzZWxlY3Rpb24tcmVjdDpmb2N1cy12aXNpYmxlIHtcbiAgb3V0bGluZTogbm9uZTtcbn1cbi5yZWFjdC1mbG93X19lZGdlLXBhdGgge1xuICBzdHJva2U6IHZhcigtLXh5LWVkZ2Utc3Ryb2tlLCB2YXIoLS14eS1lZGdlLXN0cm9rZS1kZWZhdWx0KSk7XG4gIHN0cm9rZS13aWR0aDogdmFyKC0teHktZWRnZS1zdHJva2Utd2lkdGgsIHZhcigtLXh5LWVkZ2Utc3Ryb2tlLXdpZHRoLWRlZmF1bHQpKTtcbiAgZmlsbDogbm9uZTtcbn1cbi5yZWFjdC1mbG93X19jb25uZWN0aW9uLXBhdGgge1xuICBzdHJva2U6IHZhcigtLXh5LWNvbm5lY3Rpb25saW5lLXN0cm9rZSwgdmFyKC0teHktY29ubmVjdGlvbmxpbmUtc3Ryb2tlLWRlZmF1bHQpKTtcbiAgc3Ryb2tlLXdpZHRoOiB2YXIoLS14eS1jb25uZWN0aW9ubGluZS1zdHJva2Utd2lkdGgsIHZhcigtLXh5LWNvbm5lY3Rpb25saW5lLXN0cm9rZS13aWR0aC1kZWZhdWx0KSk7XG4gIGZpbGw6IG5vbmU7XG59XG4ucmVhY3QtZmxvdyAucmVhY3QtZmxvd19fZWRnZXMge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG59XG4ucmVhY3QtZmxvdyAucmVhY3QtZmxvd19fZWRnZXMgc3ZnIHtcbiAgICBvdmVyZmxvdzogdmlzaWJsZTtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gIH1cbi5yZWFjdC1mbG93X19lZGdlIHtcbiAgcG9pbnRlci1ldmVudHM6IHZpc2libGVTdHJva2U7XG59XG4ucmVhY3QtZmxvd19fZWRnZS5zZWxlY3RhYmxlIHtcbiAgICBjdXJzb3I6IHBvaW50ZXI7XG4gIH1cbi5yZWFjdC1mbG93X19lZGdlLmFuaW1hdGVkIHBhdGgge1xuICAgIHN0cm9rZS1kYXNoYXJyYXk6IDU7XG4gICAgYW5pbWF0aW9uOiBkYXNoZHJhdyAwLjVzIGxpbmVhciBpbmZpbml0ZTtcbiAgfVxuLnJlYWN0LWZsb3dfX2VkZ2UuYW5pbWF0ZWQgcGF0aC5yZWFjdC1mbG93X19lZGdlLWludGVyYWN0aW9uIHtcbiAgICBzdHJva2UtZGFzaGFycmF5OiBub25lO1xuICAgIGFuaW1hdGlvbjogbm9uZTtcbiAgfVxuLnJlYWN0LWZsb3dfX2VkZ2UuaW5hY3RpdmUge1xuICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICB9XG4ucmVhY3QtZmxvd19fZWRnZS5zZWxlY3RlZCxcbiAgLnJlYWN0LWZsb3dfX2VkZ2U6Zm9jdXMsXG4gIC5yZWFjdC1mbG93X19lZGdlOmZvY3VzLXZpc2libGUge1xuICAgIG91dGxpbmU6IG5vbmU7XG4gIH1cbi5yZWFjdC1mbG93X19lZGdlLnNlbGVjdGVkIC5yZWFjdC1mbG93X19lZGdlLXBhdGgsXG4gIC5yZWFjdC1mbG93X19lZGdlLnNlbGVjdGFibGU6Zm9jdXMgLnJlYWN0LWZsb3dfX2VkZ2UtcGF0aCxcbiAgLnJlYWN0LWZsb3dfX2VkZ2Uuc2VsZWN0YWJsZTpmb2N1cy12aXNpYmxlIC5yZWFjdC1mbG93X19lZGdlLXBhdGgge1xuICAgIHN0cm9rZTogdmFyKC0teHktZWRnZS1zdHJva2Utc2VsZWN0ZWQsIHZhcigtLXh5LWVkZ2Utc3Ryb2tlLXNlbGVjdGVkLWRlZmF1bHQpKTtcbiAgfVxuLnJlYWN0LWZsb3dfX2VkZ2UtdGV4dHdyYXBwZXIge1xuICAgIHBvaW50ZXItZXZlbnRzOiBhbGw7XG4gIH1cbi5yZWFjdC1mbG93X19lZGdlIC5yZWFjdC1mbG93X19lZGdlLXRleHQge1xuICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICAgIC13ZWJraXQtdXNlci1zZWxlY3Q6IG5vbmU7XG4gICAgICAgLW1vei11c2VyLXNlbGVjdDogbm9uZTtcbiAgICAgICAgICAgIHVzZXItc2VsZWN0OiBub25lO1xuICB9XG4ucmVhY3QtZmxvd19fY29ubmVjdGlvbiB7XG4gIHBvaW50ZXItZXZlbnRzOiBub25lO1xufVxuLnJlYWN0LWZsb3dfX2Nvbm5lY3Rpb24gLmFuaW1hdGVkIHtcbiAgICBzdHJva2UtZGFzaGFycmF5OiA1O1xuICAgIGFuaW1hdGlvbjogZGFzaGRyYXcgMC41cyBsaW5lYXIgaW5maW5pdGU7XG4gIH1cbnN2Zy5yZWFjdC1mbG93X19jb25uZWN0aW9ubGluZSB7XG4gIHotaW5kZXg6IDEwMDE7XG4gIG92ZXJmbG93OiB2aXNpYmxlO1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG59XG4ucmVhY3QtZmxvd19fbm9kZXMge1xuICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgdHJhbnNmb3JtLW9yaWdpbjogMCAwO1xufVxuLnJlYWN0LWZsb3dfX25vZGUge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIC13ZWJraXQtdXNlci1zZWxlY3Q6IG5vbmU7XG4gICAgIC1tb3otdXNlci1zZWxlY3Q6IG5vbmU7XG4gICAgICAgICAgdXNlci1zZWxlY3Q6IG5vbmU7XG4gIHBvaW50ZXItZXZlbnRzOiBhbGw7XG4gIHRyYW5zZm9ybS1vcmlnaW46IDAgMDtcbiAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgY3Vyc29yOiBkZWZhdWx0O1xufVxuLnJlYWN0LWZsb3dfX25vZGUuc2VsZWN0YWJsZSB7XG4gICAgY3Vyc29yOiBwb2ludGVyO1xuICB9XG4ucmVhY3QtZmxvd19fbm9kZS5kcmFnZ2FibGUge1xuICAgIGN1cnNvcjogZ3JhYjtcbiAgICBwb2ludGVyLWV2ZW50czogYWxsO1xuICB9XG4ucmVhY3QtZmxvd19fbm9kZS5kcmFnZ2FibGUuZHJhZ2dpbmcge1xuICAgICAgY3Vyc29yOiBncmFiYmluZztcbiAgICB9XG4ucmVhY3QtZmxvd19fbm9kZXNzZWxlY3Rpb24ge1xuICB6LWluZGV4OiAzO1xuICB0cmFuc2Zvcm0tb3JpZ2luOiBsZWZ0IHRvcDtcbiAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG59XG4ucmVhY3QtZmxvd19fbm9kZXNzZWxlY3Rpb24tcmVjdCB7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIHBvaW50ZXItZXZlbnRzOiBhbGw7XG4gICAgY3Vyc29yOiBncmFiO1xuICB9XG4ucmVhY3QtZmxvd19faGFuZGxlIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgbWluLXdpZHRoOiA1cHg7XG4gIG1pbi1oZWlnaHQ6IDVweDtcbiAgd2lkdGg6IDZweDtcbiAgaGVpZ2h0OiA2cHg7XG4gIGJhY2tncm91bmQtY29sb3I6IHZhcigtLXh5LWhhbmRsZS1iYWNrZ3JvdW5kLWNvbG9yLCB2YXIoLS14eS1oYW5kbGUtYmFja2dyb3VuZC1jb2xvci1kZWZhdWx0KSk7XG4gIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLXh5LWhhbmRsZS1ib3JkZXItY29sb3IsIHZhcigtLXh5LWhhbmRsZS1ib3JkZXItY29sb3ItZGVmYXVsdCkpO1xuICBib3JkZXItcmFkaXVzOiAxMDAlO1xufVxuLnJlYWN0LWZsb3dfX2hhbmRsZS5jb25uZWN0aW5nZnJvbSB7XG4gICAgcG9pbnRlci1ldmVudHM6IGFsbDtcbiAgfVxuLnJlYWN0LWZsb3dfX2hhbmRsZS5jb25uZWN0aW9uaW5kaWNhdG9yIHtcbiAgICBwb2ludGVyLWV2ZW50czogYWxsO1xuICAgIGN1cnNvcjogY3Jvc3NoYWlyO1xuICB9XG4ucmVhY3QtZmxvd19faGFuZGxlLWJvdHRvbSB7XG4gICAgdG9wOiBhdXRvO1xuICAgIGxlZnQ6IDUwJTtcbiAgICBib3R0b206IDA7XG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgNTAlKTtcbiAgfVxuLnJlYWN0LWZsb3dfX2hhbmRsZS10b3Age1xuICAgIHRvcDogMDtcbiAgICBsZWZ0OiA1MCU7XG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLTUwJSk7XG4gIH1cbi5yZWFjdC1mbG93X19oYW5kbGUtbGVmdCB7XG4gICAgdG9wOiA1MCU7XG4gICAgbGVmdDogMDtcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtNTAlLCAtNTAlKTtcbiAgfVxuLnJlYWN0LWZsb3dfX2hhbmRsZS1yaWdodCB7XG4gICAgdG9wOiA1MCU7XG4gICAgcmlnaHQ6IDA7XG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoNTAlLCAtNTAlKTtcbiAgfVxuLnJlYWN0LWZsb3dfX2VkZ2V1cGRhdGVyIHtcbiAgY3Vyc29yOiBtb3ZlO1xuICBwb2ludGVyLWV2ZW50czogYWxsO1xufVxuLnJlYWN0LWZsb3dfX3BhbmVsIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB6LWluZGV4OiA1O1xuICBtYXJnaW46IDE1cHg7XG59XG4ucmVhY3QtZmxvd19fcGFuZWwudG9wIHtcbiAgICB0b3A6IDA7XG4gIH1cbi5yZWFjdC1mbG93X19wYW5lbC5ib3R0b20ge1xuICAgIGJvdHRvbTogMDtcbiAgfVxuLnJlYWN0LWZsb3dfX3BhbmVsLmxlZnQge1xuICAgIGxlZnQ6IDA7XG4gIH1cbi5yZWFjdC1mbG93X19wYW5lbC5yaWdodCB7XG4gICAgcmlnaHQ6IDA7XG4gIH1cbi5yZWFjdC1mbG93X19wYW5lbC5jZW50ZXIge1xuICAgIGxlZnQ6IDUwJTtcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSk7XG4gIH1cbi5yZWFjdC1mbG93X19hdHRyaWJ1dGlvbiB7XG4gIGZvbnQtc2l6ZTogMTBweDtcbiAgYmFja2dyb3VuZDogdmFyKC0teHktYXR0cmlidXRpb24tYmFja2dyb3VuZC1jb2xvciwgdmFyKC0teHktYXR0cmlidXRpb24tYmFja2dyb3VuZC1jb2xvci1kZWZhdWx0KSk7XG4gIHBhZGRpbmc6IDJweCAzcHg7XG4gIG1hcmdpbjogMDtcbn1cbi5yZWFjdC1mbG93X19hdHRyaWJ1dGlvbiBhIHtcbiAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gICAgY29sb3I6ICM5OTk7XG4gIH1cbkBrZXlmcmFtZXMgZGFzaGRyYXcge1xuICBmcm9tIHtcbiAgICBzdHJva2UtZGFzaG9mZnNldDogMTA7XG4gIH1cbn1cbi5yZWFjdC1mbG93X19lZGdlbGFiZWwtcmVuZGVyZXIge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHdpZHRoOiAxMDAlO1xuICBoZWlnaHQ6IDEwMCU7XG4gIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICAtd2Via2l0LXVzZXItc2VsZWN0OiBub25lO1xuICAgICAtbW96LXVzZXItc2VsZWN0OiBub25lO1xuICAgICAgICAgIHVzZXItc2VsZWN0OiBub25lO1xuICBsZWZ0OiAwO1xuICB0b3A6IDA7XG59XG4ucmVhY3QtZmxvd19fdmlld3BvcnQtcG9ydGFsIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB3aWR0aDogMTAwJTtcbiAgaGVpZ2h0OiAxMDAlO1xuICBsZWZ0OiAwO1xuICB0b3A6IDA7XG4gIC13ZWJraXQtdXNlci1zZWxlY3Q6IG5vbmU7XG4gICAgIC1tb3otdXNlci1zZWxlY3Q6IG5vbmU7XG4gICAgICAgICAgdXNlci1zZWxlY3Q6IG5vbmU7XG59XG4ucmVhY3QtZmxvd19fbWluaW1hcCB7XG4gIGJhY2tncm91bmQ6IHZhcihcbiAgICAtLXh5LW1pbmltYXAtYmFja2dyb3VuZC1jb2xvci1wcm9wcyxcbiAgICB2YXIoLS14eS1taW5pbWFwLWJhY2tncm91bmQtY29sb3IsIHZhcigtLXh5LW1pbmltYXAtYmFja2dyb3VuZC1jb2xvci1kZWZhdWx0KSlcbiAgKTtcbn1cbi5yZWFjdC1mbG93X19taW5pbWFwLXN2ZyB7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gIH1cbi5yZWFjdC1mbG93X19taW5pbWFwLW1hc2sge1xuICAgIGZpbGw6IHZhcihcbiAgICAgIC0teHktbWluaW1hcC1tYXNrLWJhY2tncm91bmQtY29sb3ItcHJvcHMsXG4gICAgICB2YXIoLS14eS1taW5pbWFwLW1hc2stYmFja2dyb3VuZC1jb2xvciwgdmFyKC0teHktbWluaW1hcC1tYXNrLWJhY2tncm91bmQtY29sb3ItZGVmYXVsdCkpXG4gICAgKTtcbiAgICBzdHJva2U6IHZhcihcbiAgICAgIC0teHktbWluaW1hcC1tYXNrLXN0cm9rZS1jb2xvci1wcm9wcyxcbiAgICAgIHZhcigtLXh5LW1pbmltYXAtbWFzay1zdHJva2UtY29sb3IsIHZhcigtLXh5LW1pbmltYXAtbWFzay1zdHJva2UtY29sb3ItZGVmYXVsdCkpXG4gICAgKTtcbiAgICBzdHJva2Utd2lkdGg6IHZhcihcbiAgICAgIC0teHktbWluaW1hcC1tYXNrLXN0cm9rZS13aWR0aC1wcm9wcyxcbiAgICAgIHZhcigtLXh5LW1pbmltYXAtbWFzay1zdHJva2Utd2lkdGgsIHZhcigtLXh5LW1pbmltYXAtbWFzay1zdHJva2Utd2lkdGgtZGVmYXVsdCkpXG4gICAgKTtcbiAgfVxuLnJlYWN0LWZsb3dfX21pbmltYXAtbm9kZSB7XG4gICAgZmlsbDogdmFyKFxuICAgICAgLS14eS1taW5pbWFwLW5vZGUtYmFja2dyb3VuZC1jb2xvci1wcm9wcyxcbiAgICAgIHZhcigtLXh5LW1pbmltYXAtbm9kZS1iYWNrZ3JvdW5kLWNvbG9yLCB2YXIoLS14eS1taW5pbWFwLW5vZGUtYmFja2dyb3VuZC1jb2xvci1kZWZhdWx0KSlcbiAgICApO1xuICAgIHN0cm9rZTogdmFyKFxuICAgICAgLS14eS1taW5pbWFwLW5vZGUtc3Ryb2tlLWNvbG9yLXByb3BzLFxuICAgICAgdmFyKC0teHktbWluaW1hcC1ub2RlLXN0cm9rZS1jb2xvciwgdmFyKC0teHktbWluaW1hcC1ub2RlLXN0cm9rZS1jb2xvci1kZWZhdWx0KSlcbiAgICApO1xuICAgIHN0cm9rZS13aWR0aDogdmFyKFxuICAgICAgLS14eS1taW5pbWFwLW5vZGUtc3Ryb2tlLXdpZHRoLXByb3BzLFxuICAgICAgdmFyKC0teHktbWluaW1hcC1ub2RlLXN0cm9rZS13aWR0aCwgdmFyKC0teHktbWluaW1hcC1ub2RlLXN0cm9rZS13aWR0aC1kZWZhdWx0KSlcbiAgICApO1xuICB9XG4ucmVhY3QtZmxvd19fYmFja2dyb3VuZC1wYXR0ZXJuLmRvdHMge1xuICAgIGZpbGw6IHZhcihcbiAgICAgIC0teHktYmFja2dyb3VuZC1wYXR0ZXJuLWNvbG9yLXByb3BzLFxuICAgICAgdmFyKC0teHktYmFja2dyb3VuZC1wYXR0ZXJuLWNvbG9yLCB2YXIoLS14eS1iYWNrZ3JvdW5kLXBhdHRlcm4tZG90cy1jb2xvci1kZWZhdWx0KSlcbiAgICApO1xuICB9XG4ucmVhY3QtZmxvd19fYmFja2dyb3VuZC1wYXR0ZXJuLmxpbmVzIHtcbiAgICBzdHJva2U6IHZhcihcbiAgICAgIC0teHktYmFja2dyb3VuZC1wYXR0ZXJuLWNvbG9yLXByb3BzLFxuICAgICAgdmFyKC0teHktYmFja2dyb3VuZC1wYXR0ZXJuLWNvbG9yLCB2YXIoLS14eS1iYWNrZ3JvdW5kLXBhdHRlcm4tbGluZXMtY29sb3ItZGVmYXVsdCkpXG4gICAgKTtcbiAgfVxuLnJlYWN0LWZsb3dfX2JhY2tncm91bmQtcGF0dGVybi5jcm9zcyB7XG4gICAgc3Ryb2tlOiB2YXIoXG4gICAgICAtLXh5LWJhY2tncm91bmQtcGF0dGVybi1jb2xvci1wcm9wcyxcbiAgICAgIHZhcigtLXh5LWJhY2tncm91bmQtcGF0dGVybi1jb2xvciwgdmFyKC0teHktYmFja2dyb3VuZC1wYXR0ZXJuLWNyb3NzLWNvbG9yLWRlZmF1bHQpKVxuICAgICk7XG4gIH1cbi5yZWFjdC1mbG93X19jb250cm9scyB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGJveC1zaGFkb3c6IHZhcigtLXh5LWNvbnRyb2xzLWJveC1zaGFkb3csIHZhcigtLXh5LWNvbnRyb2xzLWJveC1zaGFkb3ctZGVmYXVsdCkpO1xufVxuLnJlYWN0LWZsb3dfX2NvbnRyb2xzLmhvcml6b250YWwge1xuICAgIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gIH1cbi5yZWFjdC1mbG93X19jb250cm9scy1idXR0b24ge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBoZWlnaHQ6IDI2cHg7XG4gICAgd2lkdGg6IDI2cHg7XG4gICAgcGFkZGluZzogNHB4O1xuICAgIGJvcmRlcjogbm9uZTtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS14eS1jb250cm9scy1idXR0b24tYmFja2dyb3VuZC1jb2xvciwgdmFyKC0teHktY29udHJvbHMtYnV0dG9uLWJhY2tncm91bmQtY29sb3ItZGVmYXVsdCkpO1xuICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZFxuICAgICAgdmFyKFxuICAgICAgICAtLXh5LWNvbnRyb2xzLWJ1dHRvbi1ib3JkZXItY29sb3ItcHJvcHMsXG4gICAgICAgIHZhcigtLXh5LWNvbnRyb2xzLWJ1dHRvbi1ib3JkZXItY29sb3IsIHZhcigtLXh5LWNvbnRyb2xzLWJ1dHRvbi1ib3JkZXItY29sb3ItZGVmYXVsdCkpXG4gICAgICApO1xuICAgIGNvbG9yOiB2YXIoXG4gICAgICAtLXh5LWNvbnRyb2xzLWJ1dHRvbi1jb2xvci1wcm9wcyxcbiAgICAgIHZhcigtLXh5LWNvbnRyb2xzLWJ1dHRvbi1jb2xvciwgdmFyKC0teHktY29udHJvbHMtYnV0dG9uLWNvbG9yLWRlZmF1bHQpKVxuICAgICk7XG4gICAgY3Vyc29yOiBwb2ludGVyO1xuICAgIC13ZWJraXQtdXNlci1zZWxlY3Q6IG5vbmU7XG4gICAgICAgLW1vei11c2VyLXNlbGVjdDogbm9uZTtcbiAgICAgICAgICAgIHVzZXItc2VsZWN0OiBub25lO1xuICB9XG4ucmVhY3QtZmxvd19fY29udHJvbHMtYnV0dG9uIHN2ZyB7XG4gICAgICB3aWR0aDogMTAwJTtcbiAgICAgIG1heC13aWR0aDogMTJweDtcbiAgICAgIG1heC1oZWlnaHQ6IDEycHg7XG4gICAgICBmaWxsOiBjdXJyZW50Q29sb3I7XG4gICAgfVxuLnJlYWN0LWZsb3dfX2VkZ2UudXBkYXRpbmcgLnJlYWN0LWZsb3dfX2VkZ2UtcGF0aCB7XG4gICAgICBzdHJva2U6ICM3Nzc7XG4gICAgfVxuLnJlYWN0LWZsb3dfX2VkZ2UtdGV4dCB7XG4gICAgZm9udC1zaXplOiAxMHB4O1xuICB9XG4ucmVhY3QtZmxvd19fbm9kZS5zZWxlY3RhYmxlOmZvY3VzLFxuICAucmVhY3QtZmxvd19fbm9kZS5zZWxlY3RhYmxlOmZvY3VzLXZpc2libGUge1xuICAgIG91dGxpbmU6IG5vbmU7XG4gIH1cbi5yZWFjdC1mbG93X19ub2RlLWlucHV0LFxuLnJlYWN0LWZsb3dfX25vZGUtZGVmYXVsdCxcbi5yZWFjdC1mbG93X19ub2RlLW91dHB1dCxcbi5yZWFjdC1mbG93X19ub2RlLWdyb3VwIHtcbiAgcGFkZGluZzogMTBweDtcbiAgYm9yZGVyLXJhZGl1czogdmFyKC0teHktbm9kZS1ib3JkZXItcmFkaXVzLCB2YXIoLS14eS1ub2RlLWJvcmRlci1yYWRpdXMtZGVmYXVsdCkpO1xuICB3aWR0aDogMTUwcHg7XG4gIGZvbnQtc2l6ZTogMTJweDtcbiAgY29sb3I6IHZhcigtLXh5LW5vZGUtY29sb3IsIHZhcigtLXh5LW5vZGUtY29sb3ItZGVmYXVsdCkpO1xuICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gIGJvcmRlcjogdmFyKC0teHktbm9kZS1ib3JkZXIsIHZhcigtLXh5LW5vZGUtYm9yZGVyLWRlZmF1bHQpKTtcbiAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0teHktbm9kZS1iYWNrZ3JvdW5kLWNvbG9yLCB2YXIoLS14eS1ub2RlLWJhY2tncm91bmQtY29sb3ItZGVmYXVsdCkpO1xufVxuLnJlYWN0LWZsb3dfX25vZGUtaW5wdXQuc2VsZWN0YWJsZTpob3ZlciwgLnJlYWN0LWZsb3dfX25vZGUtZGVmYXVsdC5zZWxlY3RhYmxlOmhvdmVyLCAucmVhY3QtZmxvd19fbm9kZS1vdXRwdXQuc2VsZWN0YWJsZTpob3ZlciwgLnJlYWN0LWZsb3dfX25vZGUtZ3JvdXAuc2VsZWN0YWJsZTpob3ZlciB7XG4gICAgICBib3gtc2hhZG93OiB2YXIoLS14eS1ub2RlLWJveHNoYWRvdy1ob3ZlciwgdmFyKC0teHktbm9kZS1ib3hzaGFkb3ctaG92ZXItZGVmYXVsdCkpO1xuICAgIH1cbi5yZWFjdC1mbG93X19ub2RlLWlucHV0LnNlbGVjdGFibGUuc2VsZWN0ZWQsXG4gICAgLnJlYWN0LWZsb3dfX25vZGUtaW5wdXQuc2VsZWN0YWJsZTpmb2N1cyxcbiAgICAucmVhY3QtZmxvd19fbm9kZS1pbnB1dC5zZWxlY3RhYmxlOmZvY3VzLXZpc2libGUsXG4gICAgLnJlYWN0LWZsb3dfX25vZGUtZGVmYXVsdC5zZWxlY3RhYmxlLnNlbGVjdGVkLFxuICAgIC5yZWFjdC1mbG93X19ub2RlLWRlZmF1bHQuc2VsZWN0YWJsZTpmb2N1cyxcbiAgICAucmVhY3QtZmxvd19fbm9kZS1kZWZhdWx0LnNlbGVjdGFibGU6Zm9jdXMtdmlzaWJsZSxcbiAgICAucmVhY3QtZmxvd19fbm9kZS1vdXRwdXQuc2VsZWN0YWJsZS5zZWxlY3RlZCxcbiAgICAucmVhY3QtZmxvd19fbm9kZS1vdXRwdXQuc2VsZWN0YWJsZTpmb2N1cyxcbiAgICAucmVhY3QtZmxvd19fbm9kZS1vdXRwdXQuc2VsZWN0YWJsZTpmb2N1cy12aXNpYmxlLFxuICAgIC5yZWFjdC1mbG93X19ub2RlLWdyb3VwLnNlbGVjdGFibGUuc2VsZWN0ZWQsXG4gICAgLnJlYWN0LWZsb3dfX25vZGUtZ3JvdXAuc2VsZWN0YWJsZTpmb2N1cyxcbiAgICAucmVhY3QtZmxvd19fbm9kZS1ncm91cC5zZWxlY3RhYmxlOmZvY3VzLXZpc2libGUge1xuICAgICAgYm94LXNoYWRvdzogdmFyKC0teHktbm9kZS1ib3hzaGFkb3ctc2VsZWN0ZWQsIHZhcigtLXh5LW5vZGUtYm94c2hhZG93LXNlbGVjdGVkLWRlZmF1bHQpKTtcbiAgICB9XG4ucmVhY3QtZmxvd19fbm9kZS1ncm91cCB7XG4gIGJhY2tncm91bmQtY29sb3I6IHZhcigtLXh5LW5vZGUtZ3JvdXAtYmFja2dyb3VuZC1jb2xvciwgdmFyKC0teHktbm9kZS1ncm91cC1iYWNrZ3JvdW5kLWNvbG9yLWRlZmF1bHQpKTtcbn1cbi5yZWFjdC1mbG93X19ub2Rlc3NlbGVjdGlvbi1yZWN0LFxuLnJlYWN0LWZsb3dfX3NlbGVjdGlvbiB7XG4gIGJhY2tncm91bmQ6IHZhcigtLXh5LXNlbGVjdGlvbi1iYWNrZ3JvdW5kLWNvbG9yLCB2YXIoLS14eS1zZWxlY3Rpb24tYmFja2dyb3VuZC1jb2xvci1kZWZhdWx0KSk7XG4gIGJvcmRlcjogdmFyKC0teHktc2VsZWN0aW9uLWJvcmRlciwgdmFyKC0teHktc2VsZWN0aW9uLWJvcmRlci1kZWZhdWx0KSk7XG59XG4ucmVhY3QtZmxvd19fbm9kZXNzZWxlY3Rpb24tcmVjdDpmb2N1cyxcbiAgLnJlYWN0LWZsb3dfX25vZGVzc2VsZWN0aW9uLXJlY3Q6Zm9jdXMtdmlzaWJsZSxcbiAgLnJlYWN0LWZsb3dfX3NlbGVjdGlvbjpmb2N1cyxcbiAgLnJlYWN0LWZsb3dfX3NlbGVjdGlvbjpmb2N1cy12aXNpYmxlIHtcbiAgICBvdXRsaW5lOiBub25lO1xuICB9XG4ucmVhY3QtZmxvd19fY29udHJvbHMtYnV0dG9uOmhvdmVyIHtcbiAgICAgIGJhY2tncm91bmQ6IHZhcihcbiAgICAgICAgLS14eS1jb250cm9scy1idXR0b24tYmFja2dyb3VuZC1jb2xvci1ob3Zlci1wcm9wcyxcbiAgICAgICAgdmFyKC0teHktY29udHJvbHMtYnV0dG9uLWJhY2tncm91bmQtY29sb3ItaG92ZXIsIHZhcigtLXh5LWNvbnRyb2xzLWJ1dHRvbi1iYWNrZ3JvdW5kLWNvbG9yLWhvdmVyLWRlZmF1bHQpKVxuICAgICAgKTtcbiAgICAgIGNvbG9yOiB2YXIoXG4gICAgICAgIC0teHktY29udHJvbHMtYnV0dG9uLWNvbG9yLWhvdmVyLXByb3BzLFxuICAgICAgICB2YXIoLS14eS1jb250cm9scy1idXR0b24tY29sb3ItaG92ZXIsIHZhcigtLXh5LWNvbnRyb2xzLWJ1dHRvbi1jb2xvci1ob3Zlci1kZWZhdWx0KSlcbiAgICAgICk7XG4gICAgfVxuLnJlYWN0LWZsb3dfX2NvbnRyb2xzLWJ1dHRvbjpkaXNhYmxlZCB7XG4gICAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgICB9XG4ucmVhY3QtZmxvd19fY29udHJvbHMtYnV0dG9uOmRpc2FibGVkIHN2ZyB7XG4gICAgICAgIGZpbGwtb3BhY2l0eTogMC40O1xuICAgICAgfVxuLnJlYWN0LWZsb3dfX2NvbnRyb2xzLWJ1dHRvbjpsYXN0LWNoaWxkIHtcbiAgICBib3JkZXItYm90dG9tOiBub25lO1xuICB9XG4ucmVhY3QtZmxvd19fcmVzaXplLWNvbnRyb2wge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG59XG4ucmVhY3QtZmxvd19fcmVzaXplLWNvbnRyb2wubGVmdCxcbi5yZWFjdC1mbG93X19yZXNpemUtY29udHJvbC5yaWdodCB7XG4gIGN1cnNvcjogZXctcmVzaXplO1xufVxuLnJlYWN0LWZsb3dfX3Jlc2l6ZS1jb250cm9sLnRvcCxcbi5yZWFjdC1mbG93X19yZXNpemUtY29udHJvbC5ib3R0b20ge1xuICBjdXJzb3I6IG5zLXJlc2l6ZTtcbn1cbi5yZWFjdC1mbG93X19yZXNpemUtY29udHJvbC50b3AubGVmdCxcbi5yZWFjdC1mbG93X19yZXNpemUtY29udHJvbC5ib3R0b20ucmlnaHQge1xuICBjdXJzb3I6IG53c2UtcmVzaXplO1xufVxuLnJlYWN0LWZsb3dfX3Jlc2l6ZS1jb250cm9sLmJvdHRvbS5sZWZ0LFxuLnJlYWN0LWZsb3dfX3Jlc2l6ZS1jb250cm9sLnRvcC5yaWdodCB7XG4gIGN1cnNvcjogbmVzdy1yZXNpemU7XG59XG4vKiBoYW5kbGUgc3R5bGVzICovXG4ucmVhY3QtZmxvd19fcmVzaXplLWNvbnRyb2wuaGFuZGxlIHtcbiAgd2lkdGg6IDRweDtcbiAgaGVpZ2h0OiA0cHg7XG4gIGJvcmRlcjogMXB4IHNvbGlkICNmZmY7XG4gIGJvcmRlci1yYWRpdXM6IDFweDtcbiAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0teHktcmVzaXplLWJhY2tncm91bmQtY29sb3IsIHZhcigtLXh5LXJlc2l6ZS1iYWNrZ3JvdW5kLWNvbG9yLWRlZmF1bHQpKTtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLTUwJSk7XG59XG4ucmVhY3QtZmxvd19fcmVzaXplLWNvbnRyb2wuaGFuZGxlLmxlZnQge1xuICBsZWZ0OiAwO1xuICB0b3A6IDUwJTtcbn1cbi5yZWFjdC1mbG93X19yZXNpemUtY29udHJvbC5oYW5kbGUucmlnaHQge1xuICBsZWZ0OiAxMDAlO1xuICB0b3A6IDUwJTtcbn1cbi5yZWFjdC1mbG93X19yZXNpemUtY29udHJvbC5oYW5kbGUudG9wIHtcbiAgbGVmdDogNTAlO1xuICB0b3A6IDA7XG59XG4ucmVhY3QtZmxvd19fcmVzaXplLWNvbnRyb2wuaGFuZGxlLmJvdHRvbSB7XG4gIGxlZnQ6IDUwJTtcbiAgdG9wOiAxMDAlO1xufVxuLnJlYWN0LWZsb3dfX3Jlc2l6ZS1jb250cm9sLmhhbmRsZS50b3AubGVmdCB7XG4gIGxlZnQ6IDA7XG59XG4ucmVhY3QtZmxvd19fcmVzaXplLWNvbnRyb2wuaGFuZGxlLmJvdHRvbS5sZWZ0IHtcbiAgbGVmdDogMDtcbn1cbi5yZWFjdC1mbG93X19yZXNpemUtY29udHJvbC5oYW5kbGUudG9wLnJpZ2h0IHtcbiAgbGVmdDogMTAwJTtcbn1cbi5yZWFjdC1mbG93X19yZXNpemUtY29udHJvbC5oYW5kbGUuYm90dG9tLnJpZ2h0IHtcbiAgbGVmdDogMTAwJTtcbn1cbi8qIGxpbmUgc3R5bGVzICovXG4ucmVhY3QtZmxvd19fcmVzaXplLWNvbnRyb2wubGluZSB7XG4gIGJvcmRlci1jb2xvcjogdmFyKC0teHktcmVzaXplLWJhY2tncm91bmQtY29sb3IsIHZhcigtLXh5LXJlc2l6ZS1iYWNrZ3JvdW5kLWNvbG9yLWRlZmF1bHQpKTtcbiAgYm9yZGVyLXdpZHRoOiAwO1xuICBib3JkZXItc3R5bGU6IHNvbGlkO1xufVxuLnJlYWN0LWZsb3dfX3Jlc2l6ZS1jb250cm9sLmxpbmUubGVmdCxcbi5yZWFjdC1mbG93X19yZXNpemUtY29udHJvbC5saW5lLnJpZ2h0IHtcbiAgd2lkdGg6IDFweDtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgMCk7XG4gIHRvcDogMDtcbiAgaGVpZ2h0OiAxMDAlO1xufVxuLnJlYWN0LWZsb3dfX3Jlc2l6ZS1jb250cm9sLmxpbmUubGVmdCB7XG4gIGxlZnQ6IDA7XG4gIGJvcmRlci1sZWZ0LXdpZHRoOiAxcHg7XG59XG4ucmVhY3QtZmxvd19fcmVzaXplLWNvbnRyb2wubGluZS5yaWdodCB7XG4gIGxlZnQ6IDEwMCU7XG4gIGJvcmRlci1yaWdodC13aWR0aDogMXB4O1xufVxuLnJlYWN0LWZsb3dfX3Jlc2l6ZS1jb250cm9sLmxpbmUudG9wLFxuLnJlYWN0LWZsb3dfX3Jlc2l6ZS1jb250cm9sLmxpbmUuYm90dG9tIHtcbiAgaGVpZ2h0OiAxcHg7XG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsIC01MCUpO1xuICBsZWZ0OiAwO1xuICB3aWR0aDogMTAwJTtcbn1cbi5yZWFjdC1mbG93X19yZXNpemUtY29udHJvbC5saW5lLnRvcCB7XG4gIHRvcDogMDtcbiAgYm9yZGVyLXRvcC13aWR0aDogMXB4O1xufVxuLnJlYWN0LWZsb3dfX3Jlc2l6ZS1jb250cm9sLmxpbmUuYm90dG9tIHtcbiAgYm9yZGVyLWJvdHRvbS13aWR0aDogMXB4O1xuICB0b3A6IDEwMCU7XG59XG4ucmVhY3QtZmxvd19fZWRnZS10ZXh0Ymcge1xuICBmaWxsOiB2YXIoLS14eS1lZGdlLWxhYmVsLWJhY2tncm91bmQtY29sb3IsIHZhcigtLXh5LWVkZ2UtbGFiZWwtYmFja2dyb3VuZC1jb2xvci1kZWZhdWx0KSk7XG59XG4ucmVhY3QtZmxvd19fZWRnZS10ZXh0IHtcbiAgZmlsbDogdmFyKC0teHktZWRnZS1sYWJlbC1jb2xvciwgdmFyKC0teHktZWRnZS1sYWJlbC1jb2xvci1kZWZhdWx0KSk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBRUE7QUFDRTtBQUVBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFBQTtBQUVGO0FBQ0U7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUVBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUFBO0FBRUY7QUFDRTtBQUNBO0FBQ0E7QUFBQTtBQUVGO0FBQ0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBRUY7QUFDRTtBQUFBO0FBRUY7QUFDSTtBQUFBO0FBRUo7QUFDSTtBQUFBO0FBRUo7QUFDSTtBQUFBO0FBRUo7QUFDRTtBQUNBO0FBQ0E7QUFBQTtBQUVGO0FBQ0U7QUFBQTtBQUVGO0FBQ0U7QUFBQTtBQUVGO0FBQUE7QUFFRTtBQUFBO0FBRUY7QUFDRTtBQUNBO0FBQ0E7QUFBQTtBQUVGO0FBQ0U7QUFDQTtBQUNBO0FBQUE7QUFFRjtBQUNFO0FBQUE7QUFFRjtBQUNJO0FBQ0E7QUFDQTtBQUFBO0FBRUo7QUFDRTtBQUFBO0FBRUY7QUFDSTtBQUFBO0FBRUo7QUFDSTtBQUNBO0FBQUE7QUFFSjtBQUNJO0FBQ0E7QUFBQTtBQUVKO0FBQ0k7QUFBQTtBQUVKO0FBQUE7QUFBQTtBQUdJO0FBQUE7QUFFSjtBQUFBO0FBQUE7QUFHSTtBQUFBO0FBRUo7QUFDSTtBQUFBO0FBRUo7QUFDSTtBQUNBO0FBQ0c7QUFDSztBQUFBO0FBRVo7QUFDRTtBQUFBO0FBRUY7QUFDSTtBQUNBO0FBQUE7QUFFSjtBQUNFO0FBQ0E7QUFDQTtBQUFBO0FBRUY7QUFDRTtBQUNBO0FBQUE7QUFFRjtBQUNFO0FBQ0E7QUFDRztBQUNLO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUVGO0FBQ0k7QUFBQTtBQUVKO0FBQ0k7QUFDQTtBQUFBO0FBRUo7QUFDTTtBQUFBO0FBRU47QUFDRTtBQUNBO0FBQ0E7QUFBQTtBQUVGO0FBQ0k7QUFDQTtBQUNBO0FBQUE7QUFFSjtBQUNFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBRUY7QUFDSTtBQUFBO0FBRUo7QUFDSTtBQUNBO0FBQUE7QUFFSjtBQUNJO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFFSjtBQUNJO0FBQ0E7QUFDQTtBQUFBO0FBRUo7QUFDSTtBQUNBO0FBQ0E7QUFBQTtBQUVKO0FBQ0k7QUFDQTtBQUNBO0FBQUE7QUFFSjtBQUNFO0FBQ0E7QUFBQTtBQUVGO0FBQ0U7QUFDQTtBQUNBO0FBQUE7QUFFRjtBQUNJO0FBQUE7QUFFSjtBQUNJO0FBQUE7QUFFSjtBQUNJO0FBQUE7QUFFSjtBQUNJO0FBQUE7QUFFSjtBQUNJO0FBQ0E7QUFBQTtBQUVKO0FBQ0U7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUVGO0FBQ0k7QUFDQTtBQUFBO0FBRUo7QUFBQTtBQUVJO0FBQUE7QUFBQTtBQUdKO0FBQ0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNHO0FBQ0s7QUFDUjtBQUNBO0FBQUE7QUFFRjtBQUNFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNHO0FBQ0s7QUFBQTtBQUVWO0FBQ0U7QUFBQTtBQUtGO0FBQ0k7QUFBQTtBQUVKO0FBQ0k7QUFJQTtBQUlBO0FBQUE7QUFLSjtBQUNJO0FBSUE7QUFJQTtBQUFBO0FBS0o7QUFDSTtBQUFBO0FBS0o7QUFDSTtBQUFBO0FBS0o7QUFDSTtBQUFBO0FBS0o7QUFDRTtBQUNBO0FBQ0E7QUFBQTtBQUVGO0FBQ0k7QUFBQTtBQUVKO0FBQ0k7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBS0E7QUFJQTtBQUNBO0FBQ0c7QUFDSztBQUFBO0FBRVo7QUFDTTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBRU47QUFDTTtBQUFBO0FBRU47QUFDSTtBQUFBO0FBRUo7QUFBQTtBQUVJO0FBQUE7QUFFSjtBQUFBO0FBQUE7QUFBQTtBQUlFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUVGO0FBQUE7QUFBQTtBQUFBO0FBQ007QUFBQTtBQUVOO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVlNO0FBQUE7QUFFTjtBQUNFO0FBQUE7QUFFRjtBQUFBO0FBRUU7QUFDQTtBQUFBO0FBRUY7QUFBQTtBQUFBO0FBQUE7QUFJSTtBQUFBO0FBRUo7QUFDTTtBQUlBO0FBQUE7QUFLTjtBQUNNO0FBQUE7QUFFTjtBQUNRO0FBQUE7QUFFUjtBQUNJO0FBQUE7QUFFSjtBQUNFO0FBQUE7QUFFRjtBQUFBO0FBRUU7QUFBQTtBQUVGO0FBQUE7QUFFRTtBQUFBO0FBRUY7QUFBQTtBQUVFO0FBQUE7QUFFRjtBQUFBO0FBRUU7QUFBQTtBQUdGO0FBQ0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFFRjtBQUNFO0FBQ0E7QUFBQTtBQUVGO0FBQ0U7QUFDQTtBQUFBO0FBRUY7QUFDRTtBQUNBO0FBQUE7QUFFRjtBQUNFO0FBQ0E7QUFBQTtBQUVGO0FBQ0U7QUFBQTtBQUVGO0FBQ0U7QUFBQTtBQUVGO0FBQ0U7QUFBQTtBQUVGO0FBQ0U7QUFBQTtBQUdGO0FBQ0U7QUFDQTtBQUNBO0FBQUE7QUFFRjtBQUFBO0FBRUU7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUVGO0FBQ0U7QUFDQTtBQUFBO0FBRUY7QUFDRTtBQUNBO0FBQUE7QUFFRjtBQUFBO0FBRUU7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUVGO0FBQ0U7QUFDQTtBQUFBO0FBRUY7QUFDRTtBQUNBO0FBQUE7QUFFRjtBQUNFO0FBQUE7QUFFRjtBQUNFO0FBQUE7IiwKICAibmFtZXMiOiBbXQp9Cg== */
manifest.json

{
    "id": "caret",
    "name": "Caret",
    "version": "0.2.65",
    "minAppVersion": "1.5.12",
    "description": "Accelerate your work with LLMs in canvas and your notes",
    "author": "Jake Colling",
    "authorUrl": "https://twitter.com/JacobColling",
    "isDesktopOnly": true
}
main.ts

import { z } from "zod";

import {
    ai_sdk_streaming,
    sdk_provider,
    get_provider,
    isEligibleProvider,
    ai_sdk_completion,
    ai_sdk_structured,
} from "./llm_calls";

// // @ts-ignore
// import ollama from "ollama/browser";
import { encodingForModel } from "js-tiktoken";
import OpenAI from "openai";
import { around } from "monkey-around";
import { Canvas, ViewportNode, Message, Node, Edge, SparkleConfig } from "./types";
import {
    MarkdownView,
    Modal,
    Notice,
    Plugin,
    setTooltip,
    setIcon,
    requestUrl,
    editorEditorField,
    addIcon,
    loadPdfJs,
} from "obsidian";
import { CanvasFileData, CanvasNodeData, CanvasTextData } from "obsidian/canvas";

// Import all of the views, components, models, etc
import { CaretSettingTab } from "./settings";
import { CMDJModal } from "./modals/inlineEditingModal";
import { RemoveCustomModelModal } from "./modals/removeCustomModel";
// import { ResearchModal } from "./modals/researcherModal";
import { SystemPromptModal } from "./modals/systemPromptModal";
import { redBackgroundField } from "./editorExtensions/inlineDiffs";
import { NewNode, CaretPluginSettings } from "./types";
import { CustomModelModal } from "./modals/addCustomModel";
import { LinearWorkflowEditor } from "./views/workflowEditor";
import { FullPageChat, VIEW_CHAT } from "./views/chat";
import { CaretCanvas } from "./caret_canvas";
const parseString = require("xml2js").parseString;
import { createGoogleGenerativeAI, GoogleGenerativeAIProvider } from "@ai-sdk/google";
import { createOpenAI, OpenAIProvider } from "@ai-sdk/openai";
import { StreamTextResult, CoreTool } from "ai";
import { AnthropicProvider, createAnthropic } from "@ai-sdk/anthropic";
import { GroqProvider, createGroq } from "@ai-sdk/groq";
import { createOllama, OllamaProvider } from "ollama-ai-provider";
import { createOpenRouter, OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import { createOpenAICompatible, OpenAICompatibleProvider } from "@ai-sdk/openai-compatible";

export const DEFAULT_SETTINGS: CaretPluginSettings = {
    caret_version: "0.2.65",
    chat_logs_folder: "caret/chats",
    chat_logs_date_format_bool: false,
    chat_logs_rename_bool: true,
    chat_send_chat_shortcut: "enter",
    model: "gpt-4-turbo",
    llm_provider: "openai",
    openai_api_key: "",
    groq_api_key: "",
    anthropic_api_key: "",
    open_router_key: "",
    context_window: 128000,
    custom_endpoints: {},
    system_prompt: "",
    temperature: 1,
    llm_provider_options: {
        openai: {
            "gpt-4-turbo": {
                name: "gpt-4-turbo",
                context_window: 128000,
                function_calling: true,
                vision: true,
                streaming: true,
            },
            "gpt-3.5-turbo": {
                name: "gpt-3.5-turbo",
                context_window: 128000,
                function_calling: true,
                vision: true,
                streaming: true,
            },
            "gpt-4o": {
                name: "gpt-4o",
                context_window: 128000,
                function_calling: true,
                vision: true,
                streaming: true,
            },
            "gpt-4o-mini": {
                name: "gpt-4o-mini",
                context_window: 128000,
                function_calling: true,
                vision: true,
                streaming: true,
            },
            "o1-preview": {
                name: "o1-preview",
                context_window: 128000,
                function_calling: false,
                vision: false,
                streaming: false,
            },
            "o1-mini": {
                name: "o1-mini",
                context_window: 128000,
                function_calling: false,
                vision: false,
                streaming: false,
            },
        },
        groq: {
            "llama3-8b-8192": {
                name: "Llama 8B",
                context_window: 8192,
                function_calling: false,
                vision: false,
                streaming: true,
            },
            "llama3-70b-8192": {
                name: "Llama 70B",
                context_window: 8192,
                function_calling: false,
                vision: false,
                streaming: true,
            },
            "mixtral-8x7b-32768": {
                name: "Mixtral 8x7b",
                context_window: 32768,
                function_calling: false,
                vision: false,
                streaming: true,
            },
            "gemma-7b-it": {
                name: "Gemma 7B",
                context_window: 8192,
                function_calling: false,
                vision: false,
                streaming: true,
            },
            // In preview, not accessiable yet
            "llama-3.1-8b-instant": {
                name: "llama 3.1 8B Instant (Preview)",
                context_window: 8000,
                function_calling: true,
                vision: true,
                streaming: true,
            },
            "llama-3.1-70b-versatile": {
                name: "llama 3.1 70B Versatile (Preview)",
                context_window: 8000,
                function_calling: true,
                vision: true,
                streaming: true,
            },

            // Failed on first attempt. Need to add retry logic first.
            // "llama3-groq-70b-8192-tool-use-preview": {
            //     name: "llama3 Groq 70b Tool Use Preview",
            //     context_window: 8192,
            //     function_calling: true,
            //     vision: true,
            //     streaming: true,
            // },
        },
        anthropic: {
            "claude-3-5-sonnet-20240620": {
                name: "Claude 3.5 Sonnet",
                context_window: 200000,
                function_calling: true,
                vision: true,
                streaming: true,
            },
            "claude-3-opus-20240229": {
                name: "Claude 3 Opus",
                context_window: 200000,
                function_calling: true,
                vision: true,
                streaming: true,
            },
            "claude-3-sonnet-20240229": {
                name: "Claude 3 Sonnet",
                context_window: 200000,
                function_calling: true,
                vision: true,
                streaming: true,
            },

            "claude-3-haiku-20240307": {
                name: "Claude 3 Haiku",
                context_window: 200000,
                function_calling: true,
                vision: true,
                streaming: true,
            },
        },
        openrouter: {
            "anthropic/claude-3-opus": {
                name: "Claude 3 Opus",
                context_window: 200000,
                function_calling: true,
                vision: true,
                streaming: true,
            },
            "anthropic/claude-3-sonnet": {
                name: "Claude 3 Sonnet",
                context_window: 200000,
                function_calling: true,
                vision: true,
                streaming: true,
            },
            "anthropic/claude-3.5-sonnet": {
                name: "Claude 3.5 Sonnet",
                context_window: 200000,
                function_calling: true,
                vision: true,
                streaming: true,
            },
            "anthropic/claude-3-haiku": {
                name: "Claude 3 Haiku",
                context_window: 200000,
                function_calling: true,
                vision: true,
                streaming: true,
            },
            "google/gemini-flash-1.5": {
                name: "Gemini Flash 1.5",
                context_window: 2800000,
                function_calling: true,
                vision: true,
                streaming: true,
            },
            "google/gemini-pro-1.5": {
                name: "Gemini Pro 1.5",
                context_window: 2800000,
                function_calling: true,
                vision: true,
                streaming: true,
            },
            "google/gemini-flash-1.5-exp": {
                name: "Gemini Flash 1.5 Experimental",
                context_window: 4000000,
                function_calling: true,
                vision: true,
                streaming: true,
            },
            "meta-llama/llama-3.1-405b-instruct": {
                name: "Llama3.1 405B Instruct",
                context_window: 131072,
                function_calling: true,
                vision: true,
                streaming: true,
            },
            "meta-llama/llama-3.1-8b-instruct": {
                name: "Llama3.1 8B Instruct",
                context_window: 100000,
                function_calling: true,
                vision: true,
                streaming: true,
            },
            "meta-llama/llama-3.1-70b-instruct": {
                name: "Llama3.1 70B Instruct",
                context_window: 100000,
                function_calling: true,
                vision: true,
                streaming: true,
            },
        },
        ollama: {
            "llama3.1": {
                name: "llama3.1 8B",
                context_window: 131072,
                function_calling: false,
                vision: false,
                streaming: true,
            },
            llama3: {
                name: "llama3 8B",
                context_window: 8192,
                function_calling: false,
                vision: false,
                streaming: true,
            },
            "llama3.2:1b": {
                name: "llama3.2 1B",
                context_window: 131072,
                function_calling: false,
                vision: false,
                streaming: true,
            },
            "llama3.2:3b": {
                name: "llama3.2 3B",
                context_window: 131072,
                function_calling: false,
                vision: false,
                streaming: true,
            },
            phi3: {
                name: "Phi-3 3.8B",
                context_window: 8192,
                function_calling: false,
                vision: false,
                streaming: true,
            },
            mistral: {
                name: "Mistral 7B",
                context_window: 32768,
                function_calling: false,
                vision: false,
                streaming: true,
            },
            gemma: {
                name: "Gemma 7B",
                context_window: 8192,
                function_calling: false,
                vision: false,
                streaming: true,
            },
            gemma2: {
                name: "Gemma 2",
                context_window: 8192,
                function_calling: false,
                vision: false,
                streaming: true,
            },
        },
        custom: {},
        google: {
            "gemini-1.5-pro": {
                name: "Gemini 1.5 Pro",
                context_window: 800000,
                function_calling: true,
                vision: true,
                streaming: true,
            },
            "gemini-1.5-flash": {
                name: "Gemini 1.5 Flash",
                context_window: 400000,
                function_calling: true,
                vision: true,
                streaming: true,
            },
        },
        perplexity: {
            "llama-3.1-sonar-small-128k-online": {
                name: "Sonar Small",
                context_window: 127072,
                function_calling: false,
                vision: false,
                streaming: true,
            },
            "llama-3.1-sonar-large-128k-online": {
                name: "Sonar Large",
                context_window: 127072,
                function_calling: false,
                vision: false,
                streaming: true,
            },
            "llama-3.1-sonar-huge-128k-online": {
                name: "Sonar Huge",
                context_window: 127072,
                function_calling: false,
                vision: false,
                streaming: true,
            },
        },
    },
    provider_dropdown_options: {
        openai: "OpenAI",
        groq: "Groq",
        ollama: "Ollama",
        anthropic: "Anthropic",
        openrouter: "OpenRouter",
        custom: "Custom",
        google: "Google Gemini",
        perplexity: "Perplexity",
    },
    include_nested_block_refs: true,
    google_api_key: "",
    perplexity_api_key: "",
};

export default class CaretPlugin extends Plugin {
    settings: CaretPluginSettings;
    canvas_patched: boolean = false;
    selected_node_colors: any = {};
    color_picker_open_on_last_click: boolean = false;
    openai_client: OpenAIProvider;
    groq_client: GroqProvider;
    anthropic_client: AnthropicProvider;
    ollama_client: OllamaProvider;
    openrouter_client: OpenRouterProvider;
    encoder: any;
    pdfjs: any;
    google_client: GoogleGenerativeAIProvider;
    custom_client: OpenAICompatibleProvider | undefined | null;
    perplexity_client: OpenAICompatibleProvider;

    async onload() {
        // Initalize extra icons
        // addIcon("circle", `<circle cx="50" cy="50" r="50" fill="currentColor" />`);
        addIcon(
            "lucide-user-x",
            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-x"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" x2="22" y1="8" y2="13"/><line x1="22" x2="17" y1="8" y2="13"/></svg>'
        );
        // Set up the encoder (gpt-4 is just used for everything as a short term solution)
        this.encoder = encodingForModel("gpt-4-0125-preview");
        this.pdfjs = await loadPdfJs();
        // Load settings
        await this.loadSettings();

        // Initialize API clients
        if (this.settings.openai_api_key) {
            this.openai_client = createOpenAI({ apiKey: this.settings.openai_api_key });
        }
        if (this.settings.groq_api_key) {
            this.groq_client = createGroq({ apiKey: this.settings.groq_api_key });
        }
        if (this.settings.anthropic_api_key) {
            this.anthropic_client = createAnthropic({
                apiKey: this.settings.anthropic_api_key,
                headers: {
                    "anthropic-dangerous-direct-browser-access": "true",
                },
            });
        }

        if (this.settings.open_router_key) {
            this.openrouter_client = createOpenRouter({
                apiKey: this.settings.open_router_key,
            });
        }

        if (this.settings.google_api_key) {
            this.google_client = createGoogleGenerativeAI({
                apiKey: this.settings.google_api_key,
                // dangerouslyAllowBrowser: true,
            });
        }

        if (this.settings.perplexity_api_key) {
            this.perplexity_client = createOpenAICompatible({
                apiKey: this.settings.perplexity_api_key,
                baseURL: "https://api.perplexity.ai/",
                name: "perplexity",
            });
        }

        // SEt up Ollama
        this.ollama_client = createOllama();
        this.custom_client = undefined;

        // Initialize settings dab.
        this.addSettingTab(new CaretSettingTab(this.app, this));

        // Add Commands.
        this.addCommand({
            id: "add-custom-models",
            name: "Add custom models",
            callback: () => {
                new CustomModelModal(this.app, this).open();
            },
        });

        // Add Commands.
        this.addCommand({
            id: "toggle-nested-block-refs",
            name: "Toggle Including Nested Block Refs",
            callback: async () => {
                this.settings.include_nested_block_refs = !this.settings.include_nested_block_refs;
                await this.saveSettings();
            },
        });

        this.addCommand({
            id: "remove-custom-models",
            name: "Remove custom models",
            callback: () => {
                new RemoveCustomModelModal(this.app, this).open();
            },
        });
        this.addCommand({
            id: "set-system-prompt",
            name: "Set system prompt",
            callback: () => {
                new SystemPromptModal(this.app, this).open();
            },
        });
        this.addCommand({
            id: "create-new-workflow",
            name: "Create new workflow",
            callback: () => {
                const leaf = this.app.workspace.getLeaf(true);
                const linearWorkflowEditor = new LinearWorkflowEditor(this, leaf);
                leaf.open(linearWorkflowEditor);
                this.app.workspace.revealLeaf(leaf);
            },
        });
        this.addCommand({
            id: "create-linear-workflow",
            name: "Create linear workflow from canvas",
            checkCallback: (checking: boolean) => {
                const canvas_view = this.app.workspace.getMostRecentLeaf()?.view;
                let on_canvas = false;

                // @ts-ignore
                if (canvas_view?.canvas) {
                    on_canvas = true;
                }
                // @ts-ignore TODO: Type this better
                if (on_canvas) {
                    if (!checking) {
                        // @ts-ignore
                        const canvas = canvas_view.canvas;

                        const selection = canvas.selection;

                        const selected_ids = [];
                        const selection_iterator = selection.values();
                        for (const node of selection_iterator) {
                            selected_ids.push(node.id);
                        }

                        const canvas_data = canvas.getData();
                        const { nodes, edges } = canvas;

                        // Filter nodes and edges based on selected IDs
                        const selected_nodes = [];
                        for (const node of nodes.values()) {
                            if (selected_ids.includes(node.id)) {
                                selected_nodes.push(node);
                            }
                        }

                        const selected_edges = [];
                        for (const edge of edges.values()) {
                            // if (selected_ids.includes(edge.from.node.id) && selected_ids.includes(edge.to.node.id)) {
                            if (selected_ids.includes(edge.to.node.id)) {
                                selected_edges.push(edge);
                            }
                        }
                        const linear_graph = [];
                        for (let i = 0; i < selected_edges.length; i++) {
                            const edge = selected_edges[i];
                            const from_node = edge.from.node.id;
                            const to_node = edge.to.node.id;
                            const node_text = linear_graph.push({ from_node, to_node });
                        }
                        const from_nodes = new Set(linear_graph.map((edge) => edge.from_node));
                        const to_nodes = new Set(linear_graph.map((edge) => edge.to_node));

                        let ultimate_ancestor = null;
                        let ultimate_child = null;

                        // Find the ultimate ancestor (a from_node that is not a to_node)
                        for (const from_node of from_nodes) {
                            if (!to_nodes.has(from_node)) {
                                ultimate_ancestor = from_node;
                                break;
                            }
                        }

                        // Find the ultimate child (a to_node that is not a from_node)
                        for (const to_node of to_nodes) {
                            if (!from_nodes.has(to_node)) {
                                ultimate_child = to_node;
                                break;
                            }
                        }
                        // Create a map for quick lookup of edges by from_node
                        const edge_map = new Map();
                        for (const edge of linear_graph) {
                            if (!edge_map.has(edge.from_node)) {
                                edge_map.set(edge.from_node, []);
                            }
                            edge_map.get(edge.from_node).push(edge);
                        }

                        // Initialize the sorted graph with the ultimate ancestor
                        const sorted_graph = [];
                        let current_node = ultimate_ancestor;

                        // Traverse the graph starting from the ultimate ancestor
                        while (current_node !== ultimate_child) {
                            const edges_from_current = edge_map.get(current_node);
                            if (edges_from_current && edges_from_current.length > 0) {
                                const next_edge = edges_from_current[0]; // Assuming there's only one edge from each node
                                sorted_graph.push(next_edge);
                                current_node = next_edge.to_node;
                            } else {
                                break; // No further edges, break the loop
                            }
                        }

                        // Add the ultimate child as the last node
                        sorted_graph.push({ from_node: current_node, to_node: ultimate_child });
                        // Create a list to hold the ordered node IDs
                        const ordered_node_ids = [];

                        // Add the ultimate ancestor as the starting node
                        ordered_node_ids.push(ultimate_ancestor);

                        // Traverse the sorted graph to collect node IDs in order
                        for (const edge of sorted_graph) {
                            if (
                                edge.to_node !== ultimate_child ||
                                ordered_node_ids[ordered_node_ids.length - 1] !== ultimate_child
                            ) {
                                ordered_node_ids.push(edge.to_node);
                            }
                        }

                        // Initialize a new list to hold the prompts
                        const prompts = [];

                        // Iterate over the ordered node IDs
                        for (const node_id of ordered_node_ids) {
                            // Find the corresponding node in selected_nodes
                            const node = selected_nodes.find((n) => n.id === node_id);
                            if (node) {
                                // Get the node context
                                const context = node.text;
                                // Check if the context starts with "user"
                                if (node.unknownData.role === "user") {
                                    // Add the context to the prompts list
                                    prompts.push(context.replace("<role>user</role>", "").trim());
                                }
                            }
                        }

                        const chat_folder_path = "caret/workflows";
                        const chat_folder = this.app.vault.getAbstractFileByPath(chat_folder_path);
                        if (!chat_folder) {
                            this.app.vault.createFolder(chat_folder_path);
                        }

                        let prompts_string = ``;
                        for (let i = 0; i < prompts.length; i++) {
                            const escaped_content = this.escapeXml(prompts[i]);
                            prompts_string += `

<prompt model="${this.settings.model}" provider="${this.settings.llm_provider}" delay="0" temperature="1">
${escaped_content}
</prompt>`.trim();
                        }

                        let file_content = `
---
caret_prompt: linear
version: 1
---
\`\`\`xml
<root>
<system_prompt tag="placeholder_do_not_delete">
</system_prompt>
    ${prompts_string}
</root>
\`\`\`
`.trim();

                        let base_file_name = prompts[0]
                            .split(" ")
                            .slice(0, 10)
                            .join(" ")
                            .substring(0, 20)
                            .replace(/[^a-zA-Z0-9]/g, "_");
                        let file_name = `${base_file_name}.md`;
                        let file_path = `${chat_folder_path}/${file_name}`;
                        let file;
                        let counter = 1;

                        // Check if the file already exists and iterate until we find a new name
                        while (this.app.vault.getFileByPath(file_path)) {
                            file_name = `${base_file_name}_${counter}.md`;
                            file_path = `${chat_folder_path}/${file_name}`;
                            counter++;
                        }

                        this.app.vault.create(file_path, file_content).then(() => {
                            const leaf = this.app.workspace.getLeaf(true);
                            const linearWorkflowEditor = new LinearWorkflowEditor(this, leaf, file_path);
                            leaf.open(linearWorkflowEditor);
                            this.app.workspace.revealLeaf(leaf);
                        });
                    }

                    return true;
                }
                return false;
            },
        });

        this.addCommand({
            id: "canvas-prompt",
            name: "Canvas prompt",
            checkCallback: (checking: boolean) => {
                const canvas_view = this.app.workspace.getMostRecentLeaf()?.view;
                let on_canvas = false;
                // @ts-ignore
                if (canvas_view?.canvas) {
                    on_canvas = true;
                }
                // @ts-ignore TODO: Type this better
                if (on_canvas) {
                    if (!checking) {
                        (async () => {
                            // @ts-ignore
                            const canvas = canvas_view.canvas;
                            const selection = canvas.selection;

                            let average_x = 0;
                            let average_y = 0;
                            let average_height = 0;
                            let average_width = 0;

                            let total_x = 0;
                            let total_y = 0;
                            let count = 0;
                            let total_height = 0;
                            let total_width = 0;
                            let all_text = "";

                            let convo_total_tokens = 0;

                            const context_window = this.settings.context_window;

                            for (const obj of selection) {
                                const { x, y, height, width } = obj;
                                total_x += x;
                                total_y += y;
                                total_height += height;
                                total_width += width;
                                count++;
                                if ("text" in obj) {
                                    const { text } = obj;
                                    const text_token_length = this.encoder.encode(text).length;
                                    if (convo_total_tokens + text_token_length < context_window) {
                                        all_text += text + "\n";
                                        convo_total_tokens += text_token_length;
                                    } else {
                                        new Notice("Context window exceeded");
                                        break;
                                    }
                                } else if ("filePath" in obj) {
                                    let { filePath } = obj;
                                    const file = await this.app.vault.getFileByPath(filePath);
                                    if (!file) {
                                        console.error("Not a file at this file path");
                                        continue;
                                    }
                                    if (file.extension === "pdf") {
                                        const text = await this.extractTextFromPDF(file.name);
                                        const text_token_length = this.encoder.encode(text).length;
                                        if (convo_total_tokens + text_token_length > context_window) {
                                            new Notice("Context window exceeded");
                                            break;
                                        }
                                        const file_text = `PDF Title: ${file.name}`;
                                        all_text += `${file_text} \n ${text}`;
                                        convo_total_tokens += text_token_length;
                                    } else if (file?.extension === "md") {
                                        const text = await this.app.vault.read(file);
                                        const text_token_length = this.encoder.encode(text).length;
                                        if (convo_total_tokens + text_token_length > context_window) {
                                            new Notice("Context window exceeded");
                                            break;
                                        }
                                        const file_text = `
                                Title: ${filePath.replace(".md", "")}
                                ${text}
                                `.trim();
                                        all_text += file_text;
                                        convo_total_tokens += text_token_length;
                                    }
                                }
                            }

                            average_x = count > 0 ? total_x / count : 0;
                            average_y = count > 0 ? total_y / count : 0;
                            average_height = count > 0 ? Math.max(200, total_height / count) : 200;
                            average_width = count > 0 ? Math.max(200, total_width / count) : 200;

                            // This handles the model ---
                            // Create a modal with a text input and a submit button
                            const modal = new Modal(this.app);
                            modal.contentEl.createEl("h1", { text: "Canvas prompt" });
                            const container = modal.contentEl.createDiv({ cls: "caret-flex-col" });
                            const text_area = container.createEl("textarea", {
                                placeholder: "",
                                cls: "caret-w-full caret-mb-2",
                            });
                            const submit_button = container.createEl("button", { text: "Submit" });
                            submit_button.onclick = async () => {
                                modal.close();
                                const prompt = `
                        Please do the following:
                        ${text_area.value}

                        Given this content:
                        ${all_text}
                        `;
                                const conversation: Message[] = [{ role: "user", content: prompt }];
                                // Create the text node on the canvas
                                const text_node_config = {
                                    pos: { x: average_x + 50, y: average_y }, // Position on the canvas
                                    size: { width: average_width, height: average_height }, // Size of the text box
                                    position: "center", // This might relate to text alignment
                                    text: "", // Text content from input
                                    save: true, // Save this node's state
                                    focus: true, // Focus and start editing immediately
                                };
                                const node = canvas.createTextNode(text_node_config);
                                const node_id = node.id;

                                const provider = this.settings.llm_provider;
                                const model = this.settings.model;
                                const temperature = this.settings.temperature;

                                // await this.update_node_content_streaming(node_id, stream, this.settings.llm_provider);
                                if (!isEligibleProvider(provider)) {
                                    throw new Error(`Invalid provider: ${provider}`);
                                }

                                let sdk_provider: sdk_provider = get_provider(this, provider);

                                if (
                                    this.settings.llm_provider_options[this.settings.llm_provider][this.settings.model]
                                        .streaming
                                ) {
                                    const stream = await ai_sdk_streaming(
                                        sdk_provider,
                                        model,
                                        conversation,
                                        temperature,
                                        provider
                                    );

                                    await this.update_node_content_streaming(node_id, stream);
                                } else {
                                    const content = await ai_sdk_completion(
                                        sdk_provider,
                                        model,
                                        conversation,
                                        temperature,
                                        provider
                                    );
                                    node.setText(content);
                                }
                            };

                            modal.open();
                        })();
                    }

                    return true;
                }
                return false;
            },
        });

        this.addCommand({
            id: "inline-editing",
            name: "Inline editing",
            checkCallback: (checking: boolean) => {
                const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView && activeView.editor) {
                    const selectedText = activeView.editor.getSelection();
                    if (selectedText) {
                        if (!checking) {
                            const content = activeView.editor.getValue();
                            const startIndex = content.indexOf(selectedText);
                            const endIndex = startIndex + selectedText.length;
                            new CMDJModal(this.app, selectedText, startIndex, endIndex, this).open();
                        }
                        return true;
                    }
                }
                return false;
            },
        });

        this.addCommand({
            id: "edit-workflow",
            name: "Edit workflow",
            checkCallback: (checking: boolean) => {
                const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
                if (editor) {
                    if (!checking) {
                        (async () => {
                            const current_file = this.app.workspace.getActiveFile();
                            const front_matter = await this.getFrontmatter(current_file);

                            if (front_matter.caret_prompt !== "linear" && front_matter.caret_prompt !== "parallel") {
                                new Notice("Not a workflow");
                                return;
                            }
                            const leaf = this.app.workspace.getLeaf(true);
                            const linearWorkflowEditor = new LinearWorkflowEditor(this, leaf, current_file?.path);
                            leaf.open(linearWorkflowEditor);
                            this.app.workspace.revealLeaf(leaf);
                        })();
                    }
                    return true;
                }
                return false;
            },
        });

        this.addCommand({
            id: "apply-inline-changes",
            name: "Apply inline changes",
            checkCallback: (checking: boolean) => {
                const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;

                if (editor) {
                    if (!checking) {
                        let content = editor.getValue();
                        // Regex to find |-content-|
                        // @ts-ignore
                        const deleteRegex = /\|-(.*?)-\|/gs;

                        // Replace all instances of |-content-| with empty string
                        content = content.replace(deleteRegex, "");
                        // Replace all instances of |+content+| with empty string
                        content = content.replace(/\|\+/g, "");
                        content = content.replace(/\+\|/g, "");

                        // Set the modified content back to the editor
                        editor.setValue(content);
                        new Notice("Diffs applied successfully.");
                    }
                    return true;
                }
                return false;
            },
        });

        this.addCommand({
            id: "continue-chat",
            name: "Continue chat",
            callback: async () => {
                const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
                if (editor) {
                    const active_file = this.app.workspace.getActiveFile();
                    if (!active_file) {
                        new Notice("No active file to continue chat from");
                        return;
                    }
                    const active_file_name = active_file.name;
                    let content = editor.getValue();

                    const split = content.split("<root>");
                    const first_half = split[1];
                    const second_split = first_half.split("</root>");
                    const text = `<root>${second_split[0].trim()}</root>`;

                    let xml_object;

                    if (text) {
                        xml_object = await this.parseXml(text);
                    } else {
                        new Notice("No XML block found.");
                        return;
                    }
                    const convo_id = xml_object.root.metadata[0].id[0];
                    const messages_from_xml = xml_object.root.conversation[0].message;
                    const messages: Message[] = [];
                    if (messages_from_xml) {
                        for (let i = 0; i < messages_from_xml.length; i++) {
                            const role = messages_from_xml[i].role[0];
                            const content = messages_from_xml[i].content[0];
                            messages.push({ role, content });
                        }
                    }
                    if (convo_id && messages) {
                        const leaf = this.app.workspace.getLeaf(true);
                        // @ts-ignore
                        const header_el = leaf.tabHeaderEl;
                        if (header_el) {
                            const title_el = header_el.querySelector(".workspace-tab-header-inner-title");
                            if (title_el) {
                                if (active_file_name) {
                                    title_el.textContent = active_file_name;
                                } else {
                                    title_el.textContent = "Caret chat";
                                }
                            }
                        }
                        const chatView = new FullPageChat(this, leaf, convo_id, messages);
                        leaf.open(chatView);
                        leaf.getDisplayText();
                        this.app.workspace.revealLeaf(leaf);
                    } else {
                        new Notice("No valid chat data found in the current document.");
                    }
                } else {
                    new Notice("No active markdown editor found.");
                }
            },
        });

        // This registers patching the canvas
        this.registerEvent(
            this.app.workspace.on("active-leaf-change", (event) => {
                const currentFile = this.app.workspace.getActiveFile();
                if (currentFile?.extension === "canvas") {
                    this.unhighlightLineage();
                    this.patchCanvasMenu();
                }
            })
        );
        // Register the editor extension
        this.registerEditorExtension([redBackgroundField]);

        // Register the sidebar icon
        this.addChatIconToRibbon();

        // Register Views
        // Currently not using the sidebar chat.
        // this.registerView(VIEW_NAME_SIDEBAR_CHAT, (leaf) => new SidebarChat(leaf));
        this.registerView(VIEW_CHAT, (leaf) => new FullPageChat(this, leaf));
    }

    // General functions that the plugin uses
    async getFrontmatter(file: any) {
        let front_matter: any;
        try {
            await this.app.fileManager.processFrontMatter(file, (fm) => {
                front_matter = { ...fm };
            });
        } catch (error) {
            console.error("Error processing front matter:", error);
        }
        return front_matter;
    }

    async highlightLineage() {
        await new Promise((resolve) => setTimeout(resolve, 200)); // Sleep for 200 milliseconds

        const canvas_view = this.app.workspace.getMostRecentLeaf()?.view;
        // @ts-ignore
        if (!canvas_view?.canvas) {
            return;
        }
        // @ts-ignore TODO: Type this better
        const canvas = canvas_view.canvas; // Assuming canvas is a property of the view

        const selection = canvas.selection;
        const selection_iterator = selection.values();
        const node = selection_iterator.next().value;
        if (!node) {
            return;
        }
        const nodes_iterator = canvas.nodes.values();
        const nodes_array = Array.from(nodes_iterator);
        const canvas_data = canvas.getData();
        const { edges, nodes } = canvas_data;
        const longest_lineage = await CaretPlugin.getLongestLineage(nodes, edges, node.id);

        // Create a set to track lineage node IDs for comparison
        const lineage_node_ids = new Set(longest_lineage.map((node) => node.id));

        // Iterate through all nodes in the longest lineage
        for (const lineage_node of longest_lineage) {
            const lineage_id = lineage_node.id;
            const lineage_color = lineage_node.color;
            // Only store and change the color if it's not already stored
            if (!this.selected_node_colors.hasOwnProperty(lineage_id)) {
                this.selected_node_colors[lineage_id] = lineage_color; // Store the current color with node's id as key
                const filtered_nodes = nodes_array.filter((node: Node) => node.id === lineage_id);
                filtered_nodes.forEach((node: Node) => {
                    node.color = "4"; // Reset the node color to its original
                    node.render(); // Re-render the node to apply the color change
                });
            }
        }

        // Reset and remove nodes not in the current lineage
        Object.keys(this.selected_node_colors).forEach((node_id) => {
            if (!lineage_node_ids.has(node_id)) {
                const original_color = this.selected_node_colors[node_id];
                const filtered_nodes = nodes_array.filter((node: Node) => node.id === node_id);
                filtered_nodes.forEach((node: Node) => {
                    node.color = original_color; // Reset the node color to its original
                    node.render(); // Re-render the node to apply the color change
                });
                delete this.selected_node_colors[node_id]; // Remove from tracking object
            }
        });
    }
    async getChatLog(folderPath: string, chatId: string) {
        const chatFolder = this.app.vault.getFolderByPath(folderPath);
        if (!chatFolder) {
            await this.app.vault.createFolder(folderPath);
        }
        let fileToSaveTo = null;

        const folder = this.app.vault.getFolderByPath(folderPath);
        let folders_to_check = [folder];
        let num_folders_to_check = 1;
        let num_folders_checked = 0;

        while (num_folders_checked < num_folders_to_check) {
            const folder = folders_to_check[num_folders_checked];
            const children = folder?.children || [];
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (child.hasOwnProperty("extension")) {
                    // @ts-ignore
                    let contents = await this.app.vault.cachedRead(child);
                    if (!contents) {
                        continue;
                    }
                    contents = contents.toLowerCase();

                    const split_one = contents.split("<id>")[1];
                    const id = split_one.split("</id>")[0];
                    if (id.toLowerCase() === chatId.toLowerCase()) {
                        fileToSaveTo = child;
                    }
                } else {
                    // @ts-ignore
                    folders_to_check.push(child);
                    num_folders_to_check += 1;
                }
            }

            num_folders_checked += 1;
        }
        return fileToSaveTo;
    }
    escapeXml(unsafe: string): string {
        return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case "<":
                    return "&lt;";
                case ">":
                    return "&gt;";
                case "&":
                    return "&amp;";
                case "'":
                    return "&apos;";
                case '"':
                    return "&quot;";
                default:
                    return c;
            }
        });
    }
    async unhighlightLineage() {
        const canvas_view = this.app.workspace.getMostRecentLeaf()?.view;
        // @ts-ignore
        if (!canvas_view?.canvas) {
            return;
        }
        // @ts-ignore TODO: Type this better
        const canvas = canvas_view.canvas;
        const nodes_iterator = canvas.nodes.values();
        const nodes_array = Array.from(nodes_iterator);

        for (const node_id in this.selected_node_colors) {
            const filtered_nodes = nodes_array.filter((node: Node) => node.id === node_id);
            filtered_nodes.forEach((node: Node) => {
                node.color = this.selected_node_colors[node_id]; // Reset the node color to its original
                node.render(); // Re-render the node to apply the color change
            });
        }
        this.selected_node_colors = {}; // Clear the stored colors after resetting
    }
    patchCanvasMenu() {
        const canvasView = this.app.workspace.getMostRecentLeaf()?.view;
        // @ts-ignore
        if (!canvasView?.canvas) {
            return;
        }
        if (!canvasView) {
            return;
        }
        // @ts-ignore
        const canvas = canvasView.canvas;
        const nodes = canvas.nodes;

        for (const node of nodes.values()) {
            if (node.unknownData) {
                if (!node.unknownData.role) {
                    node.unknownData.role = "";
                }
                if (node.unknownData.displayOverride) {
                    node.unknownData.displayOverride = false;
                }
            }
        }

        const menu = canvas.menu;
        if (!menu) {
            console.error("No menu found on the canvas");
            return;
        }
        const that = this; // Capture the correct 'this' context.

        const menuUninstaller = around(menu.constructor.prototype, {
            render: (next: any) =>
                async function (...args: any) {
                    const result = await next.call(this, ...args);

                    that.addNewNodeButton(this.menuEl);

                    that.add_sparkle_button(this.menuEl);
                    that.addExtraActions(this.menuEl);

                    // await that.add_agent_button(this.menuEl);

                    return result;
                },
        });
        this.register(menuUninstaller);
        // if (!this.canvas_patched) {
        // Define the functions to be patched
        const functions = {
            onDoubleClick: (next: any) =>
                function (event: MouseEvent) {
                    next.call(this, event);
                },
            onPointerdown: (next: any) =>
                function (event: MouseEvent) {
                    if (event.target) {
                        // @ts-ignore
                        const isNode = event.target.closest(".canvas-node");
                        const canvas_color_picker_item = document.querySelector(
                            '.clickable-icon button[aria-label="Set Color"]'
                        );

                        if (isNode) {
                            that.highlightLineage();
                        } else {
                            that.unhighlightLineage();
                        }
                    } else {
                        that.unhighlightLineage();
                    }

                    next.call(this, event);
                },

            requestFrame: (next: any) =>
                function (...args: any) {
                    const canvas_view = this.app.workspace.getMostRecentLeaf()?.view;
                    // @ts-ignore
                    if (!canvas_view?.canvas) {
                        return;
                    }
                    // @ts-ignore TODO: Type this better
                    const canvas = canvas_view.canvas; // Assuming canvas is a property of the view
                    const nodes = canvas.nodes;

                    for (const node of nodes.values()) {
                        if (node.unknownData) {
                            if (!node.unknownData.role) {
                                node.unknownData.role = "";
                            }
                            if (!node.unknownData.displayOverride) {
                                node.unknownData.displayOverride = false;
                            }
                        }
                        const contentEl = node.contentEl;
                        if (contentEl) {
                            const targetDiv = contentEl.querySelector(".markdown-embed-content.node-insert-event");
                            if (targetDiv) {
                                let customDisplayDiv = contentEl.querySelector("#caret-custom-display");
                                if (node.unknownData.role.length > 0) {
                                    if (!customDisplayDiv) {
                                        customDisplayDiv = document.createElement("div");
                                        customDisplayDiv.id = "caret-custom-display"; // Ensure the ID is set here to prevent multiple creations
                                        targetDiv.parentNode.insertBefore(customDisplayDiv, targetDiv);
                                    }

                                    // Update the text content based on the role
                                    if (node.unknownData.role === "assistant") {
                                        customDisplayDiv.textContent = "🤖";
                                    } else if (node.unknownData.role === "user") {
                                        customDisplayDiv.textContent = "👤";
                                    } else if (node.unknownData.role === "system") {
                                        customDisplayDiv.textContent = "🖥️";
                                    } else if (node.unknownData.role === "cleared") {
                                        node.unknownData.role = "";

                                        customDisplayDiv.textContent = "";
                                        customDisplayDiv.remove();
                                        // customDisplayDiv.remove();
                                    }
                                }

                                node.unknownData.displayOverride = true;
                            }
                        }
                    }

                    const result = next.call(this, ...args);
                    return result;
                },
        };
        const doubleClickPatcher = around(canvas.constructor.prototype, functions);
        this.register(doubleClickPatcher);

        canvasView.scope?.register(["Mod", "Shift"], "ArrowUp", () => {
            that.createDirectionalNode(canvas, "top");
        });

        canvasView.scope?.register(["Mod"], "ArrowUp", () => {
            that.navigate(canvas, "top");
        });
        canvasView.scope?.register(["Mod"], "ArrowDown", () => {
            that.navigate(canvas, "bottom");
        });
        canvasView.scope?.register(["Mod"], "ArrowLeft", () => {
            that.navigate(canvas, "left");
        });
        canvasView.scope?.register(["Mod"], "ArrowRight", () => {
            that.navigate(canvas, "right");
        });
        canvasView.scope?.register(["Mod"], "Enter", () => {
            that.startEditingNode(canvas);
        });

        canvasView.scope?.register(["Mod", "Shift"], "ArrowUp", () => {
            that.createDirectionalNode(canvas, "top");
        });
        canvasView.scope?.register(["Mod", "Shift"], "ArrowDown", () => {
            that.createDirectionalNode(canvas, "bottom");
        });
        canvasView.scope?.register(["Mod", "Shift"], "ArrowLeft", () => {
            that.createDirectionalNode(canvas, "left");
        });
        canvasView.scope?.register(["Mod", "Shift"], "ArrowRight", () => {
            that.createDirectionalNode(canvas, "right");
        });
        canvasView.scope?.register(["Mod", "Shift"], "Enter", () => {
            that.runGraphChat(canvas);
        });

        if (!this.canvas_patched) {
            // @ts-ignore
            canvasView.leaf.rebuildView();
            this.canvas_patched = true;
        }
    }
    createDirectionalNode(canvas: any, direction: string) {
        const selection = canvas.selection;
        const selectionIterator = selection.values();
        const node = selectionIterator.next().value;
        if (!node) {
            return;
        }
        if (node.isEditing) {
            return;
        }
        const parent_node_x = node.x;
        const parent_node_y = node.y;
        const parent_width = node.width;
        const parent_height = node.height;

        let x: number;
        let y: number;
        let from_side: string;
        let to_side: string;

        switch (direction) {
            case "left":
                x = parent_node_x - parent_width - 200;
                y = parent_node_y;
                from_side = "left";
                to_side = "right";
                break;
            case "right":
                x = parent_node_x + parent_width + 200;
                y = parent_node_y;
                from_side = "right";
                to_side = "left";
                break;
            case "top":
                x = parent_node_x;
                y = parent_node_y - parent_height - 200;
                from_side = "top";
                to_side = "bottom";
                break;
            case "bottom":
                x = parent_node_x;
                y = parent_node_y + parent_height + 200;
                from_side = "bottom";
                to_side = "top";
                break;
            default:
                console.error("Invalid direction provided");
                return;
        }

        this.createChildNode(canvas, node, x, y, "", from_side, to_side);
    }
    startEditingNode(canvas: Canvas) {
        const selection = canvas.selection;
        const selectionIterator = selection.values();
        const node = selectionIterator.next().value;
        const node_id = node.id;
        node.isEditing = true;
        const editButton = document.querySelector('.canvas-menu button[aria-label="Edit"]') as HTMLElement;
        if (editButton) {
            editButton.click(); // Simulate the click on the edit button
        } else {
            console.error("Edit button not found");
        }
    }
    runGraphChat(canvas: Canvas) {
        canvas.requestSave();
        const selection = canvas.selection;
        const selectionIterator = selection.values();
        const node = selectionIterator.next().value;
        const node_id = node.id;

        const editButton = document.querySelector('.canvas-menu button[aria-label="Sparkle"]') as HTMLButtonElement;
        if (editButton) {
            setTimeout(() => {
                editButton.click(); // Simulate the click on the edit button after 200 milliseconds
            }, 200);
        } else {
            console.error("Edit button not found");
        }
    }
    navigate(canvas: Canvas, direction: string) {
        // const canvas = canvasView.canvas;
        const selection = canvas.selection;
        const selectionIterator = selection.values();
        const node = selectionIterator.next().value;
        if (!node) {
            return;
        }
        if (node.isEditing) {
            return;
        }
        const node_id = node.id;
        const canvas_data = canvas.getData();

        // Assuming direction can be 'next' or 'previous' for simplicity
        const edges = canvas_data.edges;
        const nodes = canvas_data.nodes;
        let targetNodeID: string | null = null;

        switch (direction) {
            case "right":
                // Handle both 'from' and 'to' cases for 'right'
                const edgeRightFrom = edges.find(
                    (edge: Edge) => edge.fromNode === node_id && edge.fromSide === "right"
                );
                if (edgeRightFrom) {
                    targetNodeID = edgeRightFrom.toNode;
                } else {
                    const edgeRightTo = edges.find((edge: Edge) => edge.toNode === node_id && edge.toSide === "right");
                    if (edgeRightTo) {
                        targetNodeID = edgeRightTo.fromNode;
                    }
                }
                break;
            case "left":
                // Handle both 'from' and 'to' cases for 'left'
                const edgeLeftFrom = edges.find((edge: Edge) => edge.fromNode === node_id && edge.fromSide === "left");
                if (edgeLeftFrom) {
                    targetNodeID = edgeLeftFrom.toNode;
                } else {
                    const edgeLeftTo = edges.find((edge: Edge) => edge.toNode === node_id && edge.toSide === "left");
                    if (edgeLeftTo) {
                        targetNodeID = edgeLeftTo.fromNode;
                    }
                }
                break;
            case "top":
                // Handle both 'from' and 'to' cases for 'top'
                const edgeTopFrom = edges.find((edge: Edge) => edge.fromNode === node_id && edge.fromSide === "top");
                if (edgeTopFrom) {
                    targetNodeID = edgeTopFrom.toNode;
                } else {
                    const edgeTopTo = edges.find((edge: Edge) => edge.toNode === node_id && edge.toSide === "top");
                    if (edgeTopTo) {
                        targetNodeID = edgeTopTo.fromNode;
                    }
                }
                break;
            case "bottom":
                // Handle both 'from' and 'to' cases for 'bottom'
                const edgeBottomFrom = edges.find(
                    (edge: Edge) => edge.fromNode === node_id && edge.fromSide === "bottom"
                );
                if (edgeBottomFrom) {
                    targetNodeID = edgeBottomFrom.toNode;
                } else {
                    const edgeBottomTo = edges.find(
                        (edge: Edge) => edge.toNode === node_id && edge.toSide === "bottom"
                    );
                    if (edgeBottomTo) {
                        targetNodeID = edgeBottomTo.fromNode;
                    }
                }
                break;
        }
        // const viewportNodes = canvas.getViewportNodes();
        let viewport_nodes: ViewportNode[] = [];
        let initial_viewport_children = canvas.nodeIndex.data.children;
        if (initial_viewport_children.length > 1) {
            let type_nodes = "nodes";

            // If there is more childen then use this path.
            if (initial_viewport_children[0] && "children" in initial_viewport_children[0]) {
                type_nodes = "children";
            }
            if (type_nodes === "children") {
                for (let i = 0; i < initial_viewport_children.length; i++) {
                    const nodes_list = initial_viewport_children[i].children;

                    nodes_list.forEach((node: ViewportNode) => {
                        viewport_nodes.push(node);
                    });
                }
            }
            if (type_nodes === "nodes") {
                for (let i = 0; i < initial_viewport_children.length; i++) {
                    const viewport_node = initial_viewport_children[i];
                    viewport_nodes.push(viewport_node);
                }
            }
        }

        if (targetNodeID) {
            const target_node = viewport_nodes.find((node) => node.id === targetNodeID);
            if (target_node) {
                // TODO - Figure out the proper way to do this and abstract it out so it's easier to get viewport children
                // @ts-ignore
                canvas.selectOnly(target_node);
                // @ts-ignore
                canvas.zoomToSelection(target_node);
            }
        }
        this.highlightLineage();
    }

    async parseXml(xmlString: string): Promise<any> {
        try {
            const result = await new Promise((resolve, reject) => {
                parseString(xmlString, (err: any, result: any) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            console.dir(result);
            return result;
        } catch (err) {
            console.error(err);
        }
    }

    parseCustomXML(xmlString: string, tags: string[]) {
        // Function to extract content between tags
        function getContent(tag: string, string: string) {
            const openTag = `<${tag}>`;
            const closeTag = `</${tag}>`;
            const start = string.indexOf(openTag) + openTag.length;
            const end = string.indexOf(closeTag);
            const prompt_content = string.substring(start, end).trim();
            return prompt_content;
        }

        // Initialize the result object
        const result: any = {};

        // Extract content for each tag provided
        tags.forEach((tag: string) => {
            const content = getContent(tag, xmlString);
            result[tag] = content;
        });

        return result;
    }
    async extractTextFromPDF(file_name: string): Promise<string> {
        // TODO - Clean this up later
        // @ts-ignore
        const file_path = await this.app.vault.getResourcePath({
            path: file_name,
        });
        const that = this;

        async function loadAndExtractText(file_path: string): Promise<string> {
            try {
                const doc = await that.pdfjs.getDocument(file_path).promise;
                const numPages = doc.numPages;

                // Load metadata
                // const metadata = await doc.getMetadata();

                let fullText = "";
                for (let i = 1; i <= numPages; i++) {
                    const page = await doc.getPage(i);
                    const content = await page.getTextContent();
                    // TODO - Clean this up
                    // @ts-ignore
                    const pageText = content.items.map((item: { str: string }) => item.str).join(" ");
                    fullText += pageText + " ";

                    // Release page resources.
                    page.cleanup();
                }
                return fullText;
            } catch (err) {
                console.error("Error: " + err);
                throw err;
            }
        }

        const fullDocumentText = await loadAndExtractText(file_path);
        return fullDocumentText;
    }
    addNewNodeButton(menuEl: HTMLElement) {
        if (!menuEl.querySelector(".graph-menu-item")) {
            const graphButtonEl = createEl("button", "clickable-icon graph-menu-item");
            setTooltip(graphButtonEl, "Create user message", { placement: "top" });
            setIcon(graphButtonEl, "lucide-workflow");
            graphButtonEl.addEventListener("click", async () => {
                // Assuming canvasView is accessible here, or you need to pass it similarly
                const canvasView = this.app.workspace.getLeavesOfType("canvas").first()?.view;
                const view = this.app.workspace.getMostRecentLeaf()?.view;
                // @ts-ignore
                if (!view?.canvas) {
                    return;
                }
                // @ts-ignore
                const canvas = view.canvas;
                const selection = canvas.selection;
                const selectionIterator = selection.values();
                const node = selectionIterator.next().value;
                const x = node.x + node.width + 200;
                const new_node = await this.createChildNode(canvas, node, x, node.y, "");
                new_node.unknownData.role = "user";
            });
            menuEl.appendChild(graphButtonEl);
        }
    }
    addExtraActions(menuEl: HTMLElement) {
        if (!menuEl.querySelector(".wand")) {
            const graphButtonEl = createEl("button", "clickable-icon wand");
            // setTooltip(graphButtonEl, "Actions", { placement: "top" });
            setIcon(graphButtonEl, "lucide-wand");

            interface SubmenuItemConfig {
                name: string;
                icon: string;
                tooltip: string;
                callback: () => void | Promise<void>;
            }

            function createSubmenu(configs: SubmenuItemConfig[]): HTMLElement {
                const submenuEl = createEl("div", { cls: "caret-submenu" });

                configs.forEach((config) => {
                    const submenuItem = createEl("div", { cls: "caret-submenu-item" });
                    const iconEl = createEl("span", { cls: "caret-clickable-icon" });
                    setIcon(iconEl, config.icon);
                    setTooltip(iconEl, config.tooltip, { placement: "top" });
                    submenuItem.appendChild(iconEl);
                    submenuItem.addEventListener("click", config.callback);
                    submenuEl.appendChild(submenuItem);
                });

                return submenuEl;
            }
            const canvasView = this.app.workspace.getLeavesOfType("canvas").first()?.view;
            const view = this.app.workspace.getMostRecentLeaf()?.view;
            // @ts-ignore
            if (!view?.canvas) {
                return;
            }
            // @ts-ignore
            const canvas = view.canvas;
            const selection = canvas.selection;
            const selectionIterator = selection.values();
            const node = selectionIterator.next().value;

            let submenuVisible = false;

            graphButtonEl.addEventListener("click", () => {
                const submenuConfigs: SubmenuItemConfig[] = [
                    {
                        name: "User",
                        icon: "lucide-user",
                        tooltip: "Set role to user",
                        callback: () => {
                            node.unknownData.role = "user";
                            node.unknownData.displayOverride = false;
                            canvas.requestFrame();
                        },
                    },
                    {
                        name: "Assistant",
                        icon: "lucide-bot",
                        tooltip: "Set role to assistant",
                        callback: () => {
                            node.unknownData.role = "assistant";
                            node.unknownData.displayOverride = false;
                            canvas.requestFrame();
                        },
                    },
                    {
                        name: "System Prompt",
                        icon: "lucide-monitor-check",
                        tooltip: "Set system prompt",
                        callback: () => {
                            node.unknownData.role = "system";
                            node.unknownData.displayOverride = false;
                            canvas.requestFrame();
                        },
                    },
                    {
                        name: "Clear Role",
                        // icon: "lucide-message-circle-off",
                        icon: "lucide-user-x",
                        tooltip: "Clears the nodes role",
                        callback: () => {
                            node.unknownData.role = "cleared";
                            node.unknownData.displayOverride = false;
                            canvas.requestFrame();
                        },
                    },
                    {
                        name: "Refresh",
                        icon: "lucide-refresh-ccw",
                        tooltip: "Refresh the path up to this point",
                        callback: () => {
                            this.refreshNode(node.id, this.settings.system_prompt, {
                                model: "default",
                                provider: "default",
                                temperature: 1,
                                context_window: "default",
                            });
                        },
                    },
                    {
                        name: "Double Sparkle",
                        icon: "lucide-sparkle",
                        tooltip: "Runs Sparkle twice",
                        callback: async () => {
                            await canvas.requestSave(true);
                            const node_id = node.id;
                            await this.sparkle(node_id, undefined, undefined, 2, 200, 10);
                            canvas.requestFrame();
                        },
                    },
                    {
                        name: "Condense",
                        icon: "lucide-arrow-down-narrow-wide",
                        tooltip: "Condenses node text content",
                        callback: async () => {
                            await canvas.requestSave(true);
                            const content = node.text || node.unknownData.text;

                            const llm_prompt = {
                                role: "user",
                                content: `Condense the following text while preserving the original meaning. Return the condensed text by itself.
                        Text: ${content}`,
                            };
                            const provider = this.settings.llm_provider;

                            if (!isEligibleProvider(provider)) {
                                throw new Error(`Invalid provider: ${provider}`);
                            }

                            let sdk_provider: sdk_provider = get_provider(this, provider);

                            const condensed_content = await ai_sdk_completion(
                                sdk_provider,
                                this.settings.model,
                                [llm_prompt],
                                1,
                                provider
                            );

                            const new_node = await this.createChildNode(
                                canvas,
                                node,
                                node.x + 50,
                                node.y,
                                condensed_content,
                                null,
                                null
                            );
                            // node.setText(condensed_content);
                            const word_count = condensed_content.split(/\s+/).length;
                            const number_of_lines = Math.ceil(word_count / 7);
                            if (word_count > 500) {
                                node.width = 750;
                                node.height = Math.max(200, number_of_lines * 35);
                            } else {
                                node.height = Math.max(200, number_of_lines * 45);
                            }

                            new_node.unknownData.text = condensed_content;
                            new_node.text = condensed_content;
                            new_node.render();

                            canvas.requestFrame();
                        },
                    },
                ];

                if (
                    node &&
                    this.settings.llm_provider_options[this.settings.llm_provider][this.settings.model]
                        .function_calling &&
                    node.text
                    //  ||
                    // node.unknownData.type == "text"
                ) {
                    submenuConfigs.push({
                        name: "Node Splitter",
                        icon: "lucide-split",
                        tooltip: "Split node",
                        callback: async () => {
                            const content = node.text || node.unknownData.text;

                            const ChunksSchema = z.object({
                                chunks: z.array(z.string().describe("A logical section of the original text")),
                            });

                            const llm_prompt = {
                                role: "user",
                                content: `Split the following text into logical sections, preserving the complete meaning of each section:

                                ${content}`,
                            };

                            try {
                                const provider = this.settings.llm_provider;
                                if (!isEligibleProvider(provider)) {
                                    throw new Error(`Invalid provider: ${provider}`);
                                }
                                let sdk_provider = get_provider(this, provider);

                                const { chunks } = await ai_sdk_structured(
                                    sdk_provider,
                                    this.settings.model,
                                    [llm_prompt],
                                    this.settings.temperature,
                                    provider,
                                    ChunksSchema
                                );

                                const newX = node.x + node.width + 50;
                                const totalHeight = (300 + 100) * chunks.length - 100;
                                const startY = node.y + node.height / 2 - totalHeight / 2;
                                let newY = startY;

                                for (const content of chunks) {
                                    let newId = this.generateRandomId(16);

                                    try {
                                        const newNodeTemp = await this.addNodeToCanvas(canvas, newId, {
                                            x: newX,
                                            y: newY,
                                            width: node.width,
                                            height: 300,
                                            type: "text",
                                            content: content,
                                        });
                                        const newNode = canvas.nodes?.get(newNodeTemp?.id!);
                                        canvas.requestFrame();
                                    } catch (error) {
                                        console.error("Failed to add node to canvas:", error);
                                        new Notice("Failed to create node");
                                    }
                                    newY += 350;
                                }
                            } catch (error) {
                                console.error("Error splitting node:", error);
                                new Notice("Failed to split node");
                            }
                        },
                    });
                    submenuConfigs.push({
                        name: "Node Splitter with connectors",
                        icon: "lucide-share-2",
                        tooltip: "Split node and link to parent",
                        callback: async () => {
                            const content = node.text || node.unknownData.text;

                            const ChunksSchema = z.object({
                                chunks: z.array(z.string().describe("A logical section of the original text")),
                            });

                            const llm_prompt = {
                                role: "user",
                                content: `Split the following text into logical sections, preserving the complete meaning of each section:

                                ${content}`,
                            };

                            try {
                                const provider = this.settings.llm_provider;
                                if (!isEligibleProvider(provider)) {
                                    throw new Error(`Invalid provider: ${provider}`);
                                }
                                let sdk_provider = get_provider(this, provider);

                                const { chunks } = await ai_sdk_structured(
                                    sdk_provider,
                                    this.settings.model,
                                    [llm_prompt],
                                    this.settings.temperature,
                                    provider,
                                    ChunksSchema
                                );

                                const newX = node.x + node.width + 50;
                                const totalHeight = (300 + 100) * chunks.length - 100;
                                const startY = node.y + node.height / 2 - totalHeight / 2;
                                let newY = startY;

                                for (const content of chunks) {
                                    let newId = this.generateRandomId(16);

                                    try {
                                        const newNodeTemp = await this.addNodeToCanvas(canvas, newId, {
                                            x: newX,
                                            y: newY,
                                            width: node.width,
                                            height: 300,
                                            type: "text",
                                            content: content,
                                        });
                                        const newNode = canvas.nodes?.get(newNodeTemp?.id!);
                                        if (newNode) {
                                            // Add a link from the original node to the new node
                                            await this.createEdge(node, newNode, canvas, "right");
                                        }
                                        canvas.requestFrame();
                                    } catch (error) {
                                        console.error("Failed to add node to canvas:", error);
                                        new Notice("Failed to create node");
                                    }
                                    newY += 350;
                                }
                            } catch (error) {
                                console.error("Error splitting node:", error);
                                new Notice("Failed to split node");
                            }
                        },
                    });
                }
                let submenuEl = createSubmenu(submenuConfigs);

                // Append the submenu to the main button
                graphButtonEl.appendChild(submenuEl);
                submenuVisible = !submenuVisible;
                if (submenuVisible) {
                    submenuEl.classList.add("visible");
                } else {
                    submenuEl.classList.remove("visible");
                }
            });

            menuEl.appendChild(graphButtonEl);
        }
    }

    getAllAncestorNodes(nodes: Node[], edges: Edge[], nodeId: string): Node[] {
        let ancestors: Node[] = [];
        let queue: string[] = [nodeId];
        let processedNodes: Set<string> = new Set();

        while (queue.length > 0) {
            let currentId = queue.shift();
            if (!currentId || processedNodes.has(currentId)) continue;

            processedNodes.add(currentId);
            const incomingEdges: Edge[] = edges.filter((edge) => edge.toNode === currentId);
            incomingEdges.forEach((edge) => {
                const ancestor = nodes.find((node) => node.id === edge.fromNode);
                if (ancestor && !processedNodes.has(ancestor.id)) {
                    ancestors.push(ancestor);
                    queue.push(ancestor.id);
                }
            });
        }

        return ancestors;
    }

    static getLongestLineage(nodes: Node[], edges: Edge[], nodeId: string): Node[] {
        let longestLineage: Node[] = [];

        function findLongestPath(currentId: string, path: Node[]): void {
            const incomingEdges: Edge[] = edges.filter((edge) => edge.toNode === currentId);
            if (incomingEdges.length === 0) {
                // Check if the current path is the longest we've encountered
                if (path.length > longestLineage.length) {
                    longestLineage = path.slice();
                }
                return;
            }

            incomingEdges.forEach((edge) => {
                const ancestor = nodes.find((node) => node.id === edge.fromNode);
                if (ancestor) {
                    // Check if the ancestor is the direct ancestor (index 1) and has 'context' in its content
                    if (path.length === 1 && ancestor.type === "text" && ancestor.text.includes("<context>")) {
                        return; // Skip this lineage
                    }
                    findLongestPath(ancestor.id, path.concat(ancestor));
                }
            });
        }

        // Start with the given node
        const startNode = nodes.find((node) => node.id === nodeId);
        if (startNode) {
            findLongestPath(nodeId, [startNode]);
        }

        return longestLineage;
    }
    async getDirectAncestorsWithContext(nodes: Node[], edges: Edge[], nodeId: string): Promise<string> {
        let direct_ancentors_context = "";

        const startNode = nodes.find((node) => node.id === nodeId);
        if (!startNode) return "";

        const incomingEdges: Edge[] = edges.filter((edge) => edge.toNode === nodeId);
        for (let i = 0; i < incomingEdges.length; i++) {
            const edge = incomingEdges[i];
            const ancestor = nodes.find((node) => node.id === edge.fromNode);
            if (ancestor && ancestor.type === "text" && ancestor.text.includes("<context>")) {
                direct_ancentors_context += ancestor.text + "\n";
            } else if (ancestor && ancestor.type === "file" && ancestor.file && ancestor.file.includes(".md")) {
                const file_path = ancestor.file;
                const file = this.app.vault.getFileByPath(file_path);
                if (file) {
                    const context = await this.app.vault.cachedRead(file);
                    direct_ancentors_context += "\n" + context;
                } else {
                    console.error("File not found:", file_path);
                }
            }
        }
        return direct_ancentors_context;
    }
    async getAllAncestorsWithContext(nodes: Node[], edges: Edge[], nodeId: string): Promise<string> {
        let ancestors_context = "";
        let convo_total_tokens = 0;

        const findAncestorsWithContext = async (nodeId: string) => {
            const node = nodes.find((node) => node.id === nodeId);
            if (!node) return;

            const incomingEdges: Edge[] = edges.filter((edge) => edge.toNode === nodeId);
            for (let i = 0; i < incomingEdges.length; i++) {
                const edge = incomingEdges[i];
                const ancestor = nodes.find((node) => node.id === edge.fromNode);
                if (ancestor) {
                    let contextToAdd = "";

                    if (ancestor.type === "text") {
                        // @ts-ignore
                        const role = ancestor.role || "";
                        if (role.length === 0) {
                            let ancestor_text = ancestor.text;
                            if (this.settings.include_nested_block_refs) {
                                const block_ref_content = await this.getRefBlocksContent(ancestor_text);
                                ancestor_text += block_ref_content;
                            }
                            contextToAdd += ancestor_text;
                        }
                    } else if (ancestor.type === "file" && ancestor.file && ancestor.file.includes(".md")) {
                        const file_path = ancestor.file;
                        const file = this.app.vault.getFileByPath(file_path);
                        if (file) {
                            const context = await this.app.vault.cachedRead(file);

                            if (!context.includes("caret_prompt")) {
                                contextToAdd = `\n\n---------------------------\n\nFile Title: ${file_path}\n${context}`;
                            }
                        } else {
                            console.error("File not found:", file_path);
                        }
                    } else if (ancestor.type === "file" && ancestor.file && ancestor.file.includes(".pdf")) {
                        const file_name = ancestor.file;
                        const text = await this.extractTextFromPDF(file_name);
                        contextToAdd = `\n\n---------------------------\n\nPDF File Title: ${file_name}\n${text}`;
                    }

                    const contextTokens = this.encoder.encode(contextToAdd).length;
                    if (convo_total_tokens + contextTokens > this.settings.context_window) {
                        new Notice(
                            "Exceeding context window while adding ancestor context. Stopping further additions."
                        );
                        return;
                    }

                    ancestors_context += contextToAdd;
                    convo_total_tokens += contextTokens;

                    await findAncestorsWithContext(ancestor.id);
                }
            }
        };

        await findAncestorsWithContext(nodeId);
        return ancestors_context;
    }

    async getRefBlocksContent(node_text: any): Promise<string> {
        const bracket_regex = /\[\[(.*?)\]\]/g;
        let rep_block_content = "";

        let match;
        const matches = [];

        while ((match = bracket_regex.exec(node_text)) !== null) {
            matches.push(match);
        }
        for (const match of matches) {
            let file_path = match[1];
            if (!file_path.includes(".")) {
                file_path += ".md";
            }
            let file = await this.app.vault.getFileByPath(file_path);

            if (!file) {
                const files = this.app.vault.getFiles();
                let matchedFile = files.find((file) => file.name === file_path);
                if (matchedFile) {
                    file = matchedFile;
                }
            }
            if (file && file_path.includes(".md")) {
                const file_content = await this.app.vault.cachedRead(file);
                rep_block_content += `File: ${file_path}\n${file_content}`; // Update modified_content instead of message.content
            } else if (file && file_path.includes(".pdf")) {
                const pdf_content = await this.extractTextFromPDF(file_path);
                rep_block_content += `PDF File Name: ${file_path}\n ${pdf_content}`;
            } else {
                new Notice(`File not found: ${file_path}`);
            }
        }

        return rep_block_content;
    }
    async getCurrentNode(canvas: Canvas, node_id: string) {
        await canvas.requestSave(true);
        const nodes_iterator = canvas.nodes.values();
        let node = null;
        for (const node_obj of nodes_iterator) {
            if (node_obj.id === node_id) {
                node = node_obj;
                break;
            }
        }
        return node;
    }
    async getCurrentCanvasView() {
        const canvas_view = this.app.workspace.getMostRecentLeaf()?.view;
        // @ts-ignore
        if (!canvas_view || !canvas_view.canvas) {
            return;
        }
        // @ts-ignore
        const canvas = canvas_view.canvas;
        return canvas_view;
    }
    async getAssociatedNodeContent(currentNode: any, nodes: any[], edges: any[]): Promise<string> {
        const visited = new Set();
        const contentBlocks: string[] = [];

        const traverse = async (nodeId: string) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);

            const node = nodes.find((n) => n.id === nodeId);
            if (node) {
                let nodeContent = "";
                if (node.role === "") {
                    if (node.type === "text") {
                        nodeContent = node.text;
                        if (this.settings.include_nested_block_refs) {
                            const block_ref_content = await this.getRefBlocksContent(node.text);
                            nodeContent += block_ref_content;
                        }
                    } else if (node.type === "file") {
                        if (node.file && node.file.includes(".md")) {
                            const file = this.app.vault.getFileByPath(node.file);
                            if (file) {
                                const fileContent = await this.app.vault.cachedRead(file);
                                nodeContent = `\n\n---------------------------\n\nFile Title: ${node.file}\n${fileContent}`;
                            } else {
                                console.error("File not found:", node.file);
                            }
                        } else if (node.file && node.file.includes(".pdf")) {
                            const pdfContent = await this.extractTextFromPDF(node.file);
                            nodeContent = `\n\n---------------------------\n\nPDF File Title: ${node.file}\n${pdfContent}`;
                        }
                    }
                    contentBlocks.push(nodeContent);
                }
            }

            const connectedEdges = edges.filter((edge) => edge.fromNode === nodeId || edge.toNode === nodeId);
            for (const edge of connectedEdges) {
                const nextNodeId = edge.fromNode === nodeId ? edge.toNode : edge.fromNode;
                const next_node = nodes.find((n) => n.id === nextNodeId);
                if (next_node.role === "user" || next_node.role === "assistant") {
                    continue;
                }

                await traverse(nextNodeId);
            }
        };

        await traverse(currentNode.id);

        return contentBlocks.join("\n");
    }

    async sparkle(
        node_id: string,
        system_prompt: string = "",
        sparkle_config: SparkleConfig = {
            model: "default",
            provider: "default",
            temperature: 1,
            context_window: "default",
        },
        iterations: number = 1,
        xOffset: number = 200,
        yOffset: number = 0
    ) {
        let local_system_prompt = system_prompt;
        const canvas_view = this.app.workspace.getMostRecentLeaf()?.view;
        // @ts-ignore
        if (!canvas_view || !canvas_view.canvas) {
            return;
        }
        // @ts-ignore
        const canvas = canvas_view.canvas;

        let node = await this.getCurrentNode(canvas, node_id);
        if (!node) {
            console.error("Node not found with ID:", node_id);
            return;
        }

        node.unknownData.role = "user";

        const canvas_data = canvas.getData();
        const { edges, nodes } = canvas_data;

        // Continue with operations on `target_node`
        if (node.hasOwnProperty("file")) {
            const file_path = node.file.path;
            const file = this.app.vault.getAbstractFileByPath(file_path);
            if (file) {
                // @ts-ignore
                const text = await this.app.vault.cachedRead(file);

                // Check for the presence of three dashes indicating the start of the front matter
                const front_matter = await this.getFrontmatter(file);
                if (front_matter.hasOwnProperty("caret_prompt")) {
                    let caret_prompt = front_matter.caret_prompt;

                    if (caret_prompt === "parallel" && text) {
                        const matchResult = text.match(/```xml([\s\S]*?)```/);
                        if (!matchResult) {
                            new Notice("Incorrectly formatted parallel workflow.");
                            return;
                        }
                        const xml_content = matchResult[1].trim();
                        const xml = await this.parseXml(xml_content);
                        const system_prompt_list = xml.root.system_prompt;

                        let system_prompt = "";
                        if (system_prompt_list[0]._) {
                            system_prompt = system_prompt_list[0]._.trim;
                        }

                        const prompts = xml.root.prompt;
                        const card_height = node.height;
                        const middle_index = Math.floor(prompts.length / 2);
                        const highest_y = node.y - middle_index * (100 + card_height); // Calculate the highest y based on the middle index
                        const sparkle_promises = [];

                        for (let i = 0; i < prompts.length; i++) {
                            const prompt = prompts[i];

                            const prompt_content = prompt._.trim();
                            const prompt_delay = prompt.$?.delay || 0;
                            const prompt_model = prompt.$?.model || "default";
                            const prompt_provider = prompt.$?.provider || "default";
                            const prompt_temperature = parseFloat(prompt.$?.temperature) || this.settings.temperature;
                            const new_node_content = `${prompt_content}`;
                            const x = node.x + node.width + 200;
                            const y = highest_y + i * (100 + card_height); // Increment y for each prompt to distribute them vertically including card height

                            // Create a new user node
                            const user_node = await this.createChildNode(
                                canvas,
                                node,
                                x,
                                y,
                                new_node_content,
                                "right",
                                "left"
                            );
                            const model_context_window =
                                this.settings.llm_provider_options[prompt_provider]?.[prompt_model]?.context_window ||
                                this.settings.context_window;
                            user_node.unknownData.role = "user";
                            user_node.unknownData.displayOverride = false;

                            const sparkle_config: SparkleConfig = {
                                model: prompt_model,
                                provider: prompt_provider,
                                temperature: prompt_temperature,
                                context_window: model_context_window,
                            };

                            const sparkle_promise = (async () => {
                                if (prompt_delay > 0) {
                                    new Notice(`Waiting for ${prompt_delay} seconds...`);
                                    await new Promise((resolve) => setTimeout(resolve, prompt_delay * 1000));
                                    new Notice(`Done waiting for ${prompt_delay} seconds.`);
                                }
                                await this.sparkle(user_node.id, system_prompt, sparkle_config);
                            })();

                            sparkle_promises.push(sparkle_promise);
                        }

                        await Promise.all(sparkle_promises);
                        return;
                    } else if (caret_prompt === "linear") {
                        const matchResult = text.match(/```xml([\s\S]*?)```/);
                        if (!matchResult) {
                            new Notice("Incorrectly formatted linear workflow.");
                            return;
                        }
                        const xml_content = matchResult[1].trim();
                        const xml = await this.parseXml(xml_content);
                        const system_prompt_list = xml.root.system_prompt;
                        let system_prompt;
                        if (system_prompt_list[0]._) {
                            system_prompt = system_prompt_list[0]._.trim();
                        }

                        const prompts = xml.root.prompt;

                        let current_node = node;
                        for (let i = 0; i < prompts.length; i++) {
                            const prompt = prompts[i];
                            const prompt_content = prompt._.trim();
                            const prompt_delay = prompt.$?.delay || 0;
                            const prompt_model = prompt.$?.model || "default";
                            const prompt_provider = prompt.$?.provider || "default";
                            const prompt_temperature = parseFloat(prompt.$?.temperature) || this.settings.temperature;
                            const new_node_content = `${prompt_content}`;
                            const x = current_node.x + current_node.width + 200;
                            const y = current_node.y;

                            // Create a new user node
                            const user_node = await this.createChildNode(
                                canvas,
                                current_node,
                                x,
                                y,
                                new_node_content,
                                "right",
                                "left"
                            );
                            const model_context_window =
                                this.settings.llm_provider_options[prompt_provider]?.[prompt_model]?.context_window ||
                                this.settings.context_window;
                            user_node.unknownData.role = "user";
                            user_node.unknownData.displayOverride = false;
                            const sparkle_config: SparkleConfig = {
                                model: prompt_model,
                                provider: prompt_provider,
                                temperature: prompt_temperature,
                                context_window: model_context_window,
                            };
                            if (prompt_delay > 0) {
                                new Notice(`Waiting for ${prompt_delay} seconds...`);
                                await new Promise((resolve) => setTimeout(resolve, prompt_delay * 1000));
                                new Notice(`Done waiting for ${prompt_delay} seconds.`);
                            }
                            const assistant_node = await this.sparkle(user_node.id, system_prompt, sparkle_config);
                            current_node = assistant_node;
                        }
                    } else {
                        new Notice("Invalid Caret prompt");
                    }

                    return;
                }
            } else {
                console.error("File not found or is not a readable file:", file_path);
            }
        }
        let context_window = sparkle_config.context_window;
        if (sparkle_config.context_window === "default") {
            context_window = this.settings.context_window;
        }
        if (typeof context_window !== "number" || isNaN(context_window)) {
            throw new Error("Invalid context window: must be a number");
        }

        const { conversation } = await this.buildConversation(node, nodes, edges, local_system_prompt, context_window);
        const { model, provider, temperature } = this.mergeSettingsAndSparkleConfig(sparkle_config);

        const node_content = ``;
        let x = node.x + node.width + xOffset;
        let y = node.y + yOffset;
        // This is needed to work with the iterations. We still need to return the first node from the iterations
        // So linear workflows works
        let firstNode = null;

        for (let i = 0; i < iterations; i++) {
            const new_node = await this.createChildNode(canvas, node, x, y, node_content, "right", "left");
            if (!new_node) {
                throw new Error("Invalid new node");
            }
            const new_node_id = new_node.id;
            if (!new_node_id) {
                throw new Error("Invalid node id");
            }
            const new_canvas_node = await this.get_node_by_id(canvas, new_node_id);
            new_canvas_node.initialize();
            if (!new_canvas_node.unknownData.hasOwnProperty("role")) {
                new_canvas_node.unknownData.role = "";
                new_canvas_node.unknownData.displayOverride = false;
            }
            new_canvas_node.unknownData.role = "assistant";

            if (!isEligibleProvider(provider)) {
                throw new Error(`Invalid provider: ${provider}`);
            }

            let sdk_provider: sdk_provider = get_provider(this, provider);

            if (this.settings.llm_provider_options[provider][model].streaming) {
                const stream = await ai_sdk_streaming(sdk_provider, model, conversation, temperature, provider);
                new_canvas_node.text = "";
                await this.update_node_content_streaming(new_node_id, stream);
            } else {
                const content = await ai_sdk_completion(sdk_provider, model, conversation, temperature, provider);
                new_canvas_node.setText(content);
            }
            if (i === 0) {
                firstNode = new_canvas_node;
            }

            y += yOffset + node.height;
        }
        return firstNode;
    }

    async buildConversation(node: Node, nodes: Node[], edges: any[], system_prompt: string, context_window: number) {
        const longest_lineage = CaretPlugin.getLongestLineage(nodes, edges, node.id);

        const conversation = [];
        let local_system_prompt = system_prompt;
        let convo_total_tokens = 0;
        const settings = this.settings;

        for (let i = 0; i < longest_lineage.length; i++) {
            const node = longest_lineage[i];

            let node_context = await this.getAssociatedNodeContent(node, nodes, edges);
            if (this.settings.include_nested_block_refs) {
                const block_ref_content = await this.getRefBlocksContent(node_context);
                if (block_ref_content.length > 0) {
                    node_context += `\n${block_ref_content}`;
                }
            }
            if (node_context.length > 0) {
                node_context += `\n${node_context}`;
            }
            // This should only go one layer deep:

            // @ts-ignore
            let role = node.role || "";
            if (role === "user") {
                let content = node.text;
                if (node.type === "file" && node.file) {
                    const file = this.app.vault.getFileByPath(node.file);
                    if (file) {
                        content = await this.app.vault.cachedRead(file);
                    }
                }
                // Only for the first node
                // And get referencing content here.
                if (this.settings.include_nested_block_refs) {
                    const block_ref_content = await this.getRefBlocksContent(content);
                    if (block_ref_content.length > 0) {
                        content += `\n${block_ref_content}`;
                    }
                }
                if (node_context.length > 0) {
                    content += `\n${node_context}`;
                }

                if (content && content.length > 0) {
                    const user_message_tokens = this.encoder.encode(content).length;
                    if (user_message_tokens + convo_total_tokens > context_window) {
                        new Notice("Exceeding context window while adding user message. Trimming content");
                        break;
                    }
                    const message = {
                        role,
                        content,
                    };
                    if (message.content.length > 0) {
                        conversation.push(message);
                        convo_total_tokens += user_message_tokens;
                    }
                }
            } else if (role === "assistant") {
                const content = node.text;
                const message = {
                    role,
                    content,
                };
                conversation.push(message);
            } else if (role === "system") {
                local_system_prompt = node.text;
            }
        }
        conversation.reverse();
        if (local_system_prompt.length > 0) {
            conversation.unshift({ role: "system", content: local_system_prompt });
        }

        // Iterate over the conversation and insert an assistant message between consecutive user messages
        for (let i = 0; i < conversation.length - 1; i++) {
            if (conversation[i].role === "user" && conversation[i + 1].role === "user") {
                conversation.splice(i + 1, 0, { role: "assistant", content: "-" });
                i++; // Skip the next element as we just inserted a new one
            }
        }

        return { conversation };
    }

    mergeSettingsAndSparkleConfig(sparkle_config: SparkleConfig): SparkleConfig {
        const settings = this.settings;
        let model = settings.model;
        let provider = settings.llm_provider;
        let temperature = settings.temperature;
        let context_window: string | number = settings.context_window;
        if (sparkle_config.model !== "default") {
            model = sparkle_config.model;
        }
        if (sparkle_config.provider !== "default") {
            provider = sparkle_config.provider;
        }
        if (sparkle_config.temperature !== settings.temperature) {
            temperature = sparkle_config.temperature;
        }
        if (sparkle_config.context_window !== "default") {
            context_window = sparkle_config.context_window;
        }
        const mergedOutput = { model, provider, temperature, context_window };

        return mergedOutput;
    }

    async refreshNode(
        refreshed_node_id: string,
        system_prompt: string = "",
        sparkle_config: SparkleConfig = {
            model: "default",
            provider: "default",
            temperature: 1,
            context_window: "default",
        }
    ) {
        const caret_canvas = CaretCanvas.fromPlugin(this);
        const refreshed_node = caret_canvas.getNode(refreshed_node_id);

        const longest_lineage = refreshed_node.getLongestLineage();
        const parent_node = longest_lineage[1];
        let context_window: string | number = this.settings.context_window;
        if (sparkle_config.context_window !== "default") {
            context_window = sparkle_config.context_window;
        }
        if (typeof context_window !== "number" || isNaN(context_window)) {
            throw new Error("Invalid context window: must be a number");
        }

        const { conversation } = await this.buildConversation(
            parent_node,
            caret_canvas.nodes,
            caret_canvas.edges,
            system_prompt,
            context_window
        );
        const { provider, model, temperature } = this.mergeSettingsAndSparkleConfig(sparkle_config);
        if (!isEligibleProvider(provider)) {
            throw new Error(`Invalid provider: ${provider}`);
        }
        let sdk_provider: sdk_provider = get_provider(this, provider);

        if (this.settings.llm_provider_options[provider][model].streaming) {
            const stream = await ai_sdk_streaming(sdk_provider, model, conversation, temperature, provider);
            // example: use textStream as an async iterable

            this.update_node_content(refreshed_node_id, "");
            await this.update_node_content_streaming(refreshed_node_id, stream);
        } else {
            this.update_node_content(refreshed_node_id, "Refreshing...");
            const content = await ai_sdk_completion(sdk_provider, model, conversation, temperature, provider);

            refreshed_node.node.text = content;
            this.update_node_content(refreshed_node_id, content);
        }
    }
    async update_node_content_streaming(
        node_id: string,
        stream: StreamTextResult<Record<string, CoreTool<any, any>>, never>
    ) {
        const canvas_view = this.app.workspace.getMostRecentLeaf()?.view;
        // @ts-ignore
        if (!canvas_view?.canvas) {
            return;
        }
        const canvas: Canvas = (canvas_view as any).canvas; // Assuming canvas is a property of the view
        const canvas_data = canvas.getData();
        const nodes_iterator = canvas.nodes.values();
        let node = null;
        for (const node_objs of nodes_iterator) {
            if (node_objs.id === node_id) {
                node = node_objs;
                break;
            }
        }
        node.width = 510;
        for await (const textPart of stream.textStream) {
            const current_text = node.text;
            const new_content = `${current_text}${textPart}`;
            const word_count = new_content.split(/\s+/).length;
            const number_of_lines = Math.ceil(word_count / 7);
            if (word_count > 500) {
                node.width = 750;
                node.height = Math.max(200, number_of_lines * 35);
            } else {
                node.height = Math.max(200, number_of_lines * 45);
            }

            node.setText(new_content);
            node.render();
        }
    }
    async update_node_content(node_id: string, content: string) {
        const canvas_view = this.app.workspace.getMostRecentLeaf()?.view;
        // @ts-ignore
        if (!canvas_view?.canvas) {
            return;
        }
        const canvas: Canvas = (canvas_view as any).canvas; // Assuming canvas is a property of the view

        const nodes_iterator = canvas.nodes.values();
        let node = null;
        for (const node_objs of nodes_iterator) {
            if (node_objs.id === node_id) {
                node = node_objs;
                break;
            }
        }
        node.width = 510;
        const word_count = content.split(/\s+/).length;
        const number_of_lines = Math.ceil(word_count / 7);
        if (word_count > 500) {
            node.width = 750;
            node.height = Math.max(200, number_of_lines * 35);
        } else {
            node.height = Math.max(200, number_of_lines * 45);
        }

        node.setText(content);
        node.render();
    }

    add_sparkle_button(menuEl: HTMLElement) {
        if (!menuEl.querySelector(".spark_button")) {
            const buttonEl = createEl("button", "clickable-icon spark_button");
            setTooltip(buttonEl, "Sparkle", { placement: "top" });
            setIcon(buttonEl, "lucide-sparkles");
            buttonEl.addEventListener("click", async () => {
                const canvasView = this.app.workspace.getMostRecentLeaf()?.view;
                // @ts-ignore
                if (!canvasView.canvas) {
                    return;
                }
                // @ts-ignore
                const canvas = canvasView.canvas;
                await canvas.requestSave(true);
                const selection = canvas.selection;
                const selectionIterator = selection.values();
                const node = selectionIterator.next().value;
                const node_id = node.id;
                await this.sparkle(node_id);
            });
            menuEl.appendChild(buttonEl);
        }
    }
    async get_node_by_id(canvas: Canvas, node_id: string) {
        const nodes_iterator = canvas.nodes.values();
        for (const node of nodes_iterator) {
            if (node.id === node_id) {
                return node;
            }
        }
        return null; // Return null if no node matches the ID
    }

    async createChildNode(
        canvas: Canvas,
        parentNode: CanvasNodeData,
        x: number,
        y: number,
        content: string = "",
        from_side: string | null = "right",
        to_side: string | null = "left"
    ) {
        let tempChildNode = await this.addNodeToCanvas(canvas, this.generateRandomId(16), {
            x: x,
            y: y,
            width: 400,
            height: 200,
            type: "text",
            content,
        });
        if (from_side && to_side) {
            await this.createEdge(parentNode, tempChildNode, canvas, from_side, to_side);
        }

        const node = canvas.nodes?.get(tempChildNode?.id!);
        if (!node) {
            return;
        }
        return node;
    }

    async addNodeToCanvas(canvas: Canvas, id: string, { x, y, width, height, type, content }: NewNode) {
        if (!canvas) {
            return;
        }

        const data = canvas.getData();
        if (!data) {
            return;
        }

        const node: Partial<CanvasTextData | CanvasFileData> = {
            id: id,
            x: x,
            y: y,
            width: width,
            height: height,
            type: type,
        };

        switch (type) {
            case "text":
                node.text = content;
                break;
            case "file":
                node.file = content;
                break;
        }

        canvas.importData({
            nodes: [...data.nodes, node],
            edges: data.edges,
        });

        canvas.requestFrame();

        return node;
    }
    async createEdge(node1: any, node2: any, canvas: any, from_side: string = "right", to_side: string = "left") {
        this.addEdgeToCanvas(
            canvas,
            this.generateRandomId(16),
            {
                fromOrTo: "from",
                side: from_side,
                node: node1,
            },
            {
                fromOrTo: "to",
                side: to_side,
                node: node2,
            }
        );
    }
    generateRandomId(length: number): string {
        const hexArray = Array.from({ length }, () => {
            const randomHex = Math.floor(Math.random() * 16).toString(16);
            return randomHex;
        });
        return hexArray.join("");
    }

    addEdgeToCanvas(canvas: any, edgeID: string, fromEdge: any, toEdge: any) {
        if (!canvas) {
            return;
        }

        const data = canvas.getData();
        if (!data) {
            return;
        }

        canvas.importData({
            edges: [
                ...data.edges,
                {
                    id: edgeID,
                    fromNode: fromEdge.node.id,
                    fromSide: fromEdge.side,
                    toNode: toEdge.node.id,
                    toSide: toEdge.side,
                },
            ],
            nodes: data.nodes,
        });
        canvas.requestFrame();
    }

    addChatIconToRibbon() {
        this.addRibbonIcon("message-square", "Caret Chat", async (evt) => {
            await this.app.workspace.getLeaf(true).setViewState({
                type: VIEW_CHAT,
                active: true,
            });
        });
    }
    addCaretCanvasIcon() {
        this.addRibbonIcon("message-square", "Caret Chat", async (evt) => {
            await this.app.workspace.getLeaf(true).setViewState({
                type: VIEW_CHAT,
                active: true,
            });
        });
    }

    onunload() {}

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
modals/addCustomModel.ts

import { App, Modal, Notice, Setting } from "obsidian";
import { CaretPluginSettings, CustomModels } from "types";
export class CustomModelModal extends Modal {
    model_id: string = "";
    model_name: string = "";
    streaming: boolean = true;
    vision: boolean = false;
    function_calling: boolean = false;
    context_window: number = 0;
    url: string = "";
    api_key: string = "";
    plugin: any;
    known_provider: string = "";

    constructor(app: App, plugin: any) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl("h2", { text: "Add custom model" });
        contentEl.createEl("div", { text: "Note: The model needs to support the OpenAI spec.", cls: "callout" });
        contentEl.createEl("div", {
            text: "Note: The endpoint needs to support CORS. This is experimental and might require additional CORS settings to be added to Caret. Let me know!",
            cls: "callout",
        });

        new Setting(contentEl)
            .setName("Model ID")
            .setDesc("This is the model. This is the value for the model parameter that will be sent to the endpoint.")
            .addText((text) => {
                text.setValue(this.model_id).onChange((value) => {
                    this.model_id = value;
                });
            });

        new Setting(contentEl)
            .setName("Model name")
            .setDesc("This is the human-friendly name only used for displaying.")
            .addText((text) => {
                text.setValue(this.model_name).onChange((value) => {
                    this.model_name = value;
                });
            });

        new Setting(contentEl)
            .setName("Vision")
            .setDesc("Not used currently, will be used to know if the model can process pictures.")
            .addToggle((toggle) => {
                toggle.setValue(this.vision).onChange((value) => {
                    this.vision = value;
                });
            });
        new Setting(contentEl)
            .setName("Function calling")
            .setDesc("Does the model support function calling?")
            .addToggle((toggle) => {
                toggle.setValue(this.function_calling).onChange((value) => {
                    this.function_calling = value;
                });
            });

        new Setting(contentEl)
            .setName("Context size")
            .setDesc("You can normally pull this out of the Hugging Face repo, the config.json.")
            .addText((text) => {
                text.setValue(this.context_window.toString()).onChange((value) => {
                    this.context_window = parseInt(value);
                });
            });

        new Setting(contentEl)
            .setName("Custom endpoint")
            .setDesc("This is where the model is located. It can be a remote URL or a server URL running locally.")
            .addText((text) => {
                text.setValue(this.url).onChange((value) => {
                    this.url = value;
                });
            });

        new Setting(contentEl)
            .setName("API key")
            .setDesc("This is the API key required to access the model.")
            .addText((text) => {
                text.setValue(this.api_key).onChange((value) => {
                    this.api_key = value;
                });
            });

        new Setting(contentEl)
            .setName("Known provider")
            .setDesc("Select this if it's a known endpoint like Ollama.")
            .addDropdown((dropdown) => {
                dropdown.addOption("ollama", "Ollama");
                dropdown.addOption("openrouter", "OpenRouter");
                dropdown.setValue(this.known_provider).onChange((value) => {
                    this.known_provider = value;
                });
            });
        new Setting(contentEl).addButton((button) => {
            button.setButtonText("Submit").onClick(async () => {
                const settings: CaretPluginSettings = this.plugin.settings;
                const parsed_context_window = parseInt(this.context_window.toString());

                if (!this.model_name || this.model_name.trim() === "") {
                    new Notice("Model name must exist");
                    console.error("Validation Error: Model name must exist");
                    return;
                }

                if (
                    (!this.url || this.url.trim() === "") &&
                    (!this.known_provider || this.known_provider.trim() === "")
                ) {
                    new Notice("Either endpoint or known provider must be set");
                    console.error("Validation Error: Either endpoint or known provider must be set");
                    return;
                }

                if (!this.model_id || this.model_id.trim() === "") {
                    new Notice("Model ID must have a value");
                    console.error("Validation Error: Model ID must have a value");
                    return;
                }

                if (isNaN(parsed_context_window)) {
                    new Notice("Context window must be a number");
                    console.error("Validation Error: Context window must be a number");
                    return;
                }
                const new_model: CustomModels = {
                    name: this.model_name,
                    context_window: this.context_window,
                    function_calling: this.function_calling, // Assuming default value as it's not provided in the form
                    vision: this.vision,
                    streaming: true,
                    endpoint: this.url,
                    api_key: this.api_key,
                    known_provider: this.known_provider,
                };

                settings.custom_endpoints[this.model_id] = new_model;

                await this.plugin.saveSettings();

                this.close();
            });
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
modals/convertTextToNoteModal.ts

import { App, Modal, Notice, Setting } from "obsidian";
export class ConvertTextToNoteModal extends Modal {
    plugin: any;
    messages: string[];
    formatting_prompt: string = "Format the below content into a nice markdown document.";
    fileName: string = "";
    apply_formatting: boolean = true;

    constructor(app: App, plugin: any, messages: string[]) {
        super(app);
        this.plugin = plugin;
        this.messages = messages;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl("h2", { text: "Convert text to note" });
        contentEl.createEl("div", { text: `Converting ${this.messages.length} messages`, cls: "callout" });

        new Setting(contentEl)
            .setName("File name")
            .setDesc("Enter the name for the note.")
            .addText((text) => {
                text.setValue(this.fileName).onChange((value) => {
                    this.fileName = value;
                });
            });

        new Setting(contentEl)
            .setName("Auto format")
            .setDesc("Apply prompt formatting to the note.")
            .addToggle((toggle) => {
                toggle.setValue(this.apply_formatting).onChange((value) => {
                    this.apply_formatting = value;
                });
            });
        const textArea = contentEl.createEl("textarea", {
            text: this.formatting_prompt,
            cls: "content-l caret-w-full",
            placeholder: "Enter the formatting song.",
        });
        textArea.onchange = (event) => {
            this.formatting_prompt = (event.target as HTMLTextAreaElement).value;
        };

        new Setting(contentEl).addButton((button) => {
            button.setButtonText("Submit").onClick(async () => {
                if (!this.fileName || this.fileName.trim() === "") {
                    new Notice("File name must be set before saving");
                    console.error("Validation Error: File name must exist");
                    return;
                }

                let final_content = this.messages.join("\n");
                if (this.apply_formatting) {
                    if (this.formatting_prompt.length < 1) {
                        new Notice("Must have formatting prompt");
                        return;
                    }
                    let final_prompt = `${this.formatting_prompt}\n\n${this.messages.join("\n")}`;
                    const conversation = [{ role: "user", content: final_prompt }];
                    const response = await this.plugin.llm_call(
                        this.plugin.settings.llm_provider,
                        this.plugin.settings.model,
                        conversation
                    );
                    final_content = response;
                }

                const file_path = `${this.fileName}.md`;

                // Check if the file path contains parentheses
                if (file_path.includes("/")) {
                    const pathParts = file_path.split("/");
                    let currentPath = "";
                    for (const part of pathParts.slice(0, -1)) {
                        currentPath += part;
                        const folder = await this.app.vault.getAbstractFileByPath(currentPath);
                        if (!folder) {
                            try {
                                await this.app.vault.createFolder(currentPath);
                            } catch (error) {
                                console.error("Failed to create folder:", error);
                            }
                        }
                        currentPath += "/";
                    }
                }
                const file = await this.app.vault.getFileByPath(file_path);

                try {
                    if (file) {
                        new Notice("File exists already, please choose another name");
                    } else {
                        await this.app.vault.create(file_path, final_content);
                        new Notice("Chat saved to note");
                        this.close();
                    }
                } catch (error) {
                    console.error("Failed to save note:", error);
                }
            });
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
modals/inlineEditingModal.ts

import { App, MarkdownView, Modal, Setting } from "obsidian";

export class CMDJModal extends Modal {
    result: string;
    selectedText: string;
    startIndex: number;
    endIndex: number;
    plugin: any;

    constructor(app: App, selectedText: string, startIndex: number, endIndex: number, plugin: any) {
        super(app);
        this.selectedText = selectedText;
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        const textDisplay = contentEl.createEl("div", {
            text: this.selectedText,
            cls: "caret-inline-editing-container-div", // Apply the CSS class here
        });

        contentEl.createEl("br"); // Line break

        const textArea = contentEl.createEl("textarea", {
            placeholder: "Type here...",
            cls: "caret-inline-editing-textarea", // Apply the CSS class here
        });

        const buttonContainer = contentEl.createEl("div", { cls: "caret-button-container" });

        new Setting(buttonContainer)
            .addButton((btn) =>
                btn
                    .setButtonText("Append output")

                    .onClick(async () => {
                        this.result = textArea.value; // Capture the value from the textarea

                        const content = await this.submit_edit(this.result);
                        this.insert_response(content);
                        this.close();
                    })
            )
            .addButton((btn) =>
                btn
                    .setButtonText("Replace")
                    .setCta()
                    .onClick(async () => {
                        this.result = textArea.value; // Capture the value from the textarea
                        const content = await this.submit_edit(this.result);
                        this.apply_delete(this.result);
                        this.insert_response(content, true);
                        this.close();
                    })
            );
    }

    async submit_edit(result: string) {
        let content = `
Please apply the following instructions to the below content:

Instructions:
${this.result}

Content:
${this.selectedText}

## Rules:
- Just return the reponse that follows the instructions. No need to include a preample or anything

## Markdown Formatting: 
Always apply markdown formatting. For keywords use the following:
	todos - Prepend todo lines with:
	- [ ] 
`.trim();
        const conversation = [{ role: "user", content: content }];
        const output_content = await this.plugin.llm_call(
            this.plugin.settings.llm_provider,
            this.plugin.settings.model,
            conversation
        );
        return output_content;
    }

    insert_response(response: string, replace: boolean = false) {
        const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
        if (editor) {
            let index = this.endIndex;
            if (replace) {
                index = index + 4;
            }
            const pos = editor.offsetToPos(index);
            editor.replaceRange(`\n|+${response}+|`, pos);
            editor.setCursor(pos); // Optionally set the cursor after the inserted text
            editor.focus(); // Focus the editor after inserting text
        }
    }

    apply_delete(text: string) {
        const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
        if (editor) {
            const content = editor.getValue();
            const index = content.indexOf(this.selectedText);
            if (index !== -1) {
                const beforeText = content.substring(0, index);
                const afterText = content.substring(index + this.selectedText.length);
                const newText = beforeText + `|-${this.selectedText}-|` + afterText;
                editor.setValue(newText);
            }
        }
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}
modals/insertNoteModal.ts

import { App, Modal } from "obsidian";
import Fuse from "fuse.js";
export class InsertNoteModal extends Modal {
    plugin: any;
    current_view: any;
    onSubmit: (note: string) => void;

    constructor(app: App, plugin: any, onSubmit: (note: string) => void) {
        super(app);
        this.plugin = plugin;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        const all_files = this.app.vault.getFiles();

        const html_insert_files = contentEl.createEl("p", {
            text: "Insert file",
            cls: "caret-insert-file-header",
        });

        // Create a text input for filtering files
        const inputField = contentEl.createEl("input", {
            type: "text",
            placeholder: "Enter text to search files",
            cls: "caret-file-filter-input",
        });

        // Function to filter files based on input text and limit to 10 results
        const filter_files = (input_text: string) => {
            const fuse_options = {
                keys: ["name"],
                includeScore: true,
                threshold: 0.3,
            };
            const fuse = new Fuse(all_files, fuse_options);
            const results = fuse.search(input_text);
            return results.map((result) => result.item).slice(0, 10);
        };

        // Display the filtered files
        const filesDisplay = contentEl.createEl("div", { cls: "caret-insert-file-files-display" });

        let currentSelectedIndex = -1; // -1 means the input field is selected

        // Function to update the visual selection
        const updateSelection = () => {
            const fileElements = filesDisplay.querySelectorAll(".insert-file-file-name");
            fileElements.forEach((el, index) => {
                if (index === currentSelectedIndex) {
                    el.classList.add("selected");
                    el.scrollIntoView({ block: "nearest" });
                } else {
                    el.classList.remove("selected");
                }
            });
        };

        // Update display when input changes
        inputField.addEventListener("input", () => {
            const filtered_files = filter_files(inputField.value);

            // Clear previous file display
            // filesDisplay.innerHTML = "";
            filesDisplay.empty();

            // Add filtered files to the display
            filtered_files.forEach((file) => {
                const fileElement = filesDisplay.createEl("div", {
                    text: file.name,
                    cls: "caret-insert-file-file-name",
                });
                fileElement.addEventListener("click", () => {
                    this.onSubmit(`[[${file.name}]]`);
                    this.close();
                    // if (this.current_view.getViewType() === "main-caret") {
                    //     this.current_view.insert_text_into_user_message(`[[${file.name}]]`);
                    //     this.current_view.focusAndPositionCursorInTextBox();
                    //     this.close();
                    // }
                });
            });

            // Reset selection
            currentSelectedIndex = -1;
            updateSelection();
        });

        // Keyboard navigation
        inputField.addEventListener("keydown", (event) => {
            const fileElements = filesDisplay.querySelectorAll(".insert-file-file-name");
            if (event.key === "ArrowDown") {
                if (currentSelectedIndex < fileElements.length - 1) {
                    currentSelectedIndex++;
                    updateSelection();
                    event.preventDefault(); // Prevent scrolling the page
                }
            } else if (event.key === "ArrowUp") {
                if (currentSelectedIndex > -1) {
                    currentSelectedIndex--;
                    updateSelection();
                    event.preventDefault(); // Prevent scrolling the page
                }
            } else if (event.key === "Enter" && currentSelectedIndex >= 0) {
                event.preventDefault(); // Prevent adding an extra line break
                (fileElements[currentSelectedIndex] as HTMLElement).click();
            }
        });
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}
modals/systemPromptModal.ts

import { App, Modal, Notice } from "obsidian";
export class SystemPromptModal extends Modal {
    plugin: any;
    system_prompt: string = "";

    constructor(app: App, plugin: any) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl("h2", { text: "System prompt" });

        const textArea = contentEl.createEl("textarea", {
            cls: "system-prompt-modal-text-area", // Apply the CSS class here
            text: this.plugin.settings.system_prompt || "",
        });

        const submitButton = contentEl.createEl("button", { text: "Submit", cls: "caret-mod-cta" });
        submitButton.addEventListener("click", async () => {
            this.plugin.settings.system_prompt = textArea.value;
            new Notice("System prompt updated");
            await this.plugin.saveSettings();
            await this.plugin.loadSettings();
            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
modals/removeCustomModel.ts

import { App, Modal } from "obsidian";
import { CustomModels } from "../types";
export class RemoveCustomModelModal extends Modal {
    plugin: any;

    constructor(app: App, plugin: any) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl, modalEl } = this;
        contentEl.empty();
        contentEl.createEl("h2", { text: "Remove custom model", cls: "caret-insert-file-header" });

        // Set the width of the modal
        modalEl.classList.add("custom-model-modal-container"); // Apply the CSS class here

        const table = contentEl.createEl("table", { cls: "caret-custom-models-table" });
        const headerRow = table.createEl("tr");
        headerRow.createEl("th", { text: "Name" });
        headerRow.createEl("th", { text: "Context window" });
        headerRow.createEl("th", { text: "URL" });
        headerRow.createEl("th", { text: "Action" });

        const custom_models: { [key: string]: CustomModels } = this.plugin.settings.custom_endpoints;

        for (const [model_id, model] of Object.entries(custom_models)) {
            const row = table.createEl("tr");

            row.createEl("td", { text: model.name });
            row.createEl("td", { text: model.context_window.toString() });
            row.createEl("td", { text: model.endpoint });

            const deleteButtonContainer = row.createEl("td", { cls: "caret-delete-btn-container" });
            const deleteButton = deleteButtonContainer.createEl("button", { text: "Delete", cls: "caret-mod-warning" });
            deleteButton.addEventListener("click", async () => {
                delete custom_models[model_id];
                await this.plugin.saveSettings();
                this.onOpen(); // Refresh the modal to reflect changes
            });
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
package.json

{
    "name": "caret",
    "version": "0.2.65",
    "description": "Caret brings LLM capabilities into your vault, with a special focus on the canvas",
    "main": "main.js",
    "scripts": {
        "dev": "node esbuild.config.mjs",
        "build": "tsc -noEmit -skipLibCheck && node esbuild.config.mjs production",
        "version": "node version-bump.mjs && git add manifest.json versions.json"
    },
    "keywords": [],
    "author": "",
    "license": "MIT",
    "devDependencies": {
        "@types/mime": "^4.0.0",
        "@types/node": "^16.11.6",
        "@types/react": "^18.3.3",
        "@types/react-dom": "^18.3.0",
        "@types/react-syntax-highlighter": "^15.5.13",
        "@typescript-eslint/eslint-plugin": "5.29.0",
        "@typescript-eslint/parser": "5.29.0",
        "builtin-modules": "3.3.0",
        "esbuild": "0.17.3",
        "obsidian": "latest",
        "raw-loader": "^4.0.2",
        "tslib": "2.4.0",
        "typescript": "^5.5.2"
    },
    "dependencies": {
        "@ai-sdk/anthropic": "^1.0.8",
        "@ai-sdk/google": "^1.0.15",
        "@ai-sdk/groq": "^1.0.11",
        "@ai-sdk/openai": "^1.0.18",
        "@ai-sdk/openai-compatible": "^0.0.16",
        "@anthropic-ai/sdk": "^0.20.9",
        "@bundled-es-modules/pdfjs-dist": "^3.6.172-alpha.1",
        "@codemirror/language": "^6.10.1",
        "@emotion/react": "^11.11.4",
        "@emotion/styled": "^11.11.5",
        "@instructor-ai/instructor": "^1.3.0",
        "@mui/icons-material": "^5.15.18",
        "@openrouter/ai-sdk-provider": "^0.0.6",
        "@xyflow/react": "^12.2.0",
        "ai": "^4.0.33",
        "csv-parse": "^5.5.5",
        "dotenv": "^16.4.5",
        "fuse.js": "^7.0.0",
        "groq-sdk": "^0.3.3",
        "install": "^0.13.0",
        "js-tiktoken": "^1.0.11",
        "lucide-react": "^0.379.0",
        "mime": "^4.0.3",
        "monkey-around": "^3.0.0",
        "ollama": "^0.5.0",
        "ollama-ai-provider": "^1.1.0",
        "openai": "^4.55.1",
        "pdf-lib": "^1.17.1",
        "react": "^18.3.1",
        "react-dom": "^18.3.1",
        "react-markdown": "^8.0.6",
        "react-syntax-highlighter": "^15.5.0",
        "remark-gfm": "^1.0.0",
        "request": "^2.88.2",
        "serpapi": "^2.1.0",
        "uuid": "^9.0.1",
        "xml2js": "^0.6.2",
        "zod": "^3.23.8"
    }
}
prettier.config.js

module.exports = {
  printWidth: 120,
  tabWidth: 4,
  semi: true,
  singleQuote: false,
  bracketSpacing: true,
  overrides: [
    {
      files: ["*.yml", "*.yaml"],
      options: {
        parser: "yaml",
      },
    },
    {
      files: ["*.json", "*.jsonc"],
      options: {
        parser: "json",
      },
    },
  ],
  // Default parser for other file types
  parser: "typescript",
};
settings.ts

import {
    App,
    Editor,
    MarkdownView,
    Modal,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting,
    ItemView,
    WorkspaceLeaf,
    setTooltip,
    setIcon,
    requestUrl,
    debounce,
} from "obsidian";
type ModelDropDownSettings = {
    openai: string;
    groq: string;
    ollama: string;
    anthropic?: string;
    custom?: string; // Make 'custom' optional
    perplexity: string;
};

import { Models, CustomModels, LLMProviderOptions } from "./types";
import CaretPlugin, { DEFAULT_SETTINGS } from "./main";

export class CaretSettingTab extends PluginSettingTab {
    plugin: CaretPlugin;

    constructor(app: App, plugin: CaretPlugin) {
        super(app, plugin);
        this.plugin = plugin;

        // Update streaming setting for Anthropic models
        const default_llm_providers = DEFAULT_SETTINGS.llm_provider_options;
        const current_llm_providers = this.plugin.settings.llm_provider_options;

        if (current_llm_providers.anthropic) {
            for (const [modelKey, modelValue] of Object.entries(default_llm_providers.anthropic)) {
                if (current_llm_providers.anthropic[modelKey]) {
                    current_llm_providers.anthropic[modelKey].streaming = modelValue.streaming;
                }
            }
            // Save the updated settings
            this.plugin.saveSettings();
        }
    }
    api_settings_tab(containerEl: HTMLElement): void {
        // API settings logic here
        const default_llm_providers = DEFAULT_SETTINGS.llm_provider_options;
        const current_llm_providers = this.plugin.settings.llm_provider_options;
        const current_custom = current_llm_providers.custom;

        this.plugin.settings.llm_provider_options = { ...default_llm_providers, custom: { ...current_custom } };

        const custom_endpoints = this.plugin.settings.custom_endpoints;
        // @ts-ignore
        let model_drop_down_settings: ModelDropDownSettings = DEFAULT_SETTINGS.provider_dropdown_options;

        if (Object.keys(custom_endpoints).length > 0) {
            for (const [key, value] of Object.entries(custom_endpoints)) {
                if (value.known_provider) {
                    if (!this.plugin.settings.llm_provider_options[value.known_provider]) {
                        this.plugin.settings.llm_provider_options[value.known_provider] = {};
                    }
                    this.plugin.settings.llm_provider_options[value.known_provider][key] = value;
                } else {
                    this.plugin.settings.llm_provider_options.custom[key] = value;
                }
            }
        }

        let context_window = null;
        try {
            const llm_provider = this.plugin.settings.llm_provider;
            const model = this.plugin.settings.model;
            if (
                this.plugin.settings.llm_provider_options[llm_provider] &&
                this.plugin.settings.llm_provider_options[llm_provider][model]
            ) {
                const model_details = this.plugin.settings.llm_provider_options[llm_provider][model];
                if (model_details && model_details.context_window) {
                    const context_window_value = model_details.context_window;
                    context_window = parseInt(context_window_value.toString());
                }
            }
        } catch (error) {
            console.error("Error retrieving model details:", error);
            context_window = null;
        }
        if (!this.plugin.settings.llm_provider || this.plugin.settings.llm_provider.length === 0) {
            this.plugin.settings.llm_provider = "openai";
            this.plugin.settings.model = "gpt-4-turbo";
            this.plugin.settings.context_window = 128000;
            this.plugin.saveSettings();
        }

        const model_options_data = Object.fromEntries(
            Object.entries(
                this.plugin.settings.llm_provider_options[
                    this.plugin.settings.llm_provider as keyof typeof this.plugin.settings.llm_provider_options
                ]
            ).map(([key, value]) => [key, value.name])
        );

        // LLM Provider Settings
        new Setting(containerEl)
            .setName("LLM provider")
            .setDesc("")
            .addDropdown((dropdown) => {
                dropdown
                    .addOptions(model_drop_down_settings)
                    .setValue(this.plugin.settings.llm_provider)
                    .onChange(async (provider) => {
                        this.plugin.settings.llm_provider = provider;
                        this.plugin.settings.model = Object.keys(
                            this.plugin.settings.llm_provider_options[provider]
                        )[0];
                        this.plugin.settings.context_window =
                            this.plugin.settings.llm_provider_options[provider][
                                this.plugin.settings.model
                            ].context_window;
                        await this.plugin.saveSettings();
                        await this.plugin.loadSettings();
                        this.display();
                    });
            });
        const setting = new Setting(containerEl).setName("Model").addDropdown((modelDropdown) => {
            modelDropdown.addOptions(model_options_data);
            modelDropdown.setValue(this.plugin.settings.model);
            modelDropdown.onChange(async (value) => {
                this.plugin.settings.model = value;
                this.plugin.settings.context_window =
                    this.plugin.settings.llm_provider_options[this.plugin.settings.llm_provider][value].context_window;
                await this.plugin.saveSettings();
                await this.plugin.loadSettings();
                this.display();
            });
        });
        if (this.plugin.settings.model === "gpt-4o") {
            new Setting(containerEl)
                .setName("GPT-4o")
                .setDesc(
                    "You are are using the new model! If you check errors it might be because your API key doesn't have access."
                );
        }

        if (context_window) {
            setting.setDesc(`FYI your selected model has a context window of ${context_window}`);
        }
        if (this.plugin.settings.llm_provider === "ollama") {
            const ollama_info_container = containerEl.createEl("div", {
                cls: "caret-settings_container",
            });
            ollama_info_container.createEl("strong", { text: "You're using Ollama!" });
            ollama_info_container.createEl("p", { text: "Remember to do the following:" });
            ollama_info_container.createEl("p", { text: "Make sure you have downloaded the model you want to use:" });
            const second_code_block_container = ollama_info_container.createEl("div", {
                cls: "caret-settings_code_block",
            });

            second_code_block_container.createEl("code", { text: `ollama run ${this.plugin.settings.model}` });
            ollama_info_container.createEl("p", {
                text: "After running the model, kill that command and close the ollama app.",
            });
            ollama_info_container.createEl("p", {
                text: "Then run this command to start the Ollama server and make it accessible from Obsidian:",
            });
            const code_block_container = ollama_info_container.createEl("div", {
                cls: "caret-settings_code_block",
            });
            code_block_container.createEl("code", {
                text: "OLLAMA_ORIGINS=app://obsidian.md* ollama serve",
            });

            ollama_info_container.createEl("br"); // Adds a line break for spacing
        }

        new Setting(containerEl)
            .setName("OpenAI API key")
            .setDesc("")
            .addText((text) => {
                text.setPlaceholder("OpenAI API key")
                    .setValue(this.plugin.settings.openai_api_key)
                    .onChange(async (value: string) => {
                        this.plugin.settings.openai_api_key = value;
                        await this.plugin.saveSettings();
                        await this.plugin.loadSettings();
                    });
                text.inputEl.addClass("caret-hidden-value-unsecure");
            });

        new Setting(containerEl)
            .setName("Groq API key")
            .setDesc("")
            .addText((text) => {
                text.setPlaceholder("Groq API key")
                    .setValue(this.plugin.settings.groq_api_key)
                    .onChange(async (value: string) => {
                        this.plugin.settings.groq_api_key = value;
                        await this.plugin.saveSettings();
                        await this.plugin.loadSettings();
                    });
                text.inputEl.addClass("caret-hidden-value-unsecure");
            });
        new Setting(containerEl)
            .setName("Anthropic API key")
            .setDesc("")
            .addText((text) => {
                text.setPlaceholder("Anthropic API key")
                    .setValue(this.plugin.settings.anthropic_api_key)
                    .onChange(async (value: string) => {
                        this.plugin.settings.anthropic_api_key = value;
                        await this.plugin.saveSettings();
                        await this.plugin.loadSettings();
                    });
                text.inputEl.addClass("caret-hidden-value-unsecure");
            });
        new Setting(containerEl)
            .setName("OpenRouter API key")
            .setDesc("")
            .addText((text) => {
                text.setPlaceholder("OpenRouter API key")
                    .setValue(this.plugin.settings.open_router_key)
                    .onChange(async (value: string) => {
                        this.plugin.settings.open_router_key = value;
                        await this.plugin.saveSettings();
                        await this.plugin.loadSettings();
                    });
                text.inputEl.addClass("caret-hidden-value-unsecure");
            });

        new Setting(containerEl)
            .setName("Google Gemini API key")
            .setDesc("")
            .addText((text) => {
                text.setPlaceholder("Google Gemini API key")
                    .setValue(this.plugin.settings.google_api_key)
                    .onChange(async (value: string) => {
                        this.plugin.settings.google_api_key = value;
                        await this.plugin.saveSettings();
                        await this.plugin.loadSettings();
                    });
                text.inputEl.addClass("caret-hidden-value-unsecure");
            });

        new Setting(containerEl)
            .setName("Perplexity API key")
            .setDesc("")
            .addText((text) => {
                text.setPlaceholder("Perplexity API key")
                    .setValue(this.plugin.settings.perplexity_api_key)
                    .onChange(async (value: string) => {
                        this.plugin.settings.perplexity_api_key = value;
                        await this.plugin.saveSettings();
                        await this.plugin.loadSettings();
                    });
                text.inputEl.addClass("caret-hidden-value-unsecure");
            });

        new Setting(containerEl)
            .setName("Reload after adding API keys!")
            .setDesc(
                "After you added API keys for the first time you will need to reload the plugin for those changes to take effect. \n This only needs to be done the first time or when you change your keys."
            );
    }
    chat_settings_tab(containerEl: HTMLElement): void {
        let tempChatFolderPath = this.plugin.settings.chat_logs_folder; // Temporary storage for input value

        const debouncedSave = debounce(
            async (value: string) => {
                if (value.length <= 1) {
                    new Notice("The folder path must be longer than one character.");
                    return;
                }
                if (value.endsWith("/")) {
                    new Notice("The folder path must not end with a trailing slash.");
                    return;
                }
                if (value !== this.plugin.settings.chat_logs_folder) {
                    this.plugin.settings.chat_logs_folder = value;
                    await this.plugin.saveSettings();
                    await this.plugin.loadSettings();
                }
            },
            1000,
            true
        ); // 500ms delay

        new Setting(containerEl)
            .setName("Chat folder path")
            .setDesc("Specify the folder path where chat logs will be stored.")
            .addText((text) => {
                text.setPlaceholder("Enter folder path")
                    .setValue(this.plugin.settings.chat_logs_folder)
                    .onChange((value: string) => {
                        tempChatFolderPath = value;
                        debouncedSave(value);
                    });
            });

        new Setting(containerEl)
            .setName("Use date format for subfolders")
            .setDesc("Use Year-Month-Date as subfolders for the chat logs.")
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.chat_logs_date_format_bool).onChange(async (value: boolean) => {
                    this.plugin.settings.chat_logs_date_format_bool = value;
                    await this.plugin.saveSettings();
                    await this.plugin.loadSettings();
                });
            });

        new Setting(containerEl)
            .setName("Rename chats")
            .setDesc("Chats will be given a descriptive name using your default set provider/model")
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.chat_logs_rename_bool).onChange(async (value: boolean) => {
                    this.plugin.settings.chat_logs_rename_bool = value;
                    await this.plugin.saveSettings();
                    await this.plugin.loadSettings();
                });
            });

        // LLM Provider Settings
        const send_chat_shortcut_options: { [key: string]: string } = {
            enter: "Enter",
            shift_enter: "Shift + Enter",
            // cmd_enter: "CMD + Enter",
        };
        new Setting(containerEl)
            .setName("Send chat keybinds")
            .setDesc("Select which shortcut will be used to send messages.")
            .addDropdown((dropdown) => {
                dropdown
                    .addOptions(send_chat_shortcut_options)
                    .setValue(this.plugin.settings.chat_send_chat_shortcut)
                    .onChange(async (selected) => {
                        this.plugin.settings.chat_send_chat_shortcut = selected;

                        await this.plugin.saveSettings();
                        await this.plugin.loadSettings();
                    });
            });

        new Setting(containerEl)
            .setName("Use nested [[]] content")
            .setDesc("When set to true, context will include 1 layer of block refs")
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.include_nested_block_refs).onChange(async (value: boolean) => {
                    this.plugin.settings.include_nested_block_refs = value;
                    await this.plugin.saveSettings();
                    await this.plugin.loadSettings();
                });
            });
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        if (this.plugin.settings.caret_version !== DEFAULT_SETTINGS.caret_version) {
            this.plugin.settings.caret_version = DEFAULT_SETTINGS.caret_version;
        }

        const tabContainer = containerEl.createEl("div", { cls: "caret-tab-container" });
        const apiTab = tabContainer.createEl("button", { text: "LLM APIs ", cls: "caret-tab" });
        const chatTab = tabContainer.createEl("button", { text: "Chat", cls: "caret-tab" });

        const apiSettingsContainer = containerEl.createEl("div", { cls: "caret-api-settings-container caret-hidden" });
        const chatSettingsContainer = containerEl.createEl("div", {
            cls: "caret-chat-settings-container caret-hidden",
        });

        this.api_settings_tab(apiSettingsContainer);
        this.chat_settings_tab(chatSettingsContainer);

        // LLM Provider Settings
        new Setting(containerEl).setDesc(`Caret Version: ${this.plugin.settings.caret_version}`);

        apiTab.addEventListener("click", () => {
            apiSettingsContainer.classList.remove("caret-hidden");
            chatSettingsContainer.classList.add("caret-hidden");
        });

        chatTab.addEventListener("click", () => {
            chatSettingsContainer.classList.remove("caret-hidden");
            apiSettingsContainer.classList.add("caret-hidden");
            // Placeholder for chat settings rendering function
            // this.chat_settings_tab(chatSettingsContainer);
        });

        // Initially load API settings tab
        apiTab.click();

        // this.api_settings_tab(containerEl);
    }
}
tsconfig.json

{
  "compilerOptions": {
    "baseUrl": ".",
    "inlineSourceMap": true,
    "inlineSources": true,
    "module": "ESNext",
    "target": "ES6",
    "allowJs": true,
    "noImplicitAny": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "isolatedModules": true,
    "allowSyntheticDefaultImports": true,
    "jsx": "react-jsx",
    "strictNullChecks": true,
    "lib": [
      "DOM",
      "ES5",
      "ES6",
      "ES7"
    ]
  },
  "include": [
    "**/*.ts",
    "**/*.tsx"
  ],
}
styles.css

.caret-container {
    padding: 2px 15px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    width: 100%; /* Ensure it takes full width */
    background-color: ; /* Background color not specified */
    white-space: pre-wrap; /* Preserve whitespace and formatting */
}
.caret-messages-container {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    /* margin-bottom: 10px; */
    height: 80%;
    /* min-height: 0; Ensure it doesn't unnecessarily expand */
    width: 100%;
    white-space: pre-wrap; /* Preserve whitespace and formatting */
}

.caret-message {
    padding: 10px; /* Increased padding to prevent text cut-off */
    border-radius: 5px;
    max-width: calc(100% - 10px); /* Prevent overflow */
    word-wrap: break-word; /* Ensure long words do not cause overflow */
    white-space: pre-wrap; /* Preserve whitespace and formatting */
    user-select: text;
    color: black; /* Set text color to black */
    width: 100%;
}

.caret-message.user, .caret-message.system {
    align-self: flex-start;
    background-color: #e0e0e0; /* Light gray for better visibility in both light and dark modes */
    white-space: pre-wrap; /* Preserve whitespace and formatting */
}

.caret-message.assistant {
    background-color: #cfe9e3; /* Light green for better visibility in both light and dark modes */
    white-space: pre-wrap; /* Preserve whitespace and formatting */
}

.caret-full_width_text_container {
    width: 100%;
    resize: vertical;
    overflow-y: auto;
    min-height: 80px;
    margin: 0 0 20px 0;
    box-sizing: border-box;
    white-space: pre-wrap; /* Preserve whitespace and formatting */
}

.caret-button-container {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

.caret-flex-col {
    display: flex;
    flex-direction: column;
}
.caret-w-full {
    width: 100%
}
.caret-mb-2 {
    margin-bottom: 0.5rem; /* 8px assuming the root font-size is 16px */
}
.caret-mb-4 {
    margin-bottom: 16px; /* 1rem typically equals 16px */
}
.theme-light .caret-settings_container {
    background-color: rgb(187, 187, 187); /* Light grey for light theme */
    padding: 10px; 
    margin-bottom: 10px;
    border-radius: 4px; /* Rounded corners */
    user-select: text;
    z-index: 1000000;
}

.theme-dark .caret-settings_container {
    background-color: #404040; /* Darker grey for dark theme */
    padding: 10px; 
    margin-bottom: 10px;
    border-radius: 4px; /* Rounded corners */
    user-select: text;
    z-index: 1000000;
}

.theme-light .caret-settings_code_block {
    background-color: #fbf4f4; /* Light grey background for light theme */
    border-radius: 4px; /* Rounded corners */
    padding: 4px;
    user-select: text;
    z-index: 1000000;
}

.theme-dark .caret-settings_code_block {
    background-color: #606060; /* Darker grey for dark theme */
    border-radius: 4px; /* Rounded corners */
    padding: 4px;
    user-select: text;
    z-index: 1000000;
}
.caret-hidden-value-unsecure {
    -webkit-text-security: disc;
}

.caret-insert-file-header {
    font-size: 18px;
    font-weight: bold;
}

.caret-insert-file-files-display {
    height: 200px;
    overflow: auto; /* Changed from 'hidden' to 'auto' to allow scrolling */
}
.caret-insert-file-file-name {
    font-size: 14px;
    padding-top: 1px;
    padding-bottom: 1px;
    padding-left: 2px;
    border: 1px solid transparent; /* Ensures layout doesn't change when selected */
    transition: font-size 0.2s, border-color 0.2s; /* Smooth transition for visual changes */
}
.caret-file-filter-input {
    margin-bottom: 4px;
    width: 100%;
}

.caret-insert-file-file-name.selected {
    font-size: 16px; /* Slightly larger font size for selected item */
    border-color: #cccccc; /* Light gray border for selected item */
    background-color: #f0f0f0; /* Optional: light background color for better visibility */
    border-radius: 4px;
}
.caret-custom-models-table {
    width: 100%;
    border-collapse: collapse;
}

.caret-custom-models-table th,
.caret-custom-models-table td {
    text-align: left;
    padding: 8px;
    border: 1px solid #ddd;
}

.caret-custom-models-table th {
    background-color: #f2f2f2;
}

.caret-custom-models-table tr:nth-child(even) {
    background-color: #f9f9f9;
}

.caret-custom-models-table tr:hover {
    background-color: #ddd;
}

.caret-mod-warning {
    color: red;
    font-weight: bold;
}

.caret-system-prompt-textarea {
    width: 100%;
    height: 400px;
    resize: vertical;
}
.caret-workflow_container {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    width: 100%;
}

.caret-flex-row {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
}

.caret-w-8 {
    width: 360px
}
.caret-workflow_text_area {
    height: 150px
}
.caret-row_items_spacing {
    margin-right: 3px;
}

.caret-bottom-screen-padding {
    padding-bottom: 100px;
}
/* Add this CSS to your plugin's stylesheet */
.caret-clickable-icon.wand {
    position: relative;
    padding: 10px; /* Increase padding to make the button larger */
}

.caret-submenu {
    display: none;
    position: absolute;
    margin-top: 15px;
    top: 100%;
    left: 50%;
    transform: translateX(-50%); /* Center the submenu */
    /* background-color: white; */
    border: 1px solid #ccc;
    z-index: 100000;
    min-width: 150px;
    grid-template-columns: repeat(4, 1fr); /* Up to four divs wide */
    gap: 5px; /* Add some space between the icons */
    padding: 2px; /* Add some padding around the grid */
    background-color: #f0f0f0;
    border-radius: 4px;
}

.caret-submenu-item {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1px;
    border-radius: 4px;
    border: 1px solid #ccc;
}

.caret-submenu-item:hover {
    /* background-color: #f0f0f0; */
}

.caret-message-container {
    display: flex;
    flex-direction: column;
    width: 100%; /* Adjusts to the width of the content */
}

.caret-chat-message-actions {
    /* width: 40px; */
    padding-top: 4px;
    display: flex;
    justify-content: left;
    margin-top: 1px;
}

.theme-light .caret-chat-message-actions {
    color: black;
}

.theme-dark .caret-chat-message-actions {
    background-color: transparent;
}
.caret-chat-message-convert-to-note {
    margin-right: 8px;
}
.caret-chat-message-checkbox {
    top: 3px;
}
.caret-input-container {
    /* background-color: #f0f0f0; */
    background-color: var(--background-primary);;
}
.caret-bulk-convert-label {
    margin-right: 3px;
}
/* .react-markdown {
    line-height: 1.5;
    margin: 0;
    padding: 0;
    white-space: pre-wrap; 
  }

.react-markdown code, .react-markdown pre {
    white-space: pre-wrap;
  }
  .styled-markdown {
    line-height: 1.5;
    margin-bottom: 0.5em;
  } */

.caret-markdown-body ul {
    list-style-type: disc;
    /* padding-left: 20px; */
}
.caret-markdown-body li {
    margin-top: 0px;
    margin-bottom: 0px;
}
.caret-markdown-body p {
    margin-top: 0px;
    margin-bottom: 0px;
}

.caret-markdown-body code {
    background-color: #f6f8fa;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    margin-top: 0px;
    margin-bottom: 0px;
}
.caret-hidden {
    display: none;
}

.caret-tab {
    margin-right: 4px;
}

/* Modals CSS */
/* Inline Editing Modal */
.caret-inline-editing-container-div {
    height: 60px;
    overflow: scroll;
}
.caret-inline-editing-textarea {
    width: 100%;
    min-height: 100px;
    resize: none;
}

/* Canvas Styles */
#caret-custom-display {
    width: 100%;
    height: 40px;
    background-color: rgba(211, 211, 211, 0.8);
    padding: 2px;
    padding-left: 8px;
    padding-top: 4px;
}
.caret-submenu {
    display: none;
    /* other styles */
    grid-template-columns: repeat(4, 1fr); /* Up to four divs wide */
    gap: 5px; /* Add some space between the icons */
    padding: 2px; /* Add some padding around the grid */
    z-index: 100000;
}

.caret-submenu.visible {
    display: grid; /* Change this to grid */
}
/* Icon Grid */

/* Chat Component */
/* Chat Copy Icon */
.caret-chat-copy-icon {
    position: absolute;
    top: 2px;
    right: 2px;
    color: white;
    cursor: pointer;
    border-radius: 12px;
    transition: background-color 0.3s ease;
}
.caret-chat-copy-icon:hover {
    background-color: lightgray;
}
.caret-custom-model-modal-container {
    width: 800px;
    min-width: 600px;
}
.caret-system-prompt-modal-text-area {
    height: 400px;
    width: 100%;
}
.caret-workflow-editor-temperature-input {
    appearance: number-input;
    -webkit-appearance: number-input;
}
types.ts

import { MarkdownView } from "obsidian";

export interface ViewportNode {
    alwaysKeepLoaded: boolean;
    app: any; // This should be more specific based on the actual type of 'app'
    aspectRatio: number;
    bbox: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };
    canvas: any; // This should be more specific based on the actual type of 'canvas'
    child: any; // This should be more specific based on the actual type of 'child'
    color: string;
    containerEl: HTMLElement;
    contentBlockerEl: HTMLElement;
    contentEl: HTMLElement;
    height: number;
    id: string;
    isEditing: boolean;
    nodeEl: HTMLElement;
    placeholderEl: HTMLElement;
    resizeDirty: boolean;
    text: string;
    unknownData: {
        id: string;
        type: string;
        text: string;
    };
    width: number;
    x: number;
    y: number;
    zIndex: number;
}

export interface Node {
    id: string;
    type: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    render(): void;
    file?: string;
}

// TODO - improve types for everyting
export interface Canvas {
    readonly: boolean;
    view: MarkdownView;
    x: number;
    y: number;
    nodes: Map<string, any>;
    edges: Map<string, any>;
    selection: Set<any>;
    menu: CanvasMenu;
    nodeIndex: any; // Gotta figure out the typing for this.
    requestSave(save?: boolean, triggerBySelf?: boolean): void;
    getData(): any;
    getViewportNodes(): any[];
    requestSave(save?: boolean, triggerBySelf?: boolean): void;
    zoomToSelection(): void;
    selectOnly(node: Node): void;
    importData({}): void;
    requestFrame(): void;
}

export interface CanvasMenu {
    containerEl: HTMLElement;
    menuEl: HTMLElement;
    canvas: Canvas;

    render(): void;
    updateZIndex(): void;
}

export type Message = {
    content: string;
    role: "user" | "assistant";
};

export type Edge = {
    fromNode: string;
    toNode: string;
    fromSide: "left" | "right" | "top" | "bottom";
    toSide: "left" | "right" | "top" | "bottom";
};

export interface SparkleConfig {
    model: string;
    provider: string;
    temperature: number;
    context_window: string | number;
}

export interface Models {
    name: string;
    context_window: number;
    function_calling: boolean;
    vision: boolean;
    streaming: boolean;
}
export interface CustomModels extends Models {
    endpoint: string;
    api_key: string;
    known_provider: string;
}

export interface LLMProviderOptions {
    [key: string]: {
        [model: string]: Models;
    };
}

export interface NewNode {
    x: number;
    y: number;
    width: number;
    height: number;
    type: "text" | "file";
    content: string;
}
export interface WorkflowPrompt {
    model: string;
    provider: string;
    delay: string;
    temperature: string;
    prompt: string;
}
export interface CaretPluginSettings {
    caret_version: string;
    chat_logs_folder: string;
    chat_logs_date_format_bool: boolean;
    chat_logs_rename_bool: boolean;
    chat_send_chat_shortcut: string;
    model: string;
    llm_provider: string;
    openai_api_key: string;
    groq_api_key: string;
    open_router_key: string;
    anthropic_api_key: string;
    context_window: number;
    custom_endpoints: { [model: string]: CustomModels };
    system_prompt: string;
    temperature: number;
    llm_provider_options: LLMProviderOptions;
    provider_dropdown_options: { [key: string]: string };
    include_nested_block_refs: boolean;
    google_api_key: string;
    perplexity_api_key: string;
}
versions.json

{
    "1.0.0": "0.15.0"
}
views/sidebarChat.ts

// import { CaretSettingTab } from "./settings";

// // @ts-ignore
// import pdfjs from "@bundled-es-modules/pdfjs-dist/build/pdf";
// import pdf_worker_code from "./workers/pdf.worker.js";

// // Create a Blob URL from the worker code
// // @ts-ignore
// const pdf_worker_blob = new Blob([pdf_worker_code], { type: "application/javascript" });
// const pdf_worker_url = URL.createObjectURL(pdf_worker_blob);
// pdfjs.GlobalWorkerOptions.workerSrc = pdf_worker_url;

// import { encodingForModel } from "js-tiktoken";
// // @ts-ignore
// import ollama from "ollama/browser";

// import OpenAI from "openai";
// import Groq from "groq-sdk";
// import Anthropic from "@anthropic-ai/sdk";
// import { around } from "monkey-around";
// import { Canvas, ViewportNode, Message, Node, Edge, SparkleConfig } from "./types";
// import {
//     App,
//     Editor,
//     MarkdownView,
//     Modal,
//     Notice,
//     Plugin,
//     PluginSettingTab,
//     Setting,
//     ItemView,
//     WorkspaceLeaf,
//     setTooltip,
//     setIcon,
//     requestUrl,
//     TFile,
// } from "obsidian";
// import { CanvasFileData, CanvasNodeData, CanvasTextData } from "obsidian/canvas";
// import { NewNode, CustomModels, CaretPluginSettings } from "./types";
// var parseString = require("xml2js").parseString;
// export const VIEW_NAME_SIDEBAR_CHAT = "sidebar-caret";
// class SidebarChat extends ItemView {
//     constructor(leaf: WorkspaceLeaf) {
//         super(leaf);
//     }
//     textBox: HTMLTextAreaElement;
//     messagesContainer: HTMLElement; // Container for messages

//     getViewType() {
//         return VIEW_NAME_SIDEBAR_CHAT;
//     }

//     getDisplayText() {
//         return VIEW_NAME_SIDEBAR_CHAT;
//     }

//     async onOpen() {
//         const metacontainer = this.containerEl.children[1];
//         metacontainer.empty();
//         const container = metacontainer.createEl("div", {
//             cls: "container",
//         });
//         metacontainer.prepend(container);
//         // this.containerEl.appendChild(container);

//         // Create a container for messages
//         this.messagesContainer = container.createEl("div", {
//             cls: "messages-container",
//         });

//         // Add a "Hello World" message
//         this.addMessage("MLX Testing", "system");
//         this.createChatInputArea(container);
//     }
//     createChatInputArea(container: HTMLElement) {
//         // Create a container for the text box and the submit button
//         const inputContainer = container.createEl("div", {
//             cls: "chat-input-container",
//         });

//         // Create the text box within the input container
//         this.textBox = inputContainer.createEl("textarea", {
//             cls: "full_width_text_container",
//         });
//         this.textBox.placeholder = "Type something...";

//         // Create the submit button within the input container
//         const button = inputContainer.createEl("button");
//         button.textContent = "Submit";
//         button.addEventListener("click", () => {
//             this.submitMessage(this.textBox.value);
//             this.textBox.value = ""; // Clear the text box after sending
//         });
//     }

//     addMessage(text: string, sender: "user" | "system") {
//         const messageDiv = this.messagesContainer.createEl("div", {
//             cls: `message ${sender}`,
//         });
//         messageDiv.textContent = text;
//     }

//     submitMessage(userMessage: string) {
//         let current_page_content = "";
//         if (userMessage.includes("@current")) {
//             // Find the first MarkdownView that is open in the workspace
//             const markdownView = this.app.workspace
//                 .getLeavesOfType("markdown")
//                 // @ts-ignore
//                 .find((leaf) => leaf.view instanceof MarkdownView && leaf.width > 0)?.view as MarkdownView;
//             if (markdownView && markdownView.editor) {
//                 current_page_content = markdownView.editor.getValue();
//             }
//         }
//         this.addMessage(userMessage, "user"); // Display the user message immediately

//         const current_page_message = `
// 		${userMessage}

// 		------ Note for Model ---
// 		When I am referring to @current, I meant the following:

// 		${current_page_content}
// 		`;

//         let final_message = userMessage;
//         if (current_page_content.length > 0) {
//             final_message = current_page_message;
//         }

//         const data = { message: final_message };
//         fetch("http://localhost:8000/conversation", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify(data),
//         })
//             .then((response) => response.json())
//             .then((data) => {
//                 this.addMessage(data.response, "system"); // Display the response
//             })
//             .catch((error) => {
//                 console.error("Error:", error);
//             });
//     }

//     async onClose() {
//         // Cleanup logic if necessary
//     }
// }
views/workflowEditor.ts

import { Notice, ItemView, WorkspaceLeaf, TFile } from "obsidian";
import { WorkflowPrompt, CaretPluginSettings } from "../types";
import { DEFAULT_SETTINGS } from "../main";

export class LinearWorkflowEditor extends ItemView {
    plugin: any;
    file_path: string;
    prompts: WorkflowPrompt[];
    workflow_name: string;
    system_prompt: string;
    prompt_container: HTMLDivElement;
    stored_file_name: string;
    workflow_type: "linear" | "parallel";

    constructor(plugin: any, leaf: WorkspaceLeaf, file_path: string = "") {
        super(leaf);
        this.plugin = plugin;
        this.file_path = file_path;
        this.prompts = [];
        this.workflow_name = "";
        this.system_prompt = "";
    }

    getViewType() {
        return "workflow-editor";
    }

    getDisplayText() {
        return "Workflow editor";
    }

    async onOpen() {
        if (this.file_path) {
            const file = this.app.vault.getAbstractFileByPath(this.file_path);
            if (file) {
                const front_matter = await this.plugin.getFrontmatter(file);
                this.workflow_type = front_matter.caret_prompt;
                let file_content;
                if (file instanceof TFile) {
                    file_content = await this.app.vault.cachedRead(file);
                    this.workflow_name = file.name.replace(".md", "");
                    this.stored_file_name = file.name;
                } else {
                    throw new Error("The provided file is not a valid TFile.");
                }
                this.workflow_name = file.name.replace(".md", "");
                this.stored_file_name = file.name;
                const xml_content = file_content.match(/```xml([\s\S]*?)```/)?.[1]?.trim() ?? "";
                const xml = await this.plugin.parseXml(xml_content);
                const xml_prompts = xml?.root?.prompt ?? [];

                for (let i = 0; i < xml_prompts.length; i++) {
                    const prompt = xml_prompts[i]._.trim();
                    const delay = parseInt(xml_prompts[i].$.delay) || 0;
                    const model = xml_prompts[i].$.model || "default";
                    const provider = xml_prompts[i].$.provider || "default";
                    const temperature = parseFloat(xml_prompts[i].$.temperature) || this.plugin.settings.temperature;

                    if (prompt.trim().length > 0) {
                        this.prompts.push({
                            model,
                            provider,
                            delay: delay.toString(),
                            temperature: temperature.toString(),
                            prompt,
                        });
                    }
                }

                if (xml.root.system_prompt && xml.root.system_prompt.length > 0) {
                    if (xml.root.system_prompt && xml.root.system_prompt[0] && xml.root.system_prompt[0]._) {
                        this.system_prompt = xml.root.system_prompt[0]._.trim();
                    } else {
                        this.system_prompt = "";
                    }
                } else {
                    this.system_prompt = "";
                }
                // Process file content and initialize prompts if necessary
            }
        }

        const metacontainer = this.containerEl.children[1];
        metacontainer.empty();
        const container = metacontainer.createEl("div", {
            cls: "caret-workflow_container",
        });
        metacontainer.prepend(container);

        // Add description

        // Add workflow name input
        const title_container = container.createEl("div", { cls: "caret-flex-row" });
        title_container.createEl("h2", { text: `Workflow name:`, cls: "caret-w-8" });
        const workflow_name_input = title_container.createEl("input", {
            type: "text",
            cls: "caret-workflow-name-input caret-w-full",
            value: this.workflow_name,
        });
        container.createEl("p", { text: "Add prompts that will then be run in a linear fashion on any input." });
        workflow_name_input.addEventListener("input", () => {
            this.workflow_name = workflow_name_input.value;
        });

        this.prompt_container = container.createEl("div", { cls: "caret-w-full" });

        // Create the system message right away
        this.add_system_prompt();
        if (this.prompts.length > 0) {
            for (let i = 0; i < this.prompts.length; i++) {
                this.add_prompt(this.prompts[i], true, i);
            }
        } else {
            this.add_prompt();
        }

        // Create a button to add new prompts
        const buttonContainer = container.createEl("div", {
            cls: "caret-button-container caret-bottom-screen-padding",
        });

        const addPromptButton = buttonContainer.createEl("button", { text: "Add new prompt" });
        addPromptButton.addEventListener("click", () => {
            this.add_prompt();
        });

        // Create a save workflow button
        const save_button = buttonContainer.createEl("button", { text: "Save workflow" });
        save_button.addEventListener("click", () => {
            if (this.workflow_name.length === 0) {
                new Notice("Workflow must be named before saving");
                return;
            }

            for (let i = 0; i < this.prompts.length; i++) {
                const prompt = this.prompts[i];
                if (!prompt.model) {
                    new Notice(`Prompt ${i + 1}: Model must have a value`);
                    return;
                }
                if (!prompt.provider) {
                    new Notice(`Prompt ${i + 1}: Provider must have a value`);
                    return;
                }
                const delay = parseInt(prompt.delay, 10);
                if (isNaN(delay) || delay < 0 || delay > 60) {
                    new Notice(`Prompt ${i + 1}: Delay must be a number between 0 and 60`);
                    return;
                }
                const temperature = parseFloat(prompt.temperature);
                if (isNaN(temperature) || temperature < 0 || temperature > 2) {
                    new Notice(`Prompt ${i + 1}: Temperature must be a float between 0 and 2`);
                    return;
                }
                if (!prompt.prompt || prompt.prompt.length === 0) {
                    new Notice(`Prompt ${i + 1}: Prompt must not be empty`);
                    return;
                }
            }

            this.save_workflow();
        });
    }

    async save_workflow() {
        const chat_folder_path = "caret/workflows";
        const chat_folder = this.app.vault.getAbstractFileByPath(chat_folder_path);
        if (!chat_folder) {
            await this.app.vault.createFolder(chat_folder_path);
        }
        const system_prompt_string = `
<system_prompt tag="placeholder_do_not_delete">
${this.plugin.escapeXml(this.system_prompt)}
</system_prompt>
`;

        let prompts_string = ``;
        for (let i = 0; i < this.prompts.length; i++) {
            if (this.prompts[i].prompt.length === 0) {
                continue;
            }
            const escaped_content = this.plugin.escapeXml(this.prompts[i].prompt);
            prompts_string += `
<prompt model="${this.prompts[i].model || "default"}" provider="${this.prompts[i].provider || "default"}" delay="${
                this.prompts[i].delay || "default"
            }" temperature="${this.prompts[i].temperature || "default"}">
${escaped_content}
</prompt>`.trim();
        }

        let file_content = `
---
caret_prompt: ${this.workflow_type}
version: 1
---
\`\`\`xml
<root>
${system_prompt_string}
${prompts_string}
</root>
\`\`\`
        `.trim();

        let file_name = `${this.workflow_name}.md`;
        let file_path = `${chat_folder_path}/${file_name}`;
        let old_file_path = `${chat_folder_path}/${this.stored_file_name}`;
        let file = await this.app.vault.getFileByPath(old_file_path);

        try {
            if (file) {
                if (old_file_path !== file_path) {
                    await this.app.vault.rename(file, file_path);
                }
                await this.app.vault.modify(file, file_content);
                new Notice("Workflow updated!");
            } else {
                await this.app.vault.create(file_path, file_content);
                new Notice("Workflow created!");
            }
        } catch (error) {
            console.error("Failed to save chat:", error);
            if (error.message.includes("File already exists")) {
                new Notice("A workflow with that name already exists!");
            } else {
                console.error("Failed to save chat:", error);
            }
        }
    }

    add_system_prompt(system_prompt: string = "") {
        // Add a toggle switch for workflow type
        const dropdown_container = this.prompt_container.createEl("div", {
            cls: "caret-dropdown-container",
        });

        dropdown_container.createEl("label", { text: "Workflow type: ", cls: "caret-dropdown-label" });

        const workflow_type_select = dropdown_container.createEl("select", {
            cls: "caret-workflow-type-select",
        });

        const options = [
            { value: "linear", text: "Linear workflow" },
            { value: "parallel", text: "Parallel workflow" },
        ];

        options.forEach((option) => {
            const opt = workflow_type_select.createEl("option", {
                value: option.value,
                text: option.text,
            });
            if (this.workflow_type === option.value) {
                opt.selected = true;
            }
        });

        workflow_type_select.addEventListener("change", (event) => {
            this.workflow_type = (event.target as HTMLSelectElement).value as "linear" | "parallel";
            new Notice(`Workflow type set to ${this.workflow_type}`);
        });

        this.prompt_container.createEl("h3", { text: "System prompt" });
        const text_area = this.prompt_container.createEl("textarea", {
            cls: "caret-full_width_text_container",
            placeholder: "Add a system prompt",
        });
        text_area.value = this.system_prompt;

        text_area.addEventListener("input", () => {
            this.system_prompt = text_area.value;
        });
    }

    add_prompt(
        prompt: WorkflowPrompt = { model: "default", provider: "default", delay: "0", temperature: "1", prompt: "" },
        loading_prompt: boolean = false,
        index: number | null = null
    ) {
        let step_number = index !== null ? index + 1 : this.prompts.length + 1;
        let array_index = index !== null ? index : this.prompts.length;

        if (step_number === 1) {
            step_number = 1;
        }
        this.prompt_container.createEl("h3", { text: `Prompt ${step_number}` });

        const text_area = this.prompt_container.createEl("textarea", {
            cls: `caret-w-full caret-workflow_text_area text_area_id_${step_number}`,
            placeholder: "Add a step into your workflow",
        });
        text_area.value = prompt.prompt;
        text_area.id = `text_area_id_${step_number}`;
        // Create a container div with class flex-row
        const options_container = this.prompt_container.createEl("div", {
            cls: "caret-flex-row",
        });
        // Provider label and dropdown
        const provider_label = options_container.createEl("label", {
            text: "Provider",
            cls: "caret-row_items_spacing",
        });
        const provider_select = options_container.createEl("select", {
            cls: "caret-provider_select caret-row_items_spacing",
        });
        const settings: CaretPluginSettings = this.plugin.settings;
        const provider_entries = Object.entries(DEFAULT_SETTINGS.provider_dropdown_options);

        // Ensure the provider select has a default value set from the beginning
        if (provider_entries.length > 0) {
            provider_entries.forEach(([provider_key, provider_name]) => {
                const option = provider_select.createEl("option", { text: provider_name });
                option.value = provider_key;
            });
        }

        // Default to the first provider if prompt.provider is not set
        if (!prompt.provider && provider_entries.length > 0) {
            prompt.provider = provider_entries[0][0];
        }

        // Set the default value after options are added
        provider_select.value = prompt.provider || provider_entries[0][0];

        // Model label and dropdown
        const model_label = options_container.createEl("label", {
            text: "Model",
            cls: "caret-row_items_spacing",
        });
        const model_select = options_container.createEl("select", {
            cls: "caret-model_select caret-row_items_spacing",
        });

        // Function to update model options based on selected provider
        const update_model_options = (provider: string) => {
            if (!provider) {
                return;
            }
            while (model_select.firstChild) {
                model_select.removeChild(model_select.firstChild);
            }
            const models = settings.llm_provider_options[provider];
            Object.entries(models).forEach(([model_key, model_details]) => {
                const option = model_select.createEl("option", { text: model_details.name });
                option.value = model_key;
            });
            // Set the default value after options are added
            model_select.value = prompt.model;
        };

        // Add event listener to provider select to update models dynamically
        provider_select.addEventListener("change", (event) => {
            const selected_provider = (event.target as HTMLSelectElement).value;
            update_model_options(selected_provider);
        });

        // Initialize model options based on the default or current provider
        update_model_options(provider_select.value);
        model_select.value = prompt.model;

        // Temperature label and input
        const temperature_label = options_container.createEl("label", {
            text: "Temperature",
            cls: "caret-row_items_spacing",
        });

        // Temperature input
        const temperature_input = options_container.createEl("input", {
            type: "number",
            cls: "caret-workflow-editor-temperature-input caret-temperature_input", // Apply the CSS class here
        }) as HTMLInputElement;

        // Set the attributes separately to avoid TypeScript errors
        temperature_input.min = "0";
        temperature_input.max = "2";
        temperature_input.step = "0.1";
        temperature_input.value = prompt.temperature;

        // Delay label and input
        const delay_label = options_container.createEl("label", {
            text: "Delay",
            cls: "caret-row_items_spacing",
        });
        const delay_input = options_container.createEl("input", {
            type: "number",
            cls: "caret-delay_input caret-row_items_spacing",
            // @ts-ignore
            min: "0",
            max: "60",
            step: "1",
            value: prompt.delay,
        });

        if (!loading_prompt) {
            this.prompts.push({
                model: provider_select.value,
                provider: provider_select.value,
                delay: delay_input.value,
                temperature: temperature_input.value,
                prompt: text_area.value,
            });
        }

        text_area.id = `text_area_id_${array_index}`;
        provider_select.id = `provider_select_id_${array_index}`;
        model_select.id = `model_select_id_${array_index}`;
        temperature_input.id = `temperature_input_id_${array_index}`;
        delay_input.id = `delay_input_id_${array_index}`;

        text_area.addEventListener("input", () => {
            const text_area_element = this.prompt_container.querySelector(`#text_area_id_${array_index}`);
            if (text_area_element) {
                this.prompts[array_index].prompt = (text_area_element as HTMLInputElement).value;
            }
        });

        provider_select.addEventListener("change", () => {
            const provider_select_element = this.prompt_container.querySelector(`#provider_select_id_${array_index}`);
            if (provider_select_element) {
                this.prompts[array_index].provider = provider_select.value;
                update_model_options(provider_select.value);
            }
        });

        model_select.addEventListener("change", () => {
            const model_select_element = this.prompt_container.querySelector(`#model_select_id_${array_index}`);
            if (model_select_element) {
                this.prompts[array_index].model = model_select.value;
            }
        });

        temperature_input.addEventListener("input", () => {
            const temperature_input_element = this.prompt_container.querySelector(
                `#temperature_input_id_${array_index}`
            );
            if (temperature_input_element) {
                this.prompts[array_index].temperature = temperature_input.value;
            }
        });

        delay_input.addEventListener("input", () => {
            const delay_input_element = this.prompt_container.querySelector(`#delay_input_id_${array_index}`);
            if (delay_input_element) {
                this.prompts[array_index].delay = delay_input.value;
            }
        });
    }
}
views/chat.ts

import { streamText, StreamTextResult, CoreTool, generateText, generateObject } from "ai";
import { ai_sdk_streaming, isEligibleProvider, sdk_provider, get_provider, ai_sdk_completion } from "../llm_calls";
import React from "react";
import { createRoot } from "react-dom/client";
import { ConvertTextToNoteModal } from "../modals/convertTextToNoteModal";
import { InsertNoteModal } from "../modals/insertNoteModal";
import ChatComponent from "../components/chat";
import { Message } from "../types";
import { Notice, ItemView, WorkspaceLeaf } from "obsidian";
import CaretPlugin from "../main";
export const VIEW_CHAT = "main-caret";
export class FullPageChat extends ItemView {
    chat_id: string;
    plugin: CaretPlugin;
    conversation_title: string;
    textBox: HTMLTextAreaElement;
    messagesContainer: HTMLElement; // Container for messages
    conversation: Message[]; // List to store conversation messages
    is_generating: boolean;
    chatComponentRef: any;
    file_name: string;

    constructor(
        plugin: any,
        leaf: WorkspaceLeaf,
        chat_id?: string,
        conversation: Message[] = [],
        file_name: string = ""
    ) {
        super(leaf);
        this.plugin = plugin;
        this.chat_id = chat_id || this.generateRandomID(5);
        this.conversation = conversation; // Initialize conversation list with default or passed value
        this.file_name = file_name;
    }

    getViewType() {
        return VIEW_CHAT;
    }

    getDisplayText() {
        if (this.file_name.length > 1) {
            return `Chat: ${this.file_name}`;
        }
        return `Chat: ${this.chat_id}`;
    }

    async onOpen() {
        const metacontainer = this.containerEl.children[1];
        metacontainer.empty();
        const container = metacontainer.createEl("div", {
            cls: "caret-container",
        });
        metacontainer.prepend(container);

        // Create a container for messages
        this.messagesContainer = container.createEl("div", {
            cls: "caret-messages-container",
        });

        // Render the React component using createRoot
        // Render the React component using createRoot
        const root = createRoot(this.messagesContainer);
        const chatComponent = React.createElement(ChatComponent, {
            plugin: this.plugin,
            chat_id: this.chat_id,
            initialConversation: this.conversation,
            onSubmitMessage: this.submitMessage.bind(this),
            onSave: this.handleSave.bind(this), // Add this line
            onBulkConvert: this.bulkConvert.bind(this),
            onNewChat: this.newChat.bind(this),
            onInsertNote: this.handleInsertNote.bind(this),
            ref: (ref) => {
                this.chatComponentRef = ref;
            }, // Set the ref here
        });
        root.render(chatComponent);
    }
    async submitMessage(userMessage: string) {
        if (this.chatComponentRef) {
            await this.chatComponentRef.submitMessage(userMessage);
        }
    }
    handleInsertNote(callback: (note: string) => void) {
        new InsertNoteModal(this.app, this.plugin, (note: string) => {
            callback(note); // Call the callback with the note value
        }).open();
    }
    bulkConvert(checkedContents: string[]) {
        if (checkedContents.length < 1) {
            new Notice("No selected messages to convert to note");
        }
        new ConvertTextToNoteModal(this.app, this.plugin, checkedContents).open();
    }
    handleSave() {
        // You can access the conversation state from the chatComponentRef if needed
        if (this.chatComponentRef) {
            const conversation = this.chatComponentRef.getConversation(); // Call the getConversation method
            // Save the conversation or perform any other actions
            this.conversation = conversation;
            this.saveChat();
        }
    }

    addMessage(text: string, sender: "user" | "assistant") {
        const newMessage = { content: text, role: sender };
        // Add message to the conversation array
        // this.conversation.push(newMessage);
        // Update the conversation in the React component
        if (this.chatComponentRef) {
            this.chatComponentRef.addMessage(newMessage);
        }
    }

    async streamMessage(stream_response: AsyncIterable<any>) {
        if (this.plugin.settings.llm_provider === "ollama") {
            for await (const part of stream_response) {
                this.conversation[this.conversation.length - 1].content += part.message.content;
                if (this.chatComponentRef) {
                    this.chatComponentRef.updateLastMessage(part.message.content);
                }
            }
        }
        if (this.plugin.settings.llm_provider === "openai" || "groq" || "custom") {
            for await (const part of stream_response) {
                const delta_content = part.choices[0]?.delta.content || "";
                this.conversation[this.conversation.length - 1].content += delta_content;
                if (this.chatComponentRef) {
                    this.chatComponentRef.updateLastMessage(delta_content);
                }
            }
        }
    }

    focusAndPositionCursorInTextBox() {
        this.textBox.focus();
    }

    insert_text_into_user_message(text: string) {
        this.textBox.value += text.trim() + " ";
    }

    escapeXml(unsafe: string): string {
        return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case "<":
                    return "&lt;";
                case ">":
                    return "&gt;";
                case "&":
                    return "&amp;";
                case "'":
                    return "&apos;";
                case '"':
                    return "&quot;";
                default:
                    return c;
            }
        });
    }
    async newChat() {
        const currentLeaf = this.app.workspace.activeLeaf;
        if (currentLeaf) {
            // This would detach it if we wanted to it. But it causes bugs below.
            // I actually like the UX this way.
            // currentLeaf?.detach();
        }

        const new_leaf = await this.app.workspace.getLeaf(true);
        new_leaf.setViewState({
            type: VIEW_CHAT,
            active: true,
        });
    }

    async saveChat() {
        // Prep the contents itself to be saved

        let file_content = `\`\`\`xml
        <root>
		<metadata>\n<id>${this.chat_id}</id>\n</metadata>
		`;

        let messages = ``;
        if (this.conversation.length === 0) {
            return;
        }
        for (let i = 0; i < this.conversation.length; i++) {
            const message = this.conversation[i];
            const escaped_content = this.escapeXml(message.content);
            const message_xml = `
                <message>
                    <role>${message.role}</role>
                    <content>${escaped_content}</content>
                </message>
            `.trim();
            messages += message_xml;
        }
        let conversation = `<conversation>\n${messages}</conversation></root>\`\`\``;
        file_content += conversation;

        // And then get the actual save file
        const chat_folder_path = this.plugin.settings.chat_logs_folder;

        const chat_folder = this.app.vault.getAbstractFileByPath(chat_folder_path);
        if (!chat_folder) {
            await this.app.vault.createFolder(chat_folder_path);
        }
        let file_to_save_to = await this.plugin.getChatLog(chat_folder_path, this.chat_id);

        let new_chat = true;
        if (file_to_save_to && file_to_save_to.path) {
            new_chat = false;
        }

        const date = new Date();
        const year = date.getFullYear();
        const month = ("0" + (date.getMonth() + 1)).slice(-2);
        const day = ("0" + date.getDate()).slice(-2);
        const date_path = `/${year}/${month}/${day}`;

        if (this.plugin.settings.chat_logs_date_format_bool) {
            const fullPath = chat_folder_path + date_path;
            const pathSegments = fullPath.split("/");
            let currentPath = "";
            for (const segment of pathSegments) {
                if (segment !== "") {
                    currentPath += segment;
                    const folderExists = this.app.vault.getAbstractFileByPath(currentPath);
                    if (!folderExists) {
                        await this.app.vault.createFolder(currentPath);
                    }
                    currentPath += "/";
                }
            }
        }

        if (new_chat) {
            const file_name = `${this.chat_id}.md`;
            let file_path = chat_folder_path + "/" + file_name;
            if (this.plugin.settings.chat_logs_date_format_bool) {
                file_path = chat_folder_path + date_path + "/" + file_name;
            }
            const new_file_created = await this.app.vault.create(file_path, file_content);
            if (this.plugin.settings.chat_logs_rename_bool) {
                await this.name_new_chat(new_file_created);
            }
        } else {
            if (!file_to_save_to?.path) {
                new Notice("Failed to find file to save to");
                return;
            }
            const file = await this.app.vault.getFileByPath(file_to_save_to.path);
            if (!file) {
                new Notice("Failed to save file");
                throw new Error("Failed to save file");
            }
            await this.app.vault.modify(file, file_content);
        }
    }
    async name_new_chat(new_file: any) {
        let new_message = `
Please create a title for this conversation. Keep it to 3-5 words at max. Be as descriptive with that as you can be.\n\n

Respond in plain text with no formatting.
`;
        for (let i = 0; i < this.conversation.length; i++) {
            const message = this.conversation[i];
            new_message += `${message.role}:\n${message.content}`;
        }
        const conversation = [{ role: "user", content: new_message }];

        const provider = this.plugin.settings.llm_provider;
        const model = this.plugin.settings.model;
        const temperature = this.plugin.settings.temperature;

        // await this.update_node_content_streaming(node_id, stream, this.settings.llm_provider);
        if (!isEligibleProvider(provider)) {
            throw new Error(`Invalid provider: ${provider}`);
        }

        let sdk_provider: sdk_provider = get_provider(this.plugin, provider);
        const content = await ai_sdk_completion(sdk_provider, model, conversation, temperature, provider);

        const path = new_file.path;
        const newPath = `${path.substring(0, path.lastIndexOf("/"))}/${content}.md`;
        await this.app.vault.rename(new_file, newPath);
    }

    generateRandomID(length: number) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    async onClose() {
        // Cleanup logic if necessary
    }
}
views.ts