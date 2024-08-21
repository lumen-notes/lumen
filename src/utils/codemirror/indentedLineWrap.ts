import { EditorView, Decoration } from "@codemirror/view";
import { StateField, EditorState } from "@codemirror/state";

export const getStartTabs = (line: string): string => /^\t*/.exec(line)?.[0] ?? "";

const getDecorations = (state: EditorState) => {
  const decorations: Decoration[] = [];

  for (let i = 0; i < state.doc.lines; i++) {
    const line = state.doc.line(i + 1);
    const numberOfTabs = getStartTabs(line.text).length;
    if (numberOfTabs === 0) continue;

    const offset = numberOfTabs * state.tabSize;

    const linerwapper = Decoration.line({
      attributes: {
        style: `--indented: ${offset}ch;`,
        class: "indented-wrapped-line",
      },
    });

    decorations.push(linerwapper.range(line.from, line.from));
  }

  return Decoration.set(decorations);
};

/**
 * Plugin that makes line wrapping in the editor respect the identation of the line.
 * It does this by adding a line decoration that adds margin-left (as much as there is indentation),
 * and adds the same amount as negative "text-indent". The nice thing about text-indent is that it
 * applies to the initial line of a wrapped line.
 */
export const indentedLineWrap = StateField.define<Decoration[]>({
  create(state) {
    return getDecorations(state);
  },
  update(deco, tr) {
    if (!tr.docChanged) return deco;
    return getDecorations(tr.state);
  },
  provide: (f) => EditorView.decorations.from(f),
});
