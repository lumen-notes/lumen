import {
  Link,
  Outlet,
  ScrollRestoration,
  createRootRoute,
  useNavigate,
} from "@tanstack/react-router"
import { useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import { useEffect, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { useEvent, useNetworkState } from "react-use"
import { useRegisterSW } from "virtual:pwa-register/react"
import { z } from "zod"
import { Button } from "../components/button"
import { CommandMenu } from "../components/command-menu"
import { SignInButton } from "../components/github-auth"
import { ErrorIcon16 } from "../components/icons"
import {
  FloatingConversationInput,
  Tool,
  voiceConversationMachineAtom,
} from "../components/voice-conversation"
import { fontAtom, globalStateMachineAtom, isSignedOutAtom, themeAtom } from "../global-state"
import { useThemeColor } from "../hooks/theme-color"

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
})

function NotFoundComponent() {
  return (
    <div className="p-4">
      Page not found.{" "}
      <Link to="/" search={{ query: undefined, view: "grid" }} className="link">
        Go home
      </Link>
    </div>
  )
}

const errorAtom = selectAtom(globalStateMachineAtom, (state) => state.context.error)

function RootComponent() {
  useThemeColor()
  const isSignedOut = useAtomValue(isSignedOutAtom)
  const error = useAtomValue(errorAtom)
  const send = useSetAtom(globalStateMachineAtom)
  const navigate = useNavigate()
  const { online } = useNetworkState()

  // Sync when the app becomes visible again
  useEvent("visibilitychange", () => {
    if (document.visibilityState === "visible" && online) {
      send("SYNC")
    }
  })

  useEvent("online", () => {
    send("SYNC")
  })

  // Reference: https://vite-pwa-org.netlify.app/frameworks/react.html#prompt-for-update
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log("SW registered: " + registration)

      if (registration) {
        // Check for updates every hour
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000)
      }
    },
    onRegisterError(error) {
      console.error("SW registration error", error)
    },
  })

  // Add voice conversation tools
  const sendVoiceConversation = useSetAtom(voiceConversationMachineAtom)
  useEffect(() => {
    const tools = [
      {
        name: "create_note",
        description:
          "Create an empty note. To add content, first create an empty note, then edit it separately.",
        parameters: z.object({}),
        execute: async () => {
          await navigate({
            to: "/notes/$",
            params: { _splat: `${Date.now()}` },
            search: {
              mode: "write",
              query: undefined,
              view: "grid",
            },
          })
          return JSON.stringify({ success: true })
        },
      } satisfies Tool<Record<string, never>>,
      {
        name: "mute_microphone",
        description: "Mute the user's microphone",
        parameters: z.object({}),
        execute: async () => {
          sendVoiceConversation("MUTE_MIC")
        },
      } satisfies Tool<Record<string, never>>,
      {
        name: "unmute_microphone",
        description: "Unmute the user's microphone",
        parameters: z.object({}),
        execute: async () => {
          sendVoiceConversation("UNMUTE_MIC")
        },
      } satisfies Tool<Record<string, never>>,
      {
        name: "end_conversation",
        description: "End the conversation",
        parameters: z.object({}),
        execute: async () => {
          sendVoiceConversation("END")
        },
      } satisfies Tool<Record<string, never>>,
    ]

    sendVoiceConversation({ type: "ADD_TOOLS", tools })
    return () => {
      sendVoiceConversation({ type: "REMOVE_TOOLS", toolNames: tools.map((tool) => tool.name) })
    }
  }, [sendVoiceConversation, navigate])

  // Toggle dev bar with ctrl+`
  const [isDevBarEnabled, setIsDevBarEnabled] = useState(false)
  useHotkeys("ctrl+`", () => setIsDevBarEnabled((prev) => !prev), {
    enabled: import.meta.env.DEV,
    preventDefault: true,
    enableOnFormTags: true,
    enableOnContentEditable: true,
  })

  // Set the theme
  const theme = useAtomValue(themeAtom)
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  // Set the font
  const font = useAtomValue(fontAtom)
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-family-content",
      font === "serif" ? "var(--font-family-serif)" : "var(--font-family-sans)",
    )
  }, [font])

  return (
    <div
      className="flex h-screen w-screen flex-col bg-bg pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] print:h-auto print:w-full [@supports(height:100svh)]:h-[100svh]"
      data-vaul-drawer-wrapper=""
    >
      {isSignedOut ? (
        <div className="flex flex-shrink-0 flex-col justify-between gap-3 border-b border-border-secondary p-4 text-text sm:flex-row sm:items-center sm:p-2">
          <span className="font-content font-bold sm:px-2">
            Lumen is in <span className="italic">read-only</span> mode.
            <span className="hidden md:inline"> Sign in to start writing notes.</span>
          </span>
          <SignInButton />
        </div>
      ) : null}
      {error ? (
        <div className="flex flex-shrink-0 items-start gap-2 border-b border-border-secondary px-4 py-2 text-text-danger">
          <div className="grid h-6 flex-shrink-0 place-items-center">
            <ErrorIcon16 />
          </div>
          <pre className="whitespace-pre-wrap pt-0.5 font-mono">{error.message}</pre>
        </div>
      ) : null}
      <ScrollRestoration />
      <div className="grid flex-grow overflow-hidden print:overflow-visible">
        <Outlet />
      </div>
      <FloatingConversationInput />
      <DevBar enabled={isDevBarEnabled} />
      {needRefresh ? (
        <div className="card-2 absolute bottom-16 right-2 z-20 flex items-center justify-between gap-4 p-1 pl-4 sm:bottom-2">
          <div className="flex items-center gap-3">
            {/* Dot to draw attention */}
            <div aria-hidden className="h-2 w-2 rounded-full bg-border-focus" />
            New version available
          </div>
          <Button onClick={() => updateServiceWorker(true)}>Update</Button>
        </div>
      ) : null}
      <CommandMenu />
    </div>
  )
}

// Shows the current state of the global state machine for debugging purposes
function DevBar({ enabled = false }: { enabled?: boolean }) {
  const state = useAtomValue(globalStateMachineAtom)

  if (!import.meta.env.DEV || !enabled) return null

  return (
    <div className="fixed bottom-16 left-2 flex h-6 items-center rounded bg-bg sm:bottom-2">
      <div className="flex h-6 items-center gap-1.5 whitespace-nowrap rounded bg-bg-secondary px-2 font-mono text-sm text-text-secondary">
        <span>{formatState(state.value)}</span>
        <span className="text-text-tertiary">·</span>
        <CurrentBreakpoint />
      </div>
    </div>
  )
}

function formatState(state: Record<string, unknown> | string): string {
  if (typeof state === "string") {
    return state
  }

  const entries = Object.entries(state)

  if (entries.length === 0) {
    return ""
  }

  if (entries.length === 1) {
    const [key, value] = entries[0]
    return `${key}.${formatState(value as Record<string, unknown> | string)}`
  }

  return `[${entries
    .map(([key, value]) => `${key}.${formatState(value as Record<string, unknown> | string)}`)
    .join("|")}]`
}

function CurrentBreakpoint() {
  return (
    <span>
      <span className="sm:hidden">xs</span>
      <span className="hidden sm:inline md:hidden">sm</span>
      <span className="hidden md:inline lg:hidden">md</span>
      <span className="hidden lg:inline xl:hidden">lg</span>
      <span className="hidden xl:inline 2xl:hidden">xl</span>
      <span className="hidden 2xl:inline">2xl</span>
    </span>
  )
}
