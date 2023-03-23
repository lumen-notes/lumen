import { createActorContext } from "@xstate/react"
import { get, set } from "idb-keyval"
import { assign, createMachine } from "xstate"
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
  tags: Record<string, NoteId[]>
  dates: Record<string, NoteId[]>
  // TODO: Rename to unpushedChanges
  pendingChanges: { upsert: Set<NoteId>; delete: Set<NoteId> }
  error: string
}

type Event =
  | { type: "UPSERT_NOTE"; id: NoteId; body: string }
  | { type: "DELETE_NOTE"; id: NoteId }
  | { type: "PULL_NOTES" }
  | { type: "PUSH_NOTES" }
  | { type: "SET_CONTEXT"; data: Partial<Context> }

const machine =
  /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGBDFA6dWEAlgHZQDCaJALmAB7UDEEVYupAbmgNZsESUa9agG0ADAF1EoAA5pYRakSrSQdRAGYNANlwAWAIx6xAdgBMBjQE4NZkyYA0IAJ6IregBy4NAVgM+xMzF-ex8AXzCnVEwcfDRCUgoqWgZGMAAndLR03BkULGoAM2yAWzjCQRTRSVU5BSUVJDVNHX0jUwtrW3snVwQTbT1cIKMPPS17Dw8TCKj0bDwZAFcUFESAOTRaWGZWdhIuXlyVlE3t8SkmusVlElV1BAMxMSGNF8G9cbMzN7NexA8Yl0BjMehs2m0BgMHh8Pg8sxA0QWx1WGy2cDSmWyuXyRVKKNO6NgF1q8hujVADyeYh8uEGQIsNmCNP+CB82lpJmhJj0Zm0HgMH3hkUR81iy1gAAs0dtdiQ2JweGwJZKznASVcyQ07k0HlYrLT9frjHy+SYrH8XIg9OZhhzIdyNIDtDSEUjxUspTKMRksjk8gViukyiq1cSapr6rd7m4rCZvL4rAZ7C7YYZWQLcAFnmIrALtHYNHo3WK8EQICgwIwAKoABQAygBRABKABUAPrrADyrcbGtkWujuoB9mGHisNI8FlMJg82lZyaGBo07QLhhByZLMTLFarABFGwAZRu9zs9vsRgdRinNBDTeNmceT6eTedWhBmPPeHzuUHJvweBoW7IuWlaME2HbkF26y9gAGq2-YgNc2oxneo6PhOcIvrOb59ByVi4MmjqeO4gHaMBsSgVWtbVoeh5nr29aIchQ6UiOD5PlhTyvqyJiwnSoJ5l8nzWMKczbuwu6MDR9YABIMY2TGXkhg43g895jphU7cThrK8gYuADOyP5wto1jBBEIokGgEBwKo7ooKS146mxCAALS4YgbmGkavl+eYFF4PwiSVMITnki5t68qyNhmFms5AsmMJpkBIoOQS3rwJGEWoVCU6EbYU7mvyPjWI474mLYAlgrYyZ8k8YmihJKqZeFKHDo80JxZYj52FYJVlayK4GQKZjsnVfiWBoMxpaWkmVm1rG3j4QS4NMAR5Z4gyCrxzyGcEnh+BOngCpZYRAA */
  createMachine(
    {
      context: {
        authToken: "",
        repoOwner: "",
        repoName: "",
        sha: "",
        notes: {},
        sortedNoteIds: [],
        // backlinks: {},
        tags: {},
        dates: {},
        pendingChanges: {
          upsert: new Set<string>(),
          delete: new Set<string>(),
        },
        error: "",
      },
      tsTypes: {} as import("./global-state.machine.typegen").Typegen0,
      schema: {
        context: {} as Context,
        services: {} as {
          loadContext: {
            data: Context
          }
          pullNotes: {
            data: Partial<Context> | null
          }
          pushNotes: {
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
              target: "pullingNotes",
            },
            onError: "idle",
          },
        },

        pullingNotes: {
          invoke: {
            src: "pullNotes",
            id: "pullNotes",
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

        pushingNotes: {
          invoke: {
            src: "pushNotes",
            id: "pushNotes",
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
              target: "pushingNotes",
            },
            DELETE_NOTE: {
              // To preserve referential integrity, we only allow you to
              // delete a note if no other notes link to it.
              cond: "hasNoBacklinks",
              actions: ["deleteNote", "sortNoteIds"],
              target: "pushingNotes",
            },
            SET_CONTEXT: {
              actions: ["setContext"],
              target: "pullingNotes",
            },
            PULL_NOTES: "pullingNotes",
            PUSH_NOTES: "pushingNotes",
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
          const { title, noteLinks, tagLinks, dateLinks, frontmatter } = parseNoteBody(event.body)

          // Update backlinks
          const noteEntries = Object.entries(context.notes).map(([noteId, note]) => {
            // If the note is listed as a backlink but shouldn't be, remove it
            if (note.backlinks.includes(event.id) && !noteLinks.includes(noteId)) {
              return [
                noteId,
                { ...note, backlinks: note.backlinks.filter((backlink) => backlink !== event.id) },
              ]
            }

            // If the note is not listed as a backlink but should be, add it
            if (!note.backlinks.includes(event.id) && noteLinks.includes(noteId)) {
              return [noteId, { ...note, backlinks: [...note.backlinks, event.id] }]
            }

            return [noteId, note]
          })

          // noteLinks
          //   .filter((noteId) => !Object.keys(context.note).includes(noteId))
          //   .forEach((noteId) => {
          //     // If the note contains a link to a note that isn't already listed, add it
          //     backlinkEntries.push([noteId, [event.id]])
          //   })

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
              ...Object.fromEntries(noteEntries),
              [event.id]: {
                title,
                body: event.body,
                tags: tagLinks,
                dates: dateLinks,
                backlinks: context.notes[event.id]?.backlinks || [],
                frontmatter,
              },
            },
            // backlinks: Object.fromEntries(backlinkEntries),
            tags: Object.fromEntries(tagEntries),
            dates: Object.fromEntries(dateEntries),
            pendingChanges: {
              ...context.pendingChanges,
              upsert: new Set([...context.pendingChanges.upsert, event.id]),
            },
          }
        }),
        deleteNote: assign((context, event) => {
          // const backlinkEntries = Object.entries(context.backlinks)
          //   .map(([noteId, backlinks]) => {
          //     return [noteId, backlinks.filter((noteId) => noteId !== event.id)]
          //   })
          //   // Remove backlinks that don't have any notes
          //   .filter(([noteId, backlinks]) => backlinks.length > 0)

          const noteEntries = Object.entries(context.notes)
            .filter(([noteId]) => noteId !== event.id)
            .map(([noteId, note]) => {
              return [
                noteId,
                { ...note, backlinks: note.backlinks.filter((backlink) => backlink !== event.id) },
              ]
            })

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
            notes: Object.fromEntries(noteEntries),
            tags: Object.fromEntries(tagEntries),
            dates: Object.fromEntries(dateEntries),
            pendingChanges: {
              upsert: new Set(
                Array.from(context.pendingChanges.upsert).filter((id) => id !== event.id),
              ),
              delete: new Set([...context.pendingChanges.delete, event.id]),
            },
          }
        }),
      },
      guards: {
        hasNoBacklinks: (context, event) => {
          return !context.notes[event.id].backlinks?.length
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
        pullNotes: async (context) => {
          const { authToken, repoOwner, repoName } = context

          // Dont pull if offline, no auth token, or no repo
          if (!navigator.onLine || !authToken || !repoOwner || !repoName) {
            return null
          }

          const worker = new Worker(new URL("./pull-notes.worker.ts", import.meta.url), {
            type: "module",
          })

          return await new Promise<Partial<Context>>((resolve) => {
            worker.postMessage(context)
            worker.onmessage = (event) => resolve(event.data)
          })
        },
        pushNotes: async (context) => {
          const { authToken, repoOwner, repoName } = context

          // Dont push if offline, no auth token, or no repo
          if (!navigator.onLine || !authToken || !repoOwner || !repoName) {
            return null
          }

          try {
            // Push pending changes to GitHub
            for (const id of context.pendingChanges.upsert) {
              await writeFile({ context, path: `${id}.md`, content: context.notes[id].body })
            }

            for (const id of context.pendingChanges.delete) {
              await deleteFile({ context, path: `${id}.md` })
            }

            return {
              // Clear pending changes
              pendingChanges: {
                upsert: new Set<string>(),
                delete: new Set<string>(),
              },
              // Clear error
              error: "",
            }
          } catch (error) {
            console.error(error)
            return { error: (error as Error).message }
          }
        },
      },
    },
  )

export const GlobalStateContext = createActorContext(machine)
