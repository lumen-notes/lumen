import { useActor } from "@xstate/react";
import React from "react";
import { useInView } from "react-intersection-observer";
import { Card } from "../components/card";
import { NoteIcon24 } from "../components/icons";
import { NoteCard } from "../components/note-card";
import { NoteForm } from "../components/note-form";
import { GlobalStateContext } from "../global-state";

export function NotesPage() {
  const globalState = React.useContext(GlobalStateContext);
  const [state] = useActor(globalState.service);

  // Sort notes by when they were created in descending order
  const sortedNoteIds = React.useMemo(
    () =>
      Object.keys(state.context.notes).sort(
        (a, b) => parseInt(b) - parseInt(a)
      ),
    [state.context.notes]
  );

  // Only render the first 10 notes when the page loads
  const [numVisibleNotes, setNumVisibleNotes] = React.useState(10);

  const { ref: bottomRef, inView: bottomInView } = useInView();

  React.useEffect(() => {
    if (bottomInView) {
      // Render 10 more notes when the user scrolls to the bottom of the list
      setNumVisibleNotes(num => Math.min(num + 10, sortedNoteIds.length));
    }
  }, [bottomInView, sortedNoteIds.length]);

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-4 p-4">
      <div className="flex gap-2">
        <NoteIcon24 />
        <h1 className="text-lg font-semibold leading-[24px]">Notes</h1>
      </div>
      <Card className="p-2">
        <NoteForm />
      </Card>
      {sortedNoteIds.slice(0, numVisibleNotes).map(id => (
        <NoteCard key={id} id={id} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
