import { useChat } from "@ai-sdk/react"
import { createFileRoute } from "@tanstack/react-router"
import { useAtomValue } from "jotai"
import React from "react"
import { SignInButton } from "../components/github-auth"
import { Markdown } from "../components/markdown"
import { isSignedOutAtom } from "../global-state"
import { cx } from "../utils/cx"

export const Route = createFileRoute("/_appRoot/chat")({
  component: RouteComponent,
})

function RouteComponent() {
  const isSignedOut = useAtomValue(isSignedOutAtom)
  return <div className="overflow-auto p-4">{isSignedOut ? <SignInButton /> : <Chat />}</div>
}

function Chat() {
  const [input, setInput] = React.useState("")
  const { messages, sendMessage, status, error } = useChat()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput("")
  }

  return (
    <div className="grid gap-2">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cx("px-4 py-2", message.role === "user" && "bg-bg-secondary rounded-xl")}
        >
          <Markdown fontSize="small">
            {message.parts
              .filter((part): part is { type: "text"; text: string } => part.type === "text")
              .map((part) => part.text)
              .join("")}
          </Markdown>
        </div>
      ))}
      {error && <div className="px-4 py-2 leading-7 text-text-danger">Error: {error.message}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI…"
          className="px-4 py-2 bg-bg-secondary w-full leading-7 placeholder:text-text-tertiary focus-ring rounded-xl"
        />
      </form>
    </div>
  )
}
