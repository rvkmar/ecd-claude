import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs";

const meta: Meta<typeof Tabs> = {
  title: "Design system/Tabs",
};
export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="claims" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="claims">Claims</TabsTrigger>
        <TabsTrigger value="observables">Observables</TabsTrigger>
        <TabsTrigger value="statistical">Statistical Model</TabsTrigger>
      </TabsList>
      <TabsContent value="claims" className="p-4 text-sm">
        Claim articulation and warrants for this Evidence Model.
      </TabsContent>
      <TabsContent value="observables" className="p-4 text-sm">
        Observable variables and evidence rules.
      </TabsContent>
      <TabsContent value="statistical" className="p-4 text-sm">
        The active statistical model and its parameter sets.
      </TabsContent>
    </Tabs>
  ),
};
