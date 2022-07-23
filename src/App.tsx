import { get, set } from "idb-keyval";
import React from "react";
import { createMachine, assign } from "xstate";
import { useMachine } from "@xstate/react";

type Context = {
  directoryHandle: FileSystemDirectoryHandle | null;
  notes: Record<string, string>;
};

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
            <div style={{ display: "flex", gap: 8 }}>
              <button>Edit</button>
              <button>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
