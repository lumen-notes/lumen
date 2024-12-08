export function Keys({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex gap-px font-normal leading-none tracking-wider">
      {keys.join("")}
    </span>
  )
}
