import { useAtom } from "jotai"
import { atomWithMachine } from "jotai-xstate"
import { assign, createMachine } from "xstate"
import { Button } from "../components/button"

const voiceModeStateMachineAtom = atomWithMachine(createVoiceModeStateMachine)

export function VoiceMode() {
  const [voiceModeState, send] = useAtom(voiceModeStateMachineAtom)

  return (
    <div>
      {voiceModeState.matches("inactive") && (
        <Button size="small" onClick={() => send("START")}>
          Start
        </Button>
      )}
      {voiceModeState.matches("starting") && (
        <Button size="small" disabled>
          Starting…
        </Button>
      )}
      {voiceModeState.matches("active") && (
        <Button size="small" onClick={() => send("STOP")}>
          Stop
        </Button>
      )}
      <pre>{JSON.stringify(voiceModeState.value, null, 2)}</pre>
    </div>
  )
}

type VoiceModeEvent = { type: "START" } | { type: "STOP" }

type VoiceModeContext = {
  peerConnection: RTCPeerConnection | null
  dataChannel: RTCDataChannel | null
  microphoneStream: MediaStream | null
  audioElement: HTMLAudioElement | null
}

function createVoiceModeStateMachine() {
  return createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5QDcD2BLAxmAsqiYAdOgHYCGmALusmAMQBKAogOICSAygCpMMD6AeQCCbPkwBqTAHJc+AYSEAZRQCEhcgNIBtAAwBdRKAAOqWOmqoShkAA9EAFgBMAGhABPRAE57hAKwB2ewA2HX8ADnsAZnswnUiwgF8E1zQsXHwiUgpqWjpuIQYuXQMkEBMzCytSuwRosMIwoP8ARn9opub7Xx1fVw9ayMjCIO8ooN9PMObPHWaklIxsPAJCWEoyACdqEig6CEtMkjQAayJUpYzV9a3SKARSNEwySuLi63LzdEtrGqDHZsI-x0nkijiCYUcnj+fUQkWajkBrUaUN8sUcTnmIHO6RW2Ro9G4AgACm9Sh9Kj9YTEGh02sEWl0ejCEM0gkFCFDwi0QujwlFMdjlkQ8bRiBAADb0ACqHF4fA4RKYTDkAAl5VwCjwACKk4ymT7faqIMKTQjTXyOfy+XxBSIoyLM+w6HR+MKDSI6RzoxyxML+AWLHHCqj4sWSuhCDgcTgamTyxXKtX5QpMHX6d76ilGhAm+rmy3W2325mghHozwVgJ-RyRC32ANpIWEEVEACusDAGw4RjAZGOtzoMrlCqVqvVxMVaZKeoqXyqoBqzUi-n8hFrIOXkTZoS9zOavgBzqPOginSdXQbF1xIdFZFgZjWZBIlG7vf7O0Hsv4I8T6s1qd1MpMznSkWWXVd10GNpt38Xd3EQS1PAad04U8Vpok8MFLyDZsb2Fe90EfZ9Xz7AdI2jfI4x-MdCSJSdAPJEDs1zM1PAtK0bTtcYHXghBLQBQIKwrTo3VgpJkhAEgMngUpBQyDNZ0NBdEAAWiCZkVJrDkhJ03SQWwpssjwhSDXnWxECXJC3UcWYKyaN17HCPcoUIT0VxXT1plCOYJLklZHxuHYTKzZSEGCF0RgtWJmmmQIIRLZoItGJxrUmIJ9wMy4W2CpjQsCAFItBZ0oU8cIwmZW0-GPHQnB3T1oky68ckyCUwBypTzIQcIkMKmzgRGMq9z+Px7B0iFUu8Rrg2awh207Ej3ygdqzMXP4fF8eJSqtQJuk9ZkfQRN1BgmZopmKzwptwma7wfdZiJ7UigrJYCOsXU6kOXUbgjY1FnXU3ifRdFDUPQ0asPEoA */
      id: "voiceMode",
      tsTypes: {} as import("./voice-mode.typegen").Typegen0,
      schema: {} as {
        events: VoiceModeEvent
        context: VoiceModeContext
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
      },
      initial: "inactive",
      states: {
        inactive: {
          on: {
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
          },
        },
        active: {
          on: {
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
          dataChannel.addEventListener("message", (event: MessageEvent<string>) => {
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
