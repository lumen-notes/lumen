import * as Portal from "@radix-ui/react-portal"
import { useAtom } from "jotai"
import { atomWithMachine } from "jotai-xstate"
import type {
  RealtimeClientEvent,
  RealtimeServerEvent,
} from "openai/resources/beta/realtime/realtime"
import React from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { useNetworkState } from "react-use"
import { useDebouncedCallback } from "use-debounce"
import { assign, createMachine } from "xstate"
import { ZodSchema } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"
import { OPENAI_KEY_STORAGE_KEY } from "../global-state"
import { useMousePosition } from "../hooks/mouse-position"
import { cx } from "../utils/cx"
import { notificationOffSound, notificationSound } from "../utils/sounds"
import { validateOpenAIKey } from "../utils/validate-openai-key"
import { AssistantActivityIndicator } from "./assistant-activity-indicator"
import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import {
  HeadphonesIcon16,
  LoadingIcon16,
  MicFillIcon16,
  MicIcon16,
  MicMuteFillIcon16,
  MicMuteIcon16,
  TriangleDownIcon8,
  XIcon16,
} from "./icons"
import { MicVisualizer } from "./mic-visualizer"
import { toast } from "./toast"
import voiceConversationPrompt from "./voice-conversation.prompt.md?raw"

export type Tool<T> = {
  name: string
  description: string
  parameters: ZodSchema<T>
  execute: (args: T) => Promise<string | void>
}

export const voiceConversationMachineAtom = atomWithMachine(createVoiceConversationMachine)

export function VoiceConversationButton() {
  const [state, send] = useAtom(voiceConversationMachineAtom)
  const { online } = useNetworkState()

  // Stop the conversation when the user goes offline
  React.useEffect(() => {
    function handleOffline() {
      send("END")
    }

    window.addEventListener("offline", handleOffline)
    return () => window.removeEventListener("offline", handleOffline)
  }, [send])

  if (state.matches("active.ready")) {
    return (
      <AssistantActivityIndicator
        state={
          state.matches("active.ready.assistant.thinking")
            ? "thinking"
            : state.matches("active.ready.assistant.speaking")
              ? "speaking"
              : "idle"
        }
      >
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <IconButton
              size="small"
              aria-label="Conversation actions"
              disableTooltip
              className={cx(
                "!text-[#fff] eink:!bg-text eink:!text-bg rounded-full",
                state.matches("active.ready.mic.muted")
                  ? "!bg-[var(--red-9)]"
                  : "!bg-[var(--green-9)]",
              )}
              disabled={state.matches("active.initializing")}
            >
              <div className="flex items-center gap-1.5 coarse:gap-2">
                {state.matches("active.ready.mic.muted") ? (
                  <MicMuteFillIcon16 />
                ) : (
                  <div className="flex items-center gap-1 coarse:gap-1.5">
                    <MicFillIcon16 />
                    <MicVisualizer />
                  </div>
                )}
                <TriangleDownIcon8 />
              </div>
            </IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item
              icon={state.matches("active.ready.mic.muted") ? <MicIcon16 /> : <MicMuteIcon16 />}
              onSelect={() => {
                if (state.matches("active.ready.mic.muted")) {
                  send("UNMUTE_MIC")
                } else {
                  send("MUTE_MIC")
                }
              }}
            >
              {state.matches("active.ready.mic.muted") ? "Unmute microphone" : "Mute microphone"}
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item icon={<XIcon16 />} variant="danger" onSelect={() => send("END")}>
              End conversation
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </AssistantActivityIndicator>
    )
  }

  return (
    <IconButton
      size="small"
      aria-label="Start conversation with AI"
      tooltipAlign="end"
      disabled={!online || state.matches("active.initializing")}
      onClick={() => send("START")}
    >
      {state.matches("active.initializing") ? <LoadingIcon16 /> : <HeadphonesIcon16 />}
    </IconButton>
  )
}

