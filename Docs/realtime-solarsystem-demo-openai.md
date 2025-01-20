Realtime Solarsystem Demo OpenAI Token Usage:

GitHub Tokens: 11257
LLM Input Tokens: 0
LLM Output Tokens: 0
Total Tokens: 11257

FileTree:

app/globals.css
app/page.tsx
.gitignore
app/api/session/route.ts
components/app.tsx
components/controls.tsx
components/charts/pie-chart.tsx
components/charts/chart.tsx
components/logs.tsx
components/scene.css
README.md
app/api/iss/route.ts
app/layout.tsx
lib/config.ts
lib/constants.ts
next.config.ts
lib/components-mapping.tsx
components/scene.tsx
tailwind.config.ts
package.json
tsconfig.json

Analysis:
app/globals.css

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
  font-family: Arial, Helvetica, sans-serif;
}
app/page.tsx

import App from "@/components/app";

export default function Main() {
  return (
    <div className="relative size-full">
      <App />
    </div>
  );
}
.gitignore

# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

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
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
app/api/session/route.ts

import { VOICE } from "@/lib/config";
import { MODEL } from "@/lib/constants";

// Get an ephemeral session token from the /realtime/sessions endpoint
export async function GET() {
  try {
    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        voice: VOICE,
      }),
    });

    return new Response(r.body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
components/app.tsx

"use client";

import Controls from "@/components/controls";
import Scene from "@/components/scene";
import Logs from "@/components/logs";
import { useEffect, useRef, useState, useCallback } from "react";
import { INSTRUCTIONS, TOOLS } from "@/lib/config";
import { BASE_URL, MODEL } from "@/lib/constants";

type ToolCallOutput = {
  response: string;
  [key: string]: any;
};

export default function App() {
  const [logs, setLogs] = useState<any[]>([]);
  const [toolCall, setToolCall] = useState<any>(null);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const audioTransceiver = useRef<RTCRtpTransceiver | null>(null);
  const tracks = useRef<RTCRtpSender[] | null>(null);

  // Start a new realtime session
  async function startSession() {
    try {
      if (!isSessionStarted) {
        setIsSessionStarted(true);
        // Get an ephemeral session token
        const session = await fetch("/api/session").then((response) =>
          response.json()
        );
        const sessionToken = session.client_secret.value;
        const sessionId = session.id;

        console.log("Session id:", sessionId);

        // Create a peer connection
        const pc = new RTCPeerConnection();

        // Set up to play remote audio from the model
        if (!audioElement.current) {
          audioElement.current = document.createElement("audio");
        }
        audioElement.current.autoplay = true;
        pc.ontrack = (e) => {
          if (audioElement.current) {
            audioElement.current.srcObject = e.streams[0];
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        stream.getTracks().forEach((track) => {
          const sender = pc.addTrack(track, stream);
          if (sender) {
            tracks.current = [...(tracks.current || []), sender];
          }
        });

        // Set up data channel for sending and receiving events
        const dc = pc.createDataChannel("oai-events");
        setDataChannel(dc);

        // Start the session using the Session Description Protocol (SDP)
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const sdpResponse = await fetch(`${BASE_URL}?model=${MODEL}`, {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "Content-Type": "application/sdp",
          },
        });

        const answer: RTCSessionDescriptionInit = {
          type: "answer",
          sdp: await sdpResponse.text(),
        };
        await pc.setRemoteDescription(answer);

        peerConnection.current = pc;
      }
    } catch (error) {
      console.error("Error starting session:", error);
    }
  }

  // Stop current session, clean up peer connection and data channel
  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }

    setIsSessionStarted(false);
    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
    }
    setAudioStream(null);
    setIsListening(false);
    audioTransceiver.current = null;
  }

  // Grabs a new mic track and replaces the placeholder track in the transceiver
  async function startRecording() {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      setAudioStream(newStream);

      // If we already have an audioSender, just replace its track:
      if (tracks.current) {
        const micTrack = newStream.getAudioTracks()[0];
        tracks.current.forEach((sender) => {
          sender.replaceTrack(micTrack);
        });
      } else if (peerConnection.current) {
        // Fallback if audioSender somehow didn't get set
        newStream.getTracks().forEach((track) => {
          const sender = peerConnection.current?.addTrack(track, newStream);
          if (sender) {
            tracks.current = [...(tracks.current || []), sender];
          }
        });
      }

      setIsListening(true);
      console.log("Microphone started.");
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  }

  // Replaces the mic track with a placeholder track
  function stopRecording() {
    setIsListening(false);

    // Stop existing mic tracks so the user’s mic is off
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
    }
    setAudioStream(null);

    // Replace with a placeholder (silent) track
    if (tracks.current) {
      const placeholderTrack = createEmptyAudioTrack();
      tracks.current.forEach((sender) => {
        sender.replaceTrack(placeholderTrack);
      });
    }
  }

  // Creates a placeholder track that is silent
  function createEmptyAudioTrack(): MediaStreamTrack {
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();
    return destination.stream.getAudioTracks()[0];
  }

  // Send a message to the model
  const sendClientEvent = useCallback(
    (message: any) => {
      if (dataChannel) {
        message.event_id = message.event_id || crypto.randomUUID();
        dataChannel.send(JSON.stringify(message));
      } else {
        console.error(
          "Failed to send message - no data channel available",
          message
        );
      }
    },
    [dataChannel]
  );

  // Attach event listeners to the data channel when a new one is created
  useEffect(() => {
    async function handleToolCall(output: any) {
      const toolCall = {
        name: output.name,
        arguments: output.arguments,
      };
      console.log("Tool call:", toolCall);
      setToolCall(toolCall);

      // TOOL CALL HANDLING
      // Initialize toolCallOutput with a default response
      const toolCallOutput: ToolCallOutput = {
        response: `Tool call ${toolCall.name} executed successfully.`,
      };

      // Handle special tool calls
      if (toolCall.name === "get_iss_position") {
        const issPosition = await fetch("/api/iss").then((response) =>
          response.json()
        );
        console.log("ISS position:", issPosition);
        toolCallOutput.issPosition = issPosition;
      }

      sendClientEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: output.call_id,
          output: JSON.stringify(toolCallOutput),
        },
      });

      // Force a model response to make sure it responds after certain tool calls
      if (
        toolCall.name === "get_iss_position" ||
        toolCall.name === "display_data"
      ) {
        sendClientEvent({
          type: "response.create",
        });
      }
    }

    if (dataChannel) {
      // Append new server events to the list
      dataChannel.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        if (event.type === "response.done") {
          const output = event.response.output[0];
          setLogs((prev) => [output, ...prev]);
          if (output?.type === "function_call") {
            handleToolCall(output);
          }
        }
      });

      // Set session active when the data channel is opened
      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setIsListening(true);
        setLogs([]);
        // Send session config
        const sessionUpdate = {
          type: "session.update",
          session: {
            tools: TOOLS,
            instructions: INSTRUCTIONS,
          },
        };
        sendClientEvent(sessionUpdate);
        console.log("Session update sent:", sessionUpdate);
      });
    }
  }, [dataChannel, sendClientEvent]);

  const handleConnectClick = async () => {
    if (isSessionActive) {
      console.log("Stopping session.");
      stopSession();
    } else {
      console.log("Starting session.");
      startSession();
    }
  };

  const handleMicToggleClick = async () => {
    if (isListening) {
      console.log("Stopping microphone.");
      stopRecording();
    } else {
      console.log("Starting microphone.");
      startRecording();
    }
  };

  return (
    <div className="relative size-full">
      <Scene toolCall={toolCall} />
      <Controls
        handleConnectClick={handleConnectClick}
        handleMicToggleClick={handleMicToggleClick}
        isConnected={isSessionActive}
        isListening={isListening}
      />
      <Logs messages={logs} />
    </div>
  );
}
components/controls.tsx

