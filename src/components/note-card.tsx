import { EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useSelector } from "@xstate/react";
import React from "react";
import ReactMarkdown from "react-markdown";
import { GlobalStateContext } from "../global-state";
import { NoteForm } from "./note-form";

type NoteCardProps = {
  id: number;
};

export function NoteCard({ id }: NoteCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const codeMirrorViewRef = React.useRef<EditorView>();

  const [isEditing, setIsEditing] = React.useState(false);

  const globalState = React.useContext(GlobalStateContext);
  const body = useSelector(
    globalState.service,
    state => state.context.notes[id]
  );

  function switchToEditing() {
    setIsEditing(true);
    setTimeout(() => {
      const view = codeMirrorViewRef.current;
      if (view) {
        view.focus();
        view.dispatch({
          selection: EditorSelection.cursor(
            view.state.doc.sliceString(0).length
          ),
        });
      }
    });
  }

  function switchToViewing() {
    setIsEditing(false);
    cardRef.current?.focus();
  }

  return (
    <div
      ref={cardRef}
      className="border border-[gray] p-4"
      tabIndex={0}
      onKeyDown={event => {
        // Switch to editing with `e`
        if (!isEditing && event.key === "e") {
          switchToEditing();
          event.preventDefault();
        }
      }}
    >
      {!isEditing ? (
        // View mode
        <div className="flex flex-col gap-4">
          <ReactMarkdown>{body}</ReactMarkdown>
          <div className="flex justify-between items-center">
            <span>{id}</span>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  globalState.service.send({ type: "DELETE_NOTE", id })
                }
              >
                Delete
              </button>
              <button onClick={switchToEditing}>Edit</button>
            </div>
          </div>
        </div>
      ) : (
        // Edit mode
        <NoteForm
          key={body}
          id={id}
          defaultBody={body}
          codeMirrorViewRef={codeMirrorViewRef}
          onSubmit={switchToViewing}
          onCancel={switchToViewing}
        />
      )}
    </div>
  );
}
