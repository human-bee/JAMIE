Structured Outputs Samples OpenAIToken Usage:

GitHub Tokens: 41289
LLM Input Tokens: 0
LLM Output Tokens: 0
Total Tokens: 41289

FileTree:
conversational-assistant/.gitignore
conversational-assistant/app/api/tools/get_orders/route.ts
conversational-assistant/app/api/tools/get_product_details/route.ts
README.md
conversational-assistant/app/api/turn_response/route.ts
conversational-assistant/.eslintrc.json
conversational-assistant/README.md
conversational-assistant/app/page.tsx
conversational-assistant/app/globals.css
conversational-assistant/app/api/tools/get_products/route.ts
conversational-assistant/app/layout.tsx
conversational-assistant/components/chat.tsx
conversational-assistant/components/message.css
conversational-assistant/components/message.tsx
conversational-assistant/components/assistant.tsx
conversational-assistant/components/ui/chart.tsx
conversational-assistant/config/components-definition.ts
conversational-assistant/components/ui/button.tsx
conversational-assistant/components.json
conversational-assistant/config/data/demo-data.ts
conversational-assistant/config/constants.ts
conversational-assistant/config/tools-list.ts
conversational-assistant/config/functions.ts
conversational-assistant/components/tool-call.tsx
conversational-assistant/config/user-actions.ts
conversational-assistant/config/data/types.ts
conversational-assistant/components/ui/table.tsx
conversational-assistant/config/ui/tool-results.tsx
conversational-assistant/lib/assistant.ts
conversational-assistant/lib/tools/generate-ui-tool.ts
conversational-assistant/lib/tools/tools.ts
conversational-assistant/config/ui/components.tsx
conversational-assistant/lib/components-mapping.tsx
conversational-assistant/lib/utils.ts
conversational-assistant/package.json
conversational-assistant/lib/tools/tools-handling.ts
conversational-assistant/tailwind.config.ts
conversational-assistant/tsconfig.json
generative-ui/.gitignore
generative-ui/app/api/generate_ui/route.ts
generative-ui/.eslintrc.json
conversational-assistant/stores/useConversationStore.ts
generative-ui/README.md
generative-ui/components/ui-display.tsx
generative-ui/components/chat.tsx
generative-ui/components/ui/table.tsx
generative-ui/app/globals.css
generative-ui/lib/components-definition.ts
generative-ui/components.json
generative-ui/app/layout.tsx
generative-ui/app/page.tsx
generative-ui/components/ui/chart.tsx
generative-ui/lib/generate-ui-tool.ts
generative-ui/lib/components.tsx
generative-ui/lib/components-mapping.tsx
generative-ui/lib/constants.ts
generative-ui/lib/utils.ts
generative-ui/lib/handle-message.ts
generative-ui/package.json
generative-ui/tsconfig.json
resume-extraction/.gitignore
generative-ui/tailwind.config.ts
resume-extraction/.eslintrc.json
resume-extraction/app/globals.css
resume-extraction/app/layout.tsx
resume-extraction/app/api/extract_resume/route.ts
resume-extraction/components.json
resume-extraction/app/page.tsx
resume-extraction/README.md
resume-extraction/components/file-dropper.css
resume-extraction/lib/resume.ts
resume-extraction/lib/constants.ts
resume-extraction/package.json
resume-extraction/components/file-dropper.tsx
resume-extraction/components/extracted-values.tsx
resume-extraction/tailwind.config.ts
resume-extraction/tsconfig.json

Analysis:
conversational-assistant/.gitignore

# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
conversational-assistant/app/api/tools/get_orders/route.ts

import { orders } from '@/config/data/demo-data'

export async function GET() {
  try {
    return new Response(JSON.stringify({ orders }), {
      status: 200
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Failed to fetch orders' }), {
      status: 500
    })
  }
}
conversational-assistant/app/api/tools/get_product_details/route.ts

import { productDetails } from '@/config/data/demo-data'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const productId = url.searchParams.get('productId')

    const product = productDetails.find(product => product.id === productId)
    return new Response(JSON.stringify({ product }), {
      status: 200
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Failed to find product' }), {
      status: 500
    })
  }
}
README.md

Structured Outputs Sample Apps

Structured Outputs is an OpenAI API feature that ensures responses and tool calls adhere to a defined JSON schema.
This makes building with our models more reliable, bridging the gap between unpredictable model outputs and deterministic workflows.

This repository contains a collection of sample apps showcasing the use of Structured Outputs.

Each app demonstrates practical ways to leverage this feature to build applications with NextJS.

Table of Contents

How to Use
Sample Apps
Resources
Contributing
License
How to use

Set Up the OpenAI API:

If you're new to the OpenAI API, sign up for an account.
Follow the Quickstart to retrieve your API key.
Clone the Repository:

git clone https://github.com/openai/structured-outputs-samples.git
Try a sample App:

Navigate to the sample app you want to try (cd /<app_folder>)
Refer to the README of the app to run it locally.
Make it your own

Explore the code, update it, and use it in your own projects or as a starting point!

Sample Apps

There are three sample apps in this repository:

Resume Extraction

This app is a simple example of how to use Structured Outputs in model responses to display information in a structured format.

Generative UI

This app focuses on generating UI components on the fly with Structured Outputs.

Conversational Assistant

This app is a more complex example that combines multi-turn conversations, tool calling and generative UI.
You can use this as a starting point to build an assistant with reliable workflows.

Resources

To learn more about Structured Outputs, refer to the Structured Outputs documentation.

To learn about Function Calling, refer to the Function Calling documentation.

Try the Introduction to Structured Outputs cookbook to get hands-on and run code snippets in Python.

Contributing

You are welcome to open issues or submit PRs to improve this app, however, please note that we may not review all suggestions.

License

This project is licensed under the MIT License. See the LICENSE file for details.

conversational-assistant/app/api/turn_response/route.ts

import OpenAI from 'openai'
import { ChatCompletionTool } from 'openai/resources/chat/completions'
import { tools } from '@/lib/tools/tools'
import { MODEL } from '@/config/constants'
const openai = new OpenAI()

export async function POST(request: Request) {
  const { messages } = await request.json()

  console.log('Received messages:', messages)

  try {
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('Starting OpenAI stream', messages[messages.length - 1])
          const openaiStream = openai.beta.chat.completions.stream({
            model: MODEL,
            messages,
            temperature: 0,
            tools: tools as ChatCompletionTool[],
            parallel_tool_calls: false
          })

          let functionArguments = ''
          let callId = ''
          let functionName = ''
          let isCollectingFunctionArgs = false

          for await (const part of openaiStream) {
            const delta = part.choices[0].delta
            const finishReason = part.choices[0].finish_reason

            if (delta.content) {
              const data = JSON.stringify({
                event: 'assistant_delta',
                data: delta
              })
              controller.enqueue(`data: ${data}\n\n`)
            }

            if (delta.tool_calls) {
              isCollectingFunctionArgs = true
              if (delta.tool_calls[0].id) {
                callId = delta.tool_calls[0].id
              }
              if (delta.tool_calls[0].function?.name) {
                functionName = delta.tool_calls[0].function.name
                console.log('Function execution:', functionName)
              }
              functionArguments += delta.tool_calls[0].function?.arguments || ''

              const data = JSON.stringify({
                event: 'function_arguments_delta',
                data: {
                  callId: callId,
                  name: functionName,
                  arguments: delta.tool_calls[0].function?.arguments
                }
              })
              controller.enqueue(`data: ${data}\n\n`)
            }

            if (finishReason === 'tool_calls' && isCollectingFunctionArgs) {
              console.log(`tool call ${functionName} is complete`)
              const data = JSON.stringify({
                event: 'function_arguments_done',
                data: {
                  callId: callId,
                  name: functionName,
                  arguments: functionArguments
                }
              })
              controller.enqueue(`data: ${data}\n\n`)

              // Reset function arguments
              functionArguments = ''
              functionName = ''
              isCollectingFunctionArgs = false
            }
          }

          controller.close()
        } catch (error) {
          console.error('Error in stream start:', error)
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    })
  } catch (error: any) {
    console.error('Error in POST handler:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    })
  }
}
conversational-assistant/.eslintrc.json

{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "off"
  }
}
conversational-assistant/README.md

Conversational Assistant Demo with Structured Outputs

Overview

This repository contains a highly customizable demo app for a Structured Outputs assistant.

The assistant uses Structured Outputs with tools, making reliable workflows possible, including when there are multiple steps.

It also showcases how to do generative UI, using Structured Outputs to reliably generate components that will be rendered recursively.

Features

Multi-turn conversation handling
Automatic tool execution
Streaming responses and function calls
Streaming generative UI
How to run

Clone the repository:

git clone https://github.com/openai/structured-outputs-samples.git
cd conversational-assistant
Install dependencies:

npm i
Set up your environment:

export OPENAI_API_KEY=your-api-key
Or create a .env file in the conversational-assistant folder containing:

OPENAI_API_KEY=<your-api-key>
Run the demo

npm run dev
The app will be available at http://localhost:3000.

Demo Flow

To try the demo, you can follow this flow.
/!\ Wait until the assistant is done replying before sending a new message.

Tell the assistant you would like to return an order (Ex: "Hi I'd like to return my order")
The assistant will call the get_orders tool to fetch the list of orders.

It will then display the list of orders in a carousel, and ask you which order you want to return.

Choose any order in the list by clicking on the "Select order" button
The assistant will then ask ask what the problem is to file a claim.

Tell the assistant that one of the order items is damaged (Ex: "The quantum processor is damaged")
At this point, the assistant will call the file_claim tool to file the claim and then create a return with the create_return tool before confirming the return has been created.

Ask the assistant which products are in store (Ex: "Which products do you have in store?")
The assistant will call the get_products tool to fetch the list of available products.

It will then display the list of products in a carousel, and ask you if you'd like more information.

Ask to see an overview of a numerical value (Ex: "Can you give me an overview of their weights?")
The assistant should display the answer in a bar chart.

Ask to compare other values (Ex: "Can you compare prices and dimensions?")
The assistant should display the answer in a table.

Ask for more details about a given product (Ex: "Can you tell me more about the CryoEngine cooling module?")
The assistant should display the answer in table.

Ask if you can add this item to your cart (Ex: "Can you add it to my cart?")
The assistant will call the add_to_cart tool to add the product to the cart and you will see a custom tool result component displayed.

Customization

This demo app can be easily customized by modifying the files located in the config directory, as well as the API routes (you shouldn't need to update the /turn_response route).

Here are the customization options:

Components

You can customize components and their parameters used by the generate_ui tool by updating the components-definition.ts file.

If you define new components, you should update ui/components.tsx to add React components that will be used to display generated components with the generate_ui tool.

If components allow for user interactions, you can add these actions to the conversation history by following the example in user-actions.ts.

Tools

You can define the tools the assistant has access to by updating tools-list.ts. Make sure the tools have a valid schema.

You should also update functions.ts with a function matching each tool, which will be called when the tool call is triggered.

If you want to customize how a tool result is displayed, you can update ui/tool-results.tsx.

Assistant

You can update the assistant's system prompt and the model used in constants.ts.

You can also customize in this file the initial message shown in the chat.

Data

This app uses demo data, defined in data/demo-data.ts. The corresponding data types are defined in data/types.ts.

Feel free to remove these files to fetch the data from your own source.

conversational-assistant/app/page.tsx

import Assistant from '@/components/assistant'

export default function Main() {
  return (
    <div className="flex justify-center h-screen">
      <div className="w-full pt-10 md:w-2/3">
        <Assistant />
      </div>
    </div>
  )
}
conversational-assistant/app/globals.css

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: var(--font-geist-sans);
}

.font-mono, pre, code {
  font-family: var(--font-geist-mono) !important;
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 20 14.3% 4.1%;
    --card: 0 0% 100%;
    --card-foreground: 20 14.3% 4.1%;
    --popover: 0 0% 100%;
    --popover-foreground: 20 14.3% 4.1%;
    --primary: 24 9.8% 10%;
    --primary-foreground: 60 9.1% 97.8%;
    --secondary: 60 4.8% 95.9%;
    --secondary-foreground: 24 9.8% 10%;
    --muted: 60 4.8% 95.9%;
    --muted-foreground: 25 5.3% 44.7%;
    --accent: 60 4.8% 95.9%;
    --accent-foreground: 24 9.8% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 60 9.1% 97.8%;
    --border: 20 5.9% 90%;
    --input: 20 5.9% 90%;
    --ring: 20 14.3% 4.1%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 20 14.3% 4.1%;
    --foreground: 60 9.1% 97.8%;
    --card: 20 14.3% 4.1%;
    --card-foreground: 60 9.1% 97.8%;
    --popover: 20 14.3% 4.1%;
    --popover-foreground: 60 9.1% 97.8%;
    --primary: 60 9.1% 97.8%;
    --primary-foreground: 24 9.8% 10%;
    --secondary: 12 6.5% 15.1%;
    --secondary-foreground: 60 9.1% 97.8%;
    --muted: 12 6.5% 15.1%;
    --muted-foreground: 24 5.4% 63.9%;
    --accent: 12 6.5% 15.1%;
    --accent-foreground: 60 9.1% 97.8%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 60 9.1% 97.8%;
    --border: 12 6.5% 15.1%;
    --input: 12 6.5% 15.1%;
    --ring: 24 5.7% 82.9%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
conversational-assistant/app/api/tools/get_products/route.ts

import { products } from '@/config/data/demo-data'

export async function GET() {
  try {
    return new Response(JSON.stringify({ products }), {
      status: 200
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Failed to fetch products' }), {
      status: 500
    })
  }
}
conversational-assistant/app/layout.tsx

import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900'
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900'
})

