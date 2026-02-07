import { useAtom } from "jotai"
import { Drawer } from "vaul"
import { isHelpPanelOpenAtom } from "../global-state"
import { IconButton } from "./icon-button"
import { XIcon16 } from "./icons"
import { Markdown } from "./markdown"
import { NoteHoverCard } from "./note-hover-card"

function HelpSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 min-w-0 p-4">
      <div className="text-sm text-text-secondary h-4 flex items-center">{title}</div>
      <ul className="flex flex-col">{children}</ul>
    </div>
  )
}

function HelpItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between h-9 gap-3 *:first:min-w-0 *:first:truncate *:last:shrink-0">
      {children}
    </li>
  )
}

function Keys({ keys }: { keys: string[] }) {
  return (
    <div className="flex items-center gap-0.5">
      {keys.map((key) => (
        <kbd
          key={key}
          className="min-w-[22px] font-[inherit] rounded-sm bg-bg-secondary p-1 text-center font-body leading-none text-text-secondary shadow-[inset_0_-1px_0_var(--color-border-secondary)] dark:shadow-[inset_0_1px_0_var(--color-border-secondary),0_1px_2px_-1px_var(--color-bg)] epaper:shadow-none"
        >
          {key}
        </kbd>
      ))}
    </div>
  )
}

function HelpLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <HelpItem>
      <a href={href} target="_blank" rel="noopener noreferrer" className="link link-external">
        {children}
      </a>
    </HelpItem>
  )
}

function MarkdownSyntaxItem({ syntax }: { syntax: string }) {
  return (
    <li className="flex flex-col gap-1 py-2">
      <code className="text-text-secondary">{syntax}</code>
      <Markdown>{syntax}</Markdown>
    </li>
  )
}

function HelpContent({
  onClose,
  size = "small",
}: {
  onClose: () => void
  size?: "small" | "medium"
}) {
  return (
    <NoteHoverCard.Provider container={null}>
      <div className="grid grid-rows-[auto_1fr] overflow-hidden h-full">
        <header className="flex items-center gap-2 px-2 py-2">
          <div className="flex w-0 grow items-center gap-3 px-2">
            <div className="truncate">Help</div>
          </div>
          <IconButton aria-label="Close" shortcut={["⌘", "/"]} size={size} onClick={onClose}>
            <XIcon16 />
          </IconButton>
        </header>

        <div className="overflow-auto scroll-mask grid divide-y divide-border-secondary">
          <HelpSection title="Links">
            <HelpLink href="https://github.com/lumen-notes/lumen/issues/new">
              Send feedback
            </HelpLink>
            <HelpLink href="https://github.com/lumen-notes/lumen/blob/main/CHANGELOG.md">
              Changelog
            </HelpLink>
            <HelpLink href="https://github.com/lumen-notes/lumen">GitHub</HelpLink>
            <HelpLink href="https://twitter.com/lumen_notes">Twitter</HelpLink>
          </HelpSection>

          <HelpSection title="Global shortcuts">
            <HelpItem>
              <span>Create new note</span>
              <Keys keys={["⌘", "⇧", "O"]} />
            </HelpItem>
            <HelpItem>
              <span>Toggle command menu</span>
              <Keys keys={["⌘", "K"]} />
            </HelpItem>
            <HelpItem>
              <span>Toggle sidebar</span>
              <Keys keys={["⌘", "B"]} />
            </HelpItem>
            <HelpItem>
              <span>Toggle help panel</span>
              <Keys keys={["⌘", "/"]} />
            </HelpItem>
          </HelpSection>

          <HelpSection title="Note shortcuts">
            <HelpItem>
              <span>Toggle editing</span>
              <Keys keys={["⌘", "E"]} />
            </HelpItem>
            <HelpItem>
              <span>Save note</span>
              <Keys keys={["⌘", "S"]} />
            </HelpItem>
            <HelpItem>
              <span>Save and view</span>
              <Keys keys={["⌘", "⏎"]} />
            </HelpItem>
          </HelpSection>

          <HelpSection title="Formatting">
            <MarkdownSyntaxItem syntax="# Heading 1" />
            <MarkdownSyntaxItem syntax="## Heading 2" />
            <MarkdownSyntaxItem syntax="_Italic_" />
            <MarkdownSyntaxItem syntax="**Bold**" />
            <MarkdownSyntaxItem syntax="~~Strikethrough~~" />
            <MarkdownSyntaxItem syntax="`Code`" />
            <MarkdownSyntaxItem syntax="[Link](https://example.com)" />
            <MarkdownSyntaxItem syntax="- Unordered list" />
            <MarkdownSyntaxItem syntax="1. Ordered list" />
            <MarkdownSyntaxItem syntax="- [ ] Unchecked" />
            <MarkdownSyntaxItem syntax="- [x] Checked" />
            <MarkdownSyntaxItem syntax="> Blockquote" />
            <MarkdownSyntaxItem syntax="$$LaTeX^{math}$$" />
            <MarkdownSyntaxItem syntax="---" />
            <MarkdownSyntaxItem syntax="[[id|Note link]]" />
            <MarkdownSyntaxItem syntax="[[2024-07-11]]" />
            <MarkdownSyntaxItem syntax="[[2024-W28]]" />
            <MarkdownSyntaxItem syntax="#tag" />
          </HelpSection>
        </div>
      </div>
    </NoteHoverCard.Provider>
  )
}

export function HelpSidebar() {
  const [, setHelpPanel] = useAtom(isHelpPanelOpenAtom)
  return (
    <div className="grid grid-rows-[1fr] overflow-hidden h-full">
      <HelpContent onClose={() => setHelpPanel(false)} />
    </div>
  )
}

export function HelpDrawer() {
  const [isOpen, setIsOpen] = useAtom(isHelpPanelOpenAtom)
  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen} shouldScaleBackground={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-linear-to-t from-[#000000] to-[#00000000] epaper:bg-none" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 flex h-[80%] flex-col bg-bg-overlay epaper:ring-2 epaper:ring-border rounded-t-xl outline-none">
          <Drawer.Title className="sr-only">Help</Drawer.Title>
          <div className="flex-1 overflow-hidden">
            <HelpContent onClose={() => setIsOpen(false)} size="medium" />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
