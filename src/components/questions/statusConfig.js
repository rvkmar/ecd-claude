// Single source of truth for question lifecycle UI

export const STATUSES = ["new", "review", "active", "retired"];

export const STATUS_CONFIG = {
  new: {
    label: "New",
    color: "#3B82F6",
  },
  review: {
    label: "Review",
    color: "#F59E0B",
  },
  active: {
    label: "Active",
    color: "#22C55E",
  },
  retired: {
    label: "Retired",
    color: "#9CA3AF",
  },
};

/**
 * Derive counts by status from a question array
 */
export function getCountByStatus(questions = []) {
  return STATUSES.map((status) => ({
    name: status,
    count: questions.filter((q) => q.status === status).length,
  }));
}