export const metadata: Metadata = {
  title: 'Conversational Assistant',
  description: 'Structured Outputs demo',
  icons: {
    icon: '/imgs/convex_icon.svg'
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} `}>
        <div className="flex h-screen bg-gray-200 w-full flex-col  text-stone-900">
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
conversational-assistant/components/chat.tsx

'use client'

import { Item } from '@/lib/assistant'
import React, { useEffect, useRef, useState } from 'react'
import ToolCall from './tool-call'
import Message from './message'

interface ChatProps {
  items: Item[]
  onSendMessage: (message: string) => void
}

const Chat: React.FC<ChatProps> = ({ items, onSendMessage }) => {
  const itemsEndRef = useRef<HTMLDivElement>(null)
  const [inputMessageText, setinputMessageText] = useState<string>('')

  const scrollToBottom = () => {
    itemsEndRef.current?.scrollIntoView({ behavior: 'instant' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [items])

  return (
    <div className="flex justify-center items-center size-full">
      <div className="flex grow flex-col h-full max-w-[750px] gap-2">
        <div className="h-[90vh] overflow-y-scroll px-10">
          <div className="space-y-1 pt-4 ">
            {items.map((item, index) => (
              <React.Fragment key={index}>
                {item.type === 'function_call' ? (
                  <ToolCall
                    functionCall={item}
                    previousItem={items[index - 1]}
                  />
                ) : (
                  <Message message={item} />
                )}
              </React.Fragment>
            ))}
            <div ref={itemsEndRef} />
          </div>
        </div>
        <div className="flex-1 p-4 px-10">
          <div className="flex items-center">
            <div className="flex w-full items-center">
              <div className="flex w-full flex-col gap-1.5 rounded-[26px] p-1.5 transition-colors bg-white">
                <div className="flex items-center gap-1.5 md:gap-2 pl-4">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <textarea
                      id="prompt-textarea"
                      tabIndex={0}
                      dir="auto"
                      rows={1}
                      placeholder="Send message"
                      className="m-0 resize-none border-0 focus:outline-none text-sm bg-transparent px-0 py-2 max-h-[20dvh]"
                      value={inputMessageText}
                      onChange={e => setinputMessageText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          onSendMessage(inputMessageText)
                          setinputMessageText('')
                        }
                      }}
                    />
                  </div>
                  <button
                    disabled={!inputMessageText}
                    data-testid="send-button"
                    className="flex size-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:outline-black disabled:bg-[#D7D7D7] disabled:text-[#f4f4f4] disabled:hover:opacity-100"
                    onClick={() => {
                      onSendMessage(inputMessageText)
                      setinputMessageText('')
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      fill="none"
                      viewBox="0 0 32 32"
                      className="icon-2xl"
                    >
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        d="M15.192 8.906a1.143 1.143 0 0 1 1.616 0l5.143 5.143a1.143 1.143 0 0 1-1.616 1.616l-3.192-3.192v9.813a1.143 1.143 0 0 1-2.286 0v-9.813l-3.192 3.192a1.143 1.143 0 1 1-1.616-1.616z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat
conversational-assistant/components/message.css

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.dot {
  width: 5px;
  height: 5px;
  margin: 0 5px;
  border-radius: 50%;
  display: inline-block;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}
conversational-assistant/components/message.tsx

import { MessageItem } from '@/lib/assistant'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import './message.css'

interface MessageProps {
  message: MessageItem
}

const Message: React.FC<MessageProps> = ({ message }) => {
  return (
    <div className="text-sm">
      {message.role === 'user' ? (
        <div className="flex justify-end">
          <div>
            <div className="my-2 flex justify-end text-xs text-zinc-600 font-medium">
              Me
            </div>
            <div className="ml-4 rounded-[18px] px-4 py-2 md:ml-24 bg-white text-zinc-900  font-light">
              <div>
                <div>
                  <ReactMarkdown>{message.content as string}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="my-2 text-xs text-zinc-600 font-medium">
            Assistant
          </div>
          <div className="flex">
            <div className="mr-4 rounded-[18px] px-4 py-2 md:mr-24 text-white bg-black font-light">
              <div>
                <ReactMarkdown>{message.content as string}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Message
conversational-assistant/components/assistant.tsx

'use client'
import React from 'react'
import Chat from './chat'
import useConversationStore from '@/stores/useConversationStore'
import { Item, processMessages } from '@/lib/assistant'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

const Assistant: React.FC = () => {
  const { chatMessages, addConversationItem, addChatMessage } =
    useConversationStore()

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return

    const userItem: Item = {
      type: 'message',
      role: 'user',
      content: message.trim()
    }
    const userMessage: ChatCompletionMessageParam = {
      role: 'user',
      content: message.trim()
    }

    try {
      addConversationItem(userMessage)
      addChatMessage(userItem)

      await processMessages()
    } catch (error) {
      console.error('Error processing message:', error)
    }
  }

  return (
    <div className="h-full p-4 w-full rounded-t-2xl shadow-lg bg-gray-100">
      <Chat items={chatMessages} onSendMessage={handleSendMessage} />
    </div>
  )
}

export default Assistant
conversational-assistant/components/ui/chart.tsx

'use client'

import * as React from 'react'
import * as RechartsPrimitive from 'recharts'

import { cn } from '@/lib/utils'

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: '', dark: '.dark' } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >['children']
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = 'Chart'

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join('\n')}
}
`
          )
          .join('\n')
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<'div'> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: 'line' | 'dot' | 'dashed'
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = 'dot',
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || 'value'}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === 'string'
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn('font-medium', labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn('font-medium', labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== 'dot'

    return (
      <div
        ref={ref}
        className={cn(
          'grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl',
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || 'value'}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
                  indicator === 'dot' && 'items-center'
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            'shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]',
                            {
                              'h-2.5 w-2.5': indicator === 'dot',
                              'w-1': indicator === 'line',
                              'w-0 border-[1.5px] border-dashed bg-transparent':
                                indicator === 'dashed',
                              'my-0.5': nestLabel && indicator === 'dashed'
                            }
                          )}
                          style={
                            {
                              '--color-bg': indicatorColor,
                              '--color-border': indicatorColor
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        'flex flex-1 justify-between leading-none',
                        nestLabel ? 'items-end' : 'items-center'
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = 'ChartTooltip'

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> &
    Pick<RechartsPrimitive.LegendProps, 'payload' | 'verticalAlign'> & {
      hideIcon?: boolean
      nameKey?: string
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = 'bottom', nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center gap-4',
          verticalAlign === 'top' ? 'pb-3' : 'pt-3',
          className
        )}
      >
        {payload.map(item => {
          const key = `${nameKey || item.dataKey || 'value'}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                'flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground'
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = 'ChartLegend'

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== 'object' || payload === null) {
    return undefined
  }

  const payloadPayload =
    'payload' in payload &&
    typeof payload.payload === 'object' &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === 'string'
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === 'string'
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent
}
conversational-assistant/config/components-definition.ts

// List of components that will be used by the generate_ui tool
// Define recursive components using the $ref property
// More information on supported schemas: https://platform.openai.com/docs/guides/structured-outputs#supported-schemas

export const components = [
  {
    name: 'card',
    parameters: {
      children: {
        type: 'array',
        items: { $ref: '#/$defs/component' }
      }
    }
  },
  {
    name: 'header',
    parameters: {
      content: {
        type: 'string',
        description: 'The text content.'
      }
    }
  },
  {
    name: 'carousel',
    parameters: {
      children: {
        type: 'array',
        items: {
          anyOf: [{ $ref: '#/$defs/item' }, { $ref: '#/$defs/order' }]
        }
      }
    }
  },
  {
    name: 'item',
    parameters: {
      id: {
        type: 'string'
      },
      item_name: {
        type: 'string'
      },
      primary_image: {
        type: 'string'
      },
      description: {
        type: 'string'
      },
      price: {
        type: 'number'
      }
    }
  },
  {
    name: 'order',
    parameters: {
      id: {
        type: 'string',
        description: 'ID of the order.'
      },
      total: {
        type: 'number',
        description: 'Total price of the order.'
      },
      status: {
        type: 'string',
        description: 'Status of the order.'
      },
      date: {
        type: 'string',
        description: 'Date of the order in format YYYY-MM-DD.'
      },
      products: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            item: {
              $ref: '#/$defs/item'
            },
            quantity: {
              type: 'integer',
              description: 'Quantity of the product.'
            }
          },
          required: ['item', 'quantity'],
          additionalProperties: false
        }
      }
    }
  },
  {
    name: 'bar_chart',
    parameters: {
      columns: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: {
              type: 'string',
              description: 'Label for the column.'
            },
            value: {
              type: 'string',
              description: 'Value for the column.'
            }
          },
          required: ['label', 'value'],
          additionalProperties: false
        }
      }
    }
  },
  {
    name: 'table',
    parameters: {
      columns: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: 'Key for the column.'
            },
            title: {
              type: 'string',
              description: 'Title for the column.'
            }
          },
          required: ['key', 'title'],
          additionalProperties: false
        }
      },
      rows: {
        type: 'array',
        items: {
          $ref: '#/$defs/row'
        }
      }
    }
  },
  {
    name: 'row',
    parameters: {
      values: {
        type: 'array',
        description:
          'An array of values for the row, either strings or integers.',
        items: {
          anyOf: [{ type: 'string' }, { type: 'integer' }]
        }
      }
    }
  }
]
conversational-assistant/components/ui/button.tsx

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
conversational-assistant/components.json

{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "stone",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
conversational-assistant/config/data/demo-data.ts

// Placeholder demo data - used in the API routes

import { Order, Product, ProductDetails } from './types'

export const products: Product[] = [
  {
    id: 'qt-24X553',
    name: 'AI-Titan Quantum Processor',
    price: 1590.0,
    description:
      "The AI-Titan Quantum Processor is engineered for next-generation artificial intelligence tasks. Featuring 256 quantum cores and neural acceleration, it's the ideal choice for cutting-edge AI models.",
    image: 'qt-24X553.webp',
    weight: 0.6,
    dimensions: '12cm x 10cm x 2cm'
  },
  {
    id: 'mb-NE9000',
    name: 'Neuronix-9000 AI Motherboard',
    price: 1199.99,
    description:
      'A state-of-the-art AI-focused motherboard featuring integrated neural networking, 12 PCIe 5.0 slots, and optimized heat dissipation for long training cycles.',
    image: 'mb-NE9000.webp',
    weight: 1.8,
    dimensions: '30cm x 25cm x 3cm'
  },
  {
    id: 'acc-MLC82',
    name: 'HyperSynapse ML Accelerator Chip',
    price: 799.99,
    description:
      'Boost your AI training speeds with the HyperSynapse ML Accelerator Chip. It offers lightning-fast matrix computations and supports multi-GPU integrations.',
    image: 'acc-MLC82.webp',
    weight: 0.2,
    dimensions: '5cm x 5cm x 1cm'
  },
  {
    id: 'cl-CE7902',
    name: 'CryoEngine Cooling Module',
    price: 499.99,
    description:
      'A state-of-the-art liquid-cooling system designed specifically for AI hardware. Keep your CPUs, GPUs, and motherboards running at peak efficiency during extended training sessions.',
    image: 'cl-CE7902.webp',
    weight: 2.0,
    dimensions: '25cm x 20cm x 10cm'
  }
]

export const productDetails: ProductDetails[] = [
  {
    id: 'qt-24X553',
    features: [
      '256 Quantum Cores',
      'Neural Acceleration Technology',
      'Energy Efficient Design',
      'Optimized for AI Workloads'
    ],
    warranty: '3 years limited warranty',
    ratings: 4.8,
    release_date: '2024-01-15'
  },
  {
    id: 'mb-NE9000',
    features: [
      'Integrated Neural Networking',
      '12 PCIe 5.0 Slots',
      'Optimized Heat Dissipation',
      'Supports AI Training Hardware'
    ],
    warranty: '3 years limited warranty',
    ratings: 4.7,
    release_date: '2024-08-02'
  },
  {
    id: 'acc-MLC82',
    features: [
      'Lightning-Fast Matrix Computations',
      'Multi-GPU Integration Support',
      'Compact and Efficient Design',
      'Optimized for Machine Learning'
    ],
    warranty: '2 years limited warranty',
    ratings: 4.6,
    release_date: '2024-03-05'
  },
  {
    id: 'cl-CE7902',
    features: [
      'Advanced Liquid Cooling System',
      'High Efficiency Thermal Management',
      'Supports CPUs and GPUs',
      'Quiet and Durable Operation'
    ],
    warranty: '3 years limited warranty',
    ratings: 4.5,
    release_date: '2024-04-04'
  }
]

const daysAgo = (days: number) => {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return date.toLocaleDateString()
}

export const orders: Order[] = [
  {
    id: 'CX2312',
    items: [
      {
        product: products[0],
        quantity: 1
      },
      {
        product: products[2],
        quantity: 1
      }
    ],
    status: 'delivered',
    created_at: daysAgo(4),
    total: 2389.99
  },
  {
    id: 'CYE223',
    items: [
      {
        product: products[1],
        quantity: 1
      }
    ],
    status: 'cancelled',
    created_at: daysAgo(18),
    total: 1199.99
  },
  {
    id: 'EB2134',
    items: [
      {
        product: products[3],
        quantity: 2
      }
    ],
    status: 'delivered',
    created_at: daysAgo(42),
    total: 999.98
  }
]
conversational-assistant/config/constants.ts

export const MODEL = 'gpt-4o'

// System prompt for the assistant
export const SYSTEM_PROMPT = `
You are a customer service assistant for a store selling computer components.

You can help customers with their orders, returns, and other questions.

If a customer wants to return a product, you can:
- Find the corresponding order by using the get_orders tool and waiting for the user to confirm which order they want to return
- Ask what the problem is to file a claim
- File a claim with the file_claim tool
- Create a return
- Tell the user they will receive details for the return via email

You can also help customers buy new products, by fetching a list of products.
You can compare these products with the details you know about them, but if the user wants to know more about a specific product, you can use the get_product_details tool to fetch more details about it.

At any point once you have data to display, use the generate_ui tool to display it.
The user will see it so no need to repeat it afterwards in a message.

For example, if you have a list of items or orders, you can use the generate_ui tool with the carousel component and the orders or items as children to display them.

If the user asks to compare data, you can again use the generate_ui tool to display the comparison visually.
If asked to compare or give an overview of numeric values, use the bar_chart component.
If asked to compare something that cannot be represented with a bar chart or multiple things, use the table component.
Wrap these tables or bar charts components in a card component with a header to add a title describing what you are showing.

After you've displayed something, don't repeat what you displayed, just ask the user if they need anything else.
`
// Initial message that will be displayed in the chat
export const INITIAL_MESSAGE = `
Hi, how can I assist you today? I can help you with anything related to your orders, or I can give you recommendations. Just tell me what you need!
`
conversational-assistant/config/tools-list.ts

// List of tools available to the assistant
// No need to include the top-level wrapper object as it is added in lib/tools/tools.ts
// More information on function calling: https://platform.openai.com/docs/guides/function-calling

export const toolsList = [
  {
    name: 'get_products',
    description: 'Fetch the list of available products',
    parameters: {}
  },
  {
    name: 'get_product_details',
    description: 'Fetch the details of a product',
    parameters: {
      productId: {
        type: 'string',
        description: 'ID of the product to fetch details for'
      }
    }
  },
  {
    name: 'get_orders',
    description: 'Fetch the list of orders',
    parameters: {}
  },
  {
    name: 'file_claim',
    description: 'File a claim on behalf of a customer',
    parameters: {
      orderId: {
        type: 'string',
        description: 'ID of the order to file a claim for'
      },
      reason: {
        type: 'string',
        description: 'Reason for the claim'
      },
      description: {
        type: 'string',
        description: 'Description of the claim'
      }
    }
  },
  {
    name: 'create_return',
    description: 'Create a return for a specific order.',
    parameters: {
      orderId: {
        type: 'string',
        description: 'ID of the order to return'
      },
      return_items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            productId: {
              type: 'string',
              description: 'ID of the product to return'
            },
            quantity: {
              type: 'integer',
              description: 'Quantity of the product to return'
            }
          },
          required: ['productId', 'quantity'],
          additionalProperties: false
        }
      }
    }
  },
  {
    name: 'add_to_cart',
    description:
      'Add items to cart when the user has confirmed their interest.',
    parameters: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            productId: {
              type: 'string',
              description: 'ID of the product to add to the cart'
            },
            quantity: {
              type: 'integer',
              description: 'Quantity of the product to add to the cart'
            }
          },
          required: ['productId', 'quantity'],
          additionalProperties: false
        }
      }
    }
  }
]
conversational-assistant/config/functions.ts

// Functions mapping to tool calls
// Define one function per tool call - each tool call should have a matching function
// Parameters for a tool call are passed as an object to the corresponding function

export const get_products = async () => {
  const response = await fetch('/api/tools/get_products', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  const result = await response.json()
  return result
}

export const get_product_details = async ({
  productId
}: {
  productId: string
}) => {
  const response = await fetch(
    `/api/tools/get_product_details?productId=${productId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
  const result = await response.json()
  return result
}

export const get_orders = async () => {
  const response = await fetch('/api/tools/get_orders', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  const result = await response.json()
  return result
}

export const create_return = ({
  orderId,
  items
}: {
  orderId: string
  items: any
}) => {
  return {
    message: `Successfully created return for order ${orderId} with items: ${JSON.stringify(
      items
    )}`
  }
}

export const file_claim = ({
  orderId,
  reason,
  description
}: {
  orderId: string
  reason: string
  description: string
}) => {
  return {
    message: `Successfully filed claim for order ${orderId} (reason: ${reason}, description: ${description})`
  }
}

export const add_to_cart = ({ items }: { items: any }) => {
  return {
    message: `Added these items to cart: ${JSON.stringify(items)}`
  }
}

export const functionsMap = {
  get_products,
  get_product_details,
  get_orders,
  file_claim,
  create_return,
  add_to_cart
  // Add more functions here as you define them
}
conversational-assistant/components/tool-call.tsx

import React from 'react'

import { FunctionCallItem, Item } from '@/lib/assistant'
import { getComponent } from '@/lib/components-mapping'
import { ChevronRight, Code, LoaderCircle, X, Zap } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { coy } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { toolDisplayMap } from '@/config/ui/tool-results'

interface FunctionCallProps {
  functionCall: FunctionCallItem
  previousItem: Item
}

const ApiCallCell: React.FC<FunctionCallProps> = ({
  functionCall,
  previousItem
}) => {
  const [showDetails, setShowDetails] = React.useState(false)
  const toggleShowDetails = () => {
    setShowDetails(!showDetails)
  }

  return (
    <div className="flex flex-col bg-white rounded-[16px] w-[70%] relative my-3">
      <div>
        {previousItem.type === 'function_call' ? (
          <div className="absolute -top-16 pt-1.5 z-0 left-5">
            <div className="w-1 h-14 bg-gray-500 bg-opacity-50"></div>
          </div>
        ) : null}

        <div className="flex flex-col text-sm overflow-x-hidden rounded-[16px]  z-10">
          <div className="font-semibold p-3 pl-4 text-gray-700 rounded-b-none flex justify-between">
            <div className="flex items-center">
              <Zap size={16} />
              <span className="ml-2">
                {functionCall.name
                  .split('_')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')}
              </span>
            </div>
            <span
              className={`mt-0.5 transform text-gray-500 cursor-pointer transition-transform duration-300 ${
                showDetails ? 'rotate-90' : 'rotate-0'
              }`}
              onClick={toggleShowDetails}
            >
              <ChevronRight size={16} />
            </span>
          </div>
          {showDetails && (
            <div>
              <div className="max-h-72 overflow-y-scroll text-xs border-b-[1.5px]">
                <SyntaxHighlighter
                  customStyle={{
                    backgroundColor: '#fff',
                    padding: '8px',
                    paddingLeft: '4px',
                    borderRadius: '0.5rem',
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    marginTop: 0,
                    marginBottom: 0
                  }}
                  language="json"
                  style={coy}
                >
                  {JSON.stringify(functionCall.parsedArguments, null, 2)}
                </SyntaxHighlighter>
              </div>
              <div className="max-h-96 overflow-y-scroll min-h-20 rounded-lg rounded-t-none">
                {functionCall.output ? (
                  <SyntaxHighlighter
                    customStyle={{
                      backgroundColor: '#fff',
                      padding: '8px',
                      paddingLeft: '4px',
                      borderRadius: '0.5rem',
                      marginTop: 0,
                      borderTopLeftRadius: 0,
                      borderTopRightRadius: 0
                    }}
                    language="json"
                    style={coy}
                  >
                    {JSON.stringify(JSON.parse(functionCall.output), null, 2)}
                  </SyntaxHighlighter>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ToolCall: React.FC<FunctionCallProps> = ({
  functionCall,
  previousItem
}: FunctionCallProps) => {
  const [showJSON, setShowJSON] = React.useState(false)
  const toggleShowJSON = () => {
    setShowJSON(!showJSON)
  }

  return (
    <div className="flex justify-start pt-8">
      {(() => {
        if (functionCall.name === 'generate_ui') {
          return (
            <div className="w-full relative my-2">
              <div
                className="absolute right-2 -top-6 z-10"
                onClick={toggleShowJSON}
              >
                {showJSON ? (
                  <X
                    size={20}
                    className="cursor-pointer text-neutral-900 hover:text-neutral-700"
                  />
                ) : (
                  <Code
                    size={20}
                    className="cursor-pointer text-neutral-900 hover:text-neutral-700"
                  />
                )}
              </div>
              <div
                className={`text-xs max-h-[500px] font-mono overflow-x-scroll h-full overflow-y-scroll rounded-xl ${
                  showJSON ? '' : 'hidden'
                }`}
              >
                <SyntaxHighlighter
                  language="json"
                  style={coy}
                  customStyle={{
                    borderRadius: '0.75rem',
                    paddingTop: '16px',
                    paddingBottom: '16px',
                    marginTop: 0
                  }}
                >
                  {JSON.stringify(functionCall.parsedArguments, null, 2)}
                </SyntaxHighlighter>
              </div>
              <div className={`${showJSON ? 'hidden' : ''}`}>
                {getComponent(functionCall.parsedArguments.component) ?? null}
              </div>
            </div>
          )
        } else if (functionCall.name in toolDisplayMap) {
          const ToolComponent =
            toolDisplayMap[functionCall.name as keyof typeof toolDisplayMap]
          return <ToolComponent />
        } else {
          return (
            <ApiCallCell
              functionCall={functionCall}
              previousItem={previousItem}
            />
          )
        }
      })()}
    </div>
  )
}

export default ToolCall
conversational-assistant/config/user-actions.ts

// User actions that are used in custom components defined in the config/ui/components.tsx
// Use this to define user-triggered actions that impact the conversation history

import { processMessages } from '@/lib/assistant'
import useConversationStore from '@/stores/useConversationStore'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

// Adds the user action as context to the conversation history and calls processMessages to get a response from the assistant
const addUserActionToContext = async (message: string) => {
  const { addConversationItem } = useConversationStore.getState()

  const conversationItem: ChatCompletionMessageParam = {
    role: 'user',
    content: `[APP CONTEXT] ${message}`
  }

  addConversationItem(conversationItem)
  await processMessages()
}

export const selectOrder = async (orderId: string) => {
  const userMessage = `User selected order ${orderId}.`
  await addUserActionToContext(userMessage)
}

export const addToCart = async (productId: string) => {
  const userMessage = `User added product ${productId} to cart.`
  await addUserActionToContext(userMessage)
}
conversational-assistant/config/data/types.ts

export interface Product {
  id: string
  name: string
  price: number
  description: string
  image: string
  weight: number
  dimensions: string
}

export interface ProductDetails {
  id: string
  features: string[]
  warranty: string
  ratings: number
  release_date: string
}

export interface OrderItem {
  product: Product
  quantity: number
}

export interface Order {
  id: string
  items: OrderItem[]
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
  created_at: string
  total: number
}
conversational-assistant/components/ui/table.tsx

import * as React from 'react'

import { cn } from '@/lib/utils'

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn('w-full caption-bottom text-xs', className)}
      {...props}
    />
  </div>
))
Table.displayName = 'Table'

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
))
TableBody.displayName = 'TableBody'

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
      className
    )}
    {...props}
  />
))
TableFooter.displayName = 'TableFooter'

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
      className
    )}
    {...props}
  />
))
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      className
    )}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      className
    )}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground', className)}
    {...props}
  />
))
TableCaption.displayName = 'TableCaption'

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
}
conversational-assistant/config/ui/tool-results.tsx

