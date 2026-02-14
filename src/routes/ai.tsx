import { useChat } from "@ai-sdk/react"
import { createFileRoute } from "@tanstack/react-router"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { SignInButton } from "../components/github-auth"
import { Markdown } from "../components/markdown"
import { githubRepoAtom, globalStateMachineAtom } from "../global-state"
import { cx } from "../utils/cx"
import { RepoForm } from "../components/repo-form"
import { LoadingIcon16 } from "../components/icons"

type PageState = "loading" | "signIn" | "selectRepo" | "cloning" | "ready"

const pageStateAtom = selectAtom(globalStateMachineAtom, (state): PageState => {
  if (state.matches("signedIn.cloned")) return "ready"
  if (state.matches("signedIn.cloningRepo")) return "cloning"
  if (state.matches("signedIn.notCloned")) return "selectRepo"
  if (state.matches("signedOut")) return "signIn"
  return "loading"
})

export const Route = createFileRoute("/ai")({
  component: RouteComponent,
})

function RouteComponent() {
  const pageState = useAtomValue(pageStateAtom)
  const githubRepo = useAtomValue(githubRepoAtom)

  switch (pageState) {
    case "loading":
      return null

    case "signIn":
      return (
        <div className="p-4">
          <SignInButton className="w-full" />
        </div>
      )

    case "selectRepo":
      return (
        <div className="p-4">
          <RepoForm />
        </div>
      )

    case "cloning":
      return (
        <div className="flex items-center gap-2 p-4 leading-4 text-text-secondary">
          <LoadingIcon16 />
          {githubRepo ? `Cloning ${githubRepo.owner}/${githubRepo.name}…` : "Cloning…"}
        </div>
      )

    case "ready":
      return (
        <div className="overflow-auto p-4">
          <Chat />
        </div>
      )
  }
}

function Chat() {
  const [input, setInput] = React.useState("")
  const { messages, sendMessage, error } = useChat()

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
