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
  voiceAssistantEnabledAtom,
} from "../global-state"
import { cx } from "../utils/cx"
import { PageHeader, PageHeaderProps } from "./page-header"
import { VoiceConversationBar } from "./voice-conversation"

type PageLayoutProps = PageHeaderProps & {
  className?: string
  disableGuard?: boolean
  floatingActions?: React.ReactNode
  children?: React.ReactNode
}

export function PageLayout({
  className,
  disableGuard = false,
  actions,
  floatingActions,
  children,
  ...props
}: PageLayoutProps) {
  const isSignedOut = useAtomValue(isSignedOutAtom)
  const isRepoNotCloned = useAtomValue(isRepoNotClonedAtom)
  const isCloningRepo = useAtomValue(isCloningRepoAtom)
  const isRepoCloned = useAtomValue(isRepoClonedAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const openaiKey = useAtomValue(openaiKeyAtom)
  const voiceAssistantEnabled = useAtomValue(voiceAssistantEnabledAtom)
  const { online } = useNetworkState()

  return (
    <div className={cx("grid grid-rows-[auto_1fr] overflow-hidden", className)}>
      <PageHeader
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
    </div>
  )
}
