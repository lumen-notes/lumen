import { useAtomValue } from "jotai"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { useMedia } from "react-use"
import { isHelpPanelOpenAtom, sidebarAtom } from "../global-state"
import { cx } from "../utils/cx"
import { HelpPanelDrawer, HelpPanelSidebar } from "./help-panel"
import { NavBar } from "./nav-bar"
import { Sidebar } from "./sidebar"
import { SignInBanner } from "./sign-in-banner"

type AppLayoutProps = {
  className?: string
  children?: React.ReactNode
}

export function AppLayout({ className, children }: AppLayoutProps) {
  const sidebar = useAtomValue(sidebarAtom)
  const isHelpPanelOpen = useAtomValue(isHelpPanelOpenAtom)
  const isWideViewport = useMedia("(min-width: 1024px)")

  return (
    <div className={cx("flex grow flex-col overflow-hidden print:overflow-visible", className)}>
      <SignInBanner />
      <div className="flex grow overflow-hidden">
        {sidebar === "expanded" ? (
          <div className="hidden w-56 shrink-0 sm:grid print:hidden">
            <Sidebar />
          </div>
        ) : null}
        <PanelGroup direction="horizontal" autoSaveId="app-layout" className="grow overflow-hidden">
          <Panel className="grid grid-rows-[1fr_auto] overflow-hidden" order={1}>
            {children}
            <div className="sm:hidden print:hidden">
              <NavBar />
            </div>
          </Panel>
          {isHelpPanelOpen && isWideViewport ? (
            <>
              <PanelResizeHandle className="relative w-px bg-border-secondary transition-colors duration-0 hover:delay-50 hover:bg-border data-[resize-handle-active]:bg-border print:hidden">
                <div className="absolute inset-y-0 -left-1.5 -right-1.5 z-10" />
              </PanelResizeHandle>
              <Panel className="print:hidden" order={2} defaultSize={25} minSize={25} maxSize={50}>
                <HelpPanelSidebar />
              </Panel>
            </>
          ) : null}
        </PanelGroup>
        {!isWideViewport ? <HelpPanelDrawer /> : null}
      </div>
    </div>
  )
}
