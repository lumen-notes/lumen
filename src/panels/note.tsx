import { search } from "fast-fuzzy"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { NoteIcon24 } from "../components/icons"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteCard } from "../components/note-card"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { notesAtom, sortedNoteEntriesAtom } from "../global-atoms"
import { Note } from "../types"
import { filterResults, parseQuery } from "../utils/use-search-notes"

const notesWithQueriesAtom = selectAtom(sortedNoteEntriesAtom, (entries) => {
  return entries.filter(([, note]) => note.queries.length > 0)
})

export function NotePanel({ id, params = {}, onClose }: PanelProps) {
  const { id: noteId = "" } = params
  const noteAtom = React.useMemo(() => selectAtom(notesAtom, (notes) => notes[noteId]), [noteId])
  const note = useAtomValue(noteAtom)
  const notesWithQueries = useAtomValue(notesWithQueriesAtom)

  // IDs of notes that contain a query that matches the current note
  const matches = React.useMemo(() => {
    return notesWithQueries
      .filter(([, n]) => {
        return n.queries.some((query) => testQuery(query, note))
      })
      .map(([id]) => id)
  }, [note, notesWithQueries])

  return (
    <Panel id={id} title="Note" icon={<NoteIcon24 />} onClose={onClose}>
      <div className="flex flex-col gap-4 p-4">
        <NoteCard id={noteId} />

        {/* TODO: Tabs */}
        <div className="flex flex-col gap-4">
          <h3 className="leading-none">Backlinks</h3>
          <LinkHighlightProvider href={`/${noteId}`}>
            <NoteList
              key={noteId}
              baseQuery={`link:${noteId}`}
              noteCount={note?.backlinks.length}
            />
          </LinkHighlightProvider>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="leading-none">Matching queries</h3>
          <LinkHighlightProvider href={`/${noteId}`}>
            <NoteList
              key={noteId}
              baseQuery={`id:${matches.join(",")}`}
              noteCount={matches.length}
            />
          </LinkHighlightProvider>
        </div>
      </div>
    </Panel>
  )
}

/*
 * Test if a note matches a query.
 *
 * We create a list with only one entry, and then pass it through the search
 * and filter functions. If the result is not empty, the note matches.
 */
function testQuery(query: string, note: Note) {
  const entries: [string, Note][] = [["", note]]

  const { fuzzy, qualifiers } = parseQuery(query)

  const results = fuzzy
    ? search(fuzzy, entries, {
        keySelector: ([, note]) => [note.title, note.rawBody],
        threshold: 0.8,
      })
    : entries

  const filteredResults = filterResults(results, qualifiers)

  return filteredResults.length > 0
}
