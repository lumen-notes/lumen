import { useAtomValue } from "jotai"
import { useNetworkState } from "react-use"
import { LoadingIcon16 } from "../components/icons"
import { RepoForm } from "../components/repo-form"
import {
  githubRepoAtom,
  isCloningRepoAtom,
  isRepoClonedAtom,
  isRepoNotClonedAtom,
  isSignedOutAtom,
  openaiKeyAtom,
  sidebarAtom,
  voiceAssistantEnabledAtom,
} from "../global-state"
import { cx } from "../utils/cx"
import { AppHeader, AppHeaderProps } from "./app-header"
import { NavBar } from "./nav-bar"
import { Sidebar } from "./sidebar"
import { SignInBanner } from "./sign-in-banner"
import { VoiceConversationBar } from "./voice-conversation"

type AppLayoutProps = AppHeaderProps & {
  className?: string
  disableGuard?: boolean
  floatingActions?: React.ReactNode
  children?: React.ReactNode
}

export function AppLayout({
  className,
  disableGuard = false,
  actions,
  floatingActions,
  children,
  ...props
}: AppLayoutProps) {
  const isSignedOut = useAtomValue(isSignedOutAtom)
  const isRepoNotCloned = useAtomValue(isRepoNotClonedAtom)
  const isCloningRepo = useAtomValue(isCloningRepoAtom)
  const isRepoCloned = useAtomValue(isRepoClonedAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const sidebar = useAtomValue(sidebarAtom)
  const openaiKey = useAtomValue(openaiKeyAtom)
  const voiceAssistantEnabled = useAtomValue(voiceAssistantEnabledAtom)
  const { online } = useNetworkState()

  return (
    <div className={cx("flex flex-col overflow-hidden", className)}>
      <SignInBanner />
      <div className="flex overflow-hidden flex-grow">
        {sidebar === "expanded" ? (
          <div className="hidden sm:grid print:hidden">
            <Sidebar />
          </div>
        ) : null}
        <div className="grid flex-grow grid-rows-[auto_1fr] overflow-hidden">
          <AppHeader
            {...props}
            actions={isRepoCloned || isSignedOut || disableGuard ? actions : undefined}
            className="print:hidden"
          />
          <div className="relative grid overflow-hidden">
            <main className="relative isolate overflow-auto [scrollbar-gutter:stable] scroll-mask">
              {isRepoNotCloned && !disableGuard ? (
                <div className="flex h-full flex-col items-center">
                  <div className="mx-auto w-full max-w-lg p-4 pb-8 md:pb-14">
                    <div className="card-1 flex flex-col gap-6 p-4">
                      <div className="flex flex-col gap-2">
                        <h1 className="text-lg font-bold [text-box-trim:trim-start]">
                          Choose a repository
                        </h1>
                        <p className="text-pretty text-text-secondary">
                          Store your notes as markdown files in a GitHub repository of your choice.
                        </p>
                      </div>
                      <RepoForm />
                    </div>
                  </div>
                </div>
              ) : null}
              {isCloningRepo && githubRepo && !disableGuard ? (
                <div className="flex items-center gap-2 p-4 leading-4 text-text-secondary">
                  <LoadingIcon16 />
                  Cloning {githubRepo.owner}/{githubRepo.name}…
                </div>
              ) : null}
              {isRepoCloned || isSignedOut || disableGuard ? children : null}
            </main>

            <div className="absolute bottom-3 right-3 flex items-center gap-2 coarse:gap-3">
              {floatingActions}
              {online && openaiKey && voiceAssistantEnabled ? <VoiceConversationBar /> : null}
            </div>
          </div>
          <div className="sm:hidden print:hidden">
            <NavBar />
          </div>
        </div>
      </div>
    </div>
  )
}
