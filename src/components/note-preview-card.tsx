import { Link } from "@tanstack/react-router"
import copy from "copy-to-clipboard"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import {
  githubRepoAtom,
  githubUserAtom,
  globalStateMachineAtom,
  isSignedOutAtom,
} from "../global-state"
import { useDeleteNote, useNoteById, useSaveNote } from "../hooks/note"
import { NoteId } from "../schema"
import { cx } from "../utils/cx"
import { exportAsGist } from "../utils/export-as-gist"
import { checkIfPinned, togglePin } from "../utils/pin"
import { pluralize } from "../utils/pluralize"
import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import {
  CopyIcon16,
  ExternalLinkIcon16,
  MoreIcon16,
  PinFillIcon16,
  PinIcon16,
  ShareIcon16,
  TrashIcon16,
} from "./icons"
import { NotePreview } from "./note-preview"

const isResolvingRepoAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.resolvingRepo"),
)

type NoteCardProps = {
  id: NoteId
}

export function NotePreviewCard(props: NoteCardProps) {
  const isResolvingRepo = useAtomValue(isResolvingRepoAtom)

  // Show a loading state while resolving the repo
  // TODO: Add shimmer animation
  if (isResolvingRepo) {
    return <div className="aspect-[5/3] w-full rounded-lg bg-bg-secondary" />
  }

  return <_NotePreviewCard {...props} />
}

const _NotePreviewCard = React.memo(function NoteCard({ id }: NoteCardProps) {
  const note = useNoteById(id)
  const githubUser = useAtomValue(githubUserAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const isSignedOut = useAtomValue(isSignedOutAtom)
  const isPinned = checkIfPinned(note?.content ?? "")
  const saveNote = useSaveNote()
  const deleteNote = useDeleteNote()
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)

  if (!note) return null

  return (
    <div className="group relative transition-transform duration-100 [&:has(a:active)]:scale-[98%]">
      <Link
        to="/notes/$"
        params={{ _splat: id }}
        search={{ mode: "read", width: "fixed" }}
        className={cx(
          "card-1 relative block w-full cursor-pointer overflow-hidden transition-[box-shadow,transform] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus group-hover:ring-2 [&:not(:focus-visible)]:group-focus-within:ring-2 [&:not(:focus-visible)]:group-focus-within:ring-border [&:not(:focus-visible)]:group-hover:ring-border",
          isDropdownOpen && "ring-2 ring-border",
        )}
      >
        <NotePreview>{note?.content ?? ""}</NotePreview>
      </Link>
      <div
        className={cx(
          "absolute right-1.5 top-1.5 rounded bg-bg-card opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100",
          isPinned && "!opacity-100",
        )}
      >
        <IconButton
          aria-label={isPinned ? "Unpin" : "Pin"}
          tooltipSide="left"
          disabled={isSignedOut}
          onClick={() => {
            if (isSignedOut) return
            saveNote({ id, content: togglePin(note.content) })
          }}
        >
          {isPinned ? <PinFillIcon16 className=" text-[var(--orange-11)]" /> : <PinIcon16 />}
        </IconButton>
      </div>
      {note ? (
        <div
          className={cx(
            "absolute bottom-1.5 right-1.5 flex gap-1 rounded bg-bg-card opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 ",
            isDropdownOpen && "!opacity-100",
          )}
        >
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen} modal={false}>
            <DropdownMenu.Trigger asChild>
              <IconButton aria-label="Actions" disableTooltip>
                <MoreIcon16 />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" side="top">
              <DropdownMenu.Item icon={<CopyIcon16 />} onSelect={() => copy(note?.content ?? "")}>
                Copy markdown
              </DropdownMenu.Item>
              <DropdownMenu.Item icon={<CopyIcon16 />} onSelect={() => copy(id)}>
                Copy ID
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                icon={<ExternalLinkIcon16 />}
                href={`https://github.com/${githubRepo?.owner}/${githubRepo?.name}/blob/main/${id}.md`}
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
                  const url = await exportAsGist({
                    githubToken: githubUser?.token ?? "",
                    noteId: id,
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
                disabled={isSignedOut}
                onSelect={() => {
                  // Ask the user to confirm before deleting a note with backlinks
                  if (
                    note.backlinks.length > 0 &&
                    !window.confirm(
                      `${id}.md has ${pluralize(
                        note.backlinks.length,
                        "backlink",
                      )}. Are you sure you want to delete it?`,
                    )
                  ) {
                    return
                  }

                  deleteNote(id)
                }}
              >
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </div>
      ) : null}
    </div>
  )
})
