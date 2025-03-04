import { useAtomValue } from "jotai"
import { SignInButton } from "./github-auth"
import { isSignedOutAtom } from "../global-state"

export function SignInBanner() {
  const isSignedOut = useAtomValue(isSignedOutAtom)

  if (!isSignedOut) {
    return null
  }

  return (
    <div className="flex flex-shrink-0 flex-col justify-between gap-3 border-b border-border-secondary p-4 text-text sm:flex-row sm:items-center sm:p-2 print:hidden">
      <span className="font-content font-bold sm:px-2">
        Lumen is in <span className="italic">read-only</span> mode.
        <span className="hidden md:inline"> Sign in to start writing notes.</span>
      </span>
      <SignInButton />
    </div>
  )
}
