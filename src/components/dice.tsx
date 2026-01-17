import { cx } from "../utils/cx"

export function Dice({
  number,
  angle = 0,
  className,
}: {
  number: number
  angle?: number
  className?: string
}) {
  return (
    <div
      style={{
        // @ts-ignore
        "--angle": `${angle}deg`,
        "--x-amount": `sin(var(--angle))`,
        "--y-amount": `cos(var(--angle))`,
        "--shadow-small": "calc(var(--x-amount) * 2px) calc(var(--y-amount) * 2px) 4px -2px",
        "--shadow-large": "calc(var(--x-amount) * 4px) calc(var(--y-amount) * 4px) 6px -1px",
      }}
      className={cx(
        "flex rotate-[var(--angle)] rounded-[2.5px] eink:rounded-none bg-bg text-text transition-[transform,translate,rotate,box-shadow] duration-150 will-change-transform [box-shadow:var(--shadow-large)_rgb(0,0,0,0.1),var(--shadow-small)_rgb(0,0,0,0.1),0_0_0_1px_var(--color-border-secondary)] motion-reduce:transition-none dark:bg-text-secondary dark:text-bg dark:[box-shadow:inset_calc(var(--x-amount)*1px)_calc(var(--y-amount)*1px)_0_var(--color-border),var(--shadow-large)_rgb(0,0,0,0.2),var(--shadow-small)_rgb(0,0,0,0.2)]",
        "eink:ring-1 eink:ring-inset eink:ring-border eink:dark:bg-transparent eink:dark:text-text",
        className,
      )}
    >
      <svg
        viewBox="0 0 16 16"
        fill="currentColor"
        className="size-icon"
        // className="dark:[filter:drop-shadow(calc(var(--x-amount)*1px)_calc(var(--y-amount)*1px)_0_var(--color-border))]"
      >
        {number === 1 && <circle cx="8" cy="8" r="1" />}
        {number === 2 && (
          <>
            <circle cx="4" cy="4" r="1" />
            <circle cx="12" cy="12" r="1" />
          </>
        )}
        {number === 3 && (
          <>
            <circle cx="4" cy="4" r="1" />
            <circle cx="8" cy="8" r="1" />
            <circle cx="12" cy="12" r="1" />
          </>
        )}
        {number === 4 && (
          <>
            <circle cx="4" cy="4" r="1" />
            <circle cx="4" cy="12" r="1" />
            <circle cx="12" cy="4" r="1" />
            <circle cx="12" cy="12" r="1" />
          </>
        )}
        {number === 5 && (
          <>
            <circle cx="4" cy="4" r="1" />
            <circle cx="4" cy="12" r="1" />
            <circle cx="8" cy="8" r="1" />
            <circle cx="12" cy="4" r="1" />
            <circle cx="12" cy="12" r="1" />
          </>
        )}
        {number === 6 && (
          <>
            <circle cx="4" cy="4" r="1" />
            <circle cx="4" cy="8" r="1" />
            <circle cx="4" cy="12" r="1" />
            <circle cx="12" cy="4" r="1" />
            <circle cx="12" cy="8" r="1" />
            <circle cx="12" cy="12" r="1" />
          </>
        )}
      </svg>
    </div>
  )
}
