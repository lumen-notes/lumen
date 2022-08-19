import { useInterpret } from "@xstate/react"
import { get, set } from "idb-keyval"
import { fromMarkdown } from "mdast-util-from-markdown"
import React from "react"
import { visit } from "unist-util-visit"
import { assign, createMachine, InterpreterFrom } from "xstate"
import { noteLink, noteLinkFromMarkdown } from "./remark-plugins/note-link"
import { tagLink, tagLinkFromMarkdown } from "./remark-plugins/tag-link"
import produce from "immer"

export type NoteId = string

type Context = {
  directoryHandle: FileSystemDirectoryHandle | null
  notes: Record<NoteId, string>
  backlinks: Record<NoteId, NoteId[]>
  tags: Record<string, NoteId[]>
}

type Event =
  | { type: "SHOW_DIRECTORY_PICKER" }
  | { type: "REQUEST_PERMISSION" }
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
          SHOW_DIRECTORY_PICKER: {
            target: "showingDirectoryPicker",
          },
        },
      },
      prompt: {
        on: {
          REQUEST_PERMISSION: {
            target: "requestingPermission",
          },
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
      }),
      clearContext: assign({
        directoryHandle: (context, event) => null,
        notes: (context, event) => ({}),
      }),
      setContextInIndexedDB: async (context, event) => {
        await set("context", context)
      },
      clearContextInIndexedDB: async (context, event) => {
        await set("context", null)
      },
      upsertNote: assign((context, event) => {
        const existingNote = context.notes[event.id]
        const { noteLinks: existingNoteLinks, tagLinks: existingTagLinks } =
          parseBody(existingNote ?? "")
        const { noteLinks, tagLinks } = parseBody(event.body)

        const noteLinksAdded = noteLinks.filter(
          (noteId) => !existingNoteLinks.includes(noteId),
        )
        const noteLinksRemoved = existingNoteLinks.filter(
          (noteId) => !noteLinks.includes(noteId),
        )

        const tagLinksAdded = tagLinks.filter(
          (tagName) => !existingTagLinks.includes(tagName),
        )
        const tagLinksRemoved = existingTagLinks.filter(
          (tagName) => !tagLinks.includes(tagName),
        )

        const backlinks = produce(context.backlinks, (draft) => {
          noteLinksAdded.forEach((noteId) => {
            if (!draft[noteId]) {
              draft[noteId] = []
            }
            draft[noteId].push(event.id)
          })

          noteLinksRemoved.forEach((noteId) => {
            draft[noteId] = draft[noteId].filter(
              (noteId) => noteId !== event.id,
            )
          })
        })

        // Add new tags
        let tags = tagLinksAdded.reduce((acc, tagName) => {
          if (!acc[tagName]) {
            acc[tagName] = []
          }
          acc[tagName].push(event.id)
          return acc
        }, context.tags)

        // Remove old tags
        tags = Object.entries(tags).reduce((acc, [tagName, noteIds]) => {
          if (tagLinksRemoved.includes(tagName)) {
            acc[tagName] = noteIds.filter((noteId) => noteId !== event.id)

            if (acc[tagName].length === 0) {
              return acc
            }
          } else {
            acc[tagName] = noteIds
          }
          return acc
        }, {} as Record<string, NoteId[]>)

        return {
          notes: {
            ...context.notes,
            [event.id]: event.body,
          },
          backlinks,
          tags,
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

        const backlinks = Object.entries(context.backlinks).reduce(
          (acc, [id, links]) => {
            if (links.includes(event.id)) {
              acc[id] = links.filter((link) => link !== event.id)
            } else {
              acc[id] = links
            }
            return acc
          },
          {} as Record<NoteId, NoteId[]>,
        )

        return {
          notes: rest,
          backlinks,
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

        // Start timer
        console.time("loadNotes")

        // Parse every note file in the directory
        for await (const [name, handle] of context.directoryHandle.entries()) {
          // Only load markdown files with numeric names (example: "123.md")
          if (handle.kind === "file" && /^\d+\.md$/.test(name)) {
            data.push(handle.getFile().then(parseFile))
          }
        }

        for (const { id, body, noteLinks, tagLinks } of await Promise.all(
          data,
        )) {
          notes[id] = body

          for (const noteLink of noteLinks) {
            push(backlinks, noteLink, id)
          }

          for (const tagLink of tagLinks) {
            push(tags, tagLink, id)
          }
        }

        // End timer
        console.timeEnd("loadNotes")

        return { notes, backlinks, tags }
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

  const mdast = fromMarkdown(body, {
    extensions: [noteLink(), tagLink()],
    mdastExtensions: [noteLinkFromMarkdown(), tagLinkFromMarkdown()],
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
    }
  })

  return { noteLinks, tagLinks }
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
