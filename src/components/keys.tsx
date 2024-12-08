export function Keys({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex gap-px font-normal leading-none tracking-wider">
      {keys.map((key, index) => (
        <span key={index} className={/^[a-zA-Z]$/.test(key) ? "font-mono" : ""}>
          {key}
        </span>
      ))}
    </span>
  )
}
