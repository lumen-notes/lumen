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
        "flex rotate-[var(--angle)] rounded-[2px] bg-bg text-text transition-[transform,box-shadow] duration-200 will-change-transform [box-shadow:var(--shadow-large)_rgb(0,0,0,0.1),var(--shadow-small)_rgb(0,0,0,0.1),0_0_0_1px_var(--color-border-secondary)] motion-reduce:transition-none dark:bg-text-secondary dark:text-bg-inset dark:[box-shadow:inset_calc(var(--x-amount)*1px)_calc(var(--y-amount)*1px)_0_var(--color-border),var(--shadow-large)_rgb(0,0,0,0.2),var(--shadow-small)_rgb(0,0,0,0.2)]",
        className,
      )}
    >
      <svg
        viewBox="0 0 16 16"
        width="16"
        height="16"
        fill="currentColor"
        // className="dark:[filter:drop-shadow(calc(var(--x-amount)*1px)_calc(var(--y-amount)*1px)_0_var(--color-border))]"
      >
        {number === 1 && <rect x="7" y="7" width="2" height="2" />}
        {number === 2 && (
          <>
            <rect x="4" y="4" width="2" height="2" />
            <rect x="10" y="10" width="2" height="2" />
          </>
        )}
        {number === 3 && (
          <>
            <rect x="4" y="4" width="2" height="2" />
            <rect x="7" y="7" width="2" height="2" />
            <rect x="10" y="10" width="2" height="2" />
          </>
        )}
        {number === 4 && (
          <>
            <rect x="4" y="4" width="2" height="2" />
            <rect x="4" y="10" width="2" height="2" />
            <rect x="10" y="4" width="2" height="2" />
            <rect x="10" y="10" width="2" height="2" />
          </>
        )}
        {number === 5 && (
          <>
            <rect x="4" y="4" width="2" height="2" />
            <rect x="4" y="10" width="2" height="2" />
            <rect x="7" y="7" width="2" height="2" />
            <rect x="10" y="4" width="2" height="2" />
            <rect x="10" y="10" width="2" height="2" />
          </>
        )}
        {number === 6 && (
          <>
            <rect x="4" y="4" width="2" height="2" />
            <rect x="4" y="7" width="2" height="2" />
            <rect x="4" y="10" width="2" height="2" />
            <rect x="10" y="4" width="2" height="2" />
            <rect x="10" y="7" width="2" height="2" />
            <rect x="10" y="10" width="2" height="2" />
          </>
        )}
      </svg>
    </div>
  )
}
