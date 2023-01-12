import { useInterpret } from "@xstate/react"
// import { Buffer } from "buffer"
import { get, set } from "idb-keyval"
import React from "react"
import { assign, createMachine, InterpreterFrom } from "xstate"
import { Note, NoteId } from "./types"
import { parseNoteBody } from "./utils/parse-note-body"

export const UPLOADS_DIRECTORY = "uploads"

export type Context = {
  // authToken: string
  // repoOwner: string
  // repoName: string
  // sha: string
  notes: Record<NoteId, Note>
  sortedNoteIds: NoteId[]
  backlinks: Record<NoteId, NoteId[]>
  tags: Record<string, NoteId[]>
  dates: Record<string, NoteId[]>
  // error: string
}

type Event =
  // | { type: "SIGN_IN"; data: { authToken: string } }
  // | { type: "SIGN_OUT" }
  // | { type: "CHANGE_REPO"; data: { repoOwner: string; repoName: string } }
  // | { type: "SYNC" }
  { type: "UPSERT_NOTE"; id: NoteId; body: string } | { type: "DELETE_NOTE"; id: NoteId }

const machine =
  /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGBDFA6dWEAlgHZQDCaJALmAB7UDEEVYupAbmgNZsESUa9agG0ADAF1EoAA5pYRakSrSQdRAGYNANlwAWAIx6xAVgCcZgBx6NYjXr0AaEAE9EAJjMbcZzwHYDSw13Gz0-bQBfCOdUTBx8NEJSCipaBkYwACdMtEzcGRQsagAzXIBbBMJBNNFJVTkFJRUkNU0Db21LAzExGwD3Ex1tZzcEdwN3XA0-c3M-e20TS18omPRsPCIIFDBGAFUABQBlAFEAJQAVAH0AOQB5C5PxKRaGxWUSVXUES3dLKcsJjE7jEQT0XUsI00Zl0YXsfi62j8NncGlWIFiG3Y212ABETgAZE6PW4PJ51V7yd7NUDfcImXDhBF-TwOQFQhAGIG4CZhEJIkwI4F6KLREAkNAQOCqTE4epUpqfFrfAC0w1ciG0ky1YUM2naLMskTFsrw-GS1WE8saHy+iD07g57gRPJMWsWJlRRmRJnRpuxO2t1KVtMQnrEuEsyLMMz+Bj8vgMToT+jE7rMYnjfx0vtFQA */
  createMachine(
    {
      context: {
        // authToken: "",
        // repoOwner: "",
        // repoName: "",
        // sha: "",
        notes: {},
        sortedNoteIds: [],
        backlinks: {},
        tags: {},
        dates: {},
        // error: "",
      },
      tsTypes: {} as import("./global-state.typegen").Typegen0,
      schema: {
        context: {} as Context,
        services: {} as {
          loadContext: {
            data: Context
          }
          loadNotes: {
            data: {
              sha: string
              notes: Record<NoteId, Note>
              backlinks: Record<NoteId, NoteId[]>
              tags: Record<string, NoteId[]>
              dates: Record<string, NoteId[]>
            } | null
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
              target: "idle",
            },
            onError: "idle",
          },
        },
        // syncing: {},
        idle: {
          entry: ["sortNoteIds", "saveContextInIndexedDB"],
          on: {
            UPSERT_NOTE: {
              actions: ["upsertNote"],
              target: "idle",
              internal: false, // Re-run entry actions
            },
            DELETE_NOTE: [
              {
                // To preserve referential integrity, we only allow you to
                // delete a note if no other notes link to it.
                cond: "hasNoBacklinks",
                actions: ["deleteNote"],
                target: "idle",
                internal: false, // Re-run entry actions
              },
            ],
          },
        },
        // loadingContext: {
        //   invoke: {
        //     src: "loadContext",
        //     id: "loadContext",
        //     onDone: [
        //       {
        //         cond: "hasAuthToken",
        //         actions: ["setContext"],
        //         target: "signedIn",
        //       },
        //       {
        //         actions: ["setContext"],
        //         target: "signedOut",
        //       },
        //     ],
        //     onError: "signedOut",
        //   },
        // },
        // signedOut: {
        //   entry: ["clearAuthToken", "clearAuthTokenInIndexedDB"],
        //   on: {
        //     SIGN_IN: {
        //       actions: ["setContext", "saveContextInIndexedDB"],
        //       target: "signedIn",
        //     },
        //   },
        // },
        // signedIn: {
        //   on: {
        //     SIGN_OUT: "signedOut",
        //   },
        //   initial: "initializing",
        //   states: {
        //     initializing: {
        //       always: [
        //         {
        //           cond: "hasRepo",
        //           target: "loadingNotes",
        //         },
        //         {
        //           target: "selectingRepo",
        //         },
        //       ],
        //     },
        //     selectingRepo: {
        //       on: {
        //         SELECT_REPO: {
        //           actions: ["setContext", "saveContextInIndexedDB"],
        //           target: "loadingNotes",
        //         },
        //       },
        //     },
        //     loadingNotes: {
        //       invoke: {
        //         src: "loadNotes",
        //         id: "loadNotes",
        //         onDone: [
        //           {
        //             actions: ["setContext", "saveContextInIndexedDB"],
        //             target: "idle",
        //           },
        //         ],
        //       },
        //     },
        //     idle: {
        //       entry: ["sortNoteIds", 'saveContextInIndexedDB'],
        //       // TODO: Allow these events while loading notes
        //       on: {
        //         RELOAD_NOTES: "loadingNotes",
        //         CHANGE_REPO: "selectingRepo",
        //         UPSERT_NOTE: {
        //           actions: ["upsertNote", "upsertNoteFile", "saveContextInIndexedDB"],
        //           target: "idle",
        //           internal: false, // Re-run entry actions
        //         },
        //         DELETE_NOTE: [
        //           {
        //             // To preserve referential integrity, we only allow you to
        //             // delete a note if no other notes link to it.
        //             cond: "hasNoBacklinks",
        //             actions: ["deleteNote", "deleteNoteFile", "saveContextInIndexedDB"],
        //             target: "idle",
        //             internal: false, // Re-run entry actions
        //           },
        //         ],
        //       },
        //     },
        //   },
        // },
      },
    },
    {
      actions: {
        setContext: assign((context, event) => {
          if (!event.data) return context
          return { ...context, ...event.data }
        }),
        saveContextInIndexedDB: async (context, event) => {
          await set("context", context)
        },
        // clearAuthToken: assign({
        //   authToken: (context, event) => "",
        // }),
        // clearAuthTokenInIndexedDB: async (context, event) => {
        //   await set("context", {
        //     ...context,
        //     authToken: "",
        //   })
        // },
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
            notes: { ...context.notes, [event.id]: { title, body: event.body } },
            backlinks: Object.fromEntries(backlinkEntries),
            tags: Object.fromEntries(tagEntries),
            dates: Object.fromEntries(dateEntries),
          }
        }),
        // upsertNoteFile: async (context, event) => {
        //   const endpoint = `https://api.github.com/repos/${context.repoOwner}/${context.repoName}/contents/${event.id}.md`

        //   // Get the SHA of the file
        //   const { sha } = await fetch(endpoint, {
        //     headers: {
        //       Accept: "application/vnd.github.v3+json",
        //       Authorization: `Bearer ${context.authToken}`,
        //     },
        //   }).then((response) => response.json())

        //   // Update the file
        //   await fetch(endpoint, {
        //     method: "PUT",
        //     headers: {
        //       Authorization: `Bearer ${context.authToken}`,
        //     },
        //     body: JSON.stringify({
        //       message: `${sha ? "Update" : "Create"} ${event.id}.md`,
        //       content: Buffer.from(event.body).toString("base64"),
        //       sha,
        //     }),
        //   })
        // },
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
          }
        }),
        // deleteNoteFile: async (context, event) => {
        //   const endpoint = `https://api.github.com/repos/${context.repoOwner}/${context.repoName}/contents/${event.id}.md`

        //   try {
        //     // Get the SHA of the file
        //     const { sha } = await fetch(endpoint, {
        //       headers: {
        //         Accept: "application/vnd.github.v3+json",
        //         Authorization: `Bearer ${context.authToken}`,
        //       },
        //     }).then((response) => response.json())

        //     // Delete the file
        //     await fetch(endpoint, {
        //       method: "DELETE",
        //       headers: {
        //         Authorization: `Bearer ${context.authToken}`,
        //       },
        //       body: JSON.stringify({
        //         message: `Delete ${event.id}.md`,
        //         sha,
        //       }),
        //     })
        //   } catch (error) {
        //     console.error(error)
        //   }

        //   // TODO: Delete unreferenced files
        // },
      },
      guards: {
        // hasAuthToken: (context, event) => {
        //   return Boolean(event.data.authToken)
        // },
        // hasRepo: (context, event) => {
        //   return Boolean(context.repoOwner && context.repoName)
        // },
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
        // loadNotes: (context) => {
        //   const worker = new Worker(new URL("./load-notes.worker.ts", import.meta.url), {
        //     type: "module",
        //   })

        //   const { authToken, repoOwner, repoName, sha } = context

        //   return new Promise((resolve) => {
        //     worker.postMessage({ authToken, repoOwner, repoName, sha })
        //     worker.onmessage = (event) => {
        //       resolve(event.data)
        //     }
        //   })
        // },
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