import React from "react";
import { Mic, MicOff, Wifi } from "lucide-react";

interface ControlsProps {
  isConnected: boolean;
  isListening: boolean;
  handleConnectClick: () => void;
  handleMicToggleClick: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  isConnected,
  isListening,
  handleConnectClick,
  handleMicToggleClick,
}) => {
  return (
    <div className="absolute top-4 right-4 flex items-center z-10">
      <div
        className="flex bg-slate-800 p-2.5 items-center rounded-full mr-2 cursor-pointer"
        onClick={handleConnectClick}
      >
        <Wifi
          className={`h-6 w-6 ${
            isConnected ? "text-green-500" : "text-red-500"
          }`}
        />
      </div>
      <div
        className={`flex bg-slate-800 p-2.5 items-center rounded-full ${
          isConnected ? "cursor-pointer" : "cursor-not-allowed"
        }`}
        onClick={handleMicToggleClick}
      >
        {isListening ? (
          <Mic className="h-6 w-6 text-green-500" />
        ) : (
          <MicOff className="h-6 w-6 text-red-500" />
        )}
      </div>
    </div>
  );
};

export default Controls;
components/charts/pie-chart.tsx

"use client";

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface DataItem {
  label: string;
  value: string;
}

export interface Component {
  title: string;
  text?: string;
  chart: string;
  data: DataItem[];
}

