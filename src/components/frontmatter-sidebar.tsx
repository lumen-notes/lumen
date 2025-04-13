import { useAtom } from "jotai"
import { frontmatterSidebarAtom } from "../global-state"
import { IconButton } from "./icon-button"
import { ArrowLeftIcon16 } from "./icons"
import { Frontmatter } from "./markdown"

export function FrontmatterSidebar({ frontmatter }: { frontmatter: Record<string, unknown> }) {
  const [isOpen, setIsOpen] = useAtom(frontmatterSidebarAtom)

  if (!isOpen) return null

  return (
    <div className="right-2 absolute border rounded border-border-secondary grid w-64 flex-shrink-0 grid-rows-[auto_1fr] overflow-hidden">
      <div className="flex w-full justify-between border-b border-border-secondary p-2">
        <span className="text-sm font-medium">Properties</span>
        <IconButton
          aria-label="Close properties sidebar"
          tooltipSide="left"
          size="small"
          onClick={() => setIsOpen(false)}
        >
          <ArrowLeftIcon16 />
        </IconButton>
      </div>
      <div className="overflow-auto p-4">
        <Frontmatter frontmatter={frontmatter} />
      </div>
    </div>
  )
}
