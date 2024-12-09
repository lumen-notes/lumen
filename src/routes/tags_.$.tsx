import { createFileRoute } from "@tanstack/react-router"
import { AppLayout } from "../components/app-layout"
import { DropdownMenu } from "../components/dropdown-menu"
import { IconButton } from "../components/icon-button"
import { EditIcon16, MoreIcon16, TrashIcon16 } from "../components/icons"
import { NoteList } from "../components/note-list"
import { useDeleteTag, useRenameTag } from "../hooks/tag"

export const Route = createFileRoute("/tags_/$")({
  component: RouteComponent,
})

function RouteComponent() {
  const { _splat: tag } = Route.useParams()
  const navigate = Route.useNavigate()
  const renameTag = useRenameTag()
  const deleteTag = useDeleteTag()

  return (
    <AppLayout
      title={`#${tag}`}
      actions={
        <DropdownMenu modal={false}>
          <DropdownMenu.Trigger asChild>
            <IconButton aria-label="More actions" size="small" disableTooltip>
              <MoreIcon16 />
            </IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end" side="top">
            <DropdownMenu.Item
              icon={<EditIcon16 />}
              onSelect={() => {
                if (!tag) return

                const newName = window.prompt("Rename tag", tag)

                if (newName) {
                  renameTag(tag, newName)
                  navigate({ to: "/tags/$", params: { _splat: newName }, replace: true })
                }
              }}
            >
              Rename tag
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item
              icon={<TrashIcon16 />}
              variant="danger"
              onSelect={() => {
                if (!tag) return

                // Confirm deletion
                if (
                  window.confirm(
                    `Remove the "${tag}" tag from all notes?\nDon't worry—no notes will be deleted.`,
                  )
                ) {
                  deleteTag(tag)
                  navigate({ to: "/tags", replace: true })
                }
              }}
            >
              Delete tag
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      }
    >
      <div className="p-4 pt-0">
        <NoteList key={tag} baseQuery={`tag:${tag}`} />
      </div>
    </AppLayout>
  )
}
