import { useAtomValue } from "jotai"
import React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useEvent, useNetworkState } from "react-use"
import { githubRepoAtom, githubUserAtom } from "../global-atoms"
import { useFetchNotes } from "../utils/github-sync"
import { getPrevPathParams, savePathParams } from "../utils/prev-path-params"
import { Card } from "./card"
import { ErrorIcon16, LoadingIcon16 } from "./icons"

export function RootLayout({ children }: { children: React.ReactNode }) {
  const githubUser = useAtomValue(githubUserAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const { fetchNotes, isFetching, error: fetchError } = useFetchNotes()

  const { online } = useNetworkState()

  const onLoad = React.useCallback(() => fetchNotes(), [fetchNotes])

  // const onVisibilityChange = React.useCallback(() => {
  //   if (document.visibilityState === "visible") {
  //     fetchNotes()
  //   }
  // }, [fetchNotes])

  // Fetch notes when the app loads, becomes visible, or comes online .
  useEvent("load", onLoad)
  // useEvent("visibilitychange", onVisibilityChange)
  // useEvent("online", onOnline)

  const location = useLocation()
  const navigate = useNavigate()

  // Restore the previous search params for this path when the app loads if the current search params are empty
  useEvent("load", () => {
    const prevPathParams = getPrevPathParams(location.pathname)

    if (location.search === "" && prevPathParams) {
      navigate({
        pathname: location.pathname,
        search: prevPathParams,
      })
    }
  })

  // Save the search params in localStorage before closing the app
  useEvent("beforeunload", () => {
    savePathParams(location)
  })

  return (
    <div className="flex h-screen w-screen flex-col pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] [@supports(height:100svh)]:h-[100svh]">
      {/* Show error message if a GitHub repository has been configured but fetching notes fails */}
      {fetchError && !isFetching && githubUser && githubRepo?.owner && githubRepo?.name ? (
        <div className="flex items-center gap-3 bg-[crimson] px-4 py-2 text-[white]">
          <div>
            <ErrorIcon16 />
          </div>
          <span className="truncate">{fetchError.message}</span>
        </div>
      ) : null}
      {children}
      {!online ? (
        <div className="flex justify-center px-4 py-2 sm:justify-start sm:bg-bg-tertiary">
          <span>Offline</span>
        </div>
      ) : null}
      {isFetching ? (
        <div className="fixed right-2 top-2 z-10 sm:bottom-2 sm:top-[unset]">
          <Card
            elevation={1}
            className=" flex items-center gap-2 rounded-md p-2 text-text-secondary after:rounded-md"
            role="status"
            aria-label="Fetching notes"
          >
            <LoadingIcon16 />
            <span className="leading-4">Fetching…</span>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
