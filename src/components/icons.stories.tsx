import React from "react"
import * as icons from "./icons"
import { StoryObj } from "@storybook/react"

export default {
  title: "Icons",
  parameters: {
    layout: "fullscreen",
  },
}

// Group icons by size
const iconsBySize = Object.entries(icons).reduce((acc, [name, Icon]) => {
  // Get number at end of name
  const size = parseInt(name.match(/\d+$/)?.[0] ?? "0")
  acc[size] = acc[size] ?? []
  acc[size].push([name, Icon])
  return acc
}, {} as Record<number, [string, React.ComponentType][]>)

export const All = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      {Object.entries(iconsBySize).map(([size, icons]) => (
        <div key={size} className="flex flex-col gap-4">
          <h3 className="text-base font-semibold">
            {size}&times;{size}
          </h3>
          <div className="grid grid-cols-[repeat(auto-fill,_minmax(200px,_1fr))] gap-4">
            {icons.map(([name, Icon]) => (
              <div key={name} className="flex items-center gap-4">
                <Icon />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
}

export const Calendar: StoryObj<{ size: "16" | "24"; number: number }> = {
  render: (args) => {
    switch (args.size) {
      case "16":
        return <icons.CalendarIcon16 number={args.number} />
      case "24":
        return <icons.CalendarIcon24 number={args.number} />
    }
  },
  args: {
    size: "16",
    number: 1,
  },
  argTypes: {
    size: {
      options: ["16", "24"],
      control: { type: "radio" },
    },
    number: {
      control: { type: "number" },
    },
  },
  parameters: {
    layout: "centered",
  },
}
