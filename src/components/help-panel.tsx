import { useAtom, useAtomValue } from "jotai"
import { useNetworkState } from "react-use"
import { Drawer } from "vaul"
import { isHelpPanelOpenAtom, openaiKeyAtom, voiceAssistantEnabledAtom } from "../global-state"
import { IconButton } from "./icon-button"
import { CircleQuestionMarkFillIcon16, CircleQuestionMarkIcon16, XIcon16 } from "./icons"
import { Keys as KeyboardShortcut } from "./keys"
import { Markdown } from "./markdown"
import { NoteHoverCard } from "./note-hover-card"

function HelpSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="text-sm text-text-secondary h-4 flex items-center">{title}</div>
      <ul className="flex flex-col">{children}</ul>
    </div>
  )
}

function HelpItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between h-9 gap-3 [&>:first-child]:min-w-0 [&>:first-child]:truncate [&>:last-child]:shrink-0">
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

function FormatItem({ syntax }: { syntax: string }) {
  return (
    <li className="flex flex-col gap-1 py-2">
      <code className="text-text-secondary">{syntax}</code>
      <Markdown>{syntax}</Markdown>
    </li>
  )
}

function HelpPanelContent({
  onClose,
  size = "small",
}: {
  onClose: () => void
  size?: "small" | "medium"
}) {
  const openaiKey = useAtomValue(openaiKeyAtom)
  const voiceAssistantEnabled = useAtomValue(voiceAssistantEnabledAtom)
  const { online } = useNetworkState()
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
        <div className="overflow-auto scroll-mask p-4 grid gap-5">
          <HelpSection title="Links">
            <HelpItem>
              <a
                href="https://github.com/lumen-notes/lumen/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="link link-external"
              >
                Send feedback
              </a>
            </HelpItem>
            <HelpItem>
              <a
                href="https://github.com/lumen-notes/lumen/blob/main/CHANGELOG.md"
                target="_blank"
                rel="noopener noreferrer"
                className="link link-external"
              >
                Changelog
              </a>
            </HelpItem>
            <HelpItem>
              <a
                href="https://github.com/lumen-notes/lumen"
                target="_blank"
                rel="noopener noreferrer"
                className="link link-external"
              >
                GitHub
              </a>
            </HelpItem>
            <HelpItem>
              <a
                href="https://twitter.com/lumen_notes"
                target="_blank"
                rel="noopener noreferrer"
                className="link link-external"
              >
                Twitter
              </a>
            </HelpItem>
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
            {online && openaiKey && voiceAssistantEnabled && (
              <HelpItem>
                <span>Toggle voice conversation</span>
                <Keys keys={["⌘", "⇧", "V"]} />
              </HelpItem>
            )}
          </HelpSection>

          <HelpSection title="Note shortcuts">
            <HelpItem>
              <span>Toggle view/edit</span>
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
            <FormatItem syntax="# Heading 1" />
            <FormatItem syntax="## Heading 2" />
            <FormatItem syntax="_Italic_" />
            <FormatItem syntax="**Bold**" />
            <FormatItem syntax="~~Strikethrough~~" />
            <FormatItem syntax="`Code`" />
            <FormatItem syntax="[Link](https://example.com)" />
            <FormatItem syntax="- Unordered list" />
            <FormatItem syntax="1. Ordered list" />
            <FormatItem syntax="- [ ] Unchecked" />
            <FormatItem syntax="- [x] Checked" />
            <FormatItem syntax="> Blockquote" />
            <FormatItem syntax="$$LaTeX^{math}$$" />
            <FormatItem syntax="---" />
            <FormatItem syntax="[[id|Note link]]" />
            <FormatItem syntax="[[2024-07-11]]" />
            <FormatItem syntax="[[2024-W28]]" />
            <FormatItem syntax="#tag" />
          </HelpSection>
        </div>
      </div>
    </NoteHoverCard.Provider>
  )
}

export function HelpPanelSidebar() {
  const [, setHelpPanel] = useAtom(isHelpPanelOpenAtom)
  return (
    <div className="grid grid-rows-[1fr] overflow-hidden h-full">
      <HelpPanelContent onClose={() => setHelpPanel(false)} />
    </div>
  )
}

export function HelpPanelDrawer() {
  const [isOpen, setIsOpen] = useAtom(isHelpPanelOpenAtom)
  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen} shouldScaleBackground={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-gradient-to-t from-[#000000] to-[#00000000] epaper:bg-none" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 flex h-[80%] flex-col bg-bg-overlay epaper:ring-2 epaper:ring-border rounded-t-[calc(var(--border-radius-base)+8px)] outline-none">
          <Drawer.Title className="sr-only">Help</Drawer.Title>
          <div className="flex-1 overflow-hidden">
            <HelpPanelContent onClose={() => setIsOpen(false)} size="medium" />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

export function HelpPanelToggle({
  className,
  size,
}: {
  className?: string
  size?: "medium" | "large"
}) {
  const [isOpen, setIsOpen] = useAtom(isHelpPanelOpenAtom)
  return (
    <button
      className={`${className} group`}
      data-size={size}
      aria-current={isOpen ? "page" : undefined}
      onClick={() => setIsOpen(!isOpen)}
    >
      {isOpen ? <CircleQuestionMarkFillIcon16 /> : <CircleQuestionMarkIcon16 />}
      Help
      <div className="ml-auto [&_*]:text-text-tertiary hidden coarse:!hidden group-hover:flex group-focus-visible:flex [[aria-current]>&]:flex">
        <KeyboardShortcut keys={["⌘", "/"]} />
      </div>
    </button>
  )
}
