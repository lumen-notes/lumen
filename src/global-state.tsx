import { useInterpret } from "@xstate/react"
import { get, set } from "idb-keyval"
import React from "react"
import { assign, createMachine, InterpreterFrom } from "xstate"
import { Note, NoteId } from "./types"
// import { writeFile } from "./utils/file-system"
import { isSupported } from "./utils/is-supported"
import { parseNoteBody } from "./utils/parse-note-body"

export const UPLOADS_DIRECTORY = "uploads"

type Context = {
  sha: string
  directoryHandle: FileSystemDirectoryHandle | null
  notes: Record<NoteId, Note>
  sortedNoteIds: NoteId[]
  backlinks: Record<NoteId, NoteId[]>
  tags: Record<string, NoteId[]>
  dates: Record<string, NoteId[]>
}

type Event =
  | { type: "SHOW_DIRECTORY_PICKER" }
  | { type: "REQUEST_PERMISSION" }
  | { type: "PERMISSION_DENIED" }
  | { type: "RELOAD" }
  | { type: "DISCONNECT" }
  | { type: "UPSERT_NOTE"; id: NoteId; body: string }
  | { type: "DELETE_NOTE"; id: NoteId }

const machine = createMachine(
  {
    context: {
      sha: "",
      directoryHandle: null,
      notes: {},
      sortedNoteIds: [],
      backlinks: {},
      tags: {},
      dates: {},
    },
    tsTypes: {} as import("./global-state.typegen").Typegen0,
    schema: {
      context: {} as Context,
      services: {} as {
        loadContext: {
          data: Context
        }
        queryPermission: {
          data: PermissionState
        }
        showDirectoryPicker: {
          data: {
            directoryHandle: FileSystemDirectoryHandle
          }
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
    initial: "initial",
    states: {
      initial: {
        always: [
          {
            cond: "isSupported",
            target: "loadingContext",
          },
          {
            target: "notSupported",
          },
        ],
      },
      // Browser does not support the File System Access API
      notSupported: {
        type: "final",
      },
      loadingContext: {
        invoke: {
          src: "loadContext",
          id: "loadContext",
          onDone: [
            {
              actions: ["setContext"],
              target: "queryingPermission",
            },
          ],
          onError: [
            {
              target: "disconnected",
            },
          ],
        },
      },
      queryingPermission: {
        invoke: {
          src: "queryPermission",
          id: "queryPermission",
          onDone: [
            {
              cond: "isGranted",
              target: "connected",
            },
            {
              cond: "isPrompt",
              target: "prompt",
            },
            {
              cond: "isDenied",
              target: "disconnected",
            },
          ],
          onError: [
            {
              target: "disconnected",
            },
          ],
        },
      },
      disconnected: {
        entry: ["clearContext", "clearContextInIndexedDB"],
        on: {
          SHOW_DIRECTORY_PICKER: "showingDirectoryPicker",
        },
      },
      prompt: {
        on: {
          REQUEST_PERMISSION: "requestingPermission",
          PERMISSION_DENIED: "disconnected",
        },
      },
      requestingPermission: {
        invoke: {
          src: "requestPermission",
          id: "requestPermission",
          onDone: [
            {
              target: "connected",
            },
          ],
          onError: [
            {
              target: "disconnected",
            },
          ],
        },
      },
      showingDirectoryPicker: {
        invoke: {
          src: "showDirectoryPicker",
          id: "showDirectoryPicker",
          onDone: [
            {
              actions: "setContext",
              target: "connected",
            },
          ],
          onError: "disconnected",
        },
      },
      connected: {
        initial: "loadingNotes",
        states: {
          loadingNotes: {
            invoke: {
              src: "loadNotes",
              id: "loadNotes",
              onDone: [
                {
                  actions: ["setContext", "setContextInIndexedDB"],
                  target: "idle",
                },
              ],
            },
          },
          idle: {
            entry: ["sortNoteIds"],
            // TODO: Allow these events while loading notes
            on: {
              RELOAD: {
                target: "#global.queryingPermission",
              },
              DISCONNECT: {
                target: "#global.disconnected",
              },
              UPSERT_NOTE: {
                actions: ["upsertNote", "upsertNoteFile", "setContextInIndexedDB"],
                target: "idle",
                internal: false, // Re-run entry actions
              },
              DELETE_NOTE: [
                {
                  // To preserve referential integrity, we only allow you to
                  // delete a note if no other notes link to it.
                  cond: "hasNoBacklinks",
                  actions: ["deleteNote", "deleteNoteFile", "setContextInIndexedDB"],
                  target: "idle",
                  internal: false, // Re-run entry actions
                },
              ],
            },
          },
        },
      },
    },
  },
  {
    actions: {
      setContext: assign({
        sha: (context, event) => {
          if (!event.data || !("sha" in event.data)) return context.sha
          return event.data.sha
        },
        directoryHandle: (context, event) => {
          if (!event.data || !("directoryHandle" in event.data)) return context.directoryHandle
          return event.data.directoryHandle
        },
        notes: (context, event) => {
          if (!event.data || !("notes" in event.data)) return context.notes
          return event.data.notes
        },
        sortedNoteIds: (context, event) => {
          if (!event.data || !("sortedNoteIds" in event.data)) return context.sortedNoteIds
          return event.data.sortedNoteIds
        },
        backlinks: (context, event) => {
          if (!event.data || !("backlinks" in event.data)) return context.backlinks
          return event.data.backlinks
        },
        tags: (context, event) => {
          if (!event.data || !("tags" in event.data)) return context.tags
          return event.data.tags
        },
        dates: (context, event) => {
          if (!event.data || !("dates" in event.data)) return context.dates
          return event.data.dates
        },
      }),
      clearContext: assign({
        directoryHandle: (context, event) => null,
        notes: (context, event) => ({}),
        backlinks: (context, event) => ({}),
        tags: (context, event) => ({}),
        dates: (context, event) => ({}),
      }),
      setContextInIndexedDB: async (context, event) => {
        await set("context", context)
      },
      clearContextInIndexedDB: async (context, event) => {
        await set("context", null)
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
          notes: { ...context.notes, [event.id]: { title, body: event.body } },
          backlinks: Object.fromEntries(backlinkEntries),
          tags: Object.fromEntries(tagEntries),
          dates: Object.fromEntries(dateEntries),
        }
      }),
      upsertNoteFile: async (context, event) => {
        const endpoint = `https://api.github.com/repos/colebemis/notes/contents/${event.id}.md`

        try {
          // Get the SHA of the file
          const { sha } = await fetch(endpoint, {
            headers: {
              Accept: "application/vnd.github.v3+json",
              Authorization: `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
            },
          }).then((response) => response.json())

          // Update the file
          await fetch(endpoint, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
            },
            body: JSON.stringify({
              message: `Update ${event.id}.md`,
              content: btoa(event.body),
              sha,
            }),
          })

          console.log("updated", sha)
        } catch (error) {
          // Create the file
          await fetch(endpoint, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
            },
            body: JSON.stringify({
              message: `Create ${event.id}.md`,
              content: btoa(event.body),
            }),
          })
        }
      },
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
      deleteNoteFile: async (context, event) => {
        const endpoint = `https://api.github.com/repos/colebemis/notes/contents/${event.id}.md`

        try {
          // Get the SHA of the file
          const { sha } = await fetch(endpoint, {
            headers: {
              Accept: "application/vnd.github.v3+json",
              Authorization: `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
            },
          }).then((response) => response.json())

          // Delete the file
          await fetch(endpoint, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
            },
            body: JSON.stringify({
              message: `Delete ${event.id}.md`,
              sha,
            }),
          })
        } catch (error) {
          console.error(error)
        }

        // TODO: Delete attached files
      },
    },
    guards: {
      isSupported: (context, event) => {
        return isSupported()
      },
      isGranted: (context, event) => {
        return event.data === "granted"
      },
      isPrompt: (context, event) => {
        return event.data === "prompt"
      },
      isDenied: (context, event) => {
        return event.data === "denied"
      },
      hasNoBacklinks: (context, event) => {
        return !context.backlinks[event.id]?.length
      },
    },
    services: {
      loadContext: async () => {
        const context = await get<Context>("context")

        if (!context) {
          throw new Error("Not found")
        }

        return context
      },
      queryPermission: async (context) => {
        if (!context.directoryHandle) {
          throw new Error("Directory not found")
        }

        const permission = await context.directoryHandle.queryPermission({
          mode: "readwrite",
        })

        return permission
      },
      requestPermission: async (context) => {
        if (!context.directoryHandle) {
          throw new Error("Directory not found")
        }

        const permission = await context.directoryHandle.requestPermission({
          mode: "readwrite",
        })

        if (permission !== "granted") {
          throw new Error("Permission denied")
        }
      },
      showDirectoryPicker: async () => {
        const directoryHandle = await window.showDirectoryPicker({
          id: "notes",
          mode: "readwrite",
        })

        return { directoryHandle }
      },
      loadNotes: (context) => {
        if (!context.directoryHandle) {
          throw new Error("Directory not found")
        }

        const worker = new Worker(new URL("./load-notes.worker.ts", import.meta.url), {
          type: "module",
        })

        return new Promise((resolve) => {
          worker.postMessage({ sha: context.sha, directoryHandle: context.directoryHandle })
          worker.onmessage = (event) => {
            resolve(event.data)
          }
        })
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