export function FloatingConversationInput() {
  const [state, send] = useAtom(voiceConversationMachineAtom)
  const mousePosition = useMousePosition()
  const inputRef = React.useRef<HTMLDivElement>(null)
  const [isInputVisible, setIsInputVisible] = React.useState(false)

  const debouncedSendText = useDebouncedCallback((text: string) => {
    send({ type: "SEND_TEXT", text })
  }, 1000)

  useHotkeys(
    "/",
    () => {
      setIsInputVisible(true)
      setTimeout(() => inputRef.current?.focus())
    },
    {
      enabled: state.matches("active"),
      preventDefault: true,
    },
  )

  if (state.matches("active.ready") && isInputVisible && mousePosition.x && mousePosition.y) {
    return (
      <Portal.Root>
        <div
          ref={inputRef}
          role="textbox"
          contentEditable
          tabIndex={0}
          spellCheck={false}
          className={cx(
            "fixed z-30 max-w-xs translate-x-4 translate-y-4 rounded-[18px] bg-[var(--cyan-9)] py-2 pl-4 pr-6 leading-5 text-[#fff] outline-none selection:bg-[rgba(255,255,255,0.2)] selection:text-[#fff] empty:before:text-[rgba(255,255,255,0.8)] empty:before:content-[attr(data-placeholder)]",
            "eink:bg-text eink:text-bg eink:shadow-none eink:selection:bg-bg eink:selection:text-text eink:empty:before:text-bg",
          )}
          style={{
            top: mousePosition.y,
            left: mousePosition.x,
          }}
          data-placeholder="Say something…"
          onInput={(event) => {
            const text = (event.target as HTMLDivElement).textContent || ""
            debouncedSendText(text)
          }}
          onBlur={() => {
            setIsInputVisible(false)
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsInputVisible(false)
            }
          }}
        />
      </Portal.Root>
    )
  }

  return null
}

type VoiceConversationEvent =
  | {
      type: "ADD_TOOLS"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: Array<Tool<any>>
    }
  | {
      type: "REMOVE_TOOLS"
      toolNames: Array<string>
    }
  | {
      type: "START"
    }
  | {
      type: "END"
    }
  | {
      type: "SESSION_CREATED"
      microphoneStream: MediaStream | undefined
      sendClientEvent: (clientEvent: RealtimeClientEvent) => void
    }
  | {
      type: "USER_SPEECH_STARTED"
    }
  | {
      type: "USER_SPEECH_STOPPED"
    }
  | {
      type: "ASSISTANT_THINKING_STARTED"
    }
  | {
      type: "ASSISTANT_THINKING_STOPPED"
    }
  | {
      type: "ASSISTANT_SPEECH_STARTED"
    }
  | {
      type: "ASSISTANT_SPEECH_STOPPED"
    }
  | {
      type: "SEND_TEXT"
      text: string
    }
  | {
      type: "ROUTE_CHANGED"
      path: string
    }
  | {
      type: "TOOL_CALLS"
      toolCalls: Array<{
        callId: string
        name: string
        args: string
      }>
    }
  | {
      type: "MUTE_MIC"
    }
  | {
      type: "UNMUTE_MIC"
    }
  | {
      type: "ERROR"
      message: string
    }

type VoiceConversationContext = {
  tools: Array<Tool<unknown>>
  microphoneStream: MediaStream | undefined
  sendClientEvent: (clientEvent: RealtimeClientEvent) => void
}

const SERVER_EVENT_LABEL = [
  "%c[server event]",
  "color: black; background: yellow; border-radius: 2px",
]

const CLIENT_EVENT_LABEL = [
  "%c[client event]",
  "color: black; background: violet; border-radius: 2px",
]

const TOOL_CALL_LABEL = ["%c[tool call]", "color: black; background: cyan; border-radius: 2px"]

