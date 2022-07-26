import { useActor } from "@xstate/react";
import React from "react";
import { GlobalStateContext, GlobalStateContextValue } from "../global-state";
import { NoteForm } from "./note-form";

export function App() {
  const globalState = React.useContext(GlobalStateContext);
  const [state, send] = useActor(
    globalState.service as NonNullable<GlobalStateContextValue["service"]>
  );
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
          <NoteForm
            onSubmit={note => {
              send({ type: "UPSERT_NOTE", id: note.id, body: note.body });
            }}
          />
        </div>
        {sortedNotes.map(([id, body]) => (
          <div
            key={id}
            style={{
              border: "1px solid gray",
              padding: 16,
            }}
          >
            <NoteForm
              key={body}
              id={Number(id)}
              defaultBody={body}
              onSubmit={note => {
                send({ type: "UPSERT_NOTE", id: note.id, body: note.body });
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
