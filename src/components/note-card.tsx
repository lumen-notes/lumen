import { useSelector } from "@xstate/react";
import React from "react";
import { GlobalStateContext } from "../global-state";
import { NoteForm } from "./note-form";

type NoteCardProps = {
  id: number;
};

export function NoteCard({ id }: NoteCardProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const globalState = React.useContext(GlobalStateContext);
  const body = useSelector(
    globalState.service,
    state => state.context.notes[id]
  );

  return (
    <div
      style={{
        border: "1px solid gray",
        padding: 16,
      }}
    >
      {!isEditing ? (
        // View mode
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ overflow: "auto" }}>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{body}</pre>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{id}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() =>
                  globalState.service.send({ type: "DELETE_NOTE", id })
                }
              >
                Delete
              </button>
              <button onClick={() => setIsEditing(true)}>Edit</button>
            </div>
          </div>
        </div>
      ) : (
        // Edit mode
        <NoteForm
          key={body}
          id={id}
          defaultBody={body}
          onSubmit={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}
