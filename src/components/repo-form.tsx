import { useAtomValue, useSetAtom } from "jotai"
import React from "react"
import { githubRepoAtom, githubUserAtom, globalStateMachineAtom } from "../global-state"
import { GitHubRepository } from "../schema"
import { cx } from "../utils/cx"
import { Button } from "./button"
import { ErrorIcon16, LoadingIcon16 } from "./icons"
import { RadioGroup } from "./radio-group"
import { TextInput } from "./text-input"
import { FormControl } from "./form-control"

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

  // Check if this is being used to add a new repo vs initial setup
  const isAddingRepo = Boolean(githubRepo)

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

      const eventType = isAddingRepo ? "ADD_REPO" : "SELECT_REPO"
      send({ type: eventType, githubRepo: { owner, name } })
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

      const eventType = isAddingRepo ? "ADD_REPO" : "SELECT_REPO"
      send({ type: eventType, githubRepo: { owner, name } })
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
      <div className="flex flex-col gap-3 @sm:flex-row">
        <FormControl
          id="repo-owner"
          label="Owner"
          className="@sm:flex-1"
          defaultValue={githubUser?.login}
        >
          <TextInput
            id="repo-owner"
            name="repo-owner"
            placeholder="owner"
            defaultValue={githubUser?.login}
            required
          />
        </FormControl>
        <FormControl id="repo-name" label="Repository name" className="@sm:flex-1">
          <TextInput
            id="repo-name"
            name="repo-name"
            placeholder="notes"
            defaultValue={githubRepo?.name}
            required
          />
        </FormControl>
      </div>
      {error ? (
        <div className="flex items-center gap-2 leading-4 text-text-error">
          <ErrorIcon16 />
          {error.message}
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="relative"
        >
          {isLoading ? (
            <span className="absolute inset-0 grid place-items-center">
              <LoadingIcon16 />
            </span>
          ) : null}
          <span className={cx(isLoading && "invisible")}>
            {repoType === "new" ? (isAddingRepo ? "Create & Add" : "Create") : (isAddingRepo ? "Add" : "Select")}
          </span>
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  )
}
