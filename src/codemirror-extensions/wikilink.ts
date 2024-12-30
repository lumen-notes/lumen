import { EditorState, Extension, Range, StateField } from "@codemirror/state"
import { Decoration, DecorationSet, EditorView, WidgetType } from "@codemirror/view"

function createWikilinkField(navigate: (id: string) => void) {
  return StateField.define<DecorationSet>({
    create(state) {
      return createDecorations(state, navigate)
    },
    update(decorations, tr) {
      // Update decorations if the document has changed or the selection has changed
      if (tr.docChanged || tr.selection) {
        return createDecorations(tr.state, navigate)
      }
      return decorations
    },
    provide: (f) => EditorView.decorations.from(f),
  })
}

const wikilinkRegex = /\[\[([^\]]+?)(?:\|([^\]]+))?\]\]/g

function createDecorations(state: EditorState, navigate: (id: string) => void) {
  const decorations: Range<Decoration>[] = []
  const { from, to } = state.selection.main

  for (let i = 1; i <= state.doc.lines; i++) {
    const line = state.doc.line(i)
    let match: RegExpExecArray | null

    while ((match = wikilinkRegex.exec(line.text)) !== null) {
      const startPos = line.from + match.index
      const endPos = startPos + match[0].length
      const [_fullMatch, id, text] = match

      // Only apply decoration if cursor is not within the wikilink
      if (from < startPos || to > endPos) {
        decorations.push(
          Decoration.replace({
            widget: new WikilinkWidget(id, text, navigate, startPos, endPos),
          }).range(startPos, endPos),
        )
      }
    }
  }

  return Decoration.set(decorations)
}

class WikilinkWidget extends WidgetType {
  private span: HTMLSpanElement | null = null
  private clickHandler: ((event: MouseEvent) => void) | null = null

  constructor(
    private id: string,
    private text: string,
    private navigate: (id: string) => void,
    private startPos: number,
    private endPos: number,
  ) {
    super()
  }

  toDOM(view: EditorView) {
    this.span = document.createElement("span")
    this.span.textContent = this.text || this.id
    this.span.className = "cm-wikilink"

    this.clickHandler = (event: MouseEvent) => {
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        this.navigate(this.id)
      } else {
        view.dispatch({
          selection: { anchor: this.startPos, head: this.endPos },
          scrollIntoView: true,
        })
      }
    }

    this.span.addEventListener("click", this.clickHandler)
    return this.span
  }

  destroy() {
    if (this.span && this.clickHandler) {
      this.span.removeEventListener("click", this.clickHandler)
      this.span = null
      this.clickHandler = null
    }
  }
}

export function wikilinkExtension(navigate: (id: string) => void): Extension {
  return createWikilinkField(navigate)
}
