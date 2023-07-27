import { useAtomValue } from "jotai"
import { CommandMenu } from "../components/command-menu"
import { SignedInUser } from "../components/github-auth"
import { SettingsIcon24 } from "../components/icons"
import { Panel } from "../components/panel"
import { RepoForm } from "../components/repo-form"
import { githubUserAtom } from "../global-atoms"

export function SettingsPage() {
  const githubUser = useAtomValue(githubUserAtom)
  return (
    <>
      <CommandMenu />
      <Panel icon={<SettingsIcon24 />} title="Settings">
        <div className="grid gap-4 p-4">
          <h3 className="text-xl font-semibold leading-4">GitHub</h3>
          <SignedInUser />
          {githubUser ? <RepoForm /> : null}
        </div>
      </Panel>
    </>
  )
}
