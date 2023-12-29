import { RadioGroup } from "./radio-group"

export default {
  title: "RadioGroup",
  component: RadioGroup,
  parameters: {
    layout: "centered",
  },
}

export const Default = {
  render: () => (
    <RadioGroup defaultValue="new" className="grid gap-3 coarse:gap-4">
      <div className="flex items-center gap-2">
        <RadioGroup.Item id="new" value="new" />
        <label htmlFor="new" className="leading-4">
          Create a new repository
        </label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroup.Item id="existing" value="existing" />
        <label htmlFor="existing" className="leading-4">
          Select an existing repository
        </label>
      </div>
    </RadioGroup>
  ),
}
