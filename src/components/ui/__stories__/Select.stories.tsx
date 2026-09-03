import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";

const meta: Meta<typeof Select> = {
  title: "Design system/Select",
};
export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <Select defaultValue="irt">
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Choose a statistical model" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="irt">IRT / Rasch</SelectItem>
        <SelectItem value="ctt">CTT / Sum</SelectItem>
        <SelectItem value="dina">DINA</SelectItem>
        <SelectItem value="gdina">G-DINA</SelectItem>
      </SelectContent>
    </Select>
  ),
};
