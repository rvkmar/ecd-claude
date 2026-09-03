import type { Meta, StoryObj } from "@storybook/react-vite";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "../button";

// Day 43: there is no "Toast" component to gallery -- the app's real
// toast system is react-hot-toast's <Toaster/>, mounted once globally in
// App.jsx (see its Day 43 comment for the accessibility fix this demo
// exercises: success toasts announce politely, error toasts announce
// assertively and stay up twice as long). This story mounts the same
// per-type toastOptions locally so the gallery shows the actual configured
// behaviour, not a bare default Toaster.
const meta: Meta = {
  title: "Design system/Toast",
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <div className="flex gap-2">
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          success: { ariaProps: { role: "status", "aria-live": "polite" } },
          error: {
            ariaProps: { role: "alert", "aria-live": "assertive" },
            duration: 6000,
          },
        }}
      />
      <Button onClick={() => toast.success("Model confirmed and locked.")}>
        Fire success toast
      </Button>
      <Button
        variant="destructive"
        onClick={() => toast.error("Confirmation failed: 2 unresolved warnings.")}
      >
        Fire error toast
      </Button>
    </div>
  ),
};
