import { request } from "@octokit/request"
import { createFileRoute } from "@tanstack/react-router"
import { Markdown } from "../components/markdown"
import { parseNote } from "../utils/parse-note"

export const Route = createFileRoute("/share/$shareId")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const shareId = params.shareId

    const { data: gist } = await request("GET /gists/{gist_id}", {
      gist_id: shareId,
    })

    if (!gist.files) {
      return {
        gist,
        note: null,
      }
    }

    // We need to locate a markdown file within the gist to display as the note content
    // If there's a README.md file, we use that. Otherwise, we use the first markdown file we find
    const readmeFile = Object.values(gist.files).find(
      (file) => file?.filename?.toLowerCase() === "readme.md",
    )
    const markdownFile =
      readmeFile || Object.values(gist.files).find((file) => file?.type === "text/markdown")

    if (!markdownFile) {
      return {
        gist,
        note: null,
      }
    }

    return {
      gist,
      note: parseNote(shareId, markdownFile.content ?? ""),
    }
  },
})

function RouteComponent() {
  const { note } = Route.useLoaderData()
  return (
    <div className="overflow-auto [scrollbar-gutter:stable]">
      <div className="px-4 md:px-14 pt-14 pb-[30vh]">
        <div className="max-w-3xl mx-auto">
          <Markdown hideFrontmatter>{note?.content ?? ""}</Markdown>
        </div>
      </div>
    </div>
  )
}
