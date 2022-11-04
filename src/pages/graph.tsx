import React from "react"
import { GlobalStateContext } from "../global-state"
import { useActor } from "@xstate/react"

type NodeType = "note" | "tag" | "date"

type Node = {
  id: string
  type: NodeType
}

type Link = {
  source: string
  target: string
}

export function GraphPage() {
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)

  const nodes = [
    ...state.context.sortedNoteIds.map<Node>((noteId) => ({
      type: "note",
      id: noteId,
    })),
    ...Object.keys(state.context.tags).map<Node>((tagName) => ({
      type: "tag",
      id: tagName,
    })),
    ...Object.keys(state.context.dates).map<Node>((date) => ({
      type: "date",
      id: date,
    })),
  ]

  const links = [
    ...Object.entries(state.context.backlinks).flatMap<Link>(([noteId, backlinks]) =>
      backlinks.map((backlink) => ({
        source: noteId,
        target: backlink,
      })),
    ),
    ...Object.entries(state.context.tags).flatMap<Link>(([tagName, noteIds]) =>
      noteIds.map((noteId) => ({
        source: tagName,
        target: noteId,
      })),
    ),
    ...Object.entries(state.context.dates).flatMap<Link>(([date, noteIds]) =>
      noteIds.map((noteId) => ({
        source: date,
        target: noteId,
      })),
    ),
  ]

  console.log({ nodes, links })

  return <div>Graph</div>
}