// Define custom components to replace the default function call UI
// These will be displayed in the chat when a tool call is triggered

import React from 'react'
import { CheckCircle } from 'lucide-react'

const CartAdded: React.FC = () => {
  return (
    <div className="flex items-center rounded-md border border-black p-2.5">
      <CheckCircle className="mr-2" />
      <div>Added to cart</div>
    </div>
  )
}

export const toolDisplayMap = {
  add_to_cart: CartAdded
  // add more components as you define them
}
conversational-assistant/lib/assistant.ts

import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { SYSTEM_PROMPT } from '@/config/constants'
import { parse } from 'partial-json'
import { handleTool } from '@/lib/tools/tools-handling'
import useConversationStore from '@/stores/useConversationStore'

export interface MessageItem {
  type: 'message'
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface FunctionCallItem {
  type: 'function_call'
  status: 'in_progress' | 'completed' | 'failed'
  id: string
  name: string
  arguments: string
  parsedArguments: any
  output: string | null
}

export type Item = MessageItem | FunctionCallItem

export const handleTurn = async (
  messages: ChatCompletionMessageParam[],
  onMessage: (data: any) => void
) => {
  console.log('Handle turn', messages)
  try {
    const response = await fetch('/api/turn_response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages })
    })

    if (!response.ok) {
      console.error(`Error: ${response.statusText}`)
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let done = false
    let buffer = ''

    while (!done) {
      const { value, done: doneReading } = await reader.read()
      done = doneReading
      const chunkValue = decoder.decode(value)
      buffer += chunkValue

      const lines = buffer.split('\n\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6)
          if (dataStr === '[DONE]') {
            done = true
            break
          }
          const data = JSON.parse(dataStr)
          onMessage(data)
        }
      }
    }

    // Handle any remaining data in buffer
    if (buffer && buffer.startsWith('data: ')) {
      const dataStr = buffer.slice(6)
      if (dataStr !== '[DONE]') {
        const data = JSON.parse(dataStr)
        onMessage(data)
      }
    }
  } catch (error) {
    console.error('Error handling turn:', error)
  }
}

