export function Keys({ keys }: { keys: string[] }) {
  return (
    <div className="-m-1 flex items-center gap-[0.125rem]">
      {keys.map((key) => (
        <kbd
          key={key}
          className="min-w-[1.375rem] rounded bg-bg-hover p-1 text-center font-body leading-none text-text-muted shadow-[inset_0_-0.0625rem_0_var(--color-border-divider)]"
        >
          {key}
        </kbd>
      ))}
    </div>
  )
}
