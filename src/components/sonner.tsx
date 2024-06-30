import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-bg group-[.toaster]:text-text group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg group-[.toaster]:ring-1 group-[.toaster]:ring-border-secondary group-[.toaster]:dark:ring-inset",
          description: "group-[.toast]:text-secondary",
          actionButton: "group-[.toast]:bg-highlight group-[.toast]:text-highlight",
          cancelButton: "group-[.toast]:bg-backdrop group-[.toast]:text-danger",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
