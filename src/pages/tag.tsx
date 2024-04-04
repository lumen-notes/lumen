import { useParams } from "react-router-dom"
import { TagPanel } from "../panels/tag"

export function TagPage() {
  const params = useParams()

  return <TagPanel params={params} />
}
