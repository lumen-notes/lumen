import { useAtom } from "jotai"
import { atomWithMachine } from "jotai-xstate"
import { assign, createMachine } from "xstate"
import { Button } from "../components/button"

const voiceModeStateMachineAtom = atomWithMachine(createVoiceModeStateMachine)

export function VoiceMode() {
  const [voiceModeState, send] = useAtom(voiceModeStateMachineAtom)
  return (
    <div>
      <Button onClick={() => send("START")}>Start</Button>
      <Button onClick={() => send("STOP")}>Stop</Button>
      <pre>{JSON.stringify(voiceModeState.value, null, 2)}</pre>
      <pre>{JSON.stringify(voiceModeState.context, null, 2)}</pre>
    </div>
  )
}

function createVoiceModeStateMachine() {
  return createMachine(
    {
      id: "voiceMode",
      tsTypes: {} as import("./voice-mode.typegen").Typegen0,
      schema: {} as {
        context: {
          peerConnection: RTCPeerConnection | null
          dataChannel: RTCDataChannel | null
          microphoneStream: MediaStream | null
          audioElement: HTMLAudioElement | null
        }
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
      initial: "idle",
      context: {
        peerConnection: null,
        dataChannel: null,
        microphoneStream: null,
        audioElement: null,
      },
      states: {
        idle: {
          on: {
            START: "starting",
          },
        },
        starting: {
          invoke: {
            src: "start",
            onDone: {
              target: "listening",
              actions: "setContext",
            },
          },
        },
        listening: {
          on: {
            STOP: {
              target: "idle",
              actions: "stop",
            },
          },
        },
      },
    },
    {
      actions: {
        setContext: assign((_, event) => {
          return {
            peerConnection: event.data.peerConnection,
            dataChannel: event.data.dataChannel,
            microphoneStream: event.data.microphoneStream,
            audioElement: event.data.audioElement,
          }
        }),
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
        start: async () => {
          // TODO: Get an ephemeral key from your server
          const EPHEMERAL_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

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
          dataChannel.addEventListener("message", (event) => {
            // Realtime server events appear here!
            console.log(JSON.parse(event.data))
          })

          // Start the session using the Session Description Protocol (SDP)
          const connectionOffer = await peerConnection.createOffer()
          await peerConnection.setLocalDescription(connectionOffer)

          const baseUrl = "https://api.openai.com/v1/realtime"
          const model = "gpt-4o-mini-realtime-preview-2024-12-17"
          const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
            method: "POST",
            body: connectionOffer.sdp,
            headers: {
              Authorization: `Bearer ${EPHEMERAL_API_KEY}`,
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
