import { useAtom, useAtomValue } from "jotai"
import React from "react"
import { githubRepoAtom, githubUserAtom } from "../global-atoms"
import { GitHubRepository } from "../types"
import { readFile } from "../utils/github-fs"
import { useFetchNotes } from "../utils/github-sync"
import { Button } from "./button"
import { Card } from "./card"
import { ErrorIcon16, LoadingIcon16 } from "./icons"
import { Input } from "./input"
import { Markdown } from "./markdown"

export function RepoForm() {
  const githubUser = useAtomValue(githubUserAtom)
  const [githubRepo, setGitHubRepo] = useAtom(githubRepoAtom)
  const { fetchNotes } = useFetchNotes()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  async function selectExistRepo({ owner, name }: GitHubRepository) {
    if (!githubUser) return

    setIsLoading(true)

    // Ensure repo exists
    const response = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
      headers: { Authorization: `token ${githubUser.token}` },
    })

    if (!response.ok) {
      setIsLoading(false)
      setError(
        new Error(
          "Repository does not exist. Please double check the owner and name and try again.",
        ),
      )
      return
    }

    // Ensure repo has .lumen/notes.json and .github/workflows/lumen.yml
    try {
      const options = { githubToken: githubUser.token, githubRepo: { owner, name } }
      await readFile({ ...options, path: ".lumen/notes.json" })
      await readFile({ ...options, path: ".github/workflows/lumen.yml" })
    } catch (error) {
      setIsLoading(false)
      setError(
        new Error(
          "Missing Lumen workflow file. Please copy [.github/workflow/lumen.yml](https://github.com/lumen-notes/notes-template/blob/main/.github/workflows/lumen.yml) from the template repository into your repository.",
        ),
      )
      return
    }

    // Reset loading and error state
    setIsLoading(false)
    setError(null)

    setGitHubRepo({ owner, name })
    fetchNotes()
  }

  return (
    <Card className="p-4">
      <form
        id="github-form"
        className="flex flex-col gap-6 @container"
        onSubmit={async (event) => {
          event.preventDefault()

          const formData = new FormData(event.currentTarget)
          const owner = String(formData.get("repo-owner"))
          const name = String(formData.get("repo-name"))

          selectExistRepo({ owner, name })
        }}
      >
        {/* <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="repo-new"
              name="repo-type"
              value="personal"
              defaultChecked={!githubRepo}
            />
            <label htmlFor="repo-new" className="leading-4">
              Create a new repository
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="repo-existing"
              name="repo-type"
              value="existing"
              defaultChecked={!!githubRepo}
            />
            <label htmlFor="repo-existing" className="leading-4">
              Select an existing repository
            </label>
          </div>
        </div> */}
        <div className="flex flex-col gap-4">
          <div className="grid flex-grow gap-2">
            <label htmlFor="repo-owner" className="leading-4">
              Repository owner
            </label>
            <Input
              id="repo-owner"
              name="repo-owner"
              spellCheck={false}
              defaultValue={githubRepo?.owner ?? githubUser?.username}
              required
            />
          </div>
          <div className="grid flex-grow gap-2">
            <label htmlFor="repo-name" className="leading-4">
              Repository name
            </label>
            <Input
              id="repo-name"
              name="repo-name"
              spellCheck={false}
              defaultValue={githubRepo?.name}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? <LoadingIcon16 /> : "Select"}
          </Button>
          {error ? (
            <div className="flex items-start gap-2 text-text-danger [&_a::after]:!bg-text-danger [&_a]:![text-decoration-color:var(--color-text-danger)] ">
              <div className="grid h-5 flex-shrink-0 place-items-center">
                <ErrorIcon16 />
              </div>
              <Markdown>{`${error.message}`}</Markdown>
            </div>
          ) : null}
        </div>
      </form>
    </Card>
  )
}
