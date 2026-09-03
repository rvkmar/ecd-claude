import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "../input";
import { Label } from "../label";

const meta: Meta<typeof Input> = {
  title: "Design system/Input",
  component: Input,
  args: { placeholder: "Type here..." },
};
export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};
export const WithLabel: Story = {
  render: (args) => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input {...args} id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};
export const Disabled: Story = { args: { disabled: true, value: "Locked value" } };
