import { useAtom } from "jotai"
import { githubRepoAtom } from "../global-atoms"
import { useFetchNotes } from "../utils/github-sync"
import { Input } from "./input"
import { Button } from "./button"

export function RepositoryPicker() {
  const [githubRepo, setGitHubRepo] = useAtom(githubRepoAtom)
  const { fetchNotes } = useFetchNotes()

  return (
    <form
      id="github-form"
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const repoOwner = String(formData.get("repo-owner"))
        const repoName = String(formData.get("repo-name"))

        setGitHubRepo({ owner: repoOwner, name: repoName })

        fetchNotes()
      }}
    >
      <div className="grid gap-2">
        <label htmlFor="repo-owner" className="leading-4">
          Repository owner
        </label>
        <Input
          id="repo-owner"
          name="repo-owner"
          spellCheck={false}
          defaultValue={githubRepo?.owner}
          required
        />
      </div>
      <div className="grid gap-2">
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
      <Button type="submit" variant="primary" className="mt-2">
        Save
      </Button>
    </form>
  )
}
