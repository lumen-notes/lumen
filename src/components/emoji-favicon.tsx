export function EmojiFavicon({ emoji }: { emoji: string }) {
  return (
    <svg className="size-icon overflow-visible" viewBox="0 0 16 16">
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize="15px">
        {emoji}
      </text>
    </svg>
  )
}
