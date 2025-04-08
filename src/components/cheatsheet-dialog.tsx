import { Dialog } from "./dialog"
import { Markdown } from "./markdown"

function CheatsheetSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-text-secondary h-4 flex items-center">{title}</div>
      <ul className="flex flex-col">{children}</ul>
    </div>
  )
}

function CheatsheetItem({ children }: { children: React.ReactNode }) {
  return <li className="flex justify-between items-center h-9 gap-4">{children}</li>
}

function Keys({ keys }: { keys: string[] }) {
  return (
    <div className="flex items-center gap-0.5">
      {keys.map((key) => (
        <kbd
          key={key}
          className="min-w-[22px] font-[inherit] rounded-sm bg-bg-tertiary p-1 text-center font-body leading-none text-text-secondary shadow-[inset_0_-1px_0_var(--color-border-secondary)] dark:shadow-[inset_0_1px_0_var(--color-border-secondary),0_1px_2px_-1px_var(--color-bg)]"
        >
          {key}
        </kbd>
      ))}
    </div>
  )
}

export function CheatsheetDialog() {
  return (
    <Dialog.Content title="Cheatsheet">
      <div className="grid gap-5">
        <CheatsheetSection title="Global shortcuts">
          <CheatsheetItem>
            <span>Create new note</span>
            <Keys keys={["⌘", "⇧", "O"]} />
          </CheatsheetItem>
          <CheatsheetItem>
            <span>Open command menu</span>
            <Keys keys={["⌘", "K"]} />
          </CheatsheetItem>
        </CheatsheetSection>

        <CheatsheetSection title="Note shortcuts">
          <CheatsheetItem>
            <span>Toggle read/write mode</span>
            <Keys keys={["⌥", "⇥"]} />
          </CheatsheetItem>
          <CheatsheetItem>
            <span>Save note</span>
            <Keys keys={["⌘", "S"]} />
          </CheatsheetItem>
          <CheatsheetItem>
            <span>Save and switch to read mode</span>
            <Keys keys={["⌘", "⏎"]} />
          </CheatsheetItem>
          {/* <CheatsheetItem>
            <span>Reference note</span>
            <Keys keys={["[", "["]} />
          </CheatsheetItem>
          <CheatsheetItem>
            <span>Insert template</span>
            <Keys keys={["/"]} />
          </CheatsheetItem> */}
        </CheatsheetSection>

        <CheatsheetSection title="Formatting">
          {/* App-specific features */}
          <CheatsheetItem>
            <Markdown>[[id|note link]]</Markdown>
            <code className="text-text-secondary">[[id|note link]]</code>
          </CheatsheetItem>
          <CheatsheetItem>
            <Markdown>[[2024-07-11]]</Markdown>
            <code className="text-text-secondary">[[2024-07-11]]</code>
          </CheatsheetItem>
          <CheatsheetItem>
            <Markdown>[[2024-W28]]</Markdown>
            <code className="text-text-secondary">[[2024-W28]]</code>
          </CheatsheetItem>
          <CheatsheetItem>
            <Markdown>#tag</Markdown>
            <code className="text-text-secondary">#tag</code>
          </CheatsheetItem>

          {/* Text formatting */}
          <CheatsheetItem>
            <Markdown>_italic_</Markdown>
            <code className="text-text-secondary">_italic_</code>
          </CheatsheetItem>
          <CheatsheetItem>
            <Markdown>**bold**</Markdown>
            <code className="text-text-secondary">**bold**</code>
          </CheatsheetItem>
          <CheatsheetItem>
            <Markdown>~~strikethrough~~</Markdown>
            <code className="text-text-secondary">~~strikethrough~~</code>
          </CheatsheetItem>
          <CheatsheetItem>
            <Markdown>`code`</Markdown>
            <code className="text-text-secondary">`code`</code>
          </CheatsheetItem>
          <CheatsheetItem>
            <Markdown>[link](https://example.com)</Markdown>
            <code className="text-text-secondary">[link](https://example.com)</code>
          </CheatsheetItem>
          <CheatsheetItem>
            <Markdown>{"$$LaTeX^{math}$$"}</Markdown>
            <code className="text-text-secondary">{"$$LaTeX^{math}$$"}</code>
          </CheatsheetItem>

          {/* Block elements */}
          <CheatsheetItem>
            <div className="flex-grow max-w-[10ch]">
              <Markdown>---</Markdown>
            </div>
            <code className="text-text-secondary">---</code>
          </CheatsheetItem>
          <CheatsheetItem>
            <Markdown># heading 1</Markdown>
            <code className="text-text-secondary"># heading 1</code>
          </CheatsheetItem>
          <CheatsheetItem>
            <Markdown>## heading 2</Markdown>
            <code className="text-text-secondary">## heading 2</code>
          </CheatsheetItem>
          <CheatsheetItem>
            <Markdown>- unordered list</Markdown>
            <code className="text-text-secondary">- unordered list</code>
          </CheatsheetItem>
          <CheatsheetItem>
            <Markdown>1. ordered list</Markdown>
            <code className="text-text-secondary">1. ordered list</code>
          </CheatsheetItem>
          <CheatsheetItem>
            <Markdown>- [ ] unchecked</Markdown>
            <code className="text-text-secondary">- [ ] unchecked</code>
          </CheatsheetItem>
          <CheatsheetItem>
            <Markdown>- [x] checked</Markdown>
            <code className="text-text-secondary">- [x] checked</code>
          </CheatsheetItem>
          <CheatsheetItem>
            <Markdown>{"> blockquote"}</Markdown>
            <code className="text-text-secondary">{"> blockquote"}</code>
          </CheatsheetItem>
        </CheatsheetSection>
      </div>
    </Dialog.Content>
  )
}
