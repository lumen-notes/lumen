import { Link } from "@tanstack/react-router"
import copy from "copy-to-clipboard"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { useNetworkState } from "react-use"
import { githubRepoAtom, globalStateMachineAtom, isSignedOutAtom } from "../global-state"
import { useDeleteNote, useNoteById, useSaveNote } from "../hooks/note"
import { NoteId } from "../schema"
import { cx } from "../utils/cx"
import { updateFrontmatterValue } from "../utils/frontmatter"
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
import { ShareDialog } from "./share-dialog"

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
  const githubRepo = useAtomValue(githubRepoAtom)
  const isSignedOut = useAtomValue(isSignedOutAtom)
  const { online } = useNetworkState()
  const saveNote = useSaveNote()
  const deleteNote = useDeleteNote()
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = React.useState(false)

  if (!note) return null

  return (
    <div className="group relative">
      <Link
        to="/notes/$"
        params={{ _splat: id }}
        search={{
          mode: "read",
          query: undefined,
          view: "grid",
        }}
        className={cx(
          "card-1 !rounded-[calc(var(--border-radius-base)+6px)] relative block w-full cursor-pointer overflow-hidden -outline-offset-1",
          "focus-visible:outline-none",
          "focus-visible:outline-2",
          "focus-visible:outline",
          "focus-visible:outline-border-focus",
          "[&:not(:focus-visible)]:group-hover:outline-2",
          "[&:not(:focus-visible)]:group-hover:outline",
          "[&:not(:focus-visible)]:group-hover:outline-[var(--neutral-7)]",
          "eink:group-hover:!outline-border",
          "[&:not(:focus-visible)]:group-focus-within:outline-2",
          "[&:not(:focus-visible)]:group-focus-within:outline",
          "[&:not(:focus-visible)]:group-focus-within:outline-[var(--neutral-7)]",
          "eink:group-focus-within:!outline-border",
        )}
      >
        <NotePreview note={note} className="coarse:pr-[52px]" />
      </Link>
      <div
        className={cx(
          "absolute right-1.5 top-1.5 rounded bg-bg-card opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 coarse:opacity-100",
          note.pinned && "!opacity-100",
        )}
      >
        <IconButton
          aria-label={note.pinned ? "Unpin" : "Pin"}
          tooltipSide="left"
          disabled={isSignedOut}
          onClick={() => {
            if (isSignedOut) return
            saveNote({
              id,
              content: updateFrontmatterValue({
                content: note.content,
                properties: { pinned: note.pinned ? null : true },
              }),
            })
          }}
        >
          {note.pinned ? <PinFillIcon16 className="text-text-pinned" /> : <PinIcon16 />}
        </IconButton>
      </div>
      {note ? (
        <div
          className={cx(
            "absolute bottom-1.5 right-1.5 flex gap-1 rounded bg-bg-card opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 coarse:opacity-100",
            isDropdownOpen && "!opacity-100",
          )}
        >
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen} modal={false}>
            <DropdownMenu.Trigger
              render={
                <IconButton aria-label="Actions" disableTooltip>
                  <MoreIcon16 />
                </IconButton>
              }
            />
            <DropdownMenu.Content align="end" side="top">
              <DropdownMenu.Item icon={<CopyIcon16 />} onClick={() => copy(note?.content ?? "")}>
                Copy markdown
              </DropdownMenu.Item>
              <DropdownMenu.Item icon={<CopyIcon16 />} onClick={() => copy(id)}>
                Copy ID
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                icon={<ShareIcon16 />}
                disabled={isSignedOut || !online}
                onClick={() => setIsShareDialogOpen(true)}
              >
                Share
              </DropdownMenu.Item>
              <DropdownMenu.Item
                icon={<ExternalLinkIcon16 />}
                href={`https://github.com/${githubRepo?.owner}/${githubRepo?.name}/blob/main/${id}.md`}
                target="_blank"
                rel="noopener noreferrer"
                disabled={isSignedOut}
              >
                Open in GitHub
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                variant="danger"
                icon={<TrashIcon16 />}
                disabled={isSignedOut}
                onClick={() => {
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
          <ShareDialog
            open={isShareDialogOpen}
            note={note}
            onPublish={(gistId) => {
              saveNote({
                id,
                content: updateFrontmatterValue({
                  content: note.content,
                  properties: { gist_id: gistId },
                }),
              })
            }}
            onUnpublish={() => {
              saveNote({
                id,
                content: updateFrontmatterValue({
                  content: note.content,
                  properties: { gist_id: null },
                }),
              })
            }}
            onOpenChange={setIsShareDialogOpen}
          />
        </div>
      ) : null}
    </div>
  )
})
