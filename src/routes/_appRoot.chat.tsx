import { useChat } from "@ai-sdk/react"
import { createFileRoute } from "@tanstack/react-router"
import React from "react"

export const Route = createFileRoute("/_appRoot/chat")({
  component: ChatPage,
})

function ChatPage() {
  const [input, setInput] = React.useState("")
  const { messages, sendMessage, status, error } = useChat()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput("")
  }

  const isLoading = status === "streaming" || status === "submitted"

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          {message.role}:{" "}
          {message.parts
            .filter((part): part is { type: "text"; text: string } => part.type === "text")
            .map((part) => part.text)
            .join("")}
        </div>
      ))}
      {isLoading && <div>Loading…</div>}
      {error && <div>Error: {error.message}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI…"
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  )
}
