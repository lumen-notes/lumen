import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import { EditIcon16, ExternalLinkIcon16, MoreIcon16, TrashIcon16 } from "./icons"

export default {
  title: "DropdownMenu",
  component: DropdownMenu,
  parameters: {
    layout: "centered",
  },
}

export const Default = {
  render: () => {
    return (
      <DropdownMenu>
        <DropdownMenu.Trigger asChild>
          <IconButton aria-label="Menu">
            <MoreIcon16 />
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="center">
          <DropdownMenu.Item icon={<EditIcon16 />} shortcut={["E"]}>
            Edit
          </DropdownMenu.Item>
          <DropdownMenu.Item icon={<ExternalLinkIcon16 />} href="#">
            Open in GitHub
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item variant="danger" icon={<TrashIcon16 />} shortcut={["⌘", "⌫"]} disabled>
            Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
    )
  },
}
