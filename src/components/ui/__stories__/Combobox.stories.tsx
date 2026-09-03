import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Combobox } from "../combobox";

const meta: Meta<typeof Combobox> = {
  title: "Design system/Combobox",
  component: Combobox,
};
export default meta;
type Story = StoryObj<typeof Combobox>;

const options = [
  { value: "irt", label: "IRT / Rasch" },
  { value: "ctt", label: "CTT / Sum" },
  { value: "dina", label: "DINA" },
  { value: "gdina", label: "G-DINA" },
];

export const Default: Story = {
  render: () => {
    function ControlledCombobox() {
      const [value, setValue] = useState("");
      return (
        <div className="w-[260px]">
          <Combobox
            options={options}
            value={value}
            onValueChange={setValue}
            placeholder="Select a model..."
          />
        </div>
      );
    }
    return <ControlledCombobox />;
  },
};

export const Disabled: Story = {
  args: { options, disabled: true, placeholder: "Not available" },
};
