import { useMatch } from "@tanstack/react-router"
import { useAtomValue } from "jotai"
import { useMemo } from "react"
import { defaultFontAtom, githubRepoAtom } from "../global-state"
import { Note, fontSchema } from "../schema"
import { cx } from "../utils/cx"
import { formatDate, formatDateDistance, formatWeekDistance, isValidDateString } from "../utils/date"
import { parseFrontmatter } from "../utils/frontmatter"
import { getNoteDraft } from "../utils/note-draft"
import { DotIcon8, GlobeIcon12, LinkIcon12, TagIcon12 } from "./icons"
import { Label } from "./label"
import { useLinkHighlight } from "./link-highlight-provider"
import { Markdown } from "./markdown"
import { pluralize, withOrdinalSuffix } from "../utils/pluralize"

const NUM_VISIBLE_TAGS = 4

type NotePreviewProps = {
  note: Note
  className?: string
  hideProperties?: boolean
}

export function NotePreview({ note, className, hideProperties }: NotePreviewProps) {
  const highlightedHrefs = useLinkHighlight()
  const defaultFont = useAtomValue(defaultFontAtom)
  const githubRepo = useAtomValue(githubRepoAtom)

  // Prefer a local draft if it exists (unsaved changes)
  const { resolvedContent, isDraft } = useMemo(() => {
    const draft = getNoteDraft({ githubRepo, noteId: note.id })
    if (draft !== null && draft !== note.content) {
      return { resolvedContent: draft, isDraft: true }
    }
    return { resolvedContent: note.content, isDraft: false }
  }, [githubRepo, note.id, note.content])

  // Parse frontmatter from the resolved content so frontmatter-derived values reflect drafts
  const resolvedFrontmatter = useMemo(() => {
    return parseFrontmatter(resolvedContent).frontmatter
  }, [resolvedContent])

  // Resolve note font (frontmatter font or default)
  const resolvedFont = useMemo(() => {
    const frontmatterFont = resolvedFrontmatter?.font as unknown
    const parseResult = fontSchema.safeParse(frontmatterFont)
    const parsedFont = parseResult.success ? parseResult.data : null
    return parsedFont || defaultFont
  }, [resolvedFrontmatter?.font, defaultFont])

  const frontmatterTags = useMemo(() => {
    return Array.isArray(resolvedFrontmatter?.tags) &&
      (resolvedFrontmatter.tags as unknown[]).every((tag) => typeof tag === "string")
      ? (resolvedFrontmatter.tags as string[])
      : []
  }, [resolvedFrontmatter?.tags])

  // Get current route's note ID
  const noteMatch = useMatch({ from: "/_appRoot/notes_/$", shouldThrow: false })
  const currentNoteId = noteMatch?.params._splat

  // Compute birthday label
  const birthdayLabel = useMemo(() => {
    // Only show when viewing a daily note
    if (!currentNoteId || !isValidDateString(currentNoteId)) {
      return null
    }

    const birthday = resolvedFrontmatter?.birthday

    // Validate birthday format: Date, "MM-DD" string, or "YYYY-MM-DD" string
    const isDate = birthday instanceof Date
    const isMonthDayString = typeof birthday === "string" && /^\d{2}-\d{2}$/.test(birthday)
    const isDateString = typeof birthday === "string" && isValidDateString(birthday)

    if (!(isDate || isMonthDayString || isDateString)) {
      return null
    }

    // Extract month, day, and optionally year from birthday
    let birthYear: number | null = null
    let birthMonth: number
    let birthDay: number

    if (isDate) {
      birthYear = birthday.getUTCFullYear()
      birthMonth = birthday.getUTCMonth() + 1
      birthDay = birthday.getUTCDate()
    } else if (isDateString) {
      const [y, m, d] = (birthday as string).split("-").map(Number)
      birthYear = y
      birthMonth = m
      birthDay = d
    } else {
      // MM-DD format
      const [m, d] = (birthday as string).split("-").map(Number)
      birthMonth = m
      birthDay = d
    }

    // Extract month and day from current daily note
    const [currentYear, currentMonth, currentDay] = currentNoteId.split("-").map(Number)

    // Check if month/day matches
    if (birthMonth !== currentMonth || birthDay !== currentDay) {
      return null
    }

    // Calculate age if birth year is available
    if (birthYear !== null) {
      const age = currentYear - birthYear
      if (age > 0) {
        return `${withOrdinalSuffix(age)} birthday`
      }
    }

    return "Birthday"
  }, [currentNoteId, resolvedFrontmatter?.birthday])

  return (
    <div
      {...{ inert: "" }}
      className={cx(
        "flex aspect-[5/3] w-full flex-col gap-2 overflow-hidden p-4 [contain:layout_paint]",
        className,
      )}
      style={
        {
          "--font-family-content": `var(--font-family-${resolvedFont})`,
          "--font-family-mono": `var(--font-family-${resolvedFont}-mono)`,
        } as React.CSSProperties
      }
    >
      {(note.type === "daily" || note.type === "weekly") && !note.title ? (
        <div className="mb-1 shrink-0 flex flex-col gap-0.5">
          <span className="font-bold text-[calc(var(--font-size-xl)*0.66)] [text-box-trim:trim-start]">
            {note.type === "daily" ? formatDate(note.id) : note.displayName}
          </span>
          <span className="text-text-secondary">
            {note.type === "daily" ? formatDateDistance(note.id) : formatWeekDistance(note.id)}
          </span>
        </div>
      ) : null}
      <div className="grow overflow-hidden [mask-image:linear-gradient(to_bottom,black_0%,black_75%,transparent_100%)] eink:[mask-image:none] [&_*::-webkit-scrollbar]:hidden">
        <div className="w-[152%] origin-top-left scale-[66%]">
          <Markdown hideFrontmatter emptyText="Empty note">
            {resolvedContent}
          </Markdown>
        </div>
      </div>
      {!hideProperties ? (
        <div className="flex flex-wrap gap-x-1.5 gap-y-2 pr-10 font-content empty:hidden coarse:pr-12">
          {isDraft ? (
            <Label icon={<DotIcon8 className="text-text-pending" />}>Unsaved</Label>
          ) : null}
          {resolvedFrontmatter?.gist_id ? (
            <Label icon={<GlobeIcon12 className="text-border-focus" />}>Published</Label>
          ) : null}
          {birthdayLabel ? <Label icon="🎂">{birthdayLabel}</Label> : null}
          {/*{note.tasks.length > 0 ? (
            <Label
              icon={
                <ProgressRing
                  size={14}
                  value={note.tasks.filter((t) => t.completed).length / note.tasks.length}
                  strokeWidth={2}
                />
              }
            >
              {note.tasks.filter((t) => t.completed).length}/{note.tasks.length}
            </Label>
          ) : null}*/}
          {note.backlinks.length > 0 ? (
            <Label icon={<LinkIcon12 />}>{note.backlinks.length}</Label>
          ) : null}
          {frontmatterTags.slice(0, NUM_VISIBLE_TAGS).map((tag) => (
            <Label
              key={tag}
              icon={<TagIcon12 />}
              className={
                highlightedHrefs.some((href) => {
                  if (!href.startsWith("/tags/")) return false
                  const highlightedTag = href.slice(6)
                  return tag === highlightedTag || tag.startsWith(`${highlightedTag}/`)
                })
                  ? "bg-bg-highlight text-text-highlight"
                  : undefined
              }
            >
              {tag}
            </Label>
          ))}
          {frontmatterTags.length > NUM_VISIBLE_TAGS ? (
            <Label icon={<TagIcon12 />}>+{frontmatterTags.length - NUM_VISIBLE_TAGS}</Label>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
