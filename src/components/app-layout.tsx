import { useAtomValue } from "jotai"
import { LoadingIcon16 } from "../components/icons"
import { RepoForm } from "../components/repo-form"
import {
  githubRepoAtom,
  isCloningRepoAtom,
  isRepoClonedAtom,
  isRepoNotClonedAtom,
  isSignedOutAtom,
  sidebarAtom,
} from "../global-state"
import { useIsScrolled } from "../hooks/is-scrolled"
import { cx } from "../utils/cx"
import { AppHeader, AppHeaderProps } from "./app-header"
import { NavBar } from "./nav-bar"
import { Sidebar } from "./sidebar"
import { SignInBanner } from "./sign-in-banner"

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

  const { isScrolled, topSentinelProps } = useIsScrolled()

  return (
    <div className="flex flex-col overflow-hidden">
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
            className={cx(
              "border-b print:hidden",
              isScrolled ? "border-border-secondary" : "border-transparent",
            )}
          />
          <div className="relative grid overflow-hidden">
            <main className="relative isolate overflow-auto [scrollbar-gutter:stable]">
              <div {...topSentinelProps} />
              {isRepoNotCloned && !disableGuard ? (
                <div className="flex h-full flex-col items-center">
                  <div className="mx-auto w-full max-w-lg p-4 pb-8 md:pb-14">
                    <div className="card-1 flex flex-col gap-6 p-4">
                      <div className="flex flex-col gap-2">
                        <h1 className="font-content text-lg font-bold">Choose a repository</h1>
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
            {floatingActions ? (
              <div className="absolute bottom-3 right-3">{floatingActions}</div>
            ) : null}
          </div>
          <div className="sm:hidden print:hidden">
            <NavBar />
          </div>
        </div>
      </div>
    </div>
  )
}
