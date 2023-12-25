import { useAtomValue, useSetAtom } from "jotai"
import React from "react"
import { githubRepoAtom, githubUserAtom, globalStateMachineAtom } from "../global-state"
import { GitHubRepository } from "../schema"
import { Button } from "./button"
import { Card } from "./card"
import { ErrorIcon16, LoadingIcon16 } from "./icons"
import { Input } from "./input"
import { Markdown } from "./markdown"

type RepoFormProps = {
  onSubmit?: (repo: GitHubRepository) => void
  onCancel?: () => void
}

export function RepoForm({ onSubmit, onCancel }: RepoFormProps) {
  const send = useSetAtom(globalStateMachineAtom)
  const githubUser = useAtomValue(githubUserAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const [repoType, setRepoType] = React.useState<"new" | "existing">(
    githubRepo ? "existing" : "new",
  )
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  async function createRepo({ owner, name }: GitHubRepository) {
    if (!githubUser) return

    try {
      setIsLoading(true)

      // Create repo from template
      const response = await fetch(
        `https://api.github.com/repos/lumen-notes/notes-template/generate`,
        {
          method: "POST",
          headers: {
            Authorization: `token ${githubUser.token}`,
          },
          body: JSON.stringify({
            owner,
            name,
            private: true,
          }),
        },
      )

      if (!response.ok) {
        console.error(await response.json())

        if (response.status === 422) {
          throw new Error("Repository already exists.")
        }

        throw new Error("Failed to create repository. Please try again.")
      }

      // 1 second delay to allow GitHub API to catch up
      await new Promise((resolve) => setTimeout(resolve, 1000))

      send({ type: "SELECT_REPO", githubRepo: { owner, name } })
      onSubmit?.({ owner, name })
      setError(null)
    } catch (error) {
      setError(error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  async function selectExistingRepo({ owner, name }: GitHubRepository) {
    if (!githubUser) return

    try {
      setIsLoading(true)

      // Ensure repo exists
      const response = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
        headers: { Authorization: `token ${githubUser.token}` },
      })

      if (!response.ok) {
        throw new Error("Repository does not exist.")
      }

      send({ type: "SELECT_REPO", githubRepo: { owner, name } })
      onSubmit?.({ owner, name })
      setError(null)
    } catch (error) {
      setError(error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-4">
      <form
        id="github-form"
        className="flex flex-col gap-6 @container"
        onSubmit={async (event) => {
          event.preventDefault()

          const formData = new FormData(event.currentTarget)
          const repoType = String(formData.get("repo-type"))
          const owner = String(formData.get("repo-owner")).trim()
          const name = String(formData.get("repo-name")).trim()

          if (repoType === "new") {
            await createRepo({ owner, name })
          } else {
            await selectExistingRepo({ owner, name })
          }
        }}
      >
        <div className="flex flex-col gap-3 coarse:gap-4">
          <div className="flex items-center gap-2">
            {/* TODO: Style radio buttons */}
            <input
              type="radio"
              id="repo-new"
              name="repo-type"
              value="new"
              defaultChecked={repoType === "new"}
              onChange={(event) => {
                if (event.target.checked) setRepoType("new")
              }}
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
              defaultChecked={repoType === "existing"}
              onChange={(event) => {
                if (event.target.checked) setRepoType("existing")
              }}
            />
            <label htmlFor="repo-existing" className="leading-4">
              Select an existing repository
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid flex-grow gap-2">
            <label htmlFor="repo-owner" className="leading-4">
              Repository owner
            </label>
            <Input
              id="repo-owner"
              name="repo-owner"
              spellCheck={false}
              defaultValue={githubRepo?.owner ?? githubUser?.login}
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
          <div className="flex gap-2">
            {onCancel ? (
              <Button className="w-full" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
            <Button
              type="submit"
              className="w-full flex-grow"
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? <LoadingIcon16 /> : repoType === "new" ? "Create" : "Select"}
            </Button>
          </div>
          {error ? (
            <div className="flex items-start gap-2 text-text-danger [&_a::after]:!bg-text-danger [&_a]:![text-decoration-color:var(--color-text-danger)] ">
              <div className="grid h-6 flex-shrink-0 place-items-center">
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
