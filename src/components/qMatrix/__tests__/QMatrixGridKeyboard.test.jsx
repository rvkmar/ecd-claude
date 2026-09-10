// D51 — the grid interaction model and its accessibility contract.
//
// The UI change specification names three behaviours in §2.1 ("arrow keys
// move, space toggles, shift-click range-selects") and three requirements
// in §5 that §6 makes a condition of this surface being done at all: the
// grid must be "fully keyboard-operable," must "expose row and column
// headers to assistive technology," and must "announce cell state
// changes." §5 also forbids conveying validity severity by colour alone.
// Each of those is asserted here.
//
// user-event rather than fireEvent for the Space cases specifically:
// jsdom does not implement default keyboard activation, so a synthetic
// keyDown would prove only that the handler ran, not that a checkbox a
// real user pressed Space on actually toggles. user-event drives the real
// key -> activation -> change sequence.

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QMatrixGrid from "../QMatrixGrid";

const attributes = [
  { id: "a1", label: "Fraction Addition" },
  { id: "a2", label: "Common Denominators" },
  { id: "a3", label: "Simplifying" },
];
const items = [{ id: "i1" }, { id: "i2" }, { id: "i3" }];

const cell = (itemId, attrLabel) =>
  screen.getByLabelText(`${itemId} requires ${attrLabel}`);

function setup(props = {}) {
  const onToggleCell = vi.fn();
  const onSetCells = vi.fn();
  const utils = render(
    <QMatrixGrid
      attributes={attributes}
      items={items}
      entries={[]}
      onToggleCell={onToggleCell}
      onSetCells={onSetCells}
      {...props}
    />
  );
  return { onToggleCell, onSetCells, ...utils };
}

describe("roving tabindex — the grid is one tab stop, not one per cell", () => {
  it("makes exactly one cell tabbable", () => {
    setup();
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(items.length * attributes.length);
    expect(boxes.filter((b) => b.tabIndex === 0)).toHaveLength(1);
    expect(boxes[0].tabIndex).toBe(0);
  });

  it("moves the tab stop with the focused cell", async () => {
    setup();
    cell("i1", "Fraction Addition").focus();
    fireEvent.keyDown(document.activeElement, { key: "ArrowRight" });

    expect(cell("i1", "Common Denominators").tabIndex).toBe(0);
    expect(cell("i1", "Fraction Addition").tabIndex).toBe(-1);
  });
});

