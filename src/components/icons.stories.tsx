import React from "react"
import * as icons from "./icons"
import { StoryObj } from "@storybook/react"
import { cx } from "../utils/cx"

export default {
  title: "Icons",
  parameters: {
    layout: "fullscreen",
  },
}

// Group icons by size
const iconsBySize = Object.entries(icons).reduce(
  (acc, [name, Icon]) => {
    // Get number at end of name
    const size = parseInt(name.match(/\d+$/)?.[0] ?? "0")
    acc[size] = acc[size] ?? []
    acc[size].push([name, Icon])
    return acc
  },
  {} as Record<number, [string, React.ComponentType][]>,
)

export const All = {
  render: (args: { showNames: boolean }) => (
    <div className={cx("flex flex-col gap-8 p-8", !args.showNames && "mx-auto max-w-[700px]")}>
      {Object.entries(iconsBySize).map(([size, icons]) => (
        <div key={size} className="flex flex-col gap-6">
          <h3 className="text-base font-bold">
            {size}&times;{size}
          </h3>
          <div
            className={cx(
              args.showNames
                ? "grid grid-cols-[repeat(auto-fill,_minmax(240px,_1fr))] gap-4"
                : "flex flex-wrap gap-[calc(var(--size)*2)]",
            )}
            style={
              {
                "--size": `${size}px`,
              } as React.CSSProperties
            }
          >
            {icons.map(([name, Icon]) => (
              <div key={name} className="flex items-center gap-4 [&_svg]:text-text-secondary">
                <Icon />
                {args.showNames && <span>{name}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
  args: {
    showNames: false,
  },
}

export const Calendar: StoryObj<{ date: number }> = {
  render: (args) => {
    return <icons.CalendarDateIcon16 date={args.date} />
  },
  args: {
    date: 1,
  },
  argTypes: {
    date: {
      control: { type: "number" },
    },
  },
  parameters: {
    layout: "centered",
  },
}
