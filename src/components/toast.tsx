import { toast as sonnerToast } from "sonner"
import { cx } from "../utils/cx"

type ToastProps = {
  icon?: React.ReactNode
  children: React.ReactNode
}

export function Toast({ children, icon }: ToastProps) {
  return (
    <div
      className={cx("card-3 flex items-center gap-3 rounded-xl! px-4 py-3 font-sans sm:max-w-sm")}
    >
      {icon ? <div className="flex text-text-secondary">{icon}</div> : null}
      <span className="text-pretty">{children}</span>
    </div>
  )
}

export function toast({ message, icon }: { message: React.ReactNode; icon?: React.ReactNode }) {
  return sonnerToast.custom(() => <Toast icon={icon}>{message}</Toast>)
}
