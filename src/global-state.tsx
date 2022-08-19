import { useInterpret } from "@xstate/react"
import { get, set } from "idb-keyval"
import React from "react"
import { assign, createMachine, InterpreterFrom } from "xstate"
import { fromMarkdown } from "mdast-util-from-markdown"
import { noteLink, noteLinkFromMarkdown } from "./remark-plugins/note-link"
import { visit } from "unist-util-visit"

export type NoteId = string

type Context = {
  directoryHandle: FileSystemDirectoryHandle | null
  notes: Record<NoteId, string>
  backlinks: Record<NoteId, NoteId[]>
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
          data: FileSystemDirectoryHandle
        }
        loadNotes: {
          data: {
            notes: Record<NoteId, string>
            backlinks: Record<NoteId, NoteId[]>
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
              actions: "setDirectoryHandle",
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
              actions: ["setNotes", "setBacklinks", "setContextInIndexedDB"],
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
      setDirectoryHandle: assign({
        directoryHandle: (context, event) => event.data,
      }),
      setNotes: assign({
        notes: (context, event) => event.data.notes,
      }),
      setBacklinks: assign({
        backlinks: (context, event) => event.data.backlinks,
      }),
      setContext: assign({
        directoryHandle: (context, event) => event.data.directoryHandle,
        notes: (context, event) => event.data.notes,
        backlinks: (context, event) => event.data.backlinks,
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
        const { noteLinks } = parseBody(event.body)

        const backlinks = noteLinks.reduce((acc, id) => {
          if (!acc[id]) {
            acc[id] = []
          }
          acc[id].push(event.id)
          return acc
        }, context.backlinks)

        return {
          notes: {
            ...context.notes,
            [event.id]: event.body,
          },
          backlinks,
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
        return await window.showDirectoryPicker({
          id: "notes",
          mode: "readwrite",
        })
      },
      loadNotes: async (context) => {
        if (!context.directoryHandle) {
          throw new Error("Directory not found")
        }

        const data: ReturnType<typeof parseFile>[] = []
        const notes: Record<NoteId, string> = {}
        const backlinks: Record<NoteId, NoteId[]> = {}

        // Start timer
        console.time("loadNotes")

        // Parse every note file in the directory
        for await (const [name, handle] of context.directoryHandle.entries()) {
          // Only load markdown files with numeric names (example: "123.md")
          if (handle.kind === "file" && /^\d+\.md$/.test(name)) {
            data.push(handle.getFile().then(parseFile))
          }
        }

        for (const { id, body, noteLinks } of await Promise.all(data)) {
          notes[id] = body

          for (const noteLink of noteLinks) {
            push(backlinks, noteLink, id)
          }
        }

        // End timer
        console.timeEnd("loadNotes")

        return { notes, backlinks }
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
  const { noteLinks } = parseBody(body)

  return { id, body, noteLinks }
}

/** Extracts metadata from a note body */
function parseBody(body: string) {
  const noteLinks: NoteId[] = []

  const mdast = fromMarkdown(body, {
    extensions: [noteLink()],
    mdastExtensions: [noteLinkFromMarkdown()],
  })

  visit(mdast, (node) => {
    switch (node.type) {
      case "noteLink": {
        noteLinks.push(node.data.id.toString())
      }
    }
  })

  return { noteLinks }
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
