import { useCreateNewNote } from "../hooks/create-new-note"
import { IconButton } from "./icon-button"
import { PlusIcon16 } from "./icons"

export function NewNoteButton() {
  const createNewNote = useCreateNewNote()

  return (
    <IconButton
      aria-label="New note"
      shortcut={["⌘", "⇧", "O"]}
      size="small"
      onClick={createNewNote}
    >
      <PlusIcon16 />
    </IconButton>
  )
}
