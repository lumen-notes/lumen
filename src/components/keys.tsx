export function Keys({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex gap-0.5">
      {keys.map((key) => (
        <kbd key={key} className="font-body leading-none">
          {key}
        </kbd>
      ))}
    </span>
  )
}
