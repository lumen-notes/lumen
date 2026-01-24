import { useAtomValue } from "jotai"
import { SignInButton } from "./github-auth"
import { isSignedOutAtom } from "../global-state"

export function SignInBanner() {
  const isSignedOut = useAtomValue(isSignedOutAtom)

  // Don't show sign-in banner when embedded in uselumen.com
  const isInIframe = window.self !== window.top
  let isEmbeddedInLumen = false
  if (isInIframe && document.referrer) {
    try {
      const referrerHost = new URL(document.referrer).hostname
      isEmbeddedInLumen = referrerHost === "uselumen.com" || referrerHost.endsWith(".uselumen.com")
    } catch {
      // Ignore invalid referrer strings
    }
  }

  if (!isSignedOut || isEmbeddedInLumen) {
    return null
  }

  return (
    <div className="flex shrink-0 flex-col justify-between gap-3 border-b border-border-secondary p-4 text-text sm:flex-row sm:items-center sm:p-2 print:hidden">
      <span className="sm:px-2">
        Lumen is in demo mode.
        <span className="hidden md:inline"> Sign in to write your own notes.</span>
      </span>
      <SignInButton />
    </div>
  )
}
