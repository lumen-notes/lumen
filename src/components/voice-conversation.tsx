import * as Portal from "@radix-ui/react-portal"
import { useAtom } from "jotai"
import { atomWithMachine } from "jotai-xstate"
import type {
  RealtimeServerEvent,
  RealtimeClientEvent,
} from "openai/resources/beta/realtime/realtime"
import React from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { useNetworkState } from "react-use"
import { useDebouncedCallback } from "use-debounce"
import { assign, createMachine } from "xstate"
import { OPENAI_KEY_STORAGE_KEY } from "../global-state"
import { useMousePosition } from "../hooks/mouse-position"
import { cx } from "../utils/cx"
import { validateOpenAIKey } from "../utils/validate-openai-key"
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
import { ZodSchema } from "zod"
import { DropdownMenu } from "./dropdown-menu"

export const voiceConversationMachineAtom = atomWithMachine(createVoiceConversationMachine)

export function VoiceConversationButton() {
  const [state, send] = useAtom(voiceConversationMachineAtom)
  const { online } = useNetworkState()

  // React.useEffect(() => {
  //   function handleServerEvent(serverEvent: RealtimeServerEvent) {
  //     if (serverEvent.type === "response.done") {
  //       const functionCalls =
  //         serverEvent.response.output?.filter((output) => output.type === "function_call") ?? []

  //       // Handle function calls
  //       for (const functionCall of functionCalls) {
  //         switch (functionCall.name) {
  //           case "end_conversation": {
  //             send("STOP")
  //             break
  //           }
  //         }
  //       }
  //     }
  //   }

  //   send({
  //     type: "REGISTER_SERVER_EVENT_CALLBACK",
  //     serverEventCallback: handleServerEvent,
  //   })
  // }, [send])

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
      <DropdownMenu>
        <DropdownMenu.Trigger asChild>
          <IconButton
            size="small"
            aria-label="Conversation actions"
            disableTooltip
            className={cx(
              "!text-[#fff] eink:!bg-text eink:!text-bg",
              state.matches("active.ready.muted") ? "!bg-[var(--red-9)]" : "!bg-[var(--green-9)]",
            )}
            disabled={state.matches("active.initializing")}
          >
            <div className="flex items-center gap-1">
              {state.matches("active.ready.muted") ? <MicMuteFillIcon16 /> : <MicFillIcon16 />}
              <TriangleDownIcon8 />
            </div>
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Item
            icon={state.matches("active.ready.muted") ? <MicIcon16 /> : <MicMuteIcon16 />}
            onSelect={() => {
              if (state.matches("active.ready.muted")) {
                send("UNMUTE_MICROPHONE")
              } else {
                send("MUTE_MICROPHONE")
              }
            }}
          >
            {state.matches("active.ready.muted") ? "Unmute microphone" : "Mute microphone"}
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item icon={<XIcon16 />} variant="danger" onSelect={() => send("END")}>
            End conversation
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
    )
  }

  return (
    <IconButton
      size="small"
      aria-label="Start conversation with AI"
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

type Tool<T> = {
  name: string
  description: string
  parameters: ZodSchema<T>
  execute: (parameters: T) => Promise<void>
}

type VoiceConversationEvent =
  | {
      type: "ADD_TOOL"
      tool: Tool<unknown>
    }
  | {
      type: "REMOVE_TOOL"
      toolName: string
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
      type: "SEND_TEXT"
      text: string
    }
  | {
      type: "MUTE_MICROPHONE"
    }
  | {
      type: "UNMUTE_MICROPHONE"
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
                SESSION_CREATED: {
                  target: "ready",
                  actions: assign({
                    microphoneStream: (context, event) => event.microphoneStream,
                    sendClientEvent: (context, event) => event.sendClientEvent,
                  }),
                },
              },
            },
            ready: {
              on: {
                SEND_TEXT: {
                  actions: "sendText",
                },
              },
              initial: "unmuted",
              states: {
                unmuted: {
                  on: {
                    MUTE_MICROPHONE: {
                      target: "muted",
                      actions: "muteMicrophone",
                    },
                  },
                },
                muted: {
                  on: {
                    UNMUTE_MICROPHONE: {
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
    {
      actions: {
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

          // Ask the model to respond
          context.sendClientEvent({ type: "response.create" })
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
      },
      services: {
        session: (context, event) => (sendBack, onRecieve) => {
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
            microphoneStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            })
            peerConnection.addTrack(microphoneStream.getTracks()[0])

            // Set up data channel for sending and receiving events
            dataChannel = peerConnection.createDataChannel("oai-events")

            function sendClientEvent(clientEvent: RealtimeClientEvent) {
              dataChannel?.send(JSON.stringify(clientEvent))
            }

            dataChannel.addEventListener("message", (event: MessageEvent<string>) => {
              const serverEvent = JSON.parse(event.data) as RealtimeServerEvent
              console.log(serverEvent)

              switch (serverEvent.type) {
                case "session.created": {
                  sendBack({
                    type: "SESSION_CREATED",
                    microphoneStream,
                    sendClientEvent,
                  })
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
