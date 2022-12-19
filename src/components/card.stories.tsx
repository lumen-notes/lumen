import { Card, CardProps } from "./card"

export default {
  title: "Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  render: (args: CardProps) => <Card className="h-24 w-48" {...args} />,
}

export const Elevation0 = {
  args: {
    elevation: 0,
  },
}

export const Elevation1 = {
  args: {
    elevation: 1,
  },
}

export const Elevation2 = {
  args: {
    elevation: 2,
  },
}
