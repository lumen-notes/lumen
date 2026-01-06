import { useAtomValue } from "jotai"
import { sidebarAtom } from "../global-state"
import { cx } from "../utils/cx"
import { NavBar } from "./nav-bar"
import { Sidebar } from "./sidebar"
import { SignInBanner } from "./sign-in-banner"

type AppLayoutProps = {
  className?: string
  children?: React.ReactNode
}

export function AppLayout({ className, children }: AppLayoutProps) {
  const sidebar = useAtomValue(sidebarAtom)

  return (
    <div
      className={cx("flex flex-grow flex-col overflow-hidden print:overflow-visible", className)}
    >
      <SignInBanner />
      <div className="flex overflow-hidden flex-grow">
        {sidebar === "expanded" ? (
          <div className="hidden sm:grid print:hidden">
            <Sidebar />
          </div>
        ) : null}
        <div className="grid flex-grow grid-rows-[1fr_auto] overflow-hidden">
          {children}
          <div className="sm:hidden print:hidden">
            <NavBar />
          </div>
        </div>
      </div>
    </div>
  )
}
