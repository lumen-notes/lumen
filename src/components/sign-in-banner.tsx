import { useAtomValue } from "jotai"
import { SignInButton } from "./github-auth"
import { isSignedOutAtom } from "../global-state"
import { cx } from "../utils/cx"

export function SignInBanner({ className }: { className?: string }) {
  const isSignedOut = useAtomValue(isSignedOutAtom)

  if (!isSignedOut) {
    return null
  }

  return (
    <div
      className={cx(
        "flex shrink-0 flex-col justify-between gap-4 p-4 text-text sm:flex-row items-center sm:p-2 print:hidden",
        className,
      )}
    >
      <span className="sm:px-2 text-text-secondary text-balance text-center sm:text-left font-handwriting">
        These are demo notes. Sign in to write your own.
      </span>
      <SignInButton className="w-full sm:w-auto" />
    </div>
  )
}