export const processMessages = async () => {
  const {
    chatMessages,
    conversationItems,
    setChatMessages,
    setConversationItems
  } = useConversationStore.getState()

  const allConversationItems: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: SYSTEM_PROMPT
    },
    ...conversationItems
  ]

  let assistantMessageContent = ''
  let functionArguments = ''

  await handleTurn(allConversationItems, async ({ event, data }) => {
    // Handle message from the assistant
    if (event === 'assistant_delta') {
      assistantMessageContent += data.content || ''

      // Update chat messages
      const lastItemIndex = chatMessages.length - 1
      if (
        chatMessages[lastItemIndex] &&
        chatMessages[lastItemIndex].type === 'message' &&
        chatMessages[lastItemIndex].role === 'assistant'
      ) {
        chatMessages[lastItemIndex].content = assistantMessageContent
      } else {
        chatMessages.push({
          type: 'message',
          role: 'assistant',
          content: assistantMessageContent
        })
      }
      setChatMessages([...chatMessages])

      // Update conversation items
      const lastMessageIndex = conversationItems.length - 1
      if (
        conversationItems[lastMessageIndex] &&
        conversationItems[lastMessageIndex].role === 'assistant'
      ) {
        conversationItems[lastMessageIndex].content = assistantMessageContent
      } else {
        conversationItems.push({
          role: 'assistant',
          content: assistantMessageContent
        })
      }
      setConversationItems([...conversationItems])
    }
    // Handle streaming tool call
    else if (event === 'function_arguments_delta') {
      functionArguments += data.arguments || ''
      let parsedFunctionArguments = {}
      if (functionArguments.length > 0) {
        parsedFunctionArguments = parse(functionArguments)
      }

      // Update chat messages
      const lastItemIndex = chatMessages.length - 1
      if (
        chatMessages[lastItemIndex] &&
        chatMessages[lastItemIndex].type === 'function_call' &&
        chatMessages[lastItemIndex].id === data.callId
      ) {
        chatMessages[lastItemIndex].arguments = functionArguments
        chatMessages[lastItemIndex].parsedArguments = parsedFunctionArguments
      } else {
        chatMessages.push({
          type: 'function_call',
          status: 'in_progress',
          id: data.callId,
          name: data.name,
          arguments: functionArguments,
          parsedArguments: parsedFunctionArguments,
          output: null
        })
      }
      setChatMessages([...chatMessages])

      // Update conversation items
      const lastMessageIndex = conversationItems.length - 1
      if (
        conversationItems[lastMessageIndex] &&
        conversationItems[lastMessageIndex].role === 'assistant'
      ) {
        if (conversationItems[lastMessageIndex].tool_calls) {
          conversationItems[lastMessageIndex].tool_calls[0].function.arguments =
            functionArguments
        } else {
          conversationItems[lastMessageIndex].tool_calls = [
            {
              id: data.callId,
              type: 'function',
              function: {
                arguments: functionArguments,
                name: data.name
              }
            }
          ]
        }
      } else {
        conversationItems.push({
          role: 'assistant',
          tool_calls: [
            {
              id: data.callId,
              type: 'function',
              function: {
                arguments: functionArguments,
                name: data.name
              }
            }
          ]
        })
      }
      setConversationItems([...conversationItems])
    }

    // Handle tool call execution
    else if (event === 'function_arguments_done') {
      // Get tool call result
      const toolCallResult = await handleTool(
        data.name,
        parse(functionArguments)
      )

      // Update chat messages
      const lastItemIndex = chatMessages.length - 1
      if (
        chatMessages[lastItemIndex] &&
        chatMessages[lastItemIndex].type === 'function_call'
      ) {
        chatMessages[lastItemIndex].status = 'completed'
        chatMessages[lastItemIndex].output = JSON.stringify(toolCallResult)
      }

      setChatMessages([...chatMessages])

      // Update conversation items
      conversationItems.push({
        role: 'tool',
        tool_call_id: data.callId,
        content: JSON.stringify(toolCallResult)
      })

      setConversationItems([...conversationItems])

      await processMessages()
    }
  })
}
conversational-assistant/lib/tools/generate-ui-tool.ts

import { components } from '@/config/components-definition'

const componentsList = components.map(component => {
  return { $ref: `#/$defs/${component.name}` }
})

const componentsDefinitions = components.reduce((acc, component) => {
  acc[component.name] = {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        enum: [component.name]
      },
      ...component.parameters
    },
    required: ['name', ...Object.keys(component.parameters)],
    additionalProperties: false
  }
  return acc
}, {} as { [key: string]: any })

export const generateUITool = {
  name: 'generate_ui',
  description:
    'Generate UI components dynamically to display relevant information.',
  parameters: {
    type: 'object',
    properties: {
      component: {
        anyOf: componentsList
      }
    },
    required: ['component'],
    additionalProperties: false,
    $defs: {
      component: {
        anyOf: componentsList
      },
      ...componentsDefinitions
    }
  },
  strict: true
}
conversational-assistant/lib/tools/tools.ts

import { JSONSchema } from 'openai/lib/jsonschema'
import { generateUITool } from './generate-ui-tool'
import { toolsList } from '../../config/tools-list'

const toolsDefinitions = [
  generateUITool,
  ...toolsList.map(tool => {
    return {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: { ...tool.parameters },
        required: Object.keys(tool.parameters),
        additionalProperties: false
      },
      strict: true
    }
  })
]

interface Parameter {
  type: 'object'
  properties: JSONSchema
  required: string[]
  additionalProperties?: boolean
}

interface Tool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters?: Parameter
    strict?: boolean
  }
}

export const tools: Tool[] = toolsDefinitions.map(tool => {
  return {
    type: 'function',
    function: {
      ...tool,
      parameters: tool.parameters as Parameter
    }
  }
})
conversational-assistant/config/ui/components.tsx

// Define components that will be used by the generate_ui tool
// Updates the componentsMap object to map React components to the components defined in config/components-definition.ts

import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartConfig, ChartContainer } from '@/components/ui/chart'
import { getComponent } from '@/lib/components-mapping'
import { addToCart, selectOrder } from '@/config/user-actions'
import { Button } from '@/components/ui/button'

const formatKey = (key: string) =>
  key.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')

const getChartConfig = (columns: { label: string; value: number }[]) => {
  const config: ChartConfig = {}

  columns.forEach((item: { label: string; value: number }) => {
    config[formatKey(item.label)] = {
      label: item.label,
      color: '#ffffff'
    }
  })

  return config
}

const getChartData = (columns: { label?: string; value?: string }[]) => {
  return columns
    .filter(item => !!item.label)
    .map((item: { label?: string; value?: string }, index: number) => {
      if (!item.label) {
        throw new Error('Label is required')
      }
      return {
        id: index,
        label: item.label,
        value: item.value !== undefined ? parseFloat(item.value) : 0,
        fill: '#000000'
      }
    })
}

export const HeaderComponent = ({ content }: { content?: string }) => {
  return (
    <div>
      <h1 className="text-sm text-stone-900 font-medium">{content}</h1>
    </div>
  )
}

export const BarChartComponent = ({
  columns
}: {
  columns?: { label?: string; value?: string }[]
}) => {
  if (!columns) return null
  const chartData = getChartData(columns)
  const chartConfig = getChartConfig(chartData)
  return (
    <ChartContainer config={chartConfig} className="">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          padding={{ left: 10, right: 10 }}
        />
        <YAxis orientation="left" width={24} />
        <Bar dataKey="value" fill="#1A535C" radius={6} barSize={30} />
      </BarChart>
    </ChartContainer>
  )
}

