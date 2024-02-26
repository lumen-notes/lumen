import { Dice } from "./dice"

export default {
  title: "Dice",
  component: Dice,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    number: {
      options: [1, 2, 3, 4, 5, 6],
      control: { type: "radio" },
    },
    angle: {
      control: {
        type: "range",
        min: 0,
        max: 360,
      },
    },
  },
}

export const Default = {
  args: {
    number: 3,
    angle: 0,
  },
}