describe("arrow keys move", () => {
  it("moves right, down, left and up", () => {
    setup();
    cell("i1", "Fraction Addition").focus();

    fireEvent.keyDown(document.activeElement, { key: "ArrowRight" });
    expect(document.activeElement).toBe(cell("i1", "Common Denominators"));

    fireEvent.keyDown(document.activeElement, { key: "ArrowDown" });
    expect(document.activeElement).toBe(cell("i2", "Common Denominators"));

    fireEvent.keyDown(document.activeElement, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(cell("i2", "Fraction Addition"));

    fireEvent.keyDown(document.activeElement, { key: "ArrowUp" });
    expect(document.activeElement).toBe(cell("i1", "Fraction Addition"));
  });

  it("clamps at the edges rather than wrapping or escaping the grid", () => {
    setup();
    cell("i1", "Fraction Addition").focus();

    fireEvent.keyDown(document.activeElement, { key: "ArrowUp" });
    fireEvent.keyDown(document.activeElement, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(cell("i1", "Fraction Addition"));

    cell("i3", "Simplifying").focus();
    fireEvent.keyDown(document.activeElement, { key: "ArrowDown" });
    fireEvent.keyDown(document.activeElement, { key: "ArrowRight" });
    expect(document.activeElement).toBe(cell("i3", "Simplifying"));
  });

  it("keeps a tab stop when the grid shrinks under the focused cell", () => {
    // Dropping an attribute or removing an item while the last cell is
    // focused must not leave the grid with NO tabbable cell, which would
    // strand a keyboard user outside a control they were just using.
    const { rerender } = setup();
    cell("i3", "Simplifying").focus();

    rerender(
      <QMatrixGrid attributes={[attributes[0]]} items={[items[0]]} entries={[]} />
    );

    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(1);
    expect(boxes.filter((b) => b.tabIndex === 0)).toHaveLength(1);
  });
});

describe("space toggles", () => {
  it("toggles the focused cell on Space, via real key activation", async () => {
    const user = userEvent.setup();
    const { onToggleCell } = setup();

    cell("i2", "Common Denominators").focus();
    await user.keyboard(" ");

    expect(onToggleCell).toHaveBeenCalledWith("i2", "a2");
  });

  it("does not intercept plain Space as a range gesture", async () => {
    const user = userEvent.setup();
    const { onSetCells } = setup();

    cell("i1", "Fraction Addition").focus();
    await user.keyboard(" ");

    expect(onSetCells).not.toHaveBeenCalled();
  });
});

describe("shift-click range-selects", () => {
  it("applies the rectangle between the anchor and the shift-clicked cell", () => {
    const { onToggleCell, onSetCells } = setup();

    // A normal toggle sets the anchor.
    fireEvent.click(cell("i1", "Fraction Addition"));
    expect(onToggleCell).toHaveBeenCalledWith("i1", "a1");

    fireEvent.click(cell("i2", "Common Denominators"), { shiftKey: true });

    expect(onSetCells).toHaveBeenCalledTimes(1);
    const [cells, nextChecked] = onSetCells.mock.calls[0];
    expect(nextChecked).toBe(true);
    expect(cells).toEqual(
      expect.arrayContaining([
        { itemId: "i1", attributeId: "a1" },
        { itemId: "i1", attributeId: "a2" },
        { itemId: "i2", attributeId: "a1" },
        { itemId: "i2", attributeId: "a2" },
      ])
    );
    expect(cells).toHaveLength(4);
  });

  it("does not also fire a single toggle for the shift-clicked cell", () => {
    const { onToggleCell, onSetCells } = setup();

    fireEvent.click(cell("i1", "Fraction Addition"));
    onToggleCell.mockClear();

    fireEvent.click(cell("i3", "Simplifying"), { shiftKey: true });

    expect(onSetCells).toHaveBeenCalledTimes(1);
    expect(onToggleCell).not.toHaveBeenCalled();
  });

  it("clears the block when the shift-clicked cell is already checked", () => {
    // The value applied is whatever a plain click on the TARGET would
    // produce, so the outcome is predictable from the cell under cursor.
    const { onSetCells } = setup({
      entries: [{ itemId: "i2", attributeId: "a2" }],
    });

    fireEvent.click(cell("i1", "Fraction Addition"));
    fireEvent.click(cell("i2", "Common Denominators"), { shiftKey: true });

    expect(onSetCells.mock.calls[0][1]).toBe(false);
  });

  it("falls back to a single toggle when there is no anchor yet", () => {
    const { onToggleCell, onSetCells } = setup();

    fireEvent.click(cell("i2", "Common Denominators"), { shiftKey: true });

    expect(onSetCells).not.toHaveBeenCalled();
    expect(onToggleCell).toHaveBeenCalledWith("i2", "a2");
  });

  it("is reachable by keyboard, not mouse only (Shift+Space)", async () => {
    // §5 requires the grid be FULLY keyboard-operable. A range select
    // available only to a mouse would be exactly the defect that rule
    // exists to catch.
    const user = userEvent.setup();
    const { onSetCells } = setup();

    cell("i1", "Fraction Addition").focus();
    await user.keyboard(" "); // normal toggle -> anchor
    fireEvent.keyDown(document.activeElement, { key: "ArrowDown" });
    fireEvent.keyDown(document.activeElement, { key: " ", shiftKey: true });

    expect(onSetCells).toHaveBeenCalledTimes(1);
    const [cells, nextChecked] = onSetCells.mock.calls[0];
    expect(nextChecked).toBe(true);
    expect(cells).toEqual([
      { itemId: "i1", attributeId: "a1" },
      { itemId: "i2", attributeId: "a1" },
    ]);
  });
});

describe("headers are exposed to assistive technology", () => {
  it("marks attribute columns as column headers and items as row headers", () => {
    setup();

    const colHeaders = screen.getAllByRole("columnheader");
    attributes.forEach((a) => {
      expect(colHeaders.some((h) => h.textContent.includes(a.label))).toBe(true);
    });
    colHeaders.forEach((h) => expect(h.getAttribute("scope")).toBe("col"));

    const rowHeaders = screen.getAllByRole("rowheader");
    expect(rowHeaders.map((h) => h.textContent.trim().split(" ")[0])).toEqual([
      "i1",
      "i2",
      "i3",
    ]);
    rowHeaders.forEach((h) => expect(h.getAttribute("scope")).toBe("row"));
  });

  it("presents itself as an interactive grid", () => {
    setup();
    expect(screen.getByRole("grid").getAttribute("aria-label")).toMatch(/Q-matrix/i);
  });
});

describe("cell state changes are announced", () => {
  it("announces a toggle in a polite live region", () => {
    setup();
    fireEvent.click(cell("i1", "Fraction Addition"));

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("i1 requires Fraction Addition");
  });

  it("announces the un-checking of a cell distinctly", () => {
    setup({ entries: [{ itemId: "i1", attributeId: "a1" }] });
    fireEvent.click(cell("i1", "Fraction Addition"));

    expect(screen.getByRole("status")).toHaveTextContent(
      "i1 no longer requires Fraction Addition"
    );
  });

  it("announces how much a range gesture changed", () => {
    setup();
    fireEvent.click(cell("i1", "Fraction Addition"));
    fireEvent.click(cell("i2", "Common Denominators"), { shiftKey: true });

    expect(screen.getByRole("status")).toHaveTextContent("4 cells checked");
  });
});

describe("severity is never conveyed by colour alone", () => {
  // Rows are addressed positionally rather than by text: once a row
  // carries screen-reader-only text, matching it by its item id alone
  // becomes brittle in exactly the case these tests care about.
  const bodyRow = (n) => screen.getAllByRole("row")[n + 1]; // 0 is the header

  it("gives an all-zero row a readable count, not just a red background", () => {
    setup({ rowErrors: [{ code: "empty-row", itemId: "i2" }] });

    const row = bodyRow(1);
    // The colour is still there...
    expect(row.className).toMatch(/bg-red-50/);
    // ...but it is not the only signal: a literal 0, and text a screen
    // reader reaches through the row header.
    expect(within(row).getByText("0")).toBeInTheDocument();
    expect(within(row).getByText(/requires no attributes/i)).toBeInTheDocument();
  });

  it("counts the attributes each row actually requires", () => {
    setup({
      entries: [
        { itemId: "i1", attributeId: "a1" },
        { itemId: "i1", attributeId: "a3" },
      ],
    });

    expect(within(bodyRow(0)).getByText("2")).toBeInTheDocument();
  });

  it("marks an advisory column with more than amber", () => {
    setup({ columnAdvisories: [{ code: "low-coverage", attributeId: "a2" }] });

    const header = screen
      .getAllByRole("columnheader")
      .find((h) => h.textContent.includes("Common Denominators"));

    expect(header.className).toMatch(/amber/);
    expect(header.textContent).toContain("ⓘ");
    expect(within(header).getByText(/advisory/i)).toBeInTheDocument();
  });
});