export const TableComponent = ({
  columns,
  rows
}: {
  columns?: { key?: string; title?: string }[]
  rows?: any[]
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        {columns?.map((column, index) => (
          <TableHead key={index}>{column.title}</TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows?.map((row, index) => (
        <TableRow key={index}>
          {row.values?.map((value: string, index: number) => (
            <TableCell key={index}>{value}</TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

export const ItemComponent = ({
  id,
  item_name,
  primary_image,
  description,
  price
}: any) => (
  <div className="flex flex-col mb-3 gap-2 justify-between border border-gray-200 bg-gray-50 p-4 rounded-lg flex-shrink-0 w-52 h-96 overflow-x-auto">
    <div className="flex flex-col">
      <div className="aspect-h-1 aspect-w-1 rounded-lg overflow-hidden text-center h-48">
        {primary_image && primary_image.match(/\.(jpeg|jpg|gif|png|webp)$/) ? (
          <img
            src={`/imgs/${primary_image}`}
            alt={item_name || 'Product Image'}
            className="w-full h-auto object-cover object-center rounded-lg"
          />
        ) : (
          <div className="animate-pulse bg-gray-200 h-full w-full rounded-lg"></div>
        )}
      </div>
      <div className="flex flex-col gap-1 justify-start">
        <h3 className="text-sm font-semibold text-gray-700 line-clamp-2">
          {item_name ?? ''}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-3">
          {description ?? ''}
        </p>
      </div>
    </div>
    <div className="flex justify-start">
      {typeof price === 'number' && !isNaN(price) ? (
        <span className="font-medium text-gray-900">${price.toFixed(2)}</span>
      ) : null}
    </div>
    <Button size="sm" onClick={() => addToCart(id)}>
      Add to cart
    </Button>
  </div>
)

export const OrderComponent = ({ id, total, date, status, products }: any) => (
  <div className="flex flex-col gap-2 mb-3">
    <div className="flex flex-col justify-between rounded-lg border bg-white p-4 w-96 h-72 flex-shrink-0">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-gray-800">
          <div className="flex items-center gap-2">
            Order <span className="font-semibold"> #{id ?? ''} </span>
          </div>
          <div className="text-xs border border-gray-500 rounded-md px-1.5 py-0.5 text-gray-500">
            {status ?? ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500">{date ?? ''}</div>
        </div>
        <div className="flex flex-col gap-2 mt-2">
          {products?.map((product: any, index: number) => (
            <div className="flex items-center gap-2" key={index}>
              <div className="aspect-h-1 aspect-w-1 w-16 h-16 overflow-hidden rounded-lg bg-gray-100 border border-gray-200 xl:aspect-h-8 xl:aspect-w-7">
                {product.item?.primary_image &&
                product.item.primary_image.match(
                  /\.(jpeg|jpg|gif|png|webp)$/
                ) ? (
                  <img
                    src={`/imgs/${product.item.primary_image}`}
                    alt={product.item.item_name}
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  <div className="animate-pulse bg-gray-200 h-full w-full"></div>
                )}
              </div>

              <div className="text-xs text-gray-600 flex-1 text-ellipsis text-nowrap overflow-hidden">
                <span className="text-ellipsis">
                  {product.item?.item_name ?? ''}
                </span>
                <span className="font-semibold ml-1">
                  x {product.quantity ?? ''}
                </span>
              </div>
              <div className="text-xs font-semibold text-gray-800">
                $ {product.item?.price ?? ''}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-gray-500 font-semibold">Total</div>
        <div className="font-medium text-gray-900 ">$ {total}</div>
      </div>
    </div>
    <div className="flex justify-start">
      <Button size="sm" onClick={() => selectOrder(id)}>
        Select order
      </Button>
    </div>
  </div>
)

export const CardComponent = ({ children }: { children?: any[] }) => (
  <div className="flex flex-col w-full bg-white rounded-lg p-4 shadow-md mt-2">
    {children ? (
      <div className="flex flex-col gap-4">
        {children.map((child: any, index: number) => (
          <React.Fragment key={index}>{getComponent(child)}</React.Fragment>
        ))}
      </div>
    ) : null}
  </div>
)

export const CarouselComponent = ({ children }: { children?: any[] }) => (
  <div className="flex space-x-2 overflow-x-scroll w-full">
    {children
      ? children.map((child: any, index: number) => (
          <React.Fragment key={index}>{getComponent(child)}</React.Fragment>
        ))
      : null}
  </div>
)

export const componentsMap = {
  card: CardComponent,
  carousel: CarouselComponent,
  bar_chart: BarChartComponent,
  header: HeaderComponent,
  table: TableComponent,
  item: ItemComponent,
  order: OrderComponent
  // update componentsMap to match components passed to generate_ui
}
conversational-assistant/lib/components-mapping.tsx

'use client'
import { componentsMap } from '@/config/ui/components'
import React from 'react'

type Component = {
  name: string
  [key: string]: any
}

export const getComponent = (component: Component) => {
  if (!component) return null

  const ComponentToRender =
    componentsMap[component.name as keyof typeof componentsMap]
  if (!ComponentToRender) return null

  return <ComponentToRender {...component} />
}
conversational-assistant/lib/utils.ts

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
conversational-assistant/package.json

{
  "name": "convex",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@npmcli/fs": "^4.0.0",
    "@reach/visually-hidden": "^0.18.0",
    "@xyflow/react": "^12.3.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.441.0",
    "next": "14.2.11",
    "openai": "^4.61.0",
    "partial-json": "^0.1.7",
    "react": "^18",
    "react-dom": "^18",
    "react-markdown": "^9.0.1",
    "react-syntax-highlighter": "^15.5.0",
    "recharts": "^2.12.7",
    "tailwind-merge": "^2.5.2",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^1.0.0",
    "zod": "^3.23.8",
    "zustand": "^5.0.2"
  },
  "devDependencies": {
    "@types/node": "^20.16.10",
    "@types/react": "^18.3.10",
    "@types/react-dom": "^18",
    "@types/react-syntax-highlighter": "^15.5.13",
    "eslint": "^9.13.0",
    "eslint-config-next": "^15.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.6.2"
  }
}
conversational-assistant/lib/tools/tools-handling.ts

import { functionsMap } from '../../config/functions'

type ToolName = keyof typeof functionsMap

export const handleTool = async (
  toolName: ToolName | 'generate_ui',
  parameters: any
) => {
  console.log('Handle tool', toolName, parameters)
  if (toolName === 'generate_ui') {
    const { component } = parameters
    return { component }
  } else if (functionsMap[toolName]) {
    return await functionsMap[toolName](parameters)
  } else {
    throw new Error(`Unknown tool: ${toolName}`)
  }
}
conversational-assistant/tailwind.config.ts

import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './config/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
  // safelist: [
  //   'mb-8',
  //   'bg-gray-300',
  //   'bg-gray-200',
  //   'w-48',
  //   'h-32',
  //   'text-gray-700',
  //   'text-gray-800',
  //   'px-1.5',
  //   'py-0.5',
  //   'mr-2',
  //   'gap-y-4'
  // ]
}
export default config
conversational-assistant/tsconfig.json

{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
generative-ui/.gitignore

# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
generative-ui/app/api/generate_ui/route.ts

import OpenAI from 'openai'
import { MODEL, SYSTEM_PROMPT } from '@/lib/constants'
import { generateUITool } from '@/lib/generate-ui-tool'
import {
  ChatCompletionMessageParam,
  ChatCompletionTool
} from 'openai/resources/chat/completions'

const openai = new OpenAI()

const toolsDefinition = [generateUITool]

const tools = toolsDefinition.map(tool => {
  return {
    type: 'function',
    function: {
      ...tool,
      parameters: tool.parameters
    }
  }
})

export async function POST(request: Request) {
  const { user_input } = await request.json()

  try {
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('Starting OpenAI stream', user_input)

          const messages = [
            {
              role: 'system',
              content: SYSTEM_PROMPT
            },
            {
              role: 'user',
              content: user_input
            }
          ] as ChatCompletionMessageParam[]

          const openaiStream = openai.beta.chat.completions.stream({
            model: MODEL,
            messages,
            temperature: 0,
            tools: tools as ChatCompletionTool[],
            //Forcing tool call to generate UI
            tool_choice: {
              type: 'function',
              function: { name: 'generate_ui' }
            },
            parallel_tool_calls: false
          })

          let functionArguments = ''
          let callId = ''
          let functionName = ''
          let isCollectingFunctionArgs = false

          for await (const part of openaiStream) {
            const delta = part.choices[0].delta
            const finishReason = part.choices[0].finish_reason

            if (delta.content) {
              const data = JSON.stringify({
                event: 'assistant_delta',
                data: delta
              })
              controller.enqueue(`data: ${data}\n\n`)
            }

            if (delta.tool_calls) {
              isCollectingFunctionArgs = true
              if (delta.tool_calls[0].id) {
                callId = delta.tool_calls[0].id
              }
              if (delta.tool_calls[0].function?.name) {
                functionName = delta.tool_calls[0].function.name
              }
              functionArguments += delta.tool_calls[0].function?.arguments || ''

              const data = JSON.stringify({
                event: 'function_arguments_delta',
                data: {
                  callId: callId,
                  name: functionName,
                  arguments: delta.tool_calls[0].function?.arguments
                }
              })
              controller.enqueue(`data: ${data}\n\n`)
            }

            if (finishReason === 'tool_calls' && isCollectingFunctionArgs) {
              console.log(`tool call ${functionName} is complete`)
              const data = JSON.stringify({
                event: 'function_arguments_done',
                data: {
                  callId: callId,
                  name: functionName,
                  arguments: functionArguments
                }
              })
              controller.enqueue(`data: ${data}\n\n`)
              functionArguments = ''
              functionName = ''
              isCollectingFunctionArgs = false
            }
          }

          console.log('OpenAI stream done')
          controller.close()
        } catch (error) {
          console.error('Error in stream start:', error)
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    })
  } catch (error: any) {
    console.error('Error in POST handler:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    })
  }
}
generative-ui/.eslintrc.json

{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "off"
  }
}
conversational-assistant/stores/useConversationStore.ts

import { create } from 'zustand'
import { Item } from '@/lib/assistant'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { INITIAL_MESSAGE } from '@/config/constants'

interface ConversationState {
  // Items displayed in the chat
  chatMessages: Item[]
  // Items sent to the Chat Completions API
  conversationItems: ChatCompletionMessageParam[]

  setChatMessages: (items: Item[]) => void
  setConversationItems: (messages: ChatCompletionMessageParam[]) => void
  addChatMessage: (item: Item) => void
  addConversationItem: (message: ChatCompletionMessageParam) => void
}

const useConversationStore = create<ConversationState>((set, get) => ({
  chatMessages: [
    {
      type: 'message',
      role: 'assistant',
      content: INITIAL_MESSAGE
    }
  ],
  conversationItems: [],
  setChatMessages: items => set({ chatMessages: items }),
  setConversationItems: messages => set({ conversationItems: messages }),
  addChatMessage: item =>
    set(state => ({ chatMessages: [...state.chatMessages, item] })),
  addConversationItem: message =>
    set(state => ({ conversationItems: [...state.conversationItems, message] }))
}))

export default useConversationStore
generative-ui/README.md

Generative UI with Structured Outputs

Overview

This simple demo app showcases how to generate UI dynamically based on a user input, using Structured Outputs to reliably generate components that will be rendered recursively.

Features

Multi-turn conversation handling
Automatic tool execution
Streaming responses and function calls
Streaming generative UI
How to run

Clone the repository:

git clone https://github.com/openai/structured-outputs-samples.git
cd generative-ui
Install dependencies:

npm i
Set up your environment:

export OPENAI_API_KEY=your-api-key
Or create a .env file in the generative-ui folder containing:

OPENAI_API_KEY=<your-api-key>
Run the demo

npm run dev
The app will be available at http://localhost:3000.

Usage

To try this demo, ask questions that can be represented visually.
You can try the suggested prompts or ask something else.

To see the arguments for the generate_ui tool, you can toggle the JSON view by clicking on the curly braces icon in the top right corner of the UI display.

Customization

This demo app can be easily customized by modifying the components and their parameters used by the generate_ui tool.

Update the components-definition.ts file to add or remove components, and make sure you update the components.tsx file so that each component definition maps to a React component.

generative-ui/components/ui-display.tsx

import React, { useEffect, useRef } from 'react'

import { getComponent } from '@/lib/components-mapping'
import { Braces, X } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { coy } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface FunctionCallProps {
  functionCall: any
}

const UIDisplay: React.FC<FunctionCallProps> = ({
  functionCall
}: {
  functionCall: any
}) => {
  const [showJSON, setShowJSON] = React.useState(false)

  const toggleShowJSON = () => {
    setShowJSON(!showJSON)
  }

  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [functionCall])

  return (
    <div className="flex justify-center items-center overflow-y-scroll rounded-lg px-8 py-2 h-full w-full">
      {(() => {
        if (functionCall?.name === 'generate_ui') {
          return (
            <div className="w-full relative my-2 h-[70vh]">
              <div
                className="absolute right-4 top-4 z-10"
                onClick={toggleShowJSON}
              >
                {showJSON ? (
                  <X
                    size={20}
                    className="cursor-pointer text-neutral-900 hover:text-neutral-700"
                  />
                ) : (
                  <Braces
                    size={20}
                    className="cursor-pointer text-neutral-900 hover:text-neutral-700"
                  />
                )}
              </div>
              <div
                className={`text-xs max-h-[500px] font-mono overflow-x-scroll h-full w-full overflow-y-scroll rounded-xl ${
                  showJSON ? '' : 'hidden'
                }`}
              >
                <SyntaxHighlighter
                  language="json"
                  style={coy}
                  customStyle={{
                    borderRadius: '0.75rem',
                    paddingTop: '16px',
                    paddingBottom: '16px',
                    marginTop: 0
                  }}
                >
                  {JSON.stringify(functionCall.parsedArguments, null, 2)}
                </SyntaxHighlighter>
              </div>
              <div className="flex items-center justify-center">
                <div
                  className={`${showJSON ? 'hidden' : ''} py-12 h-full w-full`}
                >
                  {getComponent(functionCall.parsedArguments.component) ?? null}
                </div>
                <div ref={endRef} />
              </div>
            </div>
          )
        }
      })()}
    </div>
  )
}

export default UIDisplay
generative-ui/components/chat.tsx

'use client'

import React, { useState, useEffect } from 'react'

interface ChatProps {
  onSendMessage: (message: string) => void
  suggestion?: string
}

const Chat: React.FC<ChatProps> = ({ onSendMessage, suggestion }) => {
  const [inputMessageText, setinputMessageText] = useState<string>('')

  // Whenever suggestion changes, update the input field
  useEffect(() => {
    if (suggestion !== undefined) {
      setinputMessageText(suggestion)
    }
  }, [suggestion])

  return (
    <div className="flex w-full flex-col gap-1.5 rounded-[26px] p-1.5 transition-colors bg-white">
      <div className="flex items-center gap-1.5 md:gap-2 pl-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <textarea
            id="prompt-textarea"
            tabIndex={0}
            dir="auto"
            rows={1}
            placeholder="Generate a UI component for..."
            className="m-0 resize-none border-0 focus:outline-none text-sm bg-transparent px-0 py-2 max-h-[20dvh]"
            value={inputMessageText}
            onChange={e => setinputMessageText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSendMessage(inputMessageText)
                setinputMessageText('')
              }
            }}
          />
        </div>
        <button
          disabled={!inputMessageText}
          data-testid="send-button"
          className="flex size-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:outline-black disabled:bg-[#D7D7D7] disabled:text-[#f4f4f4] disabled:hover:opacity-100"
          onClick={() => {
            onSendMessage(inputMessageText)
            setinputMessageText('')
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Chat
generative-ui/components/ui/table.tsx

import * as React from 'react'

import { cn } from '@/lib/utils'

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto min-h-[200px]">
    <table
      ref={ref}
      className={cn('w-full caption-bottom text-xs', className)}
      {...props}
    />
  </div>
))
Table.displayName = 'Table'

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
))
TableBody.displayName = 'TableBody'

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
      className
    )}
    {...props}
  />
))
TableFooter.displayName = 'TableFooter'

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
      className
    )}
    {...props}
  />
))
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      className
    )}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      className
    )}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground', className)}
    {...props}
  />
))
TableCaption.displayName = 'TableCaption'

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
}
generative-ui/app/globals.css

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: var(--font-geist-sans);
}

