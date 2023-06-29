import * as RovingFocusGroup from "@radix-ui/react-roving-focus"
import copy from "copy-to-clipboard"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { useParams } from "react-router-dom"
import { useEvent } from "react-use"
import { Button, ButtonProps } from "../components/button"
import { Card } from "../components/card"
import { DropdownMenu } from "../components/dropdown-menu"
import { IconButton } from "../components/icon-button"
import { CopyIcon16, ExternalLinkIcon16, MoreIcon16, PaperclipIcon16 } from "../components/icons"
import { Markdown } from "../components/markdown"
import { ThemeColor } from "../components/theme-color"
import { githubRepoAtom, notesAtom } from "../global-atoms"
import { cx } from "../utils/cx"

export function NotePage() {
  const { id = "" } = useParams()
  const noteAtom = React.useMemo(() => selectAtom(notesAtom, (notes) => notes[id]), [id])
  const note = useAtomValue(noteAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)

  useEvent("keydown", (event) => {
    // Switch to editing with `e`
    if (event.key === "e" && !isEditing) {
      setIsEditing(true)
      event.preventDefault()
    }

    // Switch to viewing with `esc`
    // TODO: Ignore escape if a dropdown is open
    if (event.key === "Escape" && isEditing) {
      setIsEditing(false)
      event.preventDefault()
    }

    // Copy markdown with `command + c` if no text is selected
    if (event.metaKey && event.key == "c" && !window.getSelection()?.toString()) {
      copy(note.rawBody)
      event.preventDefault()
    }

    // Copy id with `command + shift + c`
    if (event.metaKey && event.shiftKey && event.key == "c") {
      copy(id)
      event.preventDefault()
    }

    // Open dropdown with `command + .`
    if (event.key === "." && event.metaKey) {
      setIsDropdownOpen(true)
      event.preventDefault()
    }
  })

  if (!note) {
    return <div>Not found</div>
  }
  return (
    <div className="flex h-screen flex-col overflow-auto bg-bg [@supports(height:100svh)]:h-[100svh]">
      {/* Make browser toolbar color match the note's background color */}
      <ThemeColor propertyName="--color-bg" />

      <div className="w-full flex-grow p-4">
        {!isEditing ? (
          <Markdown>{note.rawBody}</Markdown>
        ) : (
          <pre className="whitespace-pre-wrap">{note.rawBody}</pre>
        )}
      </div>

      <Card
        elevation={1}
        className="sticky bottom-2 m-2 flex flex-shrink-0 justify-between gap-2 overflow-auto rounded-md bg-bg-overlay-backdrop p-1 backdrop-blur-md"
      >
        <div className="flex items-center gap-2">
          <SegmentedControl>
            <SegmentedControl.Button selected={!isEditing} onClick={() => setIsEditing(false)}>
              View
            </SegmentedControl.Button>
            <SegmentedControl.Button selected={isEditing} onClick={() => setIsEditing(true)}>
              Edit
            </SegmentedControl.Button>
          </SegmentedControl>
          {isEditing ? (
            <>
              <div className="h-[50%] w-px bg-border-secondary" />
              <IconButton aria-label="Attach file">
                <PaperclipIcon16 />
              </IconButton>
            </>
          ) : null}
        </div>

        <div className="flex gap-2">
          {/* <Button variant="primary" shortcut={["⌘", "S"]}>
            Save
          </Button> */}

          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen} modal={false}>
            <DropdownMenu.Trigger asChild>
              <IconButton aria-label="Note actions" shortcut={["⌘", "."]} tooltipSide="top">
                <MoreIcon16 />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item
                icon={<CopyIcon16 />}
                onSelect={() => copy(note.rawBody)}
                shortcut={["⌘", "C"]}
              >
                Copy markdown
              </DropdownMenu.Item>
              <DropdownMenu.Item
                icon={<CopyIcon16 />}
                onSelect={() => copy(id)}
                shortcut={["⌘", "⇧", "C"]}
              >
                Copy ID
              </DropdownMenu.Item>
              {githubRepo ? (
                <>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item
                    icon={<ExternalLinkIcon16 />}
                    href={`https://github.com/${githubRepo.owner}/${githubRepo.name}/blob/main/${id}.md`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in GitHub
                  </DropdownMenu.Item>
                </>
              ) : null}
            </DropdownMenu.Content>
          </DropdownMenu>
        </div>
      </Card>
    </div>
  )
}

function SegmentedControl({ children }: { children: React.ReactNode }) {
  return (
    <RovingFocusGroup.Root orientation="horizontal">
      <ul className="flex gap-1 rounded-sm">{children}</ul>
    </RovingFocusGroup.Root>
  )
}

SegmentedControl.Button = ({
  selected = false,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"button"> & {
  selected?: boolean
  shortcut?: ButtonProps["shortcut"]
}) => {
  return (
    <li>
      <RovingFocusGroup.Item asChild active={selected}>
        <Button
          aria-current={selected}
          className={cx("ring-0", selected && "bg-bg-secondary", className)}
          {...props}
        />
      </RovingFocusGroup.Item>
    </li>
  )
}
