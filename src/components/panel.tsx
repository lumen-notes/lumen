import clsx from "clsx"
import { useInView } from "react-intersection-observer"
import { IconButton } from "./button"
import { CloseIcon16 } from "./icons"

type PanelProps = {
  id?: string
  title: string
  description?: string
  icon?: React.ReactNode
  children?: React.ReactNode
  onClose?: () => void
}

export function Panel({ id, title, description, icon, children, onClose }: PanelProps) {
  const [topRef, topInView] = useInView()
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      data-panel // Data attribute used to manage focus
      id={id}
      className="flex h-full w-[80vw] max-w-lg flex-shrink-0 flex-col overflow-auto border-r border-border-divider"
      onKeyDown={(event) => {
        // Close with `command + x` if no text is selected
        if (event.metaKey && event.key === "x" && !window.getSelection()?.toString()) {
          onClose?.()
          event.preventDefault()
        }
      }}
    >
      <div ref={topRef} />
      <div
        className={clsx(
          "sticky top-0 z-10 flex h-[56px] shrink-0 items-center justify-between gap-2 border-b p-4",
          topInView ? "border-transparent" : "border-border-divider bg-bg-inset",
        )}
      >
        <div className="flex flex-shrink gap-2">
          <div className="flex-shrink-0">{icon}</div>
          <div className="flex items-baseline gap-3">
            <h2 className="flex-shrink-0 text-lg font-semibold leading-[24px]">{title}</h2>
            {description ? <span className="truncate text-text-muted">{description}</span> : null}
          </div>
        </div>
        {onClose ? (
          <IconButton aria-label="Close panel" onClick={() => onClose()}>
            <CloseIcon16 />
          </IconButton>
        ) : null}
      </div>
      {children}
    </div>
  )
}
