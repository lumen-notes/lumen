import { createFileRoute } from "@tanstack/react-router"
import { VoiceMode } from "../components/voice-mode"

export const Route = createFileRoute("/voice-mode")({
  component: RouteComponent,
})

function RouteComponent() {
  return <VoiceMode />
}
