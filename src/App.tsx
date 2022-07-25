import { get, set } from "idb-keyval";
import React from "react";
import { createMachine, assign } from "xstate";
import { useMachine } from "@xstate/react";

type Context = {
  directoryHandle: FileSystemDirectoryHandle | null;
  notes: Record<string, string>;
};

type Event =
  | { type: "SHOW_DIRECTORY_PICKER" }
  | { type: "REQUEST_PERMISSION" }
  | { type: "RELOAD" }
  | { type: "CLOSE" }
  | { type: "ADD_NOTE"; id: number; body: string };

const machine = createMachine(
  {
    context: { directoryHandle: null, notes: {} },
    tsTypes: {} as import("./App.typegen").Typegen0,
    schema: {
      context: {} as Context,
      services: {} as {
        loadContext: {
          data: Context;
        };
        queryPermission: {
          data: PermissionState;
        };
        showDirectoryPicker: {
          data: FileSystemDirectoryHandle;
        };
        loadNotes: {
          data: Record<string, string>;
        };
      },
      events: {} as Event,
    },
    id: "notes",
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
          CLOSE: {
            target: "empty",
          },
          ADD_NOTE: {
            actions: ["addNote", "addNoteFile", "setContextInIndexedDB"],
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
        await set("context", context);
      },
      clearContextInIndexedDB: async (context, event) => {
        await set("context", null);
      },
      addNote: assign({
        notes: (context, event) => ({
          ...context.notes,
          [event.id]: event.body,
        }),
      }),
      addNoteFile: async (context, event) => {
        if (!context.directoryHandle) {
          throw new Error("Not found");
        }

        const fileHandle = await context.directoryHandle.getFileHandle(
          `${event.id}.md`,
          { create: true }
        );

        // Create a FileSystemWritableFileStream to write to
        const writeableStream = await fileHandle.createWritable();

        // Write the contents of the file
        await writeableStream.write(event.body);

        // Close the stream
        await writeableStream.close();
      },
    },
    guards: {
      isGranted: (context, event) => {
        return event.data === "granted";
      },
      isPrompt: (context, event) => {
        return event.data === "prompt";
      },
      isDenied: (context, event) => {
        return event.data === "denied";
      },
    },
    services: {
      loadContext: async () => {
        const context = await get<Context>("context");

        if (!context) {
          throw new Error("Not found");
        }

        return context;
      },
      queryPermission: async context => {
        if (!context.directoryHandle) {
          throw new Error("Not found");
        }

        const permission = await context.directoryHandle.queryPermission({
          mode: "readwrite",
        });

        return permission;
      },
      requestPermission: async context => {
        if (!context.directoryHandle) {
          throw new Error("Not found");
        }

        const permission = await context.directoryHandle.requestPermission({
          mode: "readwrite",
        });

        if (permission !== "granted") {
          throw new Error("Not granted");
        }
      },
      showDirectoryPicker: async () => {
        return await window.showDirectoryPicker({
          id: "notes",
          mode: "readwrite",
        });
      },
      loadNotes: async context => {
        if (!context.directoryHandle) {
          return {};
        }

        // Start timer
        console.time("loadNotes");

        const entries: Array<Promise<[number, string]>> = [];

        for await (const [name, handle] of context.directoryHandle.entries()) {
          // Only markdown files
          if (handle.kind === "file" && name.endsWith(".md")) {
            entries.push(
              handle
                .getFile()
                .then(
                  async (file): Promise<[number, string]> => [
                    parseInt(file.name),
                    await file.text(),
                  ]
                )
            );
          }
        }

        const notes = Object.fromEntries(await Promise.all(entries));

        // End timer
        console.timeEnd("loadNotes");

        return notes;
      },
    },
  }
);

export function App() {
  const [state, send] = useMachine(machine);
  const [textareaValue, setTextareaValue] = React.useState("");
  const sortedNotes = React.useMemo(
    () =>
      Object.entries(state.context.notes).sort(
        (a, b) => parseInt(b[0]) - parseInt(a[0])
      ),
    [state.context.notes]
  );

  return (
    <div>
      <div style={{ padding: 16 }}>{JSON.stringify(state.value)}</div>
      {state.matches("prompt") ? (
        <dialog open>
          <button onClick={() => send("REQUEST_PERMISSION")}>Grant</button>
        </dialog>
      ) : null}
      {state.matches("empty") ? (
        <button onClick={() => send("SHOW_DIRECTORY_PICKER")}>
          Open folder
        </button>
      ) : null}
      {state.context.directoryHandle ? (
        <div
          style={{
            padding: 16,
            display: "flex",
            gap: 8,
          }}
        >
          <div>{state.context.directoryHandle?.name}</div>
          <button
            onClick={() => send("RELOAD")}
            disabled={state.matches("loadingNotes")}
          >
            {state.matches("loadingNotes") ? "Loading" : "Reload"}
          </button>
          <button onClick={() => send("CLOSE")}>Close</button>
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: 16,
        }}
      >
        <div
          style={{
            border: "1px solid gray",
            padding: 16,
          }}
        >
          <form
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
            onSubmit={event => {
              event.preventDefault();
              const id = Date.now();
              const body = textareaValue;
              send({ type: "ADD_NOTE", id, body });
              setTextareaValue("");
            }}
          >
            <textarea
              rows={3}
              placeholder="Write something..."
              value={textareaValue}
              onChange={event => setTextareaValue(event.target.value)}
            />
            <button style={{ alignSelf: "end" }}>Add</button>
          </form>
        </div>
        {sortedNotes.map(([id, body]) => (
          <div
            key={id}
            style={{
              border: "1px solid gray",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              overflow: "auto",
            }}
          >
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{body}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
