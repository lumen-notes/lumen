import { createFileRoute } from "@tanstack/react-router"
import copy from "copy-to-clipboard"
import { useAtomValue } from "jotai"
import { useCallback } from "react"
import useResizeObserver from "use-resize-observer"
import { AppLayout } from "../components/app-layout"
import { Button } from "../components/button"
import { DropdownMenu } from "../components/dropdown-menu"
import { IconButton } from "../components/icon-button"
import {
  CenteredIcon16,
  CopyIcon16,
  EditIcon16,
  ExternalLinkIcon16,
  EyeIcon16,
  FullwidthIcon16,
  MoreIcon16,
  PinFillIcon12,
  PinFillIcon16,
  PinIcon16,
  ShareIcon16,
  TrashIcon16,
} from "../components/icons"
import { Markdown } from "../components/markdown"
import { SegmentedControl } from "../components/segmented-control"
import { githubRepoAtom, githubUserAtom, isSignedOutAtom } from "../global-state"
import { useNoteById, useSaveNote } from "../hooks/note"
import { cx } from "../utils/cx"
import { exportAsGist } from "../utils/export-as-gist"
import { checkIfPinned, togglePin } from "../utils/pin"
import { pluralize } from "../utils/pluralize"
import { useHotkeys } from "react-hotkeys-hook"

type RouteSearch = {
  mode: "read" | "write"
  width: "fixed" | "fill"
}

const toggleModeShortcut = ["⌥", "⇥"]

export const Route = createFileRoute("/notes_/$")({
  validateSearch: (search: Record<string, unknown>): RouteSearch => {
    return {
      mode: search.mode === "write" ? "write" : "read",
      width: search.width === "fill" ? "fill" : "fixed",
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { _splat: noteId } = Route.useParams()
  const { mode, width } = Route.useSearch()
  const navigate = Route.useNavigate()
  const note = useNoteById(noteId)
  const isPinned = checkIfPinned(note)
  const githubUser = useAtomValue(githubUserAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const isSignedOut = useAtomValue(isSignedOutAtom)
  const saveNote = useSaveNote()
  const { ref: containerRef, width: containerWidth = 0 } = useResizeObserver()

  const switchToWriting = useCallback(() => {
    navigate({ search: { mode: "write", width }, replace: true })
  }, [navigate, width])

  const switchToReading = useCallback(() => {
    navigate({ search: { mode: "read", width }, replace: true })
  }, [navigate, width])

  const toggleMode = useCallback(() => {
    if (mode === "read") {
      switchToWriting()
    } else {
      switchToReading()
    }
  }, [mode, switchToWriting, switchToReading])

  useHotkeys(
    "alt+tab",
    (event) => {
      toggleMode()
      event.preventDefault()
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
  )

  return (
    <AppLayout
      title={
        <span className="flex items-center gap-2">
          {isPinned ? <PinFillIcon12 className="flex-shrink-0 text-[var(--orange-11)]" /> : null}
          <span>{noteId}.md</span>
        </span>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button size="small" shortcut={["⌘", "S"]}>
            Save
          </Button>
          <SegmentedControl aria-label="Mode" size="small" className="hidden md:flex">
            <SegmentedControl.Segment
              selected={mode === "read"}
              shortcut={mode !== "read" ? toggleModeShortcut : undefined}
              onClick={switchToReading}
            >
              Read
            </SegmentedControl.Segment>
            <SegmentedControl.Segment
              selected={mode === "write"}
              shortcut={mode !== "write" ? toggleModeShortcut : undefined}
              onClick={switchToWriting}
            >
              Write
            </SegmentedControl.Segment>
          </SegmentedControl>
          <IconButton
            aria-label={mode === "read" ? "Write mode" : "Read mode"}
            size="small"
            shortcut={toggleModeShortcut}
            className="md:hidden"
            onClick={toggleMode}
          >
            {mode === "read" ? <EditIcon16 /> : <EyeIcon16 />}
          </IconButton>
          <div className="flex items-center">
            {containerWidth > 800 && (
              <IconButton
                aria-label="Toggle width"
                size="small"
                onClick={() =>
                  navigate({
                    search: { width: width === "fixed" ? "fill" : "fixed", mode },
                    replace: true,
                  })
                }
              >
                {width === "fixed" ? <CenteredIcon16 /> : <FullwidthIcon16 />}
              </IconButton>
            )}
            <DropdownMenu modal={false}>
              <DropdownMenu.Trigger asChild>
                <IconButton aria-label="More actions" size="small" disableTooltip>
                  <MoreIcon16 />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end" side="top">
                <DropdownMenu.Item
                  icon={
                    isPinned ? <PinFillIcon16 className="text-[var(--orange-11)]" /> : <PinIcon16 />
                  }
                  disabled={isSignedOut || !note}
                  onSelect={() => {
                    if (isSignedOut || !note) return
                    saveNote({ id: note.id, content: togglePin(note.content) })
                  }}
                >
                  {isPinned ? "Unpin" : "Pin"}
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item icon={<CopyIcon16 />} onSelect={() => copy(note?.content ?? "")}>
                  Copy markdown
                </DropdownMenu.Item>
                <DropdownMenu.Item icon={<CopyIcon16 />} onSelect={() => copy(noteId ?? "")}>
                  Copy ID
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  icon={<ExternalLinkIcon16 />}
                  href={`https://github.com/${githubRepo?.owner}/${githubRepo?.name}/blob/main/${noteId}.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                  disabled={isSignedOut}
                >
                  Open in GitHub
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  icon={<ShareIcon16 />}
                  disabled={isSignedOut}
                  onSelect={async () => {
                    if (!note) return

                    const url = await exportAsGist({
                      githubToken: githubUser?.token ?? "",
                      noteId: note.id,
                      note,
                    })

                    // Copy Gist URL to clipboard
                    copy(url)

                    // Open Gist in new tab
                    window.open(url, "_blank")
                  }}
                >
                  Export as Gist
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  variant="danger"
                  icon={<TrashIcon16 />}
                  // disabled={isSignedOut}
                  disabled
                  onSelect={() => {
                    // Ask the user to confirm before deleting a note with backlinks
                    if (
                      note &&
                      note.backlinks.length > 0 &&
                      !window.confirm(
                        `${note.id}.md has ${pluralize(
                          note.backlinks.length,
                          "backlink",
                        )}. Are you sure you want to delete it?`,
                      )
                    ) {
                      return
                    }

                    // TODO: handleDelete()
                  }}
                >
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
        </div>
      }
    >
      <div ref={containerRef}>
        <div className="p-4">
          <div className={cx("pb-[50vh]", width === "fixed" && "mx-auto max-w-3xl")}>
            <Markdown>{note?.content ?? ""}</Markdown>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
