import { request } from "@octokit/request"
import { createFileRoute } from "@tanstack/react-router"
import { formatDistance } from "date-fns"
import React from "react"
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
  const { gist, note } = Route.useLoaderData()

  const content = React.useMemo(() => {
    let content = note?.content ?? ""

    // If there's no title, and there's a description, we use the description as the title
    if (!note?.title && gist.description) {
      content = `# ${gist.description}\n\n${content}`
    }
    return content
  }, [gist.description, note?.title, note?.content])

  return (
    <div className="overflow-auto [scrollbar-gutter:stable]">
      <div className="p-4 md:p-16">
        <div className="max-w-3xl mx-auto flex flex-col gap-5">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-flex items-center gap-2 flex-shrink-0 truncate text-text-secondary">
              <img
                src={gist.owner?.avatar_url}
                alt=""
                aria-hidden
                className="size-4 rounded-full"
              />
              <span>{gist.owner?.login}</span>
            </span>
            {gist.updated_at ? (
              <>
                <span className="text-text-secondary">·</span>
                <span className="text-text-secondary truncate">
                  Updated{" "}
                  {formatDistance(new Date(gist.updated_at), new Date(), {
                    addSuffix: true,
                  })}
                </span>
              </>
            ) : null}
          </div>
          <Markdown hideFrontmatter>{content}</Markdown>
          <div className="text-text-secondary mt-5 print:hidden">
            Published with{" "}
            <a
              href="https://uselumen.com"
              className="link link-external"
              target="_blank"
              rel="noreferrer noopener"
            >
              Lumen
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
