import { Card } from "./card"

export default {
  title: "Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
}

export const Default = {
  render: () => (
    <Card elevation={1} className="p-8">
      <Card elevation={2} className="p-8">
        <Card elevation={3} className="h-24 w-48" />
      </Card>
    </Card>
  ),
}
