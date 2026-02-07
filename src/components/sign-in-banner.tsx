import { useAtomValue } from "jotai"
import { SignInButton } from "./github-auth"
import { isSignedOutAtom } from "../global-state"

export function SignInBanner() {
  const isSignedOut = useAtomValue(isSignedOutAtom)

  if (!isSignedOut) {
    return null
  }

  return (
    <div className="flex shrink-0 flex-col justify-between bg-bg-secondary gap-4 p-4 text-text sm:flex-row items-center sm:p-2 print:hidden">
      <span className="sm:px-2 text-text-secondary text-balance text-center sm:text-left">
        These are demo notes. Sign in to write your own.
      </span>
      <SignInButton className="w-full sm:w-auto" />
    </div>
  )
}
