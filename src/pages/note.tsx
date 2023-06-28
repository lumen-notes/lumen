import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { useParams } from "react-router-dom"
import { Markdown } from "../components/markdown"
import { notesAtom } from "../global-atoms"
import "./note.css"

export function NotePage() {
  const { id = "" } = useParams()
  const noteAtom = React.useMemo(() => selectAtom(notesAtom, (notes) => notes[id]), [id])
  const note = useAtomValue(noteAtom)

  // TODO: Edit mode
  return (
    <div className="h-screen overflow-auto p-4 [@supports(height:100svh)]:h-[100svh]">
      {note ? <Markdown>{note.rawBody}</Markdown> : <div>Not found</div>}
    </div>
  )
}
