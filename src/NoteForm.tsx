import React from "react";

type NoteFormProps = {
  id?: number;
  defaultBody?: string;
  onSubmit?: (note: { id: number; body: string }) => void;
};

export function NoteForm({ id, defaultBody = "", onSubmit }: NoteFormProps) {
  const [body, setBody] = React.useState(defaultBody);

  function handleSubmit() {
    onSubmit?.({ id: id ?? Date.now(), body });

    // If we're creating a new note, reset the form on submit
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
      <button style={{ alignSelf: "end" }}>{id ? "Save" : "Add"}</button>
    </form>
  );
}
