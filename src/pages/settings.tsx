import { useAtomValue } from "jotai"
import { Card } from "../components/card"
import { CommandMenu } from "../components/command-menu"
import { SignedInUser } from "../components/github-auth"
import { SettingsIcon24 } from "../components/icons"
import { Panel } from "../components/panel"
import { RepositoryPicker } from "../components/repository-picker"
import { githubUserAtom } from "../global-atoms"

export function SettingsPage() {
  const githubUser = useAtomValue(githubUserAtom)
  return (
    <>
      <CommandMenu />
      <Panel icon={<SettingsIcon24 />} title="Settings">
        <div className="p-4">
          <Card className="grid gap-5 p-4">
            <div className="grid gap-2">
              <h3 className="text-xl font-semibold leading-4">GitHub</h3>
              <p>Store your notes as markdown files in a GitHub repository of your choice.</p>
            </div>
            <SignedInUser />
            {githubUser ? <RepositoryPicker /> : null}
          </Card>
        </div>
      </Panel>
    </>
  )
}
