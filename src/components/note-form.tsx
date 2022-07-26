import React from "react";
import { GlobalStateContext } from "../global-state";

type NoteFormProps = {
  id?: number;
  defaultBody?: string;
  onSubmit?: (note: { id: number; body: string }) => void;
  onCancel?: () => void;
};

export function NoteForm({
  id,
  defaultBody = "",
  onSubmit,
  onCancel,
}: NoteFormProps) {
  const globalState = React.useContext(GlobalStateContext);
  const [body, setBody] = React.useState(defaultBody);

  function handleSubmit() {
    const note = {
      id: id ?? Date.now(),
      body,
    };

    globalState.service?.send({
      type: "UPSERT_NOTE",
      ...note,
    });

    onSubmit?.(note);

    // If we're creating a new note, reset the form after submitting
    if (!id) {
      setBody("");
    }
  }

  return (
    <form
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
      onSubmit={event => {
        handleSubmit();
        event.preventDefault();
      }}
    >
      <textarea
        rows={3}
        placeholder="Write something..."
        value={body}
        onChange={event => setBody(event.target.value)}
        onKeyDown={event => {
          // Submit on `command + enter`
          if (event.key === "Enter" && event.metaKey) {
            handleSubmit();
            event.preventDefault();
          }
        }}
      />
      <div style={{ alignSelf: "end", display: "flex", gap: 8 }}>
        {onCancel ? (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button type="submit">{id ? "Save" : "Add"}</button>
      </div>
    </form>
  );
}
