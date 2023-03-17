import { Button } from "../components/button"
import { Card } from "../components/card"
import { CommandMenu } from "../components/command-menu"
import { SettingsIcon24 } from "../components/icons"
import { Input } from "../components/input"
import { Panel } from "../components/panel"
import { GlobalStateContext } from "../global-state.machine"

export function SettingsPage() {
  const [state, send] = GlobalStateContext.useActor()
  return (
    <>
      <CommandMenu />
      <Panel icon={<SettingsIcon24 />} title="Settings">
        <div className="p-4">
          <Card className="grid gap-5 p-4">
            <div className="grid gap-2">
              <h3 className="text-lg font-bold !leading-none">GitHub</h3>
              <p>Store your notes as Markdown files in a GitHub repository of your choice.</p>
            </div>
            <form
              id="github-form"
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                const formData = new FormData(event.currentTarget)
                const authToken = String(formData.get("auth-token"))
                const repoOwner = String(formData.get("repo-owner"))
                const repoName = String(formData.get("repo-name"))
                send({ type: "SET_CONTEXT", data: { authToken, repoOwner, repoName } })
              }}
            >
              <div className="grid gap-2">
                <label htmlFor="auth-token" className="leading-4">
                  Personal access token
                </label>
                <Input
                  id="auth-token"
                  name="auth-token"
                  spellCheck={false}
                  defaultValue={state.context.authToken}
                />
                <p className="markdown text-text-secondary">
                  Generate a{" "}
                  <a
                    href="https://github.com/settings/tokens/new"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    personal access token
                  </a>{" "}
                  with <code>repo</code> access, then paste it here.
                </p>
              </div>
              <div className="grid gap-2">
                <label htmlFor="repo-owner" className="leading-4">
                  Repository owner
                </label>
                <Input
                  id="repo-owner"
                  name="repo-owner"
                  spellCheck={false}
                  defaultValue={state.context.repoOwner}
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
                  defaultValue={state.context.repoName}
                />
              </div>
            </form>
            <Button form="github-form" type="submit" variant="primary" className="mt-2">
              Save
            </Button>
          </Card>
        </div>
      </Panel>
    </>
  )
}
