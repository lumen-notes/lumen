import { useAtom } from "jotai"
import { Drawer } from "vaul"
import { isHelpPanelOpenAtom } from "../global-state"
import { IconButton } from "./icon-button"
import { CircleQuestionMarkIcon16, XIcon16 } from "./icons"
import { Markdown } from "./markdown"
import { Details } from "./details"
import { HoverCard } from "./hover-card"

function HelpSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 p-4">
      <Details>
        <Details.Summary>{title}</Details.Summary>
        <ul className="flex flex-col gap-1">{children}</ul>
      </Details>
    </div>
  )
}

function HelpItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between h-8 group-data-[size=medium]/help:h-10 gap-3 *:first:min-w-0 *:first:truncate *:last:shrink-0">
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

function SearchSyntaxItem({
  syntax,
  description,
}: {
  syntax: string
  description: string
}) {
  return (
    <li className="flex flex-col gap-0.5 py-1.5">
      <code className="text-text">{syntax}</code>
      <span className="text-text-secondary text-sm">{description}</span>
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
    <HoverCard.Provider container={null}>
      <div className="grid grid-rows-[auto_1fr] overflow-hidden h-full group/help" data-size={size}>
        <header className="flex items-center gap-2 px-2 py-2">
          <div className="flex w-0 grow items-center gap-3 px-2">
            <CircleQuestionMarkIcon16 className="shrink-0 text-text-secondary" />
            <div className="truncate">Help</div>
          </div>
          <IconButton aria-label="Close" shortcut={["⌘", "/"]} size={size} onClick={onClose}>
            <XIcon16 />
          </IconButton>
        </header>

        <div className="overflow-auto scroll-mask grid content-start divide-y divide-border-secondary">
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

          <HelpSection title="Search syntax">
            <SearchSyntaxItem syntax="tag:work" description="Notes with tag" />
            <SearchSyntaxItem syntax="-tag:archive" description="Exclude notes with tag" />
            <SearchSyntaxItem syntax="tag:work,personal" description="Multiple values (OR)" />
            <SearchSyntaxItem
              syntax='title:"My Note"'
              description="Exact title (quotes for spaces)"
            />
            <SearchSyntaxItem syntax="type:daily" description="Note type (note, daily, weekly)" />
            <SearchSyntaxItem syntax="link:note-id" description="Notes linking to ID" />
            <SearchSyntaxItem syntax="backlink:note-id" description="Notes linked from ID" />
            <SearchSyntaxItem syntax="date:2024-01-15" description="Notes with date" />
            <SearchSyntaxItem syntax="date:>=today" description="Date with range operator" />
            <SearchSyntaxItem syntax="date:next+week" description="Natural language dates" />
            <SearchSyntaxItem syntax="tags:>=2" description="Count filters (>=, <=, >, <)" />
            <SearchSyntaxItem syntax="has:tags" description="Has property" />
            <SearchSyntaxItem syntax="no:backlinks" description="Missing property" />
            <SearchSyntaxItem syntax="priority:high" description="Frontmatter field" />
            <SearchSyntaxItem syntax="sort:title" description="Sort results" />
            <SearchSyntaxItem syntax="sort:updated_at:desc" description="Sort with direction" />
            <SearchSyntaxItem syntax="sort:tags,title" description="Multiple sort keys" />
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
    </HoverCard.Provider>
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
