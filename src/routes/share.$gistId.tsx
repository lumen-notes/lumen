import { request } from "@octokit/request"
import { createFileRoute, Link } from "@tanstack/react-router"
import { formatDistance } from "date-fns"
import { useAtomValue } from "jotai"
import React from "react"
import { IconButton } from "../components/icon-button"
import { EditIcon16 } from "../components/icons"
import { Markdown } from "../components/markdown"
import { githubUserAtom } from "../global-state"
import { useNoteById } from "../hooks/note"
import { parseNote } from "../utils/parse-note"

export const Route = createFileRoute("/share/$gistId")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const gistId = params.gistId

    try {
      const { data: gist } = await request("GET /gists/{gist_id}", {
        gist_id: gistId,
      })

      if (!gist.files) {
        throw new Error("No files found in gist")
      }

      // We need to locate a markdown file within the gist to use as the note content
      // If there's a README.md file, we use that. Otherwise, we use the first markdown file we find
      const readmeFile = Object.values(gist.files).find(
        (file) => file?.filename?.toLowerCase() === "readme.md",
      )
      const markdownFile =
        readmeFile || Object.values(gist.files).find((file) => file?.filename?.endsWith(".md"))

      if (!markdownFile) {
        throw new Error("No markdown file found in gist")
      }

      return {
        gist,
        note: parseNote(
          markdownFile.filename?.replace(/\.md$/, "") ?? "",
          markdownFile.content ?? "",
        ),
      }
    } catch (error) {
      console.error(error)
      return {
        gist: null,
        note: null,
      }
    }
  },
  head: ({ loaderData }) => {
    const { gist, note } = loaderData
    return {
      meta: [{ title: note?.title || gist?.description || note?.displayName || "Lumen" }],
    }
  },
})

function RouteComponent() {
  const { gist, note } = Route.useLoaderData()
  const githubUser = useAtomValue(githubUserAtom)
  const userNote = useNoteById(note?.id) // Check if the note is owned by the user

  const content = React.useMemo(() => {
    let content = note?.content ?? ""

    // If there's no title, and there's a description, we use the description as the title
    if (!note?.title && gist?.description) {
      content = `# ${gist.description}\n\n${content}`
    }
    return content
  }, [gist?.description, note?.title, note?.content])

  if (!gist || !note) {
    return (
      <div className="w-full h-[100svh] grid place-content-center text-text-secondary">
        Note not found
      </div>
    )
  }

  return (
    <div className="p-5 md:p-16">
      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        <div className="flex items-center gap-2 justify-between h-8 coarse:h-10 print:hidden">
          <div className="flex items-center gap-2 truncate">
            <img src={gist.owner?.avatar_url} alt="" aria-hidden className="size-4 rounded-full" />
            <span className="truncate">
              <a
                href={`https://github.com/${gist.owner?.login}`}
                className="link"
                target="_blank"
                rel="noreferrer noopener"
              >
                {gist.owner?.login}
              </a>
              {gist.updated_at ? (
                <>
                  {" "}
                  <span className="text-text-secondary truncate">
                    updated{" "}
                    {formatDistance(new Date(gist.updated_at), new Date(), {
                      addSuffix: true,
                    })}
                  </span>
                </>
              ) : null}
            </span>
          </div>
          {githubUser && userNote ? (
            <IconButton aria-label="Edit in Lumen" asChild>
              <Link
                to="/notes/$"
                params={{ _splat: userNote.id }}
                search={{ mode: "write", query: undefined, view: "grid" }}
              >
                <EditIcon16 />
              </Link>
            </IconButton>
          ) : null}
        </div>
        <div
          className="flex flex-col gap-2"
          style={{ "--font-family-content": "var(--font-family-serif)" } as React.CSSProperties}
        >
          <Markdown hideFrontmatter>{content}</Markdown>
        </div>
        <div className="mt-5 print:hidden">
          <span className="text-text-secondary text-sm">
            Published with{" "}
            <a
              href="https://uselumen.com"
              className="link"
              target="_blank"
              rel="noreferrer noopener"
            >
              Lumen
            </a>
          </span>
        </div>
      </div>
    </div>
  )
}