const chartColors = ["#00BFFF", "#e1a95f", "#FF4500", "#FFE66D"];

const getChartData = (data: any) => {
  return {
    labels: data?.map((item: any) => item.label) || [],
    datasets: [
      {
        data: data?.map((item: any) => parseFloat(item.value)) || [],
        backgroundColor: chartColors,
      },
    ],
  };
};

export function PieChartComponent({ title, data }: Component) {
  const chartData = getChartData(data);

  return (
    <div className="flex flex-col justify-center items-center">
      <h1 className="text-white mb-2 font-medium text-xl">{title}</h1>
      <Pie data={chartData} />
    </div>
  );
}
components/charts/chart.tsx

"use client";
import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

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
  );
});
ChartContainer.displayName = "Chart";

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  );

  if (!colorConfig.length) {
    return null;
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
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean;
      hideIndicator?: boolean;
      indicator?: "line" | "dot" | "dashed";
      nameKey?: string;
      labelKey?: string;
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }

      const [item] = payload;
      const key = `${labelKey || item.dataKey || item.name || "value"}`;
      const itemConfig = getPayloadConfigFromPayload(config, item, key);
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label;

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        );
      }

      if (!value) {
        return null;
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>;
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ]);

    if (!active || !payload?.length) {
      return null;
    }

    const nestLabel = payload.length === 1 && indicator !== "dot";

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            const indicatorColor = color || item.payload.fill || item.color;

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
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
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
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
            );
          })}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltip";

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean;
      nameKey?: string;
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart();

    if (!payload?.length) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          );
        })}
      </div>
    );
  }
);
ChartLegendContent.displayName = "ChartLegend";

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string;
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config];
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
components/logs.tsx

import React, { useState } from "react";
import { CodeXml, SidebarClose } from "lucide-react";

interface LogsProps {
  messages: any[];
}

