import * as Tabs from "@radix-ui/react-tabs"
import React from "react"
import { LinkIcon16, NoteIcon24, UnlinkIcon16 } from "../components/icons"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteCard } from "../components/note-card"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { useNoteById } from "../utils/use-note-by-id"
import { useSearchNotes } from "../utils/use-search"

// const notesWithQueriesAtom = selectAtom(sortedNoteEntriesAtom, (entries) => {
//   return entries.filter(([, note]) => note.queries.length > 0)
// })

export function NotePanel({ id, params = {}, onClose }: PanelProps) {
  const { id: noteId = "" } = params
  const note = useNoteById(noteId)
  // const notesWithQueries = useAtomValue(notesWithQueriesAtom)
  const searchNotes = useSearchNotes()

  const unlinkedNoteCount = React.useMemo(() => {
    if (!note) return 0
    const query = `${note.title} -link:"${noteId}" -id:"${noteId}"`
    return note.title ? searchNotes(query).length : 0
  }, [note, noteId, searchNotes])

  // IDs of notes that contain a query that matches the current note
  // const queryMatches = React.useMemo(() => {
  //   return notesWithQueries
  //     .filter(([, n]) => {
  //       return n.queries.some((query) => testQuery(query, note))
  //     })
  //     .map(([id]) => id)
  // }, [note, notesWithQueries])

  return (
    <Panel id={id} title="Note" icon={<NoteIcon24 />} onClose={onClose}>
      <div className="flex flex-col gap-4 p-4">
        <NoteCard id={noteId} />

        <Tabs.Root defaultValue="backlinks">
          {/* TODO: Move overflor items to a dropdown menu */}
          <Tabs.List className="mb-4 flex gap-2 overflow-auto pb-2 shadow-[inset_0_-1px_0_var(--color-border-secondary)]">
            <TabsTrigger value="backlinks">
              <LinkIcon16 />
              Backlinks
              <span>{note?.backlinks.length}</span>
            </TabsTrigger>
            <TabsTrigger value="unlinked">
              <UnlinkIcon16 />
              Unlinked
              <span>{unlinkedNoteCount}</span>
            </TabsTrigger>
            {/* <TabsTrigger value="queries">
              <QueryIcon16 />
              Queries
              <span>{queryMatches.length}</span>
            </TabsTrigger> */}
          </Tabs.List>

          <Tabs.Content value="backlinks" className="outline-none">
            <LinkHighlightProvider href={`/${noteId}`}>
              <NoteList baseQuery={`link:"${noteId}"`} />
            </LinkHighlightProvider>
          </Tabs.Content>

          <Tabs.Content value="unlinked" className="outline-none">
            <NoteList
              baseQuery={
                note?.title ? `${note.title} -link:"${noteId}" -id:"${noteId}"` : "id:noop"
              }
            />
          </Tabs.Content>

          {/* <Tabs.Content value="queries" className="outline-none">
            <LinkHighlightProvider href={`/${noteId}`}>
              <NoteList
                baseQuery={
                  queryMatches.length > 0
                    ? `id:${queryMatches.join(",")}`
                    : // If there are no matches, we need to pass a query that
                      // returns no results. We can't pass an empty string,
                      // because that will return all the notes. Instead,
                      // we use "id:noop" because no note can have that ID.
                      "id:noop"
                }
              />
            </LinkHighlightProvider>
          </Tabs.Content> */}
        </Tabs.Root>
      </div>
    </Panel>
  )
}

function TabsTrigger(props: Tabs.TabsTriggerProps) {
  return (
    <Tabs.Trigger
      className=" focus-ring relative flex h-8 cursor-default items-center gap-2 rounded-sm px-3 leading-4 text-text-secondary hover:bg-bg-secondary data-[state=active]:text-text data-[state=active]:before:absolute data-[state=active]:before:-bottom-2 data-[state=active]:before:left-0 data-[state=active]:before:right-0 data-[state=active]:before:h-[0.125rem] data-[state=active]:before:w-full data-[state=active]:before:bg-text data-[state=active]:before:content-[''] coarse:h-10 coarse:px-4"
      {...props}
    />
  )
}

/*
 * Test if a note matches a query.
 *
 * We create a list with only one entry, and then pass it through the search
 * and filter functions. If the result is not empty, the note matches.
 */
// function testQuery(query: string, note: Note) {
//   const entries: [string, Note][] = [["", note]]

//   const { fuzzy, qualifiers } = parseQuery(query)

//   const results = fuzzy
//     ? search(fuzzy, entries, {
//         keySelector: ([, note]) => [note.title, note.rawBody],
//         threshold: 0.8,
//       })
//     : entries

//   const filteredResults = filterResults(results, qualifiers)

//   return filteredResults.length > 0
// }
