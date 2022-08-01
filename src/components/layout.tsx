import { useActor } from "@xstate/react";
import React from "react";
import { Outlet } from "react-router-dom";
import { GlobalStateContext } from "../global-state";

export function Layout() {
  const globalState = React.useContext(GlobalStateContext);
  const [state, send] = useActor(globalState.service);
  return (
    <div>
      <div className="p-4">{JSON.stringify(state.value)}</div>
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
        <div className="p-4 flex gap-2">
          <div>{state.context.directoryHandle?.name}</div>
          <button
            onClick={() => send("RELOAD")}
            disabled={state.matches("loadingNotes")}
          >
            {state.matches("loadingNotes") ? "Loading" : "Reload"}
          </button>
          <button onClick={() => send("DISCONNECT")}>Disconnect</button>
        </div>
      ) : null}
      <Outlet />
    </div>
  );
}
