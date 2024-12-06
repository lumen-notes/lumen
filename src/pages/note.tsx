import { EditorSelection, ReactCodeMirrorRef } from "@uiw/react-codemirror"
import copy from "copy-to-clipboard"
import { id } from "date-fns/locale"
import ejs from "ejs"
import { useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { flushSync } from "react-dom"
import { useNavigate, useParams } from "react-router-dom"
import { useNetworkState } from "react-use"
import useResizeObserver from "use-resize-observer"
import { z } from "zod"
import { Button } from "../components/button"
import { Calendar } from "../components/calendar"
import { Details } from "../components/details"
import { DropdownMenu } from "../components/dropdown-menu"
import { IconButton } from "../components/icon-button"
import {
  ArrowLeftIcon16,
  ArrowRightIcon16,
  BookIcon16,
  CalendarIcon16,
  CenteredIcon16,
  CopyIcon16,
  EditIcon16,
  ExternalLinkIcon16,
  EyeIcon16,
  FullwidthIcon16,
  MenuIcon16,
  MessageIcon16,
  MoreIcon16,
  NoteIcon16,
  PinFillIcon12,
  PinFillIcon16,
  PinIcon16,
  PlusIcon16,
  SettingsIcon16,
  ShareIcon16,
  TagIcon16,
  TrashIcon16,
  UndoIcon16,
} from "../components/icons"
import { removeFrontmatterComments } from "../components/insert-template"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { Markdown } from "../components/markdown"
import { NoteEditor } from "../components/note-editor"
import { NoteList } from "../components/note-list"
import { SyncStatusIcon, useSyncStatusText } from "../components/sync-status"
import {
  githubRepoAtom,
  githubUserAtom,
  globalStateMachineAtom,
  isSignedOutAtom,
  templatesAtom,
} from "../global-state"
import { useNoteById, useSaveNote } from "../hooks/note"
import { useSearchNotes } from "../hooks/search"
import { useSearchParam } from "../hooks/search-param"
import { GitHubRepository } from "../schema"
import { cx } from "../utils/cx"
import {
  formatDateDistance,
  formatWeekDistance,
  isValidDateString,
  isValidWeekString,
  toDateString,
} from "../utils/date"
import { exportAsGist } from "../utils/export-as-gist"
import { parseFrontmatter } from "../utils/parse-frontmatter"
import { checkIfPinned, togglePin } from "../utils/pin"
import { pluralize } from "../utils/pluralize"

const widthSchema = z.enum(["fixed", "fill"])

function getStorageKey({
  githubRepo,
  noteId,
}: {
  githubRepo: GitHubRepository | null
  noteId: string
}) {
  if (!githubRepo) return noteId
  return `${githubRepo.owner}/${githubRepo.name}/${noteId}`
}

const dailyTemplateAtom = selectAtom(templatesAtom, (templates) =>
  Object.values(templates).find((t) => t.name.match(/^daily$/i)),
)

export function useDailyTemplate(date: string) {
  const dailyTemplate = useAtomValue(dailyTemplateAtom)

  const renderedDailyTemplate = React.useMemo(() => {
    if (!dailyTemplate) return ""

    let text = ejs.render(dailyTemplate.body, { date })
    text = removeFrontmatterComments(text)
    text = text.replace("{cursor}", "")
    return text
  }, [dailyTemplate, date])

  return renderedDailyTemplate
}

export function NotePage() {
  const { "*": noteId = "" } = useParams()
  const isSignedOut = useAtomValue(isSignedOutAtom)
  const note = useNoteById(noteId)
  const githubRepo = useAtomValue(githubRepoAtom)
  const githubUser = useAtomValue(githubUserAtom)
  const saveNote = useSaveNote()
  const isDailyPage = isValidDateString(noteId)
  const isWeeklyPage = isValidWeekString(noteId)
  const dailyTemplate = useDailyTemplate(noteId)
  const placeholder = "Write something…"
  const searchNotes = useSearchNotes()

  const backlinks = React.useMemo(
    () => searchNotes(`link:"${noteId}" -id:"${noteId}"`),
    [noteId, searchNotes],
  )

  const [width, setWidth] = useSearchParam<z.infer<typeof widthSchema>>("width", {
    validate: widthSchema.catch("fixed").parse,
    replace: true,
  })

  const defaultValue = React.useMemo(() => {
    if (isDailyPage) return dailyTemplate
    return ""
  }, [isDailyPage, dailyTemplate])

  const [editorValue, setEditorValue] = React.useState(() => {
    // We use localStorage to persist a "draft" of the note while editing,
    // then clear it when the note is saved
    return (
      localStorage.getItem(getStorageKey({ githubRepo, noteId: noteId })) ?? note?.content ?? ""
    )
  })

  const [mode, setMode] = React.useState<"read" | "write">(
    !note || editorValue !== note.content ? "write" : "read",
  )

  const isDirty = React.useMemo(() => {
    if (!note) {
      return editorValue !== defaultValue
    }

    return editorValue !== note.content
  }, [note, editorValue, defaultValue])

  // If the note content changes and there is no pending draft in localStorage,
  // update the editor value
  if (
    note &&
    note.content !== editorValue &&
    localStorage.getItem(getStorageKey({ githubRepo, noteId })) === null
  ) {
    setEditorValue(note.content)
  }

  // If the default value changes and there is no pending draft in localStorage,
  // update the editor value
  if (
    !note &&
    editorValue !== defaultValue &&
    localStorage.getItem(getStorageKey({ githubRepo, noteId })) === null
  ) {
    setEditorValue(defaultValue)
  }

  // Refs
  const editorRef = React.useRef<ReactCodeMirrorRef>(null)
  const { ref: scrollContainerRef, width: scrollContainerWidth = 0 } = useResizeObserver()

  const handleChange = React.useCallback(
    (value: string) => {
      setEditorValue(value)

      if (note ? value !== note.content : value !== defaultValue) {
        localStorage.setItem(getStorageKey({ githubRepo, noteId }), value)
      } else {
        localStorage.removeItem(getStorageKey({ githubRepo, noteId }))
      }
    },
    [note, defaultValue, githubRepo, noteId],
  )

  const handleSave = React.useCallback(
    (content: string) => {
      if (isSignedOut) {
        return
      }

      // Only save if the content has changed
      if (content !== note?.content) {
        saveNote({ id: noteId, content })
      }

      localStorage.removeItem(getStorageKey({ githubRepo, noteId }))
    },
    [note, saveNote, githubRepo, noteId, isSignedOut],
  )

  const handleDiscardChanges = React.useCallback(() => {
    // Reset editor value to the last saved state of the note
    setEditorValue(note?.content ?? defaultValue)
    // Clear the "draft" from localStorage
    localStorage.removeItem(getStorageKey({ githubRepo, noteId }))
  }, [note, defaultValue, githubRepo, noteId])

  const switchToWriting = React.useCallback(() => {
    flushSync(() => {
      setMode("write")
    })

    const editor = editorRef.current

    if (editor) {
      // Focus the editor
      editor.view?.focus()
      // Move cursor to end of document
      editor.view?.dispatch({
        selection: EditorSelection.cursor(editor.view.state.doc.sliceString(0).length),
      })
    }
  }, [])

  const switchToReading = React.useCallback(() => {
    setMode("read")
  }, [])

  const navigate = useNavigate()

  return (
    <div className="grid grid-rows-[auto_1fr] overflow-hidden">
      <header className="flex h-10 items-center justify-between px-2 sm:grid sm:grid-cols-3">
        <div className="hidden items-center sm:flex">
          <DropdownMenu modal={false}>
            <DropdownMenu.Trigger asChild>
              <IconButton aria-label="Menu" size="small" disableTooltip>
                <MenuIcon16 />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="start">
              {/* TODO: Render these as links */}
              <DropdownMenu.Item icon={<NoteIcon16 />} onClick={() => navigate("/")}>
                Notes
              </DropdownMenu.Item>
              <DropdownMenu.Item
                icon={<CalendarIcon16>{new Date().getDate()}</CalendarIcon16>}
                onClick={() => navigate(`/${toDateString(new Date())}`)}
              >
                Calendar
              </DropdownMenu.Item>
              <DropdownMenu.Item icon={<TagIcon16 />} onClick={() => navigate("/tags")}>
                Tags
              </DropdownMenu.Item>
              <DropdownMenu.Item icon={<SettingsIcon16 />} onClick={() => navigate("/settings")}>
                Settings
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item icon={<BookIcon16 />}>Docs</DropdownMenu.Item>
              <DropdownMenu.Item icon={<MessageIcon16 />}>Give feedback</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
          <IconButton
            aria-label="Go back"
            size="small"
            shortcut={["⌘", "["]}
            className="group"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon16 className="transition-transform duration-100 group-active:-translate-x-0.5" />
          </IconButton>
          <IconButton
            aria-label="Go forward"
            size="small"
            shortcut={["⌘", "]"]}
            className="group"
            onClick={() => navigate(1)}
          >
            <ArrowRightIcon16 className="transition-transform duration-100 group-active:translate-x-0.5" />
          </IconButton>
        </div>
        <div className="flex items-center gap-2 justify-self-center whitespace-nowrap px-2 text-text-secondary">
          <div className="flex items-center gap-1">
            {parseFrontmatter(editorValue).frontmatter?.pinned ? (
              <PinFillIcon12 className="mr-1 flex-shrink-0 text-[var(--orange-11)]" />
            ) : null}
            <span>{noteId}.md</span>
            {isDirty ? (
              <svg
                viewBox="0 0 16 16"
                width="16"
                height="16"
                fill="var(--yellow-11)"
                className="flex-shrink-0"
              >
                <circle cx="8" cy="8" r="4" />
              </svg>
            ) : null}
          </div>
          {isDailyPage ? (
            <>
              <span>·</span>
              <span>{formatDateDistance(noteId)}</span>
            </>
          ) : null}
          {isWeeklyPage ? (
            <>
              <span>·</span>
              <span>{formatWeekDistance(noteId)}</span>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2 justify-self-end">
          {isDirty ? (
            <Button
              size="small"
              shortcut={["⌘", "S"]}
              onClick={() => {
                handleSave(editorValue)
                editorRef.current?.view?.focus()
              }}
            >
              {!note ? "Create" : "Save"}
            </Button>
          ) : null}
          <div className="flex">
            <IconButton
              aria-label={mode === "read" ? "Write mode" : "Read mode"}
              size="small"
              shortcut={["⌘", "E"]}
              onClick={mode === "read" ? switchToWriting : switchToReading}
            >
              {mode === "read" ? <EditIcon16 /> : <EyeIcon16 />}
            </IconButton>
            {scrollContainerWidth > 896 ? (
              <IconButton
                aria-label="Toggle width"
                size="small"
                onClick={() => setWidth(width === "fixed" ? "fill" : "fixed")}
              >
                {width === "fixed" ? <CenteredIcon16 /> : <FullwidthIcon16 />}
              </IconButton>
            ) : null}
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <IconButton aria-label="More actions" size="small" disableTooltip>
                  <MoreIcon16 />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                {isDirty ? (
                  <>
                    <DropdownMenu.Item icon={<UndoIcon16 />} onSelect={handleDiscardChanges}>
                      Discard changes
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                  </>
                ) : null}
                <DropdownMenu.Item
                  icon={
                    checkIfPinned(note) ? (
                      <PinFillIcon16 className="text-[var(--orange-11)]" />
                    ) : (
                      <PinIcon16 />
                    )
                  }
                  disabled={isSignedOut || !note}
                  onSelect={() => {
                    handleSave(togglePin(note?.content ?? ""))
                  }}
                >
                  {checkIfPinned(note) ? "Unpin" : "Pin"}
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item icon={<CopyIcon16 />} onSelect={() => copy(note?.content ?? "")}>
                  Copy markdown
                </DropdownMenu.Item>
                <DropdownMenu.Item icon={<CopyIcon16 />} onSelect={() => copy(noteId)}>
                  Copy ID
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  icon={<ExternalLinkIcon16 />}
                  href={`https://github.com/${githubRepo?.owner}/${githubRepo?.name}/blob/main/${id}.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                  disabled={isSignedOut || !note}
                >
                  Open in GitHub
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  icon={<ShareIcon16 />}
                  disabled={isSignedOut || !note}
                  onSelect={async () => {
                    if (!note) return

                    const url = await exportAsGist({
                      githubToken: githubUser?.token ?? "",
                      noteId,
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
                  disabled={isSignedOut || !note}
                  onSelect={() => {
                    // Ask the user to confirm before deleting a note with backlinks
                    if (
                      note &&
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

                    // handleDelete()
                  }}
                >
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
          <div className="hidden h-5 w-px bg-border sm:block" />
          <div className="hidden sm:flex">
            <SyncButton />
            <IconButton aria-label="New note" size="small" shortcut={["⌘", "⇧", "O"]}>
              <PlusIcon16 />
            </IconButton>
          </div>
        </div>
      </header>
      <div ref={scrollContainerRef} className="overflow-auto [scrollbar-gutter:stable]">
        <div className=""></div>
        <div className={cx("w-full px-4 md:px-6", width === "fixed" && "mx-auto max-w-4xl ")}>
          {isDailyPage || isWeeklyPage ? (
            <Calendar activeNoteId={noteId} className="-mb-px" />
          ) : null}
          <div className="flex flex-col gap-6 py-4 md:gap-8 md:py-6">
            <div hidden={mode === "write"}>
              {editorValue ? (
                <Markdown onChange={handleChange}>{editorValue}</Markdown>
              ) : (
                <span className="italic text-text-secondary">Empty note</span>
              )}
            </div>
            <div hidden={mode === "read"}>
              <NoteEditor
                ref={editorRef}
                defaultValue={editorValue}
                placeholder={placeholder}
                onChange={handleChange}
                // onStateChange={handleEditorStateChange}
                className="grid min-h-[12rem]"
              />
            </div>
            {backlinks.length > 0 ? (
              <Details>
                <Details.Summary>Backlinks</Details.Summary>
                <LinkHighlightProvider href={`/${noteId}`}>
                  <NoteList baseQuery={`link:"${noteId}" -id:"${noteId}"`} />
                </LinkHighlightProvider>
              </Details>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
  // return (
  //   <Panels.Container>
  //     <NotePanel params={params} />
  //     <Panels.Outlet />
  //   </Panels.Container>
  // )
}

const isClonedAtom = selectAtom(globalStateMachineAtom, (state) => state.matches("signedIn.cloned"))

function SyncButton() {
  const isCloned = useAtomValue(isClonedAtom)
  const send = useSetAtom(globalStateMachineAtom)
  const syncStatusText = useSyncStatusText()
  const { online } = useNetworkState()

  if (!isCloned) return null

  return (
    <IconButton
      aria-label={syncStatusText}
      size="small"
      disabled={!online}
      onClick={() => send({ type: "SYNC" })}
    >
      <SyncStatusIcon size={16} />
    </IconButton>
  )
}
