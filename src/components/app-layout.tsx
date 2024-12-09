import { useEffect, useRef, useState } from "react"
import { cx } from "../utils/cx"
import { AppHeader, AppHeaderProps } from "./app-header"
import {
  isSignedOutAtom,
  isRepoNotClonedAtom,
  isCloningRepoAtom,
  isRepoClonedAtom,
  githubRepoAtom,
} from "../global-state"
import { useAtomValue } from "jotai"
import { RepoForm } from "../components/repo-form"
import { LoadingIcon16 } from "../components/icons"

type AppLayoutProps = AppHeaderProps & {
  className?: string
  disableGuard?: boolean
  children?: React.ReactNode
}

export function AppLayout({ className, children, disableGuard = false, ...props }: AppLayoutProps) {
  const isSignedOut = useAtomValue(isSignedOutAtom)
  const isRepoNotCloned = useAtomValue(isRepoNotClonedAtom)
  const isCloningRepo = useAtomValue(isCloningRepoAtom)
  const isRepoCloned = useAtomValue(isRepoClonedAtom)
  const githubRepo = useAtomValue(githubRepoAtom)

  const [isScrolled, setIsScrolled] = useState(false)
  const scrollContainerRef = useRef<HTMLElement>(null)
  // Reference to an invisible element at the top of the content
  // Used to detect when content is scrolled
  const topSentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = topSentinelRef.current
    if (!sentinel) return

    // Create an IntersectionObserver that watches when our sentinel element
    // enters or leaves the viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel is visible (intersecting), we're at the top (not scrolled)
        // When it's not visible, we've scrolled down
        setIsScrolled(!entry.isIntersecting)
      },
      {
        // Only trigger when sentinel is fully visible/hidden
        threshold: 1.0,
      },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="grid grid-rows-[auto_1fr] overflow-hidden">
      <AppHeader
        {...props}
        className={cx("border-b", isScrolled ? "border-border-secondary" : "border-transparent")}
      />
      <main ref={scrollContainerRef} className="relative overflow-auto [scrollbar-gutter:stable]">
        {/* Invisible sentinel element that helps detect scroll position */}
        <div ref={topSentinelRef} className="pointer-events-none absolute top-0 h-[1px] w-full" />
        {isRepoNotCloned && !disableGuard ? (
          <div className="flex h-full flex-col items-center p-4 pt-0 sm:justify-center sm:pb-10">
            <div className="mx-auto w-full max-w-lg">
              <div className="card-1 flex flex-col gap-6 p-4">
                <div className="flex flex-col gap-1">
                  <h1 className="text-lg font-semibold">Choose a repository</h1>
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
    </div>
  )
}
