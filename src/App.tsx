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
    id: "notes",
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
    context: {
      directoryHandle: null,
      notes: {},
    },
    initial: "loadingContext",
    states: {
      loadingContext: {
        invoke: {
          id: "loadContext",
          src: "loadContext",
          onDone: {
            target: "queryingPermission",
            actions: ["setContext", "saveContext"],
          },
          onError: "empty",
        },
      },
      queryingPermission: {
        invoke: {
          id: "queryPermission",
          src: "queryPermission",
          onDone: [
            { cond: "isGranted", target: "loadingNotes" },
            { cond: "isPrompt", target: "prompt" },
            { cond: "isDenied", target: "empty" },
          ],
          onError: "empty",
        },
      },
      empty: {
        entry: ["clearContext", "unsaveContext"],
        on: {
          SHOW_DIRECTORY_PICKER: "showingDirectoryPicker",
        },
      },
      prompt: {
        on: {
          REQUEST_PERMISSION: "requestingPermission",
        },
      },
      requestingPermission: {
        invoke: {
          id: "requestPermission",
          src: "requestPermission",
          onDone: "loadingNotes",
          onError: "empty",
        },
      },
      showingDirectoryPicker: {
        invoke: {
          id: "showDirectoryPicker",
          src: "showDirectoryPicker",
          onDone: {
            target: "loadingNotes",
            actions: ["setDirectoryHandle"],
          },
        },
      },
      loadingNotes: {
        invoke: {
          id: "loadNotes",
          src: "loadNotes",
          onDone: {
            target: "ready",
            actions: ["setNotes", "saveContext"],
          },
        },
      },
      ready: {
        on: {
          SHOW_DIRECTORY_PICKER: "showingDirectoryPicker",
          RELOAD: "queryingPermission",
          CLOSE: "empty",
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
      saveContext: async (context, event) => {
        await set("context", context);
      },
      unsaveContext: async (context, event) => {
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

        const permission = await context.directoryHandle.queryPermission();

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

        console.time("load");

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

        console.timeEnd("load");

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
          <button onClick={() => send("RELOAD")}>Reload</button>
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
              display: "grid",
              gap: 16,
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
