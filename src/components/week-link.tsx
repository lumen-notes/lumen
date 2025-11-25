import * as HoverCard from "@radix-ui/react-hover-card"
import { Link } from "@tanstack/react-router"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React, { useMemo } from "react"
import { notesAtom } from "../global-state"
import { formatWeek, formatWeekDistance } from "../utils/date"

export type WeekLinkProps = {
  week: string
  text?: string
  className?: string
}

export function WeekLink({ week, text, className }: WeekLinkProps) {
  const hasWeekNote = useAtomValue(
    useMemo(() => selectAtom(notesAtom, (notes) => notes.has(week)), [week]),
  )

  return (
    <HoverCard.Root>
      <HoverCard.Trigger asChild>
        <Link
          className={className}
          to="/notes/$"
          params={{ _splat: week }}
          search={{
            mode: hasWeekNote ? "read" : "write",
            query: undefined,
            view: "grid",
          }}
        >
          {text || formatWeek(week)}
        </Link>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="bottom"
          sideOffset={4}
          align="center"
          className="card-2 z-20 animate-in fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 print:hidden"
        >
          <div className="p-2 leading-none text-text-secondary">{formatWeekDistance(week)}</div>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}
