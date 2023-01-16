import { useInterpret } from "@xstate/react"
import { get, set } from "idb-keyval"
import React from "react"
import { assign, createMachine, InterpreterFrom } from "xstate"
import { Note, NoteId } from "./types"
import { deleteFile, writeFile } from "./utils/file-system"
import { parseNoteBody } from "./utils/parse-note-body"

export const UPLOADS_DIRECTORY = "uploads"

export type Context = {
  authToken: string
  repoOwner: string
  repoName: string
  sha: string
  notes: Record<NoteId, Note>
  sortedNoteIds: NoteId[]
  backlinks: Record<NoteId, NoteId[]>
  tags: Record<string, NoteId[]>
  dates: Record<string, NoteId[]>
  unsyncedNotes: { upserted: Set<NoteId>; deleted: Set<NoteId> }
  error: string
}

type Event =
  | { type: "SYNC_NOTES" }
  | { type: "UPSERT_NOTE"; id: NoteId; body: string }
  | { type: "DELETE_NOTE"; id: NoteId }
  | { type: "SET_CONTEXT"; data: Partial<Context> }

const machine =
  /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGBDFA6dWEAlgHZQDCaJALmAB7UDEEVYupAbmgNZsESUa9agG0ADAF1EoAA5pYRakSrSQdRAGYNANlwAWAIx6xADgMAmMwYDs1vdoA0IAJ6ID2k7hMBODefN6liY62gYaAL7hTqiYOPhohKQUVLQMjGAAThloGbgyKFjUAGY5ALbxhIKpopKqcgpKKkhqmjr6RqYWVrb2Tq4IFga4Gr7mBmIT2uZiRhFRIDHYeLDOJADGSQByaLSwzKzsJFy8uCvr27viUs31isokquoI3gCs1rhi9r7B1iba331EIZPBoXr5tGJzN5-NprAFItF0EtTqsNmQLnB0lkcnkCsUyijzjs4Fc6vI7k1QE9XiCTJYwdZTJDLICEGZ9N5OdDtBpTIzPgiFki4kQICgwIwAKoABQAygBRABKABUAPqbADyyvlpJu5MaD2aTx+uEs3lMgWhGmM1lZNj0uFeGgMRj+YNegUFixFYolABF5QAZeXa9VanW1PUNe6PRAms0WqHma1iW0uRDmaxDYxTMTm7RTczaF4vL3CvCi8WMWUATU25DD2tlutk+pjRrjGneCZMluTNtZOneJjBfg8o8+Bki8xIaAgcFU3pQZOjlJaCAAtI505vtGXYnh+EkqsIVxTDVSgeY7S7cLNpnSE3pvPvkWc0VAMfAo+fYwMjOYd5+CYtiguM7ispmQwaHS1gFjB7jTFO8xLuwvpngaf4vNMXjWC8MzYQY3iGHhdpiBowx5j45HPi8ZjFtO4RAA */
  createMachine(
    {
      context: {
        authToken: "",
        repoOwner: "",
        repoName: "",
        sha: "",
        notes: {},
        sortedNoteIds: [],
        backlinks: {},
        tags: {},
        dates: {},
        unsyncedNotes: {
          upserted: new Set<string>(),
          deleted: new Set<string>(),
        },
        error: "",
      },
      tsTypes: {} as import("./global-state.typegen").Typegen0,
      schema: {
        context: {} as Context,
        services: {} as {
          loadContext: {
            data: Context
          }
          syncNotes: {
            data: Partial<Context> | null
          }
        },
        events: {} as Event,
      },
      id: "global",
      initial: "loadingContext",
      states: {
        loadingContext: {
          invoke: {
            src: "loadContext",
            id: "loadContext",
            onDone: {
              actions: "setContext",
              target: "syncingNotes",
            },
            onError: "idle",
          },
        },
        syncingNotes: {
          invoke: {
            src: "syncNotes",
            id: "syncNotes",
            onDone: {
              actions: "setContext",
              target: "idle",
            },
            onError: {
              actions: "setContext",
              target: "idle",
            },
          },
        },
        idle: {
          entry: ["sortNoteIds", "saveContextInIndexedDB"],
          exit: ["sortNoteIds", "saveContextInIndexedDB"],
          on: {
            UPSERT_NOTE: {
              actions: ["upsertNote", "sortNoteIds"],
              target: "syncingNotes",
            },
            DELETE_NOTE: [
              {
                // To preserve referential integrity, we only allow you to
                // delete a note if no other notes link to it.
                cond: "hasNoBacklinks",
                actions: ["deleteNote", "sortNoteIds"],
                target: "syncingNotes",
              },
            ],
            SYNC_NOTES: "syncingNotes",
            SET_CONTEXT: {
              actions: ["setContext"],
              target: "syncingNotes",
            },
          },
        },
      },
    },
    {
      actions: {
        setContext: assign((context, event) => {
          if (!event.data) return context
          return { ...context, ...(event.data as Partial<Context>) }
        }),
        saveContextInIndexedDB: async (context, event) => {
          await set("context", context)
        },
        sortNoteIds: assign({
          sortedNoteIds: (context, event) => {
            return Object.keys(context.notes).sort((a, b) => parseInt(b) - parseInt(a))
          },
        }),
        upsertNote: assign((context, event) => {
          const { title, noteLinks, tagLinks, dateLinks } = parseNoteBody(event.body)

          // Update backlinks
          const backlinkEntries = Object.entries(context.backlinks).map(([noteId, backlinks]) => {
            // If the note is listed as a backlink but shouldn't be, remove it
            if (backlinks.includes(event.id) && !noteLinks.includes(noteId)) {
              return [noteId, backlinks.filter((backlink) => backlink !== event.id)]
            }

            // If the note is not listed as a backlink but should be, add it
            if (!backlinks.includes(event.id) && noteLinks.includes(noteId)) {
              return [noteId, [...backlinks, event.id]]
            }

            return [noteId, backlinks]
          })

          noteLinks
            .filter((noteId) => !Object.keys(context.backlinks).includes(noteId))
            .forEach((noteId) => {
              // If the note contains a link to a note that isn't already listed, add it
              backlinkEntries.push([noteId, [event.id]])
            })

          // Update tags
          const tagEntries = Object.entries(context.tags)
            .map(([tagName, noteIds]) => {
              // If the note is listed with a tag but shouldn't be, remove it
              if (noteIds.includes(event.id) && !tagLinks.includes(tagName)) {
                return [tagName, noteIds.filter((noteId) => noteId !== event.id)]
              }

              // If the note is not listed with a tag but should be, add it
              if (!noteIds.includes(event.id) && tagLinks.includes(tagName)) {
                return [tagName, [...noteIds, event.id]]
              }

              return [tagName, noteIds]
            })
            // Remove tags that don't have any notes
            .filter(([tagName, noteIds]) => noteIds.length > 0)

          tagLinks
            .filter((tag) => !Object.keys(context.tags).includes(tag))
            .forEach((tag) => {
              // If the note contains a tag that isn't already listed, add it
              tagEntries.push([tag, [event.id]])
            })

          // Update dates
          const dateEntries = Object.entries(context.dates)
            .map(([date, noteIds]) => {
              // If the note is listed with a date but shouldn't be, remove it
              if (noteIds.includes(event.id) && !dateLinks.includes(date)) {
                return [date, noteIds.filter((noteId) => noteId !== event.id)]
              }

              // If the note is not listed with a date but should be, add it
              if (!noteIds.includes(event.id) && dateLinks.includes(date)) {
                return [date, [...noteIds, event.id]]
              }

              return [date, noteIds]
            })
            // Remove dates that don't have any notes
            .filter(([date, noteIds]) => noteIds.length > 0)

          dateLinks
            .filter((date) => !Object.keys(context.dates).includes(date))
            .forEach((date) => {
              // If the note contains a date that isn't already listed, add it
              dateEntries.push([date, [event.id]])
            })

          return {
            notes: {
              ...context.notes,
              [event.id]: { title, body: event.body },
            },
            backlinks: Object.fromEntries(backlinkEntries),
            tags: Object.fromEntries(tagEntries),
            dates: Object.fromEntries(dateEntries),
            unsyncedNotes: {
              ...context.unsyncedNotes,
              upserted: new Set([...context.unsyncedNotes.upserted, event.id]),
            },
          }
        }),
        deleteNote: assign((context, event) => {
          const { [event.id]: _, ...rest } = context.notes

          const backlinkEntries = Object.entries(context.backlinks)
            .map(([noteId, backlinks]) => {
              return [noteId, backlinks.filter((noteId) => noteId !== event.id)]
            })
            // Remove backlinks that don't have any notes
            .filter(([noteId, backlinks]) => backlinks.length > 0)

          const tagEntries = Object.entries(context.tags)
            .map(([tagName, noteIds]) => {
              return [tagName, noteIds.filter((noteId) => noteId !== event.id)]
            })
            // Remove tags that don't have any notes
            .filter(([tagName, noteIds]) => noteIds.length > 0)

          const dateEntries = Object.entries(context.dates)
            .map(([date, noteIds]) => {
              return [date, noteIds.filter((noteId) => noteId !== event.id)]
            })
            // Remove dates that don't have any notes
            .filter(([date, noteIds]) => noteIds.length > 0)

          return {
            notes: rest,
            backlinks: Object.fromEntries(backlinkEntries),
            tags: Object.fromEntries(tagEntries),
            dates: Object.fromEntries(dateEntries),
            unsyncedNotes: {
              upserted: new Set(
                Array.from(context.unsyncedNotes.upserted).filter((id) => id !== event.id),
              ),
              deleted: new Set([...context.unsyncedNotes.deleted, event.id]),
            },
          }
        }),
      },
      guards: {
        hasNoBacklinks: (context, event) => {
          return !context.backlinks[event.id]?.length
        },
      },
      services: {
        loadContext: async () => {
          // Get context object from IndexedDB
          const context = await get<Context>("context")

          if (!context) {
            throw new Error("Not found")
          }

          return context
        },
        syncNotes: async (context) => {
          const { authToken, repoOwner, repoName } = context

          // Dont sync if offline, no auth token, or no repo
          if (!navigator.onLine || !authToken || !repoOwner || !repoName) {
            return null
          }

          // Update files
          for (const id of context.unsyncedNotes.upserted) {
            writeFile({ context, path: `${id}.md`, content: context.notes[id].body })
            // What happens there is an error?
          }

          // Delete files
          for (const id of context.unsyncedNotes.deleted) {
            deleteFile({ context, path: `${id}.md` })
            // What happens there is an error?
          }

          // Load files
          const worker = new Worker(new URL("./load-notes.worker.ts", import.meta.url), {
            type: "module",
          })

          const data: Partial<Context> | null = await new Promise((resolve) => {
            worker.postMessage(context)
            worker.onmessage = (event) => resolve(event.data)
          })

          const unsyncedNotes = {
            upserted: new Set<string>(),
            deleted: new Set<string>(),
          }

          return data ? { ...data, unsyncedNotes } : { unsyncedNotes }
        },
      },
    },
  )

export type GlobalStateContextValue = {
  service: InterpreterFrom<typeof machine>
}

export const GlobalStateContext = React.createContext<GlobalStateContextValue>(
  // @ts-ignore
  {},
)

export function GlobalStateProvider({ children }: React.PropsWithChildren) {
  const service = useInterpret(machine)
  const contextValue = React.useMemo(() => ({ service }), [service])
  return <GlobalStateContext.Provider value={contextValue}>{children}</GlobalStateContext.Provider>
}
