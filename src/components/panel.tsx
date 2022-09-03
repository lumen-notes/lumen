import clsx from "clsx"
import { useInView } from "react-intersection-observer"

type PanelProps = {
  title: string
  description?: string
  icon?: React.ReactNode
  children?: React.ReactNode
}

export function Panel({ title, description, icon, children }: PanelProps) {
  const [topRef, topInView] = useInView()
  return (
    <div className="flex h-full w-screen max-w-lg flex-shrink-0 flex-col overflow-auto border-r border-border-divider">
      <div ref={topRef} />
      <div
        className={clsx(
          "sticky top-0 z-10 flex h-[56px] shrink-0 items-center justify-between border-b p-4",
          topInView ? "border-transparent" : "border-border-divider bg-bg-inset",
        )}
      >
        <div className="flex gap-2">
          {icon}
          <div className="flex items-baseline gap-1">
            <h2 className="text-lg font-semibold leading-[24px]">{title}</h2>
            {description ? (
              <>
                <span className="text-text-muted" aria-hidden>
                  ·
                </span>
                <span className="text-text-muted">{description}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
