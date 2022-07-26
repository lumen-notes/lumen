import { useActor } from "@xstate/react";
import React from "react";
import { GlobalStateContext, GlobalStateContextValue } from "../global-state";
import { NoteCard } from "./note-card";
import { NoteForm } from "./note-form";

export function App() {
  const globalState = React.useContext(GlobalStateContext);
  const [state, send] = useActor(globalState.service);
  const sortedNoteIds = React.useMemo(
    () =>
      Object.keys(state.context.notes).sort(
        (a, b) => parseInt(b) - parseInt(a)
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
          <NoteForm />
        </div>
        {sortedNoteIds.map(id => (
          <NoteCard key={id} id={Number(id)} />
        ))}
      </div>
    </div>
  );
}