const Logs: React.FC<LogsProps> = ({ messages }) => {
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  const toggleConsole = () => {
    setIsConsoleOpen(!isConsoleOpen);
  };

  return (
    <div className="absolute top-4 left-4">
      <div
        onClick={toggleConsole}
        className="cursor-pointer bg-slate-800 text-white rounded-full p-2.5 flex items-center justify-center"
      >
        <CodeXml size={24} />
      </div>
      <div
        className={`fixed top-0 left-0 h-screen bg-slate-900 font-mono text-white transform ${
          isConsoleOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out`}
        style={{ width: "350px" }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Logs</h2>
            <SidebarClose onClick={toggleConsole} />
          </div>
          <div className="h-[90vh] overflow-x-scroll overflow-y-scroll">
            <pre className="mt-4 text-xs">
              {messages.map((message, index) => (
                <div key={index} className="mb-2">
                  <pre>{JSON.stringify(message, null, 2)}</pre>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;
components/scene.css

.scene-bg {
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle, #1b2735, #090a0f);
}
README.md

Realtime Solar System Demo

This demo showcases how to use the OpenAI Realtime API to interact through voice with a 3D scene (built with Spline), in this case a scene representing the solar system.

It is implemented using the Realtime + WebRTC integration and uses Function Calling to trigger actions in the app.

How to use

Running the application

Set up the OpenAI API:

If you're new to the OpenAI API, sign up for an account.
Follow the Quickstart to retrieve your API key.
Clone the Repository:

git clone https://github.com/openai/openai-realtime-solar-system.git
Set your API key:

2 options:

Set the OPENAI_API_KEY environment variable globally in your system
Set the OPENAI_API_KEY environment variable in the project:
Create a .env file at the root of the project and add the following line:
OPENAI_API_KEY=<your_api_key>
Install dependencies:

Navigate to the project directory and run:

npm install
Run the app:

npm run dev
The app will be available at http://localhost:3000.

Note: the 1st time you load the app, the scene can take a while to load (it's heavy!). The subsequent loads should be faster as it will be cached.

Starting a session

To start a new Realtime session, wait for a few seconds for the page to load properly, thenclick on the wifi icon in the top right corner of the app.
Once it turns green, you can start talking to the model.

You can use the mic icon right next to it to toggle the microphone on and off. When you start the session, it will automatically turn on, but you can turn it off to mute yourself while the session is running.

Toggling the wifi icon will stop the session, and the conversation will be reset.

Demo flow

Make sure there is no background noise or echo when you talk to the model, as this may cause interruptions.

The demo is configured with instructions prompting the model to answer any question about the solar system. Additionally, the model has access to multiple tools that map to actions in the app or animations in the spline scene.

Configured interactions

More specifically, the following interactions trigger animations:

🪐 Asking about a specific planet will trigger a visual focus on that planet if the animation was set up in the spline scene (works with the Sun, Earth, Mercury, Mars, Jupiter, Saturn, Neptune, Pluto). These animations can also be triggered by clicking on the planets in the UI.

🌕 Asking about moons will trigger the moons to appear if they have been set up in the spline scene (works with Pluto's moons and Jupiter's galilean moons).

📊 Asking about data that can be represented with a chart will result in a chart being displayed in the UI (bar chart or pie chart).

🛰️ Asking about the position of the ISS will result in the ISS position being fetched and the ISS being displayed in the spline scene with the corresponding animation.

👋 Saying something like "thank you, I'm good" or anything to close the conversation will reset the camera to the initial position. This animation can also be triggered by hitting the space bar.

🌌 Asking about the planets' orbits will result in a camera change to see the solar system from above. This animation can also be triggered by hitting the M key to change to orbit view, and pressing the Enter key to change back to main view.

For more details about tools used by the model, see the lib/config.ts file.

Example flow

Here is an example flow that showcases the different interactions:

Say something like "I'm curious about Earth" to focus on Earth
Ask for the distribution of land vs water - a pie chart should appear, if not prompt the model to show it to you
Say something like "I have a question about Mars now" to focus on Mars
Ask for the highest volcano and how it compares to Mount Everest - a bar chart should appear, if not prompt the model to show it to you
Say something like "thank you, I'm good" to reset the camera
Ask where the ISS is - the model should reply with the position and the ISS should appear in the scene
Say that you'd like to see Pluto now to focus on Pluto
Ask about its moons - 5 moons will pop up
(optional): Do the same with Jupiter and ask about Galilean moons - 4 moons will pop up
Ask something related to the position of the planets in the solar system, for example "how are the planets positioned in their orbits" - The view will change to a high level view with orbits
Customization

This demo is just an example of how to use Function Calling with the Realtime API to trigger actions in an application, including sending events to a spline scene.

You can read more about how to build your own scene in the Spline documentation. You can then change the scene url in the components/scene.tsx file.

<Spline
  scene="https://prod.spline.design/<scene_id>/scene.splinecode"
  onLoad="{onLoad}"
/>
If you want to use your own scene, make sure to configure trigger events in the spline scene, and update the code to trigger the events in the components/scene.tsx file.

For example, you can add to any object in your scene a mouseDown event that will trigger an animation. You can then trigger this event in the components/scene.tsx file by calling spline.current.emitEvent("mouseDown", "object_name").

You can also update:

The instructions in the lib/config.ts file to change the behavior of the model
The tools the model has access to in the lib/config.ts file
The voice in the lib/constants.ts file
License

This project is licensed under the MIT License. See the LICENSE file for details.

app/api/iss/route.ts

// Fetch the ISS position
export async function GET() {
  try {
    const response = await fetch("http://api.open-notify.org/iss-now.json");
    if (!response.ok) {
      console.error("Failed to fetch ISS position", response);
      return new Response(
        JSON.stringify({ error: "Failed to fetch ISS position" }),
        {
          status: response.status,
        }
      );
    }
    const data = await response.json();
    console.log("ISS position:", data.iss_position);
    return new Response(JSON.stringify(data.iss_position), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch ISS location:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solar System",
  description: "Realtime API demo",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
lib/config.ts

const PLANETS = [
  "Sun",
  "Mercury",
  "Venus",
  "Earth",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
];

const MOONS = [
  "Io",
  "Europa",
  "Ganymede",
  "Callisto",
  "Kerberos",
  "Styx",
  "Nix",
  "Hydra",
  "Charon",
];

const toolsDefinition = [
  {
    name: "focus_planet",
    description: "Focus on a specific planet, when the user is asking about it",
    parameters: {
      type: "object",
      properties: {
        planet: {
          type: "string",
          enum: PLANETS,
          description: "The name of the planet to focus on",
        },
      },
      required: ["planet"],
    },
  },
  {
    name: "display_data",
    description:
      "Display a chart to summarize the answer with data points. Respond to the user before calling this tool, and call this as soon as there is numeric data to be displayed.",
    parameters: {
      type: "object",
      properties: {
        chart: {
          type: "string",
          enum: ["bar", "pie"],
          description: "The most appropriate chart to use",
        },
        title: {
          type: "string",
          description:
            "The title of the response that will be displayed above the chart, be concise",
        },
        text: {
          type: "string",
          description:
            "Optional text to display above the chart for more context, empty if unnecessary",
        },
        data: {
          type: "array",
          description: "data to display in the component, empty array if N/A",
          items: {
            type: "object",
            properties: {
              label: {
                type: "string",
                description: "Data item label",
              },
              value: {
                type: "string",
                description: "Data item value",
              },
            },
            required: ["label", "value"],
            additionalProperties: false,
          },
        },
      },
    },
  },
  {
    name: "reset_camera",
    description:
      "When the user says that they're done, for example 'thank you, i'm ok', zoom out of a planet focus and reset the camera to the initial position",
    parameters: {},
  },
  {
    name: "show_orbit",
    description:
      "Show planets orbits when there's a question related to to the position of the planet in the solar system",
    parameters: {},
  },
  {
    name: "show_moons",
    description: "Show a list of moons",
    parameters: {
      type: "object",
      properties: {
        moons: {
          type: "array",
          items: {
            type: "string",
            enum: MOONS,
          },
        },
      },
      required: ["moons"],
    },
  },
  {
    name: "get_iss_position",
    description: "Get the ISS position and once you have it, say it out loud",
    parameters: {},
  },
];

export const TOOLS = toolsDefinition.map((tool) => ({
  type: "function",
  ...tool,
}));

export const INSTRUCTIONS = `
You are an assistant helping users navigate a 3D solar system and understand the planets and their orbits.

As soon as the user starts talking about a specific planet, use the focus_planet tool to zoom in on that planet.
When they stop talking about it and ask about another topic, there's no need to focus on it anymore, so call the reset_camera tool to reset the camera position to view the whole solar system.

Answer any question they have about the solar system, and if they have a specific question that you can answer with numbers, respond to the question and then display a chart to them using the display_data tool to show the summary of the answer on the screen. For example, if they ask about a comparison of heights, show them a bar chart. If they ask about the repartition or distribution of elements, show them a pie chart.
Call the display_data tool to display the response, then say the response out loud. For example, if they ask a question that can be answered with a chart (distribution of elements, comparison of numbers), first call the display_data tool to show the chart,then say out loud what you are showing in the chart.

If they ask about something related to the position of the planets in the solar system, use the show_orbit tool to see a view from above.

If they ask about moons, talk about them and then call the show_moons tool to display a list of moons.

When they say something like "thank you, I'm ok" or something meaning that they're done with the questions and there's no need to continue the conversation, call the reset_camera tool.
Do not call this tool if the user hasn't specifically said something that should trigger the camera reset. 

Whenever you can, call a tool after responding if it makes sense.

Be friendly but not overly excited, and imagine you're talking to students learning in a classroom.
Be very concise in your answers, and speak fast. Don't add unnecessary details that the user hasn't asked for.

If speaking in another language, use a native accent.
`;

export const VOICE = "coral";
lib/constants.ts

export const MODEL = "gpt-4o-realtime-preview";
export const BASE_URL = "https://api.openai.com/v1/realtime";
next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
lib/components-mapping.tsx

"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartConfig, ChartContainer } from "@/components/charts/chart";
import React from "react";
import { PieChartComponent } from "@/components/charts/pie-chart";

interface DataItem {
  label: string;
  value: string;
}

export interface Component {
  title: string;
  text?: string;
  chart: string;
  data: DataItem[];
}

const chartColors = ["#00BFFF", "#e1a95f", "#FF4500", "#FFE66D"];

const formatKey = (key: string) =>
  key.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");

const getChartConfig = (data: any) => {
  const config: ChartConfig = {};
  if (data?.length > 0) {
    data.forEach((item: any) => {
      config[formatKey(item.label)] = {
        label: item.label,
        color: "#ffffff",
      };
    });
  }

  return config;
};

const getChartData = (data: any, chartType: string) => {
  return data?.map((item: any, index: number) => ({
    id: formatKey(item.label),
    label: item.label,
    value: parseFloat(item.value),
    fill:
      chartType === "pie" ? chartColors[index % chartColors.length] : "#ffffff",
  }));
};

export const getComponent = (component: Component) => {
  console.log("get component", component);
  const chartData = getChartData(component?.data, component.chart);
  const chartConfig = getChartConfig(chartData);

  switch (component.chart) {
    case "pie":
      return (
        <PieChartComponent
          title={component.title}
          text={component.text}
          chart={component.chart}
          data={component.data}
        />
      );
    case "bar":
      return (
        <div>
          <h1 className="text-white font-bold text-xl">{component.title}</h1>
          <ChartContainer config={chartConfig}>
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 7)}
              />
              <Bar dataKey="value" fill={chartColors[0]} radius={8} />
            </BarChart>
          </ChartContainer>
        </div>
      );

    default:
      return null;
  }
};
components/scene.tsx

import Spline from "@splinetool/react-spline";
import React, { useEffect, useState, useRef } from "react";
import type { Application } from "@splinetool/runtime";
import "./scene.css";
import { getComponent } from "@/lib/components-mapping";

interface ToolCall {
  name: string;
  arguments: any;
}

interface SceneProps {
  toolCall: ToolCall;
}

const Scene: React.FC<SceneProps> = ({ toolCall }) => {
  const spline = useRef<Application | null>(null);
  const [currentCamera, setCurrentCamera] = useState<string>("main");
  const [displayComponent, setDisplayComponent] =
    useState<React.ReactNode | null>(null);

  // Set the Spline scene on load
  const onLoad = (splineApp: Application) => {
    spline.current = splineApp;
  };

  // Keydown listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Reset UI when "d" key is pressed, to clear data without tool calls from the model
      if (event.code === "d") {
        setDisplayComponent(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Tool calls handling
  useEffect(() => {
    if (!toolCall) return;

    // Parse arguments
    const { name, arguments: toolArgs } = toolCall;
    let args: any = {};
    try {
      args = JSON.parse(toolArgs);
    } catch (error) {
      console.error("Failed to parse toolCall arguments:", error);
      return;
    }

    // Trigger animation in spline for a given object
    // The mouseDown events need to be set up in the spline scene
    function triggerAnimation(objectName: string) {
      if (spline.current) {
        try {
          spline.current.emitEvent("mouseDown", objectName);
        } catch (error) {
          console.error("Failed to trigger animation:", error);
        }
      }
    }

    function displayData() {
      try {
        const { chart, title, text, data } = JSON.parse(toolCall.arguments);
        const component = getComponent({ chart, title, text, data });
        setDisplayComponent(component || null);
      } catch (error) {
        console.error("Failed to parse toolCall arguments:", error);
      }
    }

    // Show moons in sequence
    async function showMoons(moons: string[]) {
      for (const moon of moons) {
        triggerAnimation(moon);
        // small delay to make the moons appear sequentially
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    function resetCamera() {
      console.log("Resetting camera to initial position");
      triggerAnimation("trigger_reset");
      if (currentCamera !== "main") {
        triggerAnimation("trigger_camera_main");
        setCurrentCamera("main");
      }
    }

    // Reset UI before handling a tool call
    setDisplayComponent(null);

    switch (name) {
      case "focus_planet":
        triggerAnimation(args.planet);
        break;

      case "display_data":
        displayData();
        break;

      case "show_moons":
        showMoons(args.moons);
        break;

      case "get_iss_position":
        triggerAnimation("ISS");
        break;

      case "reset_camera":
        resetCamera();
        break;

      case "show_orbit":
        triggerAnimation("trigger_camera_high_level");
        setCurrentCamera("high_level");
        break;

      default:
        // No matching toolCall
        break;
    }
  }, [toolCall, currentCamera]);

  return (
    <div className="size-full relative scene-bg">
      <Spline
        scene="https://prod.spline.design/yH4ADQUBzWTJ2ITk/scene.splinecode"
        onLoad={onLoad}
      />

      {displayComponent && (
        <div className="absolute top-0 text-white right-16 h-full flex items-center justify-center">
          {displayComponent}
        </div>
      )}
    </div>
  );
};

export default Scene;
tailwind.config.ts

import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
} satisfies Config;
package.json

{
  "name": "realtime-solar-system",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@splinetool/react-spline": "^4.0.0",
    "@splinetool/runtime": "^1.9.57",
    "chart.js": "^4.4.7",
    "lucide-react": "^0.469.0",
    "next": "15.1.3",
    "react": "^19.0.0",
    "react-chartjs-2": "^5.3.0",
    "react-dom": "^19.0.0",
    "recharts": "^2.15.0",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.1.3",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
tsconfig.json

{
  "compilerOptions": {
    "target": "ES2017",
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