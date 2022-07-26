import { useSelector } from "@xstate/react";
import React from "react";
import { GlobalStateContext } from "../global-state";
import { NoteForm } from "./note-form";

type NoteCardProps = {
  id: number;
};

export function NoteCard({ id }: NoteCardProps) {
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
      <NoteForm key={body} id={id} defaultBody={body} />
    </div>
  );
}
