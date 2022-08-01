import { useActor } from "@xstate/react";
import React from "react";
import { useInView } from "react-intersection-observer";
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
    <div>
      <div className="flex flex-col gap-4 p-4">
        <div className="border border-[gray] p-4">
          <NoteForm />
        </div>
        {sortedNoteIds.slice(0, numVisibleNotes).map(id => (
          <NoteCard key={id} id={Number(id)} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
