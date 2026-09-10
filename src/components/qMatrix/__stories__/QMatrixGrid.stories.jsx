import { useState } from "react";
import QMatrixGrid from "../QMatrixGrid";

const meta = {
  title: "Q-Matrix/QMatrixGrid",
  component: QMatrixGrid,
};
export default meta;

const attributes = [
  { id: "a1", label: "Fraction Addition" },
  { id: "a2", label: "Common Denominators" },
  { id: "a3", label: "Simplification" },
];

const items = [
  { id: "item-101", metadata: { subject: "Math" } },
  { id: "item-102", metadata: { subject: "Math" } },
  { id: "item-103", metadata: { subject: "Math" } },
];

export const Default = {
  render: () => {
    const [entries, setEntries] = useState([
      { itemId: "item-101", attributeId: "a1" },
      { itemId: "item-102", attributeId: "a1" },
      { itemId: "item-102", attributeId: "a2" },
    ]);

    const onToggleCell = (itemId, attributeId) => {
      setEntries((prev) => {
        const exists = prev.some((e) => e.itemId === itemId && e.attributeId === attributeId);
        return exists
          ? prev.filter((e) => !(e.itemId === itemId && e.attributeId === attributeId))
          : [...prev, { itemId, attributeId }];
      });
    };

    // Without this the grid renders but shift-click and Shift+Space do
    // nothing, so the interaction model would be unreviewable in the one
    // place a designer would actually try it.
    const onSetCells = (cells, nextChecked) => {
      setEntries((prev) => {
        const inRange = new Set(cells.map((c) => `${c.itemId}::${c.attributeId}`));
        const kept = prev.filter((e) => !inRange.has(`${e.itemId}::${e.attributeId}`));
        return nextChecked ? [...kept, ...cells] : kept;
      });
    };

    return (
      <QMatrixGrid
        attributes={attributes}
        items={items}
        entries={entries}
        onToggleCell={onToggleCell}
        onSetCells={onSetCells}
        onRemoveItem={() => {}}
      />
    );
  },
};

export const WithValidityIssues = {
  render: () => (
    <QMatrixGrid
      attributes={attributes}
      items={items}
      entries={[{ itemId: "item-101", attributeId: "a1" }]}
      rowErrors={[{ code: "empty-row", itemId: "item-102" }, { code: "empty-row", itemId: "item-103" }]}
      columnAdvisories={[{ code: "identifiability", attributeId: "a3" }]}
    />
  ),
};

export const ReadOnly = {
  render: () => (
    <QMatrixGrid
      attributes={attributes}
      items={items}
      entries={[
        { itemId: "item-101", attributeId: "a1" },
        { itemId: "item-102", attributeId: "a2" },
      ]}
      readOnly
    />
  ),
};

export const Empty = {
  render: () => <QMatrixGrid attributes={attributes} items={[]} entries={[]} />,
};
