import { useInterpret } from "@xstate/react"
import { get, set } from "idb-keyval"
import React from "react"
import { assign, createMachine, InterpreterFrom } from "xstate"

type Context = {
  directoryHandle: FileSystemDirectoryHandle | null
  notes: Record<string, string>
}

type Event =
  | { type: "SHOW_DIRECTORY_PICKER" }
  | { type: "REQUEST_PERMISSION" }
  | { type: "RELOAD" }
  | { type: "DISCONNECT" }
  | { type: "UPSERT_NOTE"; id: string; body: string }
  | { type: "DELETE_NOTE"; id: string }

const machine = createMachine(
  {
    context: {
      directoryHandle: null,
      notes: {},
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
          data: Record<string, string>
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
              target: "empty",
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
              target: "empty",
            },
          ],
          onError: [
            {
              target: "empty",
            },
          ],
        },
      },
      empty: {
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
              target: "empty",
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
          onError: "empty",
        },
      },
      loadingNotes: {
        invoke: {
          src: "loadNotes",
          id: "loadNotes",
          onDone: [
            {
              actions: ["setNotes", "setContextInIndexedDB"],
              target: "ready",
            },
          ],
        },
      },
      ready: {
        on: {
          SHOW_DIRECTORY_PICKER: {
            target: "showingDirectoryPicker",
          },
          RELOAD: {
            target: "queryingPermission",
          },
          DISCONNECT: {
            target: "empty",
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
        notes: (context, event) => event.data,
      }),
      setContext: assign({
        directoryHandle: (context, event) => event.data.directoryHandle,
        notes: (context, event) => event.data.notes,
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
      upsertNote: assign({
        notes: (context, event) => ({
          ...context.notes,
          [event.id]: event.body,
        }),
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
      deleteNote: assign({
        notes: (context, event) => {
          const { [event.id]: _, ...rest } = context.notes
          return rest
        },
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
          return {}
        }

        // Start timer
        console.time("loadNotes")

        const entries: Array<Promise<[string, string]>> = []

        // TODO: Read files in a worker to avoid blocking the main thread
        for await (const [name, handle] of context.directoryHandle.entries()) {
          // Only load markdown files with numeric names (example: "123.md")
          if (handle.kind === "file" && /^\d+\.md$/.test(name)) {
            entries.push(
              handle
                .getFile()
                .then(
                  async (file): Promise<[string, string]> => [
                    file.name.replace(/\.md$/, ""),
                    await file.text(),
                  ],
                ),
            )
          }
        }

        const notes = Object.fromEntries(await Promise.all(entries))

        // End timer
        console.timeEnd("loadNotes")

        return notes
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

export function GlobalStateProvider({ children }: React.PropsWithChildren<{}>) {
  const service = useInterpret(machine)

  return (
    <GlobalStateContext.Provider value={{ service }}>
      {children}
    </GlobalStateContext.Provider>
  )
}
