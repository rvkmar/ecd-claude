// src/components/ui/__tests__/dialogAndCombobox.test.jsx
//
// Day 42 (Week 9): smoke tests for the two shared primitives Part 5.4
// named that had no implementation anywhere in the repo -- Dialog and
// Combobox (composed from the new Popover + Command primitives, matching
// shadcn's own documented pattern since there is no standalone "combobox"
// registry entry). None of the seven pre-existing shadcn primitives
// (Button, Input, Select, Tabs, Table, Badge, Card) carry component-level
// tests either -- this repo's convention tests behaviour, not markup --
// so these are deliberately minimal: do they mount, respond to the open
// trigger, and (for Combobox) report a selection back to the caller.
// Not a claim of full accessibility coverage; Radix's own test suite
// covers focus-trap/keyboard semantics, which this repo inherits for free
// by using the primitives rather than reimplementing them.

import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../dialog.tsx";
import { Combobox } from "../combobox.tsx";

describe("Dialog", () => {
  it("is closed by default and opens on trigger click, rendering its title", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm action</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    expect(screen.queryByText("Confirm action")).not.toBeInTheDocument();

    await user.click(screen.getByText("Open"));

    expect(await screen.findByText("Confirm action")).toBeInTheDocument();
  });

  it("closes when the built-in close button is activated", async () => {
    const user = userEvent.setup();
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm action</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    expect(await screen.findByText("Confirm action")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(screen.queryByText("Confirm action")).not.toBeInTheDocument();
  });
});

describe("Combobox", () => {
  const options = [
    { value: "irt", label: "IRT / Rasch" },
    { value: "dina", label: "DINA" },
    { value: "gdina", label: "G-DINA" },
  ];

  it("shows the placeholder when nothing is selected, and the selected label once a value is set", () => {
    const { rerender } = render(
      <Combobox options={options} placeholder="Select a model..." />
    );
    expect(screen.getByText("Select a model...")).toBeInTheDocument();

    rerender(<Combobox options={options} value="dina" placeholder="Select a model..." />);
    expect(screen.getByText("DINA")).toBeInTheDocument();
  });

  it("opens the option list on trigger click and reports the chosen value via onValueChange", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Combobox options={options} onValueChange={onValueChange} placeholder="Select a model..." />
    );

    await user.click(screen.getByRole("combobox"));

    const option = await screen.findByText("G-DINA");
    await user.click(option);

    expect(onValueChange).toHaveBeenCalledWith("gdina");
  });
});
