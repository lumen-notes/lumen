import * as Portal from "@radix-ui/react-portal"
import { useAtom } from "jotai"
import { atomWithMachine } from "jotai-xstate"
import type { RealtimeServerEvent } from "openai/resources/beta/realtime/realtime"
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
import { HeadphonesIcon16, MicFillIcon16 } from "./icons"

export const voiceConversationMachineAtom = atomWithMachine(createVoiceConversationMachine)

export function VoiceConversationButton() {
  const [state, send] = useAtom(voiceConversationMachineAtom)
  const { online } = useNetworkState()

  React.useEffect(() => {
    function handleServerEvent(serverEvent: RealtimeServerEvent) {
      if (serverEvent.type === "response.done") {
        const functionCalls =
          serverEvent.response.output?.filter((output) => output.type === "function_call") ?? []

        // Handle function calls
        for (const functionCall of functionCalls) {
          switch (functionCall.name) {
            case "end_conversation": {
              send("STOP")
              break
            }
          }
        }
      }
    }

    send({
      type: "REGISTER_SERVER_EVENT_CALLBACK",
      serverEventCallback: handleServerEvent,
    })
  }, [send])

  React.useEffect(() => {
    function handleOffline() {
      send("STOP")
    }
    window.addEventListener("offline", handleOffline)
    return () => window.removeEventListener("offline", handleOffline)
  }, [send])

  return (
    <IconButton
      size="small"
      aria-label={state.matches("inactive") ? "Start conversation" : "End conversation"}
      aria-pressed={!state.matches("inactive")}
      disabled={state.matches("starting") || !online}
      className="aria-pressed:!bg-[var(--green-9)] aria-pressed:!text-[#fff] eink:aria-pressed:!bg-text eink:aria-pressed:!text-bg"
      onClick={() => {
        if (state.matches("inactive")) {
          send("START")
        } else {
          send("STOP")
        }
      }}
    >
      {state.matches("inactive") ? <HeadphonesIcon16 /> : <MicFillIcon16 />}
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

  if (state.matches("active") && isInputVisible && mousePosition.x && mousePosition.y) {
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
      type: "REGISTER_SERVER_EVENT_CALLBACK"
      serverEventCallback: (serverEvent: RealtimeServerEvent) => void
    }
  | { type: "START" }
  | { type: "STOP" }
  | { type: "SEND_TEXT"; text: string }

type VoiceConversationContext = {
  peerConnection: RTCPeerConnection | null
  dataChannel: RTCDataChannel | null
  microphoneStream: MediaStream | null
  audioElement: HTMLAudioElement | null
  serverEventCallback: (serverEvent: RealtimeServerEvent) => void
}

function createVoiceConversationMachine() {
  return createMachine(
    {
      id: "voiceConversation",
      tsTypes: {} as import("./voice-conversation.typegen").Typegen0,
      schema: {} as {
        events: VoiceConversationEvent
        context: VoiceConversationContext
        services: {
          start: {
            data: {
              peerConnection: RTCPeerConnection
              dataChannel: RTCDataChannel
              microphoneStream: MediaStream
              audioElement: HTMLAudioElement
            }
          }
        }
      },
      context: {
        peerConnection: null,
        dataChannel: null,
        microphoneStream: null,
        audioElement: null,
        serverEventCallback: () => {},
      },
      initial: "inactive",
      states: {
        inactive: {
          on: {
            REGISTER_SERVER_EVENT_CALLBACK: {
              actions: assign((context, event) => {
                return {
                  serverEventCallback: event.serverEventCallback,
                }
              }),
            },
            START: "starting",
          },
        },
        starting: {
          invoke: {
            src: "start",
            onDone: {
              target: "active",
              actions: assign((context, event) => {
                return {
                  peerConnection: event.data.peerConnection,
                  dataChannel: event.data.dataChannel,
                  microphoneStream: event.data.microphoneStream,
                  audioElement: event.data.audioElement,
                }
              }),
            },
            onError: {
              target: "inactive",
              actions: "stop",
            },
          },
        },
        active: {
          on: {
            SEND_TEXT: {
              actions: "sendText",
            },
            STOP: {
              target: "inactive",
              actions: "stop",
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

          const dataChannel = context.dataChannel
          if (!dataChannel) {
            return
          }

          // Send the user's message
          dataChannel.send(
            JSON.stringify({
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
            }),
          )

          // Ask the model to respond
          dataChannel.send(JSON.stringify({ type: "response.create" }))
        },
        stop: (context) => {
          // Close the WebRTC peer connection if it exists
          if (context.peerConnection) {
            // close() returns immediately but triggers async cleanup
            context.peerConnection.close()
          }

          // Close the data channel used for events if it exists
          if (context.dataChannel) {
            // close() is async and returns a Promise
            context.dataChannel.close()
          }

          // Stop all tracks from the microphone stream if it exists
          if (context.microphoneStream) {
            // getTracks() and stop() are sync but may trigger async cleanup
            context.microphoneStream.getTracks().forEach((track) => track.stop())
          }

          // Clean up the audio element used for playback
          if (context.audioElement) {
            // These DOM operations can trigger async events
            context.audioElement.pause()
            context.audioElement.srcObject = null
            context.audioElement.remove()
          }
        },
      },
      services: {
        start: async (context) => {
          const openaiKey = String(JSON.parse(localStorage.getItem(OPENAI_KEY_STORAGE_KEY) ?? "''"))

          // Validate OpenAI key before proceeding
          const isValidKey = await validateOpenAIKey(openaiKey)
          if (!isValidKey) {
            alert("Invalid OpenAI API key. Update your OpenAI key in Settings and try again.")
            throw new Error("Invalid OpenAI API key")
          }

          // Create a peer connection
          const peerConnection = new RTCPeerConnection()

          // Set up to play remote audio from the model
          const audioElement = document.createElement("audio")
          audioElement.autoplay = true
          peerConnection.ontrack = (event) => (audioElement.srcObject = event.streams[0])

          // Add local audio track for microphone input in the browser
          const microphoneStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          })
          peerConnection.addTrack(microphoneStream.getTracks()[0])

          // Set up data channel for sending and receiving events
          const dataChannel = peerConnection.createDataChannel("oai-events")
          dataChannel.addEventListener("message", (event: MessageEvent<string>) => {
            const serverEvent = JSON.parse(event.data) as RealtimeServerEvent
            console.log(serverEvent)

            // Initialize the session
            if (serverEvent.type === "session.created") {
              dataChannel.send(
                JSON.stringify({
                  type: "session.update",
                  session: {
                    tools: [
                      {
                        type: "function",
                        name: "end_conversation",
                        description: "End the conversation",
                      },
                    ],
                  },
                }),
              )
            }

            context.serverEventCallback(serverEvent)
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

          return {
            peerConnection,
            dataChannel,
            microphoneStream,
            audioElement,
          }
        },
      },
    },
  )
}
