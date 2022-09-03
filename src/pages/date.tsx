import { useParams } from "react-router-dom"
import { Panels } from "../components/panels"
import { DatePanel } from "../panels/date"

export function DatePage() {
  const params = useParams()
  return (
    <Panels>
      <DatePanel params={params} />
      <Panels.Outlet />
    </Panels>
  )
}
