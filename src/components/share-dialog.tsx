import * as Dialog from "@radix-ui/react-dialog"
import copy from "copy-to-clipboard"
import React from "react"
import { Note } from "../schema"
import { Button } from "./button"
import { IconButton } from "./icon-button"
import { CheckIcon16, ExternalLinkIcon16, LoadingIcon16, XIcon16 } from "./icons"
import { TextInput } from "./text-input"
import { useAtomValue } from "jotai"
import { githubUserAtom } from "../global-state"
import { createGist, deleteGist } from "../utils/gist"
import { NotePreview } from "./note-preview"

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
  const gistId = note.frontmatter.gist_id as string | undefined
  const shareUrl = gistId ? `${window.location.origin}/share/${gistId}` : ""
  const [isPublishing, setIsPublishing] = React.useState(false)
  const [isUnpublishing, setIsUnpublishing] = React.useState(false)
  const [linkCopied, setLinkCopied] = React.useState(false)
  const timeoutRef = React.useRef<number | null>(null)

  const handlePublish = React.useCallback(async () => {
    if (!githubUser) return

    setIsPublishing(true)
    const gist = await createGist({ note, githubUser })
    setIsPublishing(false)

    // TODO: Handle error
    if (!gist?.id) return

    onPublish(gist.id)
  }, [githubUser, note, onPublish])

  const handleUnpublish = React.useCallback(async () => {
    if (!githubUser?.token || !gistId) return

    setIsUnpublishing(true)
    const success = await deleteGist({ githubToken: githubUser.token, gistId })
    setIsUnpublishing(false)

    // TODO: Handle error
    if (!success) return

    onUnpublish()
  }, [githubUser, gistId, onUnpublish])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Content className="card-3 !rounded-xl fixed left-1/2 top-2 z-20 max-h-[85vh] w-[calc(100vw_-_1rem)] max-w-md -translate-x-1/2 overflow-auto focus:outline-none sm:top-[10vh]">
          <div className="grid gap-4 p-4">
            <div className="flex items-center justify-between h-4">
              <Dialog.Title className="font-bold">Share</Dialog.Title>
              <Dialog.Close asChild>
                <IconButton
                  aria-label="Close"
                  className="-m-2 coarse:-m-3 coarse:rounded-lg"
                  disableTooltip
                >
                  <XIcon16 />
                </IconButton>
              </Dialog.Close>
            </div>
            <div
              className="card-1 !bg-bg-overlay"
              style={{ "--font-family-content": "var(--font-family-serif)" } as React.CSSProperties}
            >
              <NotePreview note={note} hideProperties />
            </div>
            {gistId ? (
              <>
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <TextInput
                      id="share-url"
                      name="share-url"
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="pr-8 coarse:pr-10"
                    />
                    <IconButton
                      aria-label="Open in new tab"
                      className="absolute right-0 top-0"
                      asChild
                    >
                      <a href={shareUrl} target="_blank" rel="noreferrer noopener">
                        <ExternalLinkIcon16 />
                      </a>
                    </IconButton>
                  </div>
                  <span className="text-text-secondary text-sm">
                    Anyone with this link can view this note.
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="secondary" onClick={handleUnpublish} disabled={isUnpublishing}>
                    {isUnpublishing ? <LoadingIcon16 /> : "Unpublish"}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      copy(shareUrl)
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
                      "Copy link"
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Button variant="primary" onClick={handlePublish} disabled={isPublishing}>
                  {isPublishing ? <LoadingIcon16 /> : "Publish note"}
                </Button>
                <span className="text-text-secondary text-sm text-center">
                  Anyone with the link will be able to view this note.
                </span>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
