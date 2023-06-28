import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { useParams } from "react-router-dom"
import { Markdown } from "../components/markdown"
import { notesAtom } from "../global-atoms"
import { ThemeColor } from "../components/theme-color"

export function NotePage() {
  const { id = "" } = useParams()
  const noteAtom = React.useMemo(() => selectAtom(notesAtom, (notes) => notes[id]), [id])
  const note = useAtomValue(noteAtom)

  // TODO: Edit mode
  return (
    <div className="h-screen overflow-auto bg-bg p-4 [@supports(height:100svh)]:h-[100svh]">
      {/* Make browser toolbar color match the note's background color */}
      <ThemeColor propertyName="--color-bg" />
      {note ? <Markdown>{note.rawBody}</Markdown> : <div>Not found</div>}
    </div>
  )
}
