import { Button } from "./button"
import { Dialog } from "./dialog"
import { IconButton } from "./icon-button"
import { ShareIcon16 } from "./icons"

export default {
  title: "Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
  },
}

export const Default = {
  render: () => {
    return (
      <Dialog>
        <Dialog.Trigger>
          <IconButton aria-label="Share">
            <ShareIcon16 />
          </IconButton>
        </Dialog.Trigger>
        <Dialog.Content title="Share">
          <div className="grid gap-2">
            <Button variant="primary">Publish note</Button>
            <span className="text-text-secondary text-sm text-center text-pretty">
              Anyone with the link will be able to view this note.
            </span>
          </div>
        </Dialog.Content>
      </Dialog>
    )
  },
}
