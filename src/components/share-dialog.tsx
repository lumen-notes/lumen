import copy from "copy-to-clipboard"
import { useAtomValue } from "jotai"
import React from "react"
import { useNetworkState } from "react-use"
import { githubUserAtom, notesAtom } from "../global-state"
import { Note } from "../schema"
import { createGist, deleteGist } from "../utils/gist"
import { inlineNoteEmbeds } from "../utils/inline-note-embeds"
import { stripWikilinks } from "../utils/strip-wikilinks"
import { Button } from "./button"
import { Dialog } from "./dialog"
import { FormControl } from "./form-control"
import { IconButton } from "./icon-button"
import {
  CheckIcon16,
  ExternalLinkIcon16,
  GlobeSlashIcon16,
  LinkIcon16,
  LoadingIcon16,
} from "./icons"
import { NotePreview } from "./note-preview"
import { TextInput } from "./text-input"

type ShareDialogProps = {
  open: boolean
  note: Note
  onPublish: (gistId: string) => void
  onUnpublish: () => void
  onOpenChange: (open: boolean) => void
}

export function ShareDialog({
  open,
  note,
  onPublish,
  onUnpublish,
  onOpenChange,
}: ShareDialogProps) {
  const githubUser = useAtomValue(githubUserAtom)
  const notes = useAtomValue(notesAtom)
  const { online } = useNetworkState()
  const gistId = note.frontmatter.gist_id as string | undefined
  const shareLink = gistId ? `${window.location.origin}/share/${gistId}` : ""
  const [isPublishing, setIsPublishing] = React.useState(false)
  const [isUnpublishing, setIsUnpublishing] = React.useState(false)
  const [linkCopied, setLinkCopied] = React.useState(false)
  const timeoutRef = React.useRef<number | null>(null)

  const strippedNote = React.useMemo(() => {
    // Process note content so the preview matches the published note:
    // 1. Inline note embeds as blockquotes
    // 2. Strip wikilinks
    const contentWithEmbeds = inlineNoteEmbeds(note.content, notes)
    return { ...note, content: stripWikilinks(contentWithEmbeds) }
  }, [note, notes])

  const handlePublish = React.useCallback(async () => {
    if (!githubUser) return

    setIsPublishing(true)
    const gist = await createGist({ note, githubUser, notes })
    setIsPublishing(false)

    // TODO: Handle error
    if (!gist?.id) return

    onPublish(gist.id)
  }, [githubUser, note, notes, onPublish])

  const handleUnpublish = React.useCallback(async () => {
    if (!githubUser?.token || !gistId) return

    const confirmed = window.confirm("Are you sure you want to unpublish this note?")
    if (!confirmed) return

    setIsUnpublishing(true)
    const success = await deleteGist({ githubToken: githubUser.token, gistId })
    setIsUnpublishing(false)

    // TODO: Handle error
    if (!success) return

    onUnpublish()
  }, [githubUser, gistId, onUnpublish])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content title="Share">
        <div className="grid gap-4">
          <div
            className="card-1 bg-bg-overlay!"
            style={{ "--font-family-content": "var(--font-family-serif)" } as React.CSSProperties}
          >
            <NotePreview note={strippedNote} hideProperties />
          </div>
          {gistId ? (
            <>
              <FormControl
                htmlFor="share-url"
                label="Share link"
                visuallyHideLabel
                description="Anyone with this link can view this note."
              >
                <div className="relative">
                  <TextInput
                    id="share-link"
                    name="share-link"
                    type="text"
                    readOnly
                    value={shareLink}
                    className="pr-8 coarse:pr-10"
                  />
                  <IconButton
                    aria-label="Open in new tab"
                    className="absolute right-0 top-0"
                    asChild
                  >
                    <a href={shareLink} target="_blank" rel="noreferrer noopener">
                      <ExternalLinkIcon16 />
                    </a>
                  </IconButton>
                </div>
              </FormControl>
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant="secondary"
                  onClick={handleUnpublish}
                  disabled={isUnpublishing || !online}
                  className="text-text-danger"
                >
                  {isUnpublishing ? (
                    <LoadingIcon16 className="text-text" />
                  ) : (
                    <>
                      <GlobeSlashIcon16 />
                      Unpublish
                    </>
                  )}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    copy(shareLink)
                    setLinkCopied(true)

                    if (timeoutRef.current) {
                      window.clearTimeout(timeoutRef.current)
                    }

                    timeoutRef.current = window.setTimeout(() => setLinkCopied(false), 1000)
                  }}
                >
                  {linkCopied ? (
                    <>
                      <CheckIcon16 />
                      Link copied
                    </>
                  ) : (
                    <>
                      <LinkIcon16 />
                      Copy link
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Button variant="primary" onClick={handlePublish} disabled={isPublishing || !online}>
                {isPublishing ? <LoadingIcon16 /> : "Publish note"}
              </Button>
              <span className="text-text-secondary text-sm text-center text-pretty">
                Anyone with the link will be able to view this note.
              </span>
            </div>
          )}
        </div>
      </Dialog.Content>
    </Dialog>
  )
}
