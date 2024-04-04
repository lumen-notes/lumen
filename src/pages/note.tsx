import { useParams } from "react-router-dom"
import { NotePanel } from "../panels/note"

export function NotePage() {
  const params = useParams()

  return <NotePanel params={params} />
}
