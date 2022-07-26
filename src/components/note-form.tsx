import { closeBrackets } from "@codemirror/autocomplete";
import { history } from "@codemirror/commands";
import { EditorState } from "@codemirror/state";
import { EditorView, placeholder } from "@codemirror/view";
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

  const {
    editorRef,
    view,
    value: body = "",
  } = useCodeMirror({
    defaultValue: defaultBody,
    placeholder: "Write something...",
  });

  function handleSubmit() {
    const note = {
      id: id ?? Date.now(),
      body: body,
    };

    globalState.service?.send({
      type: "UPSERT_NOTE",
      ...note,
    });

    onSubmit?.(note);

    // If we're creating a new note, reset the form after submitting
    if (!id) {
      view?.dispatch({
        changes: [{ from: 0, to: body.length, insert: defaultBody }],
      });
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
      <div
        ref={editorRef}
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

// Reference: https://www.codiga.io/blog/implement-codemirror-6-in-react/
function useCodeMirror({
  defaultValue,
  placeholder: placeholderValue = "",
  viewRef: providedViewRef,
}: {
  defaultValue?: string;
  placeholder?: string;
  viewRef?: React.MutableRefObject<EditorView | null>;
}) {
  const [editorElement, setEditorElement] = React.useState<HTMLElement>();
  const editorRef = React.useCallback((node: HTMLElement | null) => {
    if (!node) return;

    setEditorElement(node);
  }, []);

  const newViewRef = React.useRef<EditorView>();
  const viewRef = providedViewRef ?? newViewRef;

  const [value, setValue] = React.useState(defaultValue);

  React.useEffect(() => {
    if (!editorElement) return;

    const state = EditorState.create({
      doc: defaultValue,
      extensions: [
        placeholder(placeholderValue),
        history(),
        EditorView.updateListener.of(event => {
          const value = event.view.state.doc.sliceString(0);
          setValue(value);
        }),
        closeBrackets(),
        // autocompletion({
        //   override: [],
        //   icons: false,
        // }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorElement,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [editorElement]);

  return { editorRef, view: viewRef.current, value };
}
