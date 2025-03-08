import { useAtomValue, useSetAtom } from "jotai"
import React from "react"
import { githubRepoAtom, githubUserAtom, globalStateMachineAtom } from "../global-state"
import { GitHubRepository } from "../schema"
import { cx } from "../utils/cx"
import { Button } from "./button"
import { ErrorIcon16, LoadingIcon16 } from "./icons"
import { RadioGroup } from "./radio-group"
import { TextInput } from "./text-input"

type RepoFormProps = {
  className?: string
  onSubmit?: (repo: GitHubRepository) => void
  onCancel?: () => void
}

export function RepoForm({ className, onSubmit, onCancel }: RepoFormProps) {
  const send = useSetAtom(globalStateMachineAtom)
  const githubUser = useAtomValue(githubUserAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const [repoType, setRepoType] = React.useState<"new" | "existing">("existing")
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
        if (response.status === 422) {
          throw new Error("Repository already exists.")
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { message } = (await response.json()) as any

        throw new Error(message || "Failed to create repository. Please try again.")
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
        if (response.status === 404) {
          throw new Error("Repository does not exist or you do not have access.")
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { message } = (await response.json()) as any

        throw new Error(message || "Something went wrong.")
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
    <form
      id="github-form"
      className={cx("flex flex-col gap-6 @container", className)}
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
      <RadioGroup
        value={repoType}
        onValueChange={(value) => {
          setRepoType(value as "new" | "existing")
          setError(null)
        }}
        className="flex flex-col gap-3 coarse:gap-4"
        name="repo-type"
      >
        <div className="flex items-center gap-2">
          <RadioGroup.Item id="repo-existing" value="existing" />
          <label htmlFor="repo-existing" className="select-none leading-4">
            Select an existing repository
          </label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroup.Item id="repo-new" value="new" />
          <label htmlFor="repo-new" className="select-none leading-4">
            Create a new repository
          </label>
        </div>
      </RadioGroup>
      <div className="flex flex-col gap-4 @lg:gap-3">
        <div className="flex flex-col gap-4 @lg:flex-row @lg:gap-3">
          <div className="grid flex-grow gap-2">
            <label htmlFor="repo-owner" className="justify-self-start leading-[1.25]">
              Repository owner
            </label>
            <TextInput
              id="repo-owner"
              name="repo-owner"
              spellCheck={false}
              autoCapitalize="off"
              defaultValue={githubRepo?.owner ?? githubUser?.login}
              required
              invalid={Boolean(error)}
              onChange={() => setError(null)}
            />
          </div>
          <div className="grid flex-grow gap-2">
            <label htmlFor="repo-name" className="justify-self-start leading-[1.25]">
              Repository name
            </label>
            <TextInput
              id="repo-name"
              name="repo-name"
              spellCheck={false}
              autoCapitalize="off"
              defaultValue={githubRepo?.name}
              required
              invalid={Boolean(error)}
              onChange={() => setError(null)}
            />
          </div>
        </div>
        {error ? (
          <div className="flex items-start gap-2 text-text-danger [&_a::after]:!bg-text-danger [&_a]:![text-decoration-color:var(--color-text-danger)]">
            <div className="grid h-5 flex-shrink-0 place-items-center">
              <ErrorIcon16 />
            </div>
            <pre className="whitespace-pre-wrap font-mono text-sm leading-5">{error.message}</pre>
          </div>
        ) : null}
      </div>
      <div className="flex gap-3 @lg:ml-auto">
        {onCancel ? (
          <Button className="w-full" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button
          type="submit"
          className="relative w-full flex-grow"
          variant="primary"
          disabled={isLoading}
        >
          <span className={cx({ invisible: isLoading })}>
            {repoType === "new" ? "Create" : "Select"}
          </span>
          {isLoading ? (
            <span className="absolute inset-0 grid place-items-center">
              <LoadingIcon16 />
            </span>
          ) : null}
        </Button>
      </div>
    </form>
  )
}
