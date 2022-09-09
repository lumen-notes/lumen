import { useParams } from "react-router-dom"
import { CommandMenu } from "../components/command-menu"
import { Panels } from "../components/panels"
import { DatePanel } from "../panels/date"

export function DatePage() {
  const params = useParams()
  return (
    <Panels>
      <CommandMenu />
      <DatePanel params={params} />
      <Panels.Outlet />
    </Panels>
  )
}
