import { toast as sonnerToast } from "sonner"

export function Toast({ children }: { children: React.ReactNode }) {
  return <div className="card-3 !rounded-xl px-4 py-2">{children}</div>
}

export function toast(message: React.ReactNode) {
  return sonnerToast.custom(() => <Toast>{message}</Toast>)
}
