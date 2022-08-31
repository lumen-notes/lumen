import { useInterpret } from "@xstate/react"
import { get, set } from "idb-keyval"
import { fromMarkdown } from "mdast-util-from-markdown"
import React from "react"
import { visit } from "unist-util-visit"
import { assign, createMachine, InterpreterFrom } from "xstate"
import { dateLink, dateLinkFromMarkdown } from "./remark-plugins/date-link"
import { noteLink, noteLinkFromMarkdown } from "./remark-plugins/note-link"
import { tagLink, tagLinkFromMarkdown } from "./remark-plugins/tag-link"

export type NoteId = string

type Context = {
  directoryHandle: FileSystemDirectoryHandle | null
  notes: Record<NoteId, string>
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
      directoryHandle: null,
      notes: {},
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
            notes: Record<NoteId, string>
            backlinks: Record<NoteId, NoteId[]>
            tags: Record<string, NoteId[]>
            dates: Record<string, NoteId[]>
          }
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
              target: "loadingNotes",
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
              target: "loadingNotes",
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
              target: "loadingNotes",
            },
          ],
          onError: "disconnected",
        },
      },
      loadingNotes: {
        invoke: {
          src: "loadNotes",
          id: "loadNotes",
          onDone: [
            {
              actions: ["setContext", "setContextInIndexedDB"],
              target: "connected",
            },
          ],
        },
      },
      connected: {
        on: {
          SHOW_DIRECTORY_PICKER: {
            target: "showingDirectoryPicker",
          },
          RELOAD: {
            target: "queryingPermission",
          },
          DISCONNECT: {
            target: "disconnected",
          },
          UPSERT_NOTE: {
            actions: ["upsertNote", "upsertNoteFile", "setContextInIndexedDB"],
          },
          DELETE_NOTE: {
            actions: ["deleteNote", "deleteNoteFile", "setContextInIndexedDB"],
          },
        },
      },
    },
  },
  {
    actions: {
      setContext: assign({
        directoryHandle: (context, event) =>
          "directoryHandle" in event.data
            ? event.data.directoryHandle
            : context.directoryHandle,
        notes: (context, event) =>
          "notes" in event.data ? event.data.notes : context.notes,
        backlinks: (context, event) =>
          "backlinks" in event.data ? event.data.backlinks : context.backlinks,
        tags: (context, event) =>
          "tags" in event.data ? event.data.tags : context.tags,
        dates: (context, event) =>
          "dates" in event.data ? event.data.dates : context.dates,
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
      upsertNote: assign((context, event) => {
        const { noteLinks, tagLinks, dateLinks } = parseBody(event.body)

        // Update backlinks
        const backlinkEntries = Object.entries(context.backlinks).map(
          ([noteId, backlinks]) => {
            // If the note is listed as a backlink but shouldn't be, remove it
            if (backlinks.includes(event.id) && !noteLinks.includes(noteId)) {
              return [
                noteId,
                backlinks.filter((backlink) => backlink !== event.id),
              ]
            }

            // If the note is not listed as a backlink but should be, add it
            if (!backlinks.includes(event.id) && noteLinks.includes(noteId)) {
              return [noteId, [...backlinks, event.id]]
            }

            return [noteId, backlinks]
          },
        )

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
          notes: { ...context.notes, [event.id]: event.body },
          backlinks: Object.fromEntries(backlinkEntries),
          tags: Object.fromEntries(tagEntries),
          dates: Object.fromEntries(dateEntries),
        }
      }),
      upsertNoteFile: async (context, event) => {
        if (!context.directoryHandle) {
          throw new Error("Directory not found")
        }

        const fileHandle = await context.directoryHandle.getFileHandle(
          `${event.id}.md`,
          { create: true },
        )

        // Create a FileSystemWritableFileStream to write to
        const writeableStream = await fileHandle.createWritable()

        // Write the contents of the file
        await writeableStream.write(event.body)

        // Close the stream
        await writeableStream.close()
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
        if (!context.directoryHandle) {
          throw new Error("Directory not found")
        }

        // Delete the file
        await context.directoryHandle.removeEntry(`${event.id}.md`)
      },
    },
    guards: {
      isGranted: (context, event) => {
        return event.data === "granted"
      },
      isPrompt: (context, event) => {
        return event.data === "prompt"
      },
      isDenied: (context, event) => {
        return event.data === "denied"
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
      loadNotes: async (context) => {
        if (!context.directoryHandle) {
          throw new Error("Directory not found")
        }

        const data: ReturnType<typeof parseFile>[] = []
        const notes: Record<NoteId, string> = {}
        const backlinks: Record<NoteId, NoteId[]> = {}
        const tags: Record<string, NoteId[]> = {}
        const dates: Record<string, NoteId[]> = {}

        // Start timer
        console.time("loadNotes")

        // Parse every note file in the directory
        for await (const [name, handle] of context.directoryHandle.entries()) {
          // Only load markdown files with numeric names (example: "123.md")
          if (handle.kind === "file" && /^\d+\.md$/.test(name)) {
            data.push(handle.getFile().then(parseFile))
          }
        }

        for (const {
          id,
          body,
          noteLinks,
          tagLinks,
          dateLinks,
        } of await Promise.all(data)) {
          notes[id] = body

          for (const noteLink of noteLinks) {
            push(backlinks, noteLink, id)
          }

          for (const tagLink of tagLinks) {
            push(tags, tagLink, id)
          }

          for (const dateLink of dateLinks) {
            push(dates, dateLink, id)
          }
        }

        // End timer
        console.timeEnd("loadNotes")

        return { notes, backlinks, tags, dates }
      },
    },
  },
)

/** Extracts metadata from a note file */
async function parseFile(file: File) {
  if (!/^\d+\.md$/.test(file.name)) {
    throw new Error(`Invalid note filename: ${file.name}`)
  }

  const id = file.name.replace(/\.md$/, "")
  const body = await file.text()

  return { id, body, ...parseBody(body) }
}

/** Extracts metadata from a note body */
function parseBody(body: string) {
  const noteLinks: NoteId[] = []
  const tagLinks: string[] = []
  const dateLinks: string[] = []

  const mdast = fromMarkdown(body, {
    extensions: [noteLink(), tagLink(), dateLink()],
    mdastExtensions: [
      noteLinkFromMarkdown(),
      tagLinkFromMarkdown(),
      dateLinkFromMarkdown(),
    ],
  })

  visit(mdast, (node) => {
    switch (node.type) {
      case "noteLink": {
        noteLinks.push(node.data.id.toString())
        break
      }
      case "tagLink": {
        tagLinks.push(node.data.name)
        break
      }
      case "dateLink": {
        dateLinks.push(node.data.date)
        break
      }
    }
  })

  return { noteLinks, tagLinks, dateLinks }
}

/**
 * Pushes a value to an array in an object.
 * If the array doesn't exist, this function creates it.
 */
function push<Key extends string | number, Value>(
  obj: Record<Key, Value[]>,
  property: Key,
  value: Value,
) {
  const list = obj[property] ? obj[property] : (obj[property] = [])
  list.push(value)
}

export type GlobalStateContextValue = {
  service: InterpreterFrom<typeof machine>
}

export const GlobalStateContext = React.createContext<GlobalStateContextValue>(
  // @ts-ignore
  {},
)

export function GlobalStateProvider({ children }: React.PropsWithChildren<{}>) {
  const service = useInterpret(machine)

  return (
    <GlobalStateContext.Provider value={{ service }}>
      {children}
    </GlobalStateContext.Provider>
  )
}