.font-mono, pre, code {
  font-family: var(--font-geist-mono) !important;
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 20 14.3% 4.1%;
    --card: 0 0% 100%;
    --card-foreground: 20 14.3% 4.1%;
    --popover: 0 0% 100%;
    --popover-foreground: 20 14.3% 4.1%;
    --primary: 24 9.8% 10%;
    --primary-foreground: 60 9.1% 97.8%;
    --secondary: 60 4.8% 95.9%;
    --secondary-foreground: 24 9.8% 10%;
    --muted: 60 4.8% 95.9%;
    --muted-foreground: 25 5.3% 44.7%;
    --accent: 60 4.8% 95.9%;
    --accent-foreground: 24 9.8% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 60 9.1% 97.8%;
    --border: 20 5.9% 90%;
    --input: 20 5.9% 90%;
    --ring: 20 14.3% 4.1%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 20 14.3% 4.1%;
    --foreground: 60 9.1% 97.8%;
    --card: 20 14.3% 4.1%;
    --card-foreground: 60 9.1% 97.8%;
    --popover: 20 14.3% 4.1%;
    --popover-foreground: 60 9.1% 97.8%;
    --primary: 60 9.1% 97.8%;
    --primary-foreground: 24 9.8% 10%;
    --secondary: 12 6.5% 15.1%;
    --secondary-foreground: 60 9.1% 97.8%;
    --muted: 12 6.5% 15.1%;
    --muted-foreground: 24 5.4% 63.9%;
    --accent: 12 6.5% 15.1%;
    --accent-foreground: 60 9.1% 97.8%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 60 9.1% 97.8%;
    --border: 12 6.5% 15.1%;
    --input: 12 6.5% 15.1%;
    --ring: 24 5.7% 82.9%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
generative-ui/lib/components-definition.ts

// List of components that will be used by the generate_ui tool
// Define recursive components using the $ref property
// More information on supported schemas: https://platform.openai.com/docs/guides/structured-outputs#supported-schemas

export const components = [
  {
    name: 'card',
    parameters: {
      children: {
        type: 'array',
        items: { $ref: '#/$defs/component' }
      }
    }
  },
  {
    name: 'header',
    parameters: {
      content: {
        type: 'string',
        description: 'Text content of the header'
      }
    }
  },
  {
    name: 'container',
    parameters: {
      content: {
        type: 'string',
        description: 'Text content of the container'
      },
      classes: {
        type: 'string',
        description:
          'Tailwind classes to apply to the container, empty string if no classes are needed'
      }
    }
  },
  {
    name: 'carousel',
    parameters: {
      children: {
        type: 'array',
        items: {
          anyOf: [{ $ref: '#/$defs/card' }, { $ref: '#/$defs/item' }]
        }
      }
    }
  },
  {
    name: 'item',
    parameters: {
      children: {
        type: 'array',
        items: {
          anyOf: [{ $ref: '#/$defs/header' }, { $ref: '#/$defs/container' }]
        }
      }
    }
  },
  {
    name: 'table',
    parameters: {
      columns: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: 'Key for the column.'
            },
            title: {
              type: 'string',
              description: 'Title for the column.'
            }
          },
          required: ['key', 'title'],
          additionalProperties: false
        }
      },
      rows: {
        type: 'array',
        items: {
          $ref: '#/$defs/row'
        }
      }
    }
  },
  {
    name: 'row',
    parameters: {
      values: {
        type: 'array',
        description:
          'An array of values for the row, either strings or integers.',
        items: {
          anyOf: [{ type: 'string' }, { type: 'integer' }]
        }
      }
    }
  },
  {
    name: 'bar_chart',
    parameters: {
      columns: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: {
              type: 'string',
              description: 'Label for the column.'
            },
            value: {
              type: 'string',
              description: 'Value for the column.'
            }
          },
          required: ['label', 'value'],
          additionalProperties: false
        }
      }
    }
  }
]
generative-ui/components.json

{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "stone",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
generative-ui/app/layout.tsx

import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900'
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900'
})

