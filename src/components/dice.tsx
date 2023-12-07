export function Dice({ number, angle = 0 }: { number: number; angle?: number }) {
  return (
    <div
      style={{
        // @ts-ignore
        "--angle": `${angle}deg`,
        "--x-amount": `sin(var(--angle))`,
        "--y-amount": `cos(var(--angle))`,
      }}
      className="flex rotate-[var(--angle)] rounded-[2px] bg-bg text-text shadow-[calc(var(--x-amount)*4px)_calc(var(--y-amount)*4px)_6px_-1px_rgb(0,0,0,0.1),calc(var(--x-amount)*2px)_calc(var(--y-amount)*2px)_4px_-2px_rgb(0,0,0,0.1)] ring-1 ring-border-secondary transition-[transform,box-shadow] will-change-transform duration-300 motion-reduce:transition-none dark:bg-text-secondary dark:text-bg-inset dark:ring-0 dark:[box-shadow:inset_calc(var(--x-amount)*1px)_calc(var(--y-amount)*1px)_0_var(--color-border),calc(var(--x-amount)*4px)_calc(var(--y-amount)*4px)_6px_-1px_rgb(0,0,0,0.2),calc(var(--x-amount)*2px)_calc(var(--y-amount)*2px)_4px_-2px_rgb(0,0,0,0.2)]"
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