function createVoiceConversationMachine() {
  return createMachine(
    {
      id: "voiceConversation",
      tsTypes: {} as import("./voice-conversation.typegen").Typegen0,
      schema: {} as {
        events: VoiceConversationEvent
        context: VoiceConversationContext
      },
      context: {
        tools: [],
        microphoneStream: undefined,
        sendClientEvent: () => {},
      },
      initial: "inactive",
      states: {
        inactive: {
          on: {
            ADD_TOOLS: {
              actions: "addToolsToContext",
            },
            REMOVE_TOOLS: {
              actions: "removeToolsFromContext",
            },
            START: "active",
          },
        },
        active: {
          invoke: {
            src: "session",
          },
          on: {
            END: {
              target: "inactive",
              actions: "playEndSound",
            },
            ERROR: {
              target: "inactive",
              actions: "alertError",
            },
          },
          initial: "initializing",
          states: {
            initializing: {
              on: {
                ADD_TOOLS: {
                  actions: "addToolsToContext",
                },
                REMOVE_TOOLS: {
                  actions: "removeToolsFromContext",
                },
                SESSION_CREATED: {
                  target: "ready",
                  actions: [
                    assign({
                      microphoneStream: (context, event) => event.microphoneStream,
                      sendClientEvent: (context, event) => event.sendClientEvent,
                    }),
                    "playReadySound",
                  ],
                },
              },
            },
            ready: {
              entry: ["updateSessionWithTools", "initiateConversation"],
              on: {
                SEND_TEXT: {
                  actions: "sendText",
                },
                ADD_TOOLS: {
                  actions: ["addToolsToContext", "updateSessionWithTools"],
                },
                REMOVE_TOOLS: {
                  actions: ["removeToolsFromContext", "updateSessionWithTools"],
                },
                TOOL_CALLS: {
                  actions: "executeToolCalls",
                },
                ROUTE_CHANGED: {
                  actions: "sendNavigationEvent",
                },
              },
              type: "parallel",
              states: {
                user: {
                  initial: "idle",
                  states: {
                    idle: {
                      on: {
                        USER_SPEECH_STARTED: "speaking",
                      },
                    },
                    speaking: {
                      on: {
                        USER_SPEECH_STOPPED: "idle",
                      },
                    },
                  },
                },
                assistant: {
                  initial: "listening",
                  states: {
                    listening: {
                      on: {
                        ASSISTANT_THINKING_STARTED: "thinking",
                      },
                    },
                    thinking: {
                      on: {
                        USER_SPEECH_STARTED: "listening",
                        ASSISTANT_THINKING_STOPPED: "listening",
                        ASSISTANT_SPEECH_STARTED: "speaking",
                      },
                    },
                    speaking: {
                      on: {
                        USER_SPEECH_STARTED: "listening",
                        ASSISTANT_SPEECH_STOPPED: "listening",
                      },
                    },
                  },
                },
                mic: {
                  initial: "unmuted",
                  states: {
                    unmuted: {
                      on: {
                        MUTE_MIC: {
                          target: "muted",
                          actions: "muteMicrophone",
                        },
                      },
                    },
                    muted: {
                      on: {
                        UNMUTE_MIC: {
                          target: "unmuted",
                          actions: "unmuteMicrophone",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      actions: {
        addToolsToContext: assign({
          tools: (context, event) => context.tools.concat(event.tools),
        }),
        removeToolsFromContext: assign({
          tools: (context, event) =>
            context.tools.filter((tool) => !event.toolNames.includes(tool.name)),
        }),
        updateSessionWithTools: (context) => {
          context.sendClientEvent({
            type: "session.update",
            session: {
              tools: context.tools.map((tool) => ({
                type: "function",
                name: tool.name,
                description: tool.description,
                parameters: zodToJsonSchema(tool.parameters),
              })),
            },
          })
        },
        initiateConversation: async (context) => {
          // Get custom instructions from the user
          const readNote = context.tools.find((tool) => tool.name === "read_note")
          const customInstructions = await readNote?.execute({
            noteId: ".lumen/voice-instructions",
          })

          // Inject custom instructions into the system prompt
          const systemInstructions = voiceConversationPrompt.replace(
            "{{CUSTOM_INSTRUCTIONS}}",
            customInstructions || "",
          )

          // Send system instructions
          context.sendClientEvent({
            type: "session.update",
            session: {
              instructions: systemInstructions,
            },
          })

          const currentPath = window.location.pathname
          const readCurrentNote = context.tools.find((tool) => tool.name === "read_current_note")
          const note = await readCurrentNote?.execute({})

          // Send information about the user's current context
          context.sendClientEvent({
            type: "conversation.item.create",
            item: {
              type: "message",
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: `${
                    note
                      ? `I'm currently viewing this note: ${note}`
                      : `I'm currently on the ${currentPath} page.`
                  }\n\nStart the conversation by using that context to provide a brief, relevant greeting followed by asking how you can help. Keep your greeting short; only one sentence.\n\nIMPORTANT:If the user has provided custom instructions about how to start the conversation, follow those instructions instead.`,
                },
              ],
            },
          })

          context.sendClientEvent({ type: "response.create" })
        },
        executeToolCalls: async (context, event) => {
          for (const toolCall of event.toolCalls) {
            const tool = context.tools.find((tool) => tool.name === toolCall.name)
            if (!tool) return

            if (import.meta.env.DEV) {
              toast({ message: <span className="font-mono">{tool.name}</span> })
              console.log(...TOOL_CALL_LABEL, toolCall.name, toolCall.args)
            }

            const output = await tool.execute(tool.parameters.parse(JSON.parse(toolCall.args)))

            if (output) {
              context.sendClientEvent({
                type: "conversation.item.create",
                item: {
                  type: "function_call_output",
                  call_id: toolCall.callId,
                  output,
                },
              })

              context.sendClientEvent({ type: "response.create" })
            }
          }
        },
        sendText: (context, event) => {
          // Don't send empty messages
          if (!event.text) {
            return
          }

          context.sendClientEvent({
            type: "conversation.item.create",
            item: {
              type: "message",
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: event.text,
                },
              ],
            },
          })

          // Trigger a response from the assistant
          context.sendClientEvent({ type: "response.create" })
        },
        sendNavigationEvent: async (context, event) => {
          const noteId = /\/notes\/(.*)/.exec(event.path)?.[1] ?? null
          const readNote = context.tools.find((tool) => tool.name === "read_note")
          const note = noteId ? await readNote?.execute({ noteId }) : null

          context.sendClientEvent({
            type: "conversation.item.create",
            item: {
              type: "message",
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: note ? `Navigated to note: ${note}` : `Navigated to ${event.path} page`,
                },
              ],
            },
          })
        },
        muteMicrophone: (context) => {
          context.microphoneStream?.getTracks().forEach((track) => {
            track.enabled = false
          })
        },
        unmuteMicrophone: (context) => {
          context.microphoneStream?.getTracks().forEach((track) => {
            track.enabled = true
          })
        },
        alertError: (context, event) => {
          alert(event.message)
        },
        playReadySound: () => {
          notificationSound.play()
        },
        playEndSound: () => {
          notificationOffSound.play()
        },
      },
      services: {
        session: () => (sendBack) => {
          let peerConnection: RTCPeerConnection | undefined
          let dataChannel: RTCDataChannel | undefined
          let microphoneStream: MediaStream | undefined
          let audioElement: HTMLAudioElement | undefined

          init()

          async function init() {
            const openaiKey = String(
              JSON.parse(localStorage.getItem(OPENAI_KEY_STORAGE_KEY) ?? "''"),
            )

            // Validate OpenAI key before proceeding
            const isValidKey = await validateOpenAIKey(openaiKey)
            if (!isValidKey) {
              sendBack({
                type: "ERROR",
                message:
                  "Invalid OpenAI API key. Update your OpenAI key in Settings and try again.",
              })
              return
            }

            // Create a peer connection
            peerConnection = new RTCPeerConnection()

            // Set up to play remote audio from the model
            audioElement = document.createElement("audio")
            audioElement.autoplay = true
            peerConnection.ontrack = (event) => {
              if (audioElement) {
                audioElement.srcObject = event.streams[0]
              }
            }

            // Add local audio track for microphone input in the browser
            try {
              microphoneStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
              })
              peerConnection.addTrack(microphoneStream.getTracks()[0])
            } catch (error) {
              console.warn("Microphone access denied", error)
              sendBack({
                type: "ERROR",
                message: "Microphone access denied.",
              })
              return
            }

            // Set up data channel for sending and receiving events
            dataChannel = peerConnection.createDataChannel("oai-events")

            function sendClientEvent(clientEvent: RealtimeClientEvent) {
              if (import.meta.env.DEV) {
                console.log(...CLIENT_EVENT_LABEL, clientEvent.type, clientEvent)
              }

              dataChannel?.send(JSON.stringify(clientEvent))
            }

            // let hasOutputAudioBuffer = false

            dataChannel.addEventListener("message", (event: MessageEvent<string>) => {
              const serverEvent = JSON.parse(event.data) as RealtimeServerEvent

              if (import.meta.env.DEV) {
                console.log(...SERVER_EVENT_LABEL, serverEvent.type, serverEvent)
              }

              switch (serverEvent.type) {
                case "session.created": {
                  sendBack({
                    type: "SESSION_CREATED",
                    microphoneStream,
                    sendClientEvent,
                  })
                  break
                }

                case "input_audio_buffer.speech_started": {
                  sendBack("USER_SPEECH_STARTED")
                  break
                }

                case "input_audio_buffer.speech_stopped": {
                  sendBack("USER_SPEECH_STOPPED")
                  break
                }

                case "response.created": {
                  sendBack("ASSISTANT_THINKING_STARTED")
                  break
                }

                // @ts-expect-error This event is not documented
                case "output_audio_buffer.started": {
                  sendBack("ASSISTANT_SPEECH_STARTED")
                  break
                }

                // @ts-expect-error This event is not documented
                case "output_audio_buffer.stopped": {
                  sendBack("ASSISTANT_SPEECH_STOPPED")
                  break
                }

                case "response.done": {
                  sendBack("ASSISTANT_THINKING_STOPPED")

                  const toolCalls =
                    serverEvent.response.output?.filter(
                      (output) => output.type === "function_call",
                    ) ?? []

                  if (toolCalls.length > 0) {
                    sendBack({
                      type: "TOOL_CALLS",
                      toolCalls: toolCalls.map((toolCall) => ({
                        callId: toolCall.call_id ?? "",
                        name: toolCall.name ?? "",
                        args: toolCall.arguments ?? "",
                      })),
                    })
                  }
                  break
                }
              }
            })

            // Start the session using the Session Description Protocol (SDP)
            const connectionOffer = await peerConnection.createOffer()
            await peerConnection.setLocalDescription(connectionOffer)

            const baseUrl = "https://api.openai.com/v1/realtime"
            const model = "gpt-4o-realtime-preview-2024-12-17"
            const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
              method: "POST",
              body: connectionOffer.sdp,
              headers: {
                Authorization: `Bearer ${openaiKey}`,
                "Content-Type": "application/sdp",
              },
            })

            const answer: RTCSessionDescriptionInit = {
              type: "answer" as const,
              sdp: await sdpResponse.text(),
            }

            await peerConnection.setRemoteDescription(answer)
          }

          function cleanup() {
            // Close the WebRTC peer connection
            peerConnection?.close()

            // Close the data channel used for events
            dataChannel?.close()

            // Stop all tracks from the microphone stream
            microphoneStream?.getTracks().forEach((track) => track.stop())

            // Clean up the audio element used for playback
            if (audioElement) {
              audioElement.pause()
              audioElement.srcObject = null
              audioElement.remove()
            }
          }

          return cleanup
        },
      },
    },
  )
}