export const metadata: Metadata = {
  title: 'Generative UI',
  description: 'Generative UI demo with Structured Outputs',
  icons: {
    icon: '/imgs/convex_icon.svg'
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} `}>
        <div className="h-screen bg-gray-200 text-stone-900">
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
generative-ui/app/page.tsx

'use client'

import Chat from '@/components/chat'
import UIDisplay from '@/components/ui-display'
import { PROMPT_SUGGESTIONS } from '@/lib/constants'
import { FunctionCallItem, handleMessage } from '@/lib/handle-message'
import React, { useState, useEffect } from 'react'
import { parse } from 'partial-json'

const MainInterface: React.FC = () => {
  const [functionCall, setFunctionCall] = useState<FunctionCallItem | null>(
    null
  )
  const [suggestion, setSuggestion] = useState<string | undefined>(undefined)
  const [functionArguments, setFunctionArguments] = useState('')

  useEffect(() => {
    if (functionArguments.length > 0) {
      let parsedArguments = {}
      try {
        parsedArguments = parse(functionArguments)
      } catch (e) {
        console.error('Failed to parse arguments:', e)
      }

      setFunctionCall(prev => {
        if (prev) {
          return {
            ...prev,
            arguments: functionArguments,
            parsedArguments
          }
        }
        return null
      })
    }
  }, [functionArguments])

  const onMessage = async (data: any) => {
    const { event: eventType, data: eventData } = data

    if (eventType === 'function_arguments_delta') {
      // Accumulate arguments
      setFunctionArguments(prev => prev + eventData.arguments)

      // If functionCall doesn't exist, create it, otherwise update it
      setFunctionCall(prev => {
        if (!prev) {
          return {
            type: 'function_call',
            status: 'in_progress',
            id: eventData.callId,
            name: eventData.name,
            arguments: eventData.arguments,
            parsedArguments: {},
            output: null
          }
        } else {
          return {
            ...prev,
            status: 'in_progress',
            name: eventData.name,
            id: eventData.callId,
            arguments: prev.arguments + eventData.arguments
          }
        }
      })
    } else if (eventType === 'function_arguments_done') {
      setFunctionArguments(eventData.arguments)
      console.log('functionCall done', functionCall)
      setFunctionCall(prev => {
        if (prev) {
          return { ...prev, status: 'completed' }
        }
        return null
      })
    }
  }

  const handleSendMessage = async (message: string) => {
    setFunctionArguments('')
    setFunctionCall(null)
    if (!message.trim()) return
    await handleMessage(message, onMessage)
    setSuggestion(undefined)
  }

  const applySuggestion = (sugg: string) => {
    setSuggestion(sugg)
  }

  return (
    <div className="flex flex-col justify-bewtween gap-4 w-full h-screen pt-4 px-24 items-center">
      <div className="w-full flex-1 md:w-2/3 flex flex-col items-center justify-center gap-2">
        <Chat onSendMessage={handleSendMessage} suggestion={suggestion} />
        <div className="flex items-center gap-2 py-2 px-4 text-sm overflow-x-scroll w-full pb-4">
          {PROMPT_SUGGESTIONS.map((sugg: string, index: number) => (
            <div
              key={index}
              className="hover:bg-gray-100 cursor-pointer text-sm text-nowrap px-2 py-1 rounded-full border border-gray-300 text-gray-400"
              onClick={() => applySuggestion(sugg)}
            >
              {sugg}
            </div>
          ))}
        </div>
      </div>
      <div className="h-[75vh] w-full bg-gray-50 rounded-t-lg shadow-md md:w-2/3 flex justify-center items-center">
        <UIDisplay functionCall={functionCall} />
      </div>
    </div>
  )
}

export default MainInterface
generative-ui/components/ui/chart.tsx

'use client'

import * as React from 'react'
import * as RechartsPrimitive from 'recharts'

import { cn } from '@/lib/utils'

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: '', dark: '.dark' } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >['children']
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = 'Chart'

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join('\n')}
}
`
          )
          .join('\n')
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<'div'> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: 'line' | 'dot' | 'dashed'
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = 'dot',
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || 'value'}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === 'string'
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn('font-medium', labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn('font-medium', labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== 'dot'

    return (
      <div
        ref={ref}
        className={cn(
          'grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl',
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || 'value'}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
                  indicator === 'dot' && 'items-center'
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            'shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]',
                            {
                              'h-2.5 w-2.5': indicator === 'dot',
                              'w-1': indicator === 'line',
                              'w-0 border-[1.5px] border-dashed bg-transparent':
                                indicator === 'dashed',
                              'my-0.5': nestLabel && indicator === 'dashed'
                            }
                          )}
                          style={
                            {
                              '--color-bg': indicatorColor,
                              '--color-border': indicatorColor
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        'flex flex-1 justify-between leading-none',
                        nestLabel ? 'items-end' : 'items-center'
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = 'ChartTooltip'

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> &
    Pick<RechartsPrimitive.LegendProps, 'payload' | 'verticalAlign'> & {
      hideIcon?: boolean
      nameKey?: string
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = 'bottom', nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center gap-4',
          verticalAlign === 'top' ? 'pb-3' : 'pt-3',
          className
        )}
      >
        {payload.map(item => {
          const key = `${nameKey || item.dataKey || 'value'}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                'flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground'
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = 'ChartLegend'

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== 'object' || payload === null) {
    return undefined
  }

  const payloadPayload =
    'payload' in payload &&
    typeof payload.payload === 'object' &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === 'string'
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === 'string'
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent
}
generative-ui/lib/generate-ui-tool.ts

import { components } from './components-definition'

const componentsList = components.map(component => {
  return { $ref: `#/$defs/${component.name}` }
})

const componentsDefinitions = components.reduce((acc, component) => {
  acc[component.name] = {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        enum: [component.name]
      },
      ...component.parameters
    },
    required: ['name', ...Object.keys(component.parameters)],
    additionalProperties: false
  }
  return acc
}, {} as { [key: string]: any })

export const generateUITool = {
  name: 'generate_ui',
  description:
    'Generate UI components dynamically to display relevant information.',
  parameters: {
    type: 'object',
    properties: {
      component: {
        anyOf: componentsList
      }
    },
    required: ['component'],
    additionalProperties: false,
    $defs: {
      component: {
        anyOf: componentsList
      },
      ...componentsDefinitions
    }
  },
  strict: true
}
generative-ui/lib/components.tsx

// Components that will be used by the generate_ui tool

import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartConfig, ChartContainer } from '@/components/ui/chart'
import { getComponent } from './components-mapping'

// Utility Functions
const formatKey = (key: string) =>
  key.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')

const getChartConfig = (columns: { label: string; value: number }[]) => {
  const config: ChartConfig = {}

  columns.forEach((item: { label: string; value: number }) => {
    config[formatKey(item.label)] = {
      label: item.label,
      color: '#ffffff'
    }
  })

  return config
}

// Chart Data Functions
const getChartData = (columns: { label?: string; value?: string }[]) => {
  return columns
    .filter(item => !!item.label)
    .map((item: { label?: string; value?: string }, index: number) => {
      if (!item.label) {
        throw new Error('Label is required')
      }
      return {
        id: index,
        label: item.label,
        value: item.value !== undefined ? parseFloat(item.value) : 0,
        fill: '#000000'
      }
    })
}

export const CardComponent = ({ children }: { children?: any[] }) => (
  <div className="flex flex-col w-full bg-white rounded-lg p-4 shadow-md my-2 min-w-52">
    {children ? (
      <div className="flex flex-col gap-4">
        {children.map((child: any, index: number) => (
          <React.Fragment key={index}>{getComponent(child)}</React.Fragment>
        ))}
      </div>
    ) : null}
  </div>
)

export const CarouselComponent = ({ children }: { children?: any[] }) => (
  <div className="flex gap-2 overflow-x-scroll w-full">
    {children
      ? children.map((child: any, index: number) => (
          <React.Fragment key={index}>{getComponent(child)}</React.Fragment>
        ))
      : null}
  </div>
)

export const HeaderComponent = ({ content }: { content?: string }) => {
  return (
    <div>
      <h1 className="text-sm text-stone-900 font-medium">{content}</h1>
    </div>
  )
}

export const ContainerComponent = ({
  content,
  classes
}: {
  content?: string
  classes?: string
}) => {
  return <div className={classes}>{content}</div>
}

export const BarChartComponent = ({
  columns
}: {
  columns?: { label?: string; value?: string }[]
}) => {
  if (!columns) return null
  const chartData = getChartData(columns)
  const chartConfig = getChartConfig(chartData)
  return (
    <ChartContainer config={chartConfig}>
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          padding={{ left: 10, right: 10 }}
        />
        <YAxis orientation="left" width={48} />
        <Bar dataKey="value" fill="#1A535C" radius={6} barSize={30} />
      </BarChart>
    </ChartContainer>
  )
}

export const TableComponent = ({
  columns,
  rows
}: {
  columns?: { key?: string; title?: string }[]
  rows?: any[]
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        {columns?.map((column, index) => (
          <TableHead key={index}>{column.title}</TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows?.map((row, index) => (
        <TableRow key={index}>
          {row.values?.map((value: string, index: number) => (
            <TableCell key={index}>{value}</TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

// Components Map
export const componentsMap: Record<string, React.FC<any>> = {
  card: CardComponent,
  carousel: CarouselComponent,
  header: HeaderComponent,
  container: ContainerComponent,
  bar_chart: BarChartComponent,
  table: TableComponent
  // Add more components as you define them in components-definition.ts
}
generative-ui/lib/components-mapping.tsx

'use client'
import { componentsMap } from './components'
import React from 'react'

type Component = {
  name: string
  [key: string]: any
}

export const getComponent = (component: Component) => {
  if (!component) return null

  const ComponentToRender =
    componentsMap[component.name as keyof typeof componentsMap]
  if (!ComponentToRender) return null

  return <ComponentToRender {...component} />
}
generative-ui/lib/constants.ts

export const MODEL = 'gpt-4o'

export const SYSTEM_PROMPT = `
Generate a UI component based on the user input, to answer as relevantly as possible.
You can combine different components to best match what the user is asking for.

For example, 

Follow these guidelines:
- If the user input would be best answered with multiple components, use a card and include multiple components as children.
- When there are a list of things to return, use a carousel component to display each item individually.
- For UI components that accept a 'classes' prop, you can use tailwind classes to style the component (use classes for background and text color as well as margin and padding, and things like flex, flex-col and related classes when appropriate).
- For questions that can be answered with 1 set of numerical values (like height, width, weight, etc), use a bar chart component.
- For questions that compare multiple things or that contain information that can be shown with columns and rows, use a table component.
- When appropriate, use headers to display a title.
- When you use a bar chart or table, include them as children of a card component and include a title with a header.
- When you don't know which component to use, use an item component with a container (that you can style with tailwind classes)
`

export const PROMPT_SUGGESTIONS = [
  'Average temperatures by season in Fahrenheit and Celsius',
  'Height of tallest mountains in the world',
  'List of countries with the highest population density'
]
generative-ui/lib/utils.ts

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
generative-ui/lib/handle-message.ts

export interface MessageItem {
  type: 'message'
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface FunctionCallItem {
  type: 'function_call'
  status: 'in_progress' | 'completed' | 'failed'
  id: string
  name: string
  arguments: string
  parsedArguments: any
  output: string | null
}

export type Item = MessageItem | FunctionCallItem

export const handleMessage = async (
  user_input: string,
  onMessage: (data: any) => void
) => {
  console.log('Handle message', user_input)
  try {
    const response = await fetch('/api/generate_ui', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_input })
    })

    if (!response.ok) {
      console.error(`Error: ${response.statusText}`)
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let done = false
    let buffer = ''

    while (!done) {
      const { value, done: doneReading } = await reader.read()
      done = doneReading
      const chunkValue = decoder.decode(value)
      buffer += chunkValue

      const lines = buffer.split('\n\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6)
          if (dataStr === '[DONE]') {
            done = true
            break
          }
          const data = JSON.parse(dataStr)
          onMessage(data)
        }
      }
    }

    // Handle any remaining data in buffer
    if (buffer && buffer.startsWith('data: ')) {
      const dataStr = buffer.slice(6)
      if (dataStr !== '[DONE]') {
        const data = JSON.parse(dataStr)
        onMessage(data)
      }
    }
  } catch (error) {
    console.error('Error handling turn:', error)
  }
}
generative-ui/package.json

{
  "name": "convex",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "fs": "0.0.1-security",
    "lucide-react": "^0.468.0",
    "next": "14.2.11",
    "openai": "^4.61.0",
    "partial-json": "^0.1.7",
    "react": "^18",
    "react-dom": "^18",
    "react-markdown": "^9.0.1",
    "react-syntax-highlighter": "^15.5.0",
    "recharts": "^2.12.7",
    "tailwind-merge": "^2.5.2",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^1.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.16.10",
    "@types/react": "^18.3.16",
    "@types/react-dom": "^18",
    "@types/react-syntax-highlighter": "^15.5.13",
    "eslint": "^8",
    "eslint-config-next": "14.2.11",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.6.2"
  }
}
generative-ui/tsconfig.json

{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
resume-extraction/.gitignore

# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
generative-ui/tailwind.config.ts

import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [require('tailwindcss-animate')],
  safelist: [
    // Text color
    { pattern: /^text-/ },
    // Background color
    { pattern: /^bg-/ },
    // Padding
    { pattern: /^p(?:[trblxy]?)-/ },
    // Margin
    { pattern: /^m(?:[trblxy]?)-/ },
    // Border
    { pattern: /^border-/ },
    // Flex
    { pattern: /^flex/ },
    // Grid
    { pattern: /^grid/ },
    // Width and Height
    { pattern: /^(w|h)-/ }
  ]
}
export default config
resume-extraction/.eslintrc.json

{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "off"
  }
}
resume-extraction/app/globals.css

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: var(--font-geist-sans);
}

.font-mono, pre, code {
  font-family: var(--font-geist-mono) !important;
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 20 14.3% 4.1%;
    --card: 0 0% 100%;
    --card-foreground: 20 14.3% 4.1%;
    --popover: 0 0% 100%;
    --popover-foreground: 20 14.3% 4.1%;
    --primary: 24 9.8% 10%;
    --primary-foreground: 60 9.1% 97.8%;
    --secondary: 60 4.8% 95.9%;
    --secondary-foreground: 24 9.8% 10%;
    --muted: 60 4.8% 95.9%;
    --muted-foreground: 25 5.3% 44.7%;
    --accent: 60 4.8% 95.9%;
    --accent-foreground: 24 9.8% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 60 9.1% 97.8%;
    --border: 20 5.9% 90%;
    --input: 20 5.9% 90%;
    --ring: 20 14.3% 4.1%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 20 14.3% 4.1%;
    --foreground: 60 9.1% 97.8%;
    --card: 20 14.3% 4.1%;
    --card-foreground: 60 9.1% 97.8%;
    --popover: 20 14.3% 4.1%;
    --popover-foreground: 60 9.1% 97.8%;
    --primary: 60 9.1% 97.8%;
    --primary-foreground: 24 9.8% 10%;
    --secondary: 12 6.5% 15.1%;
    --secondary-foreground: 60 9.1% 97.8%;
    --muted: 12 6.5% 15.1%;
    --muted-foreground: 24 5.4% 63.9%;
    --accent: 12 6.5% 15.1%;
    --accent-foreground: 60 9.1% 97.8%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 60 9.1% 97.8%;
    --border: 12 6.5% 15.1%;
    --input: 12 6.5% 15.1%;
    --ring: 24 5.7% 82.9%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
resume-extraction/app/layout.tsx

import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900'
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900'
})

export const metadata: Metadata = {
  title: 'Resume Extraction',
  description: 'Resume Extraction demo with Structured Outputs',
  icons: {
    icon: '/imgs/convex_icon.svg'
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} `}>
        <div className="bg-gray-200 text-stone-900">
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
resume-extraction/app/api/extract_resume/route.ts

import { EXTRACT_VALUES_PROMPT, MODEL } from '@/lib/constants'
import { ResumeSchema } from '@/lib/resume'
import { promises as fs } from 'fs'
import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import PDFParser from 'pdf2json'

const openai = new OpenAI()

export const runtime = 'nodejs'

function extractValues(resumeText: string): ReadableStream {
  console.log('Extract values from resume text:', resumeText)

  const stream = openai.beta.chat.completions.stream({
    model: MODEL,
    messages: [
      { role: 'system', content: EXTRACT_VALUES_PROMPT },
      { role: 'user', content: resumeText }
    ],
    response_format: zodResponseFormat(ResumeSchema, 'event')
  })

  const encoder = new TextEncoder()

  const readableStream = new ReadableStream({
    start(controller) {
      stream
        .on('content.delta', ({ parsed }) => {
          console.log('content.delta parsed:', parsed)
          // Send the parsed data as JSON
          controller.enqueue(encoder.encode(JSON.stringify(parsed) + '\n'))
        })
        .on('content.done', () => {
          console.log('content.done')
          controller.close()
        })
        .on('error', error => {
          console.error('Error in OpenAI stream:', error)
          controller.error(error)
        })
    }
  })

  return readableStream
}

async function parsePDF(uploadedFiles: FormDataEntryValue[]): Promise<string> {
  return new Promise((resolve, reject) => {
    if (uploadedFiles && uploadedFiles.length > 0) {
      const uploadedFile = uploadedFiles[0]
      if (uploadedFile instanceof File) {
        const tempFilePath = `/tmp/resume.pdf`

        uploadedFile.arrayBuffer().then(arrayBuffer => {
          const fileBuffer = Buffer.from(arrayBuffer)

          fs.writeFile(tempFilePath, fileBuffer)
            .then(() => {
              // Parse the pdf using pdf2json
              const pdfParser = new (PDFParser as any)(null, 1)

              pdfParser.on('pdfParser_dataError', (errData: any) => {
                console.log(errData.parserError)
                reject(errData.parserError)
              })

              pdfParser.on('pdfParser_dataReady', () => {
                const rawTextContent = (pdfParser as any).getRawTextContent()
                resolve(rawTextContent)
              })

              pdfParser.loadPDF(tempFilePath)
            })
            .catch(error => {
              console.error('Error writing file:', error)
              reject(error)
            })
        })
      } else {
        reject(new Error('Uploaded file is not of type File'))
      }
    } else {
      reject(new Error('No files uploaded'))
    }
  })
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const uploadedFiles = formData.getAll('files')
    console.log('Received files:', uploadedFiles)

    const resumeText = await parsePDF(uploadedFiles)
    console.log('Parsed resume text:', resumeText)

    const readableStream = extractValues(resumeText)

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Transfer-Encoding': 'chunked'
      }
    })
  } catch (error) {
    console.error('Error in POST handler:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process the PDF file' }),
      { status: 500 }
    )
  }
}
resume-extraction/components.json

{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "stone",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
resume-extraction/app/page.tsx

'use client'

import { ResumeValues } from '@/lib/resume'
import React, { useCallback, useState } from 'react'
import ExtractedValues from '@/components/extracted-values'
import FileDropper from '@/components/file-dropper'

const ResumeExtraction: React.FC = () => {
  const [values, setValues] = useState<ResumeValues>()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const onFileSelected = useCallback(
    (selectedFile: File) => {
      setFile(selectedFile)
      setLoading(true)

      // Start processing the file
      ;(async () => {
        try {
          const formData = new FormData()
          formData.append('files', selectedFile)

          const response = await fetch('/api/extract_resume', {
            method: 'POST',
            body: formData
          })

          if (!response.body) {
            throw new Error('ReadableStream not supported in this browser.')
          }

          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let done = false
          let partialData = ''

          while (!done) {
            const { value, done: readerDone } = await reader.read()
            done = readerDone
            const chunkValue = decoder.decode(value)
            partialData += chunkValue

            const dataParts = partialData.split('\n')
            partialData = dataParts.pop() || ''

            for (const dataPart of dataParts) {
              if (dataPart.trim() === '') continue
              try {
                const parsedData = JSON.parse(dataPart)
                setValues(prevValues => ({
                  ...prevValues,
                  ...parsedData
                }))
              } catch (e) {
                console.error('Error parsing JSON:', e)
              }
            }
          }
        } catch (error) {
          console.error('Error extracting resume:', error)
        } finally {
          setLoading(false)
        }
      })()
    },
    [setFile, setValues, setLoading]
  )

  return (
    <div className="flex h-screen w-full py-2 px-4 flex-col">
      <div className="size-full flex flex-col sm:flex-row">
        <div className="w-full sm:w-1/2 size-full p-8">
          <FileDropper
            file={file}
            setFile={setFile}
            setValues={setValues}
            onFileSelected={onFileSelected}
          />
        </div>
        <div className="w-full sm:w-1/2 size-full p-8">
          <ExtractedValues values={values} loading={loading} />
        </div>
      </div>
    </div>
  )
}

export default ResumeExtraction
resume-extraction/README.md

Resume Extraction Demo with Structured Outputs

Overview

This simple demo app showcases how to build deterministic interfaces by using Structured Outputs. It also demonstrates how to stream JSON responses.

As an example, the app extracts key details from PDF resumes.

Features

Reliable Parsing: Ensures output adheres to a defined JSON schema.
Streaming Responses: Streams structured outputs for dynamic display in the UI.
Type-Safe Interfaces: Simplifies downstream processing with predictable JSON responses.
How to run

Clone the repository:

git clone https://github.com/openai/structured-outputs-samples.git
cd resume-extraction
Install dependencies:

npm i
Set up your environment:

export OPENAI_API_KEY=your-api-key
Or create a .env file in the resume-extraction folder containing:

OPENAI_API_KEY=<your-api-key>
Run the demo

npm run dev
The app will be available at http://localhost:3000.

Usage

To test the app, you can either upload a PDF resume or use the example resume provided by clicking on the "Use the example" button.

You can then see the extracted fields stream in the UI. To see the full JSON response, toggle the JSON view by clicking on the "{}" icon in the top right.

To update the fields extracted by the model, you can edit the zod schema in lib/resume.ts file.

resume-extraction/components/file-dropper.css

.react-pdf__Page__textContent, .react-pdf__Page__annotations {
  display: none;
}
resume-extraction/lib/resume.ts

import { z } from 'zod'

// Schema used to extract values in a structured way
export const ResumeSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  location: z.string().optional(),
  contactInfo: z.object({
    email: z.string().optional(),
    website: z.string().optional(),
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    github: z.string().optional()
  }),
  workExperience: z
    .array(
      z.object({
        startYear: z.string().optional(),
        endYear: z.string().optional(),
        title: z.string().optional(),
        company: z.string().optional(),
        location: z.string().optional(),
        description: z.string().optional()
      }),
      {
        description:
          'Work experience, ordered from the most recent to the oldest.'
      }
    )
    .optional(),
  education: z
    .array(
      z.object({
        startYear: z.string().optional(),
        endYear: z.string().optional(),
        degree: z.string().optional(),
        institution: z.string().optional(),
        location: z.string().optional(),
        description: z.string().optional()
      }),
      {
        description: 'Education, ordered from the most recent to the oldest.'
      }
    )
    .optional(),
  skills: z
    .array(
      z.object({
        name: z.string().optional()
      })
    )
    .optional()
})

export interface ExperienceItem {
  title?: string
  company?: string
  startYear?: string
  endYear?: string
  location?: string
  description?: string
}

export interface EducationItem {
  institution?: string
  degree?: string
  startYear?: string
  endYear?: string
  location?: string
  description?: string
}

export interface Skill {
  name: string
  level?: string
}

export interface ContactInfo {
  email?: string
  phone?: string
  website?: string
  linkedin?: string
  twitter?: string
}

export interface ResumeValues {
  name?: string
  title?: string
  location?: string
  contactInfo?: ContactInfo
  workExperience?: ExperienceItem[]
  education?: EducationItem[]
  skills?: Skill[]
}
resume-extraction/lib/constants.ts

export const MODEL = 'gpt-4o-mini'
export const EXTRACT_VALUES_PROMPT =
  "Extract the relevant fields from the resume text provided. If you can't identify a required field, leave it blank."
resume-extraction/package.json

{
  "name": "convex",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "fs": "0.0.1-security",
    "lucide-react": "^0.441.0",
    "next": "^14.2.23",
    "openai": "^4.61.0",
    "partial-json": "^0.1.7",
    "pdf2json": "^3.1.4",
    "pdfjs-dist": "^4.10.38",
    "react": "^18",
    "react-dom": "^18",
    "react-dropzone": "^14.2.3",
    "react-markdown": "^9.0.1",
    "react-pdf": "^9.1.1",
    "react-syntax-highlighter": "^15.5.0",
    "tailwind-merge": "^2.5.2",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^1.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.16.10",
    "@types/react": "^18.3.10",
    "@types/react-dom": "^18",
    "@types/react-syntax-highlighter": "^15.5.13",
    "eslint": "^8.57.1",
    "eslint-config-next": "14.2.11",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.6.2"
  }
}
resume-extraction/components/file-dropper.tsx

import { FilePlus2, Trash2 } from 'lucide-react'
import React, { memo, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Document, Page, pdfjs } from 'react-pdf'
import './file-dropper.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const options = {
  cMapUrl: '/cmaps/',
  standardFontDataUrl: '/standard_fonts/'
}

interface FileDropperProps {
  file: File | null
  setFile: (file: File | null) => void
  setValues: (values: any | null) => void
  onFileSelected: (file: File) => void
}
const FileDropper: React.FC<FileDropperProps> = memo(
  ({ file, setFile, setValues, onFileSelected }) => {
    const onDrop = useCallback(
      (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
          onFileSelected(acceptedFiles[0])
        }
      },
      [onFileSelected]
    )

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: { 'application/pdf': ['.pdf'] },
      multiple: false
    })

    const resetResume = () => {
      setFile(null)
      setValues(null)
    }

    const useExampleFile = () => {
      fetch('/example_resume.pdf')
        .then(response => response.blob())
        .then(blob => {
          const exampleFile = new File([blob], 'example_resume.pdf', {
            type: 'application/pdf'
          })
          onFileSelected(exampleFile)
        })
        .catch(error => {
          console.error('Error fetching the example file:', error)
        })
    }

    return (
      <div className="w-full h-[90vh] flex justify-center items-center">
        {file ? (
          <div className="flex flex-col">
            <div className="document drop-shadow-md mt-4">
              <Document file={file} options={options}>
                <Page className="page" pageNumber={1} scale={0.8} />
              </Document>
            </div>
            <div className="flex justify-center items-center mt-2">
              <div className="text-xs text-neutral-600 mr-2">{file.name}</div>
              <Trash2
                onClick={() => resetResume()}
                size={12}
                className="cursor-pointer text-neutral-800"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center">
            <div
              {...getRootProps()}
              className="p-6 flex items-center justify-center relative focus-visible:outline-0"
            >
              <input {...getInputProps()} />

              <div
                className={`absolute rounded-full transition-all duration-300 ${
                  isDragActive
                    ? 'h-56 w-56 bg-stone-300'
                    : 'h-0 w-0 bg-transparent'
                }`}
              ></div>

              <div className="justify-center flex flex-col items-center text-center z-10 cursor-pointer">
                <FilePlus2 className="mb-4 size-8 text-stone-800" />
                <div className="text-stone-700">Upload a resume</div>
              </div>
            </div>
            <div className="mt-2 text-sm text-stone-500">
              Or{' '}
              <div
                className="inline-block border-b border-stone-400 text-stone-400  cursor-pointer hover:text-stone-500"
                onClick={useExampleFile}
              >
                use the example
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

FileDropper.displayName = 'FileDropper'

export default FileDropper
resume-extraction/components/extracted-values.tsx

import React, { useState } from 'react'

import {
  EducationItem,
  ExperienceItem,
  ResumeValues,
  Skill as SkillInterface
} from '@/lib/resume'
import { Braces, ChevronDown, ChevronRight, X } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { coy } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface ExtractedValuesProps {
  values: ResumeValues | undefined
  loading: boolean
}
const ExtractedValues: React.FC<ExtractedValuesProps> = ({
  values,
  loading
}: ExtractedValuesProps) => {
  const [showJSON, setShowJSON] = useState(false)
  const toggleShowJSON = () => {
    setShowJSON(!showJSON)
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute right-4 top-4 z-10" onClick={toggleShowJSON}>
        {showJSON ? (
          <X
            size={20}
            className="cursor-pointer text-neutral-900 hover:text-neutral-700"
          />
        ) : (
          <Braces
            size={20}
            className="cursor-pointer text-neutral-900 hover:text-neutral-700"
          />
        )}
      </div>
      <div className="bg-white p-8 text-stone-900 h-full overflow-y-scroll rounded-xl">
        <div
          className={`text-sm font-mono overflow-x-scroll h-full overflow-y-scroll rounded-xl ${
            showJSON ? 'h-full' : 'hidden'
          }`}
        >
          {values ? (
            <SyntaxHighlighter
              language="json"
              style={coy}
              customStyle={{
                borderRadius: '0.75rem',
                paddingTop: '16px',
                paddingBottom: '16px',
                marginTop: 0
              }}
            >
              {JSON.stringify(values, null, 2)}
            </SyntaxHighlighter>
          ) : (
            <div className="text-gray-500 text-center mt-6">
              Upload a resume to see the extracted JSON.
            </div>
          )}
        </div>
        <div className={` ${showJSON ? 'hidden' : ''}`}>
          {/* HEADER */}
          <div className="min-h-[100px]">
            {!values?.name ? (
              <div
                className={`h-8 w-48 rounded-md bg-stone-100 ${
                  loading ? 'animate-pulse' : ''
                }`}
              ></div>
            ) : (
              <h2 className="text-lg font-medium text-gray-800">
                {values.name}
              </h2>
            )}
            {!values?.title ? (
              <div
                className={`h-6 w-96 rounded-md bg-stone-100 ${
                  loading ? 'animate-pulse' : ''
                } mt-2`}
              ></div>
            ) : (
              <h3 className="text-gray-600">{values.title}</h3>
            )}
            <div className="flex items-center mt-2">
              {!values?.location ? (
                <>
                  <div
                    className={`h-6 w-28 rounded-md bg-stone-100 ${
                      loading ? 'animate-pulse' : ''
                    } mt-2`}
                  ></div>
                </>
              ) : (
                <div className="text-gray-500 text-xs">{values.location}</div>
              )}
            </div>
          </div>
          {/* CONTACT */}
          <div className="mt-4 text-xs min-h-[100px]">
            <CategoryTitle title="Contact" />
            {!values?.contactInfo ? (
              <>
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex items-center">
                    <div
                      className={`h-6 w-28 rounded-md bg-stone-100 ${
                        loading ? 'animate-pulse' : ''
                      } mt-2`}
                    ></div>
                    <div
                      className={`h-6 w-72 ml-2 rounded-md bg-stone-100 ${
                        loading ? 'animate-pulse' : ''
                      } mt-2`}
                    ></div>
                  </div>
                ))}
              </>
            ) : (
              Object.entries(values.contactInfo || {}).map(
                ([key, value]) =>
                  value && (
                    <LabeledValue
                      key={key}
                      label={key.charAt(0).toUpperCase() + key.slice(1)}
                      value={value}
                    />
                  )
              )
            )}
          </div>
          <Divider />
          {/* WORK EXPERIENCE */}
          <div className="mt-6 min-h-[100px]">
            <CategoryTitle title="Work Experience" />
            {!values?.workExperience ? (
              <>
                {[...Array(2)].map((_, index) => (
                  <div key={index} className="flex items-center">
                    <div
                      className={`h-6 w-28 rounded-md bg-stone-100 ${
                        loading ? 'animate-pulse' : ''
                      } mt-2`}
                    ></div>
                    <div
                      className={`h-6 w-72 ml-2 rounded-md bg-stone-100 ${
                        loading ? 'animate-pulse' : ''
                      } mt-2`}
                    ></div>
                  </div>
                ))}
              </>
            ) : (
              values.workExperience.map((experience, index) => (
                <WorkExperience key={index} experience={experience} />
              ))
            )}
          </div>
          <Divider />
          {/* EDUCATION */}
          <div className="mt-6 min-h-[100px]">
            <CategoryTitle title="Education" />

            {!values?.education ? (
              <>
                {[...Array(2)].map((_, index) => (
                  <div key={index} className="flex items-center">
                    <div
                      className={`h-6 w-28 rounded-md bg-stone-100 ${
                        loading ? 'animate-pulse' : ''
                      } mt-2`}
                    ></div>
                    <div
                      className={`h-6 w-72 ml-2 rounded-md bg-stone-100 ${
                        loading ? 'animate-pulse' : ''
                      } mt-2`}
                    ></div>
                  </div>
                ))}
              </>
            ) : (
              values.education.map((experience, index) => (
                <Education key={index} experience={experience} />
              ))
            )}
          </div>
          <Divider />

          {/* SKILLS */}
          <div className="mt-6">
            <CategoryTitle title="Skills" />
            <div className="flex w-full">
              <div className="flex gap-2 flex-wrap">
                {!values?.skills ? (
                  <>
                    {[...Array(6)].map((_, index) => (
                      <div
                        key={index}
                        className={`flex text-xs px-3 py-1 rounded-full bg-stone-100 text-gray-800 mr-1 w-16 h-6 ${
                          loading ? 'animate-pulse' : ''
                        }`}
                      ></div>
                    ))}
                  </>
                ) : (
                  values.skills.map((skill, index) => (
                    <Skill key={index} skill={skill} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const LabeledValue: React.FC<{ label: string; value: string }> = ({
  label,
  value
}) => {
  return (
    <div className="flex">
      <div className="w-28 mt-2 text-gray-500 font-light">{label}</div>
      <div className="mt-2 text-gray-700">{value}</div>
    </div>
  )
}

const CategoryTitle: React.FC<{ title: string }> = ({ title }) => {
  return <div className="font-medium text-sm mb-3">{title}</div>
}

const Divider: React.FC = () => {
  return <div className="border-b border-gray-200 my-6"></div>
}

const WorkExperience: React.FC<{ experience: ExperienceItem }> = ({
  experience
}) => {
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false)

  const toggleDescription = () => {
    setIsDescriptionVisible(!isDescriptionVisible)
  }

  return (
    <div className="flex items-start text-xs mb-4">
      {!experience?.startYear ? (
        <div className={`h-6 w-28 rounded-md bg-stone-100 mt-2`}></div>
      ) : (
        <div className="text-gray-500 min-w-28">
          <span>{experience.startYear}</span> -{' '}
          <span>{experience?.endYear || 'now'}</span>
        </div>
      )}
      {!experience?.title ? (
        <div className={`h-6 w-72 ml-2 rounded-md bg-stone-100 mt-2`}></div>
      ) : (
        <div className="text-gray-800 flex flex-col items-start min-w-96 overflow-x-clip">
          <div className="flex items-center pb-1 text-nowrap">
            <div>{`${experience.title} at `}</div>
            <div className="border-b border-gray-800 ml-1 text-nowrap">
              {experience.company}
            </div>
            {experience.location && (
              <div className="text-gray-500 ml-1">({experience.location})</div>
            )}
            <div
              onClick={toggleDescription}
              className="ml-2 cursor-pointer text-gray-400"
            >
              {isDescriptionVisible ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </div>
          </div>

          {isDescriptionVisible && experience.description && (
            <div className="text-gray-700 mt-1 text-xs font-light">
              {experience.description}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const Education: React.FC<{ experience: EducationItem }> = ({ experience }) => {
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false)

  const toggleDescription = () => {
    setIsDescriptionVisible(!isDescriptionVisible)
  }

  return (
    <div className="flex items-start text-xs mb-4">
      <div className="text-gray-500 min-w-28">
        {experience.startYear} - {experience.endYear || 'now'}
      </div>
      <div className="text-gray-800 flex flex-col items-start max-w-[500px] overflow-x-clip">
        <div className="flex items-center pb-1  text-nowrap">
          <div>{`${
            experience.degree && experience.institution
              ? experience.degree + ' at '
              : experience.degree || ''
          }`}</div>
          {experience.institution && (
            <div className="border-b border-gray-800 ml-1 text-nowrap">
              {experience.institution}
            </div>
          )}
          {experience.location && (
            <div className="text-gray-500 ml-1">({experience.location})</div>
          )}
          {experience.description && (
            <div
              onClick={toggleDescription}
              className="ml-2 cursor-pointer text-gray-400"
            >
              {isDescriptionVisible ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </div>
          )}
        </div>

        {isDescriptionVisible && experience.description && (
          <div className="text-gray-700 mt-1 text-xs font-light">
            {experience.description}
          </div>
        )}
      </div>
    </div>
  )
}

const Skill: React.FC<{ skill: SkillInterface }> = ({ skill }) => {
  return (
    <div className="flex text-xs py-1 px-2 rounded-full bg-stone-100 text-nowrap text-gray-800 h-6">
      <div>{skill.name}</div>
    </div>
  )
}

export default ExtractedValues
resume-extraction/tailwind.config.ts

import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
resume-extraction/tsconfig.json

{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}