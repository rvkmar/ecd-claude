// src/config/rolePermissions.js
// Role-based visibility and access control for ECD Assessment App

export const rolePermissions = {
  admin: {
    label: "System Admin",
    canView: [
      "questions",
      // `items` was absent from every role, so can(role, *, "items")
      // denied for everyone -- the Item Bank had no declared permissions
      // at all while its API accepted any authenticated caller, including
      // a student. The two are aligned now: authoring is admin/district,
      // matching the item routes' authorizeRole.
      "items",
      "competencyModels",
      "evidenceModels",
      "taskModels",
      "tasks",
      "sessions",
      "policies",
      "curricularPolicies",
      "reports",
      "students",
      "teachers",
      "users"
    ],
    canEdit: [
      "questions",
      "competencyModels",
      "evidenceModels",
      "taskModels",
      "items",
      "tasks",
      "policies",
      "curricularPolicies",
      "users"
    ],
    canApprove: ["questions", "items"], // promote from review → confirmed
    canDelete: [
      "questions",
      "competencyModels",
      "evidenceModels",
      "taskModels",
      "items",
      "tasks",
      "policies",
      "curricularPolicies",
      "users",
      "students"
    ],
    // "students" was declared in canView but never in canCreate/canDelete
    // on any role, while studentsRoutes.js accepted any authenticated
    // caller -- the RBAC sweep found this the same way it found items/
    // student being absent before. Admin-only until a real enrollment
    // workflow exists for district/teacher.
    canCreate: ["students"],
  },

  district: {
    label: "District User",
    canView: [
      "questions",
      "items",
      "competencyModels",
      "evidenceModels",
      "taskModels",
      "tasks",
      "sessions",
      "reports"
    ],
    canEdit: [
      "tasks",              // can create local tasks
      "taskModels",         // can clone and modify published task models
      "items"               // authors and governs bank items
    ],
    canApprove: ["questions", "items"],
    canDelete: ["tasks"],      // local tasks only
    restrictions: {
      viewScope: "district",   // limits view to district data
      editableModels: "cloned", // can only edit cloned models
    },
  },

  teacher: {
    label: "Teacher",
    canView: [
      "items",
      "competencyModels",
      "evidenceModels",
      "taskModels",
      "tasks",
      "sessions",
      "reports"
    ],
    canEdit: [
      "tasks",
      "sessions"
    ],
    canCreate: [
      "tasks",
      "sessions"
    ],
    canDelete: [],
    restrictions: {
      viewScope: "school",
      modelAccess: "read-only",
      questionAccess: "active-only",
    },
  },

  // Previously missing entirely, which meant can(role, ...) fell through to
  // its `if (!r) return false` branch for every student — silently denying
  // every permission check by omission rather than by design. Students only
  // need to see their own sessions/reports; they don't author content.
  student: {
    label: "Student",
    canView: ["sessions", "reports"],
    canEdit: [],
    canCreate: [],
    canDelete: [],
    canApprove: [],
    restrictions: {
      viewScope: "self",
    },
  },
};

// Helper to check if a role can perform an action
export function can(role, action, entity) {
  const r = rolePermissions[role];
  if (!r) return false;
  switch (action) {
    case "view": return r.canView?.includes(entity);
    case "edit": return r.canEdit?.includes(entity);
    case "delete": return r.canDelete?.includes(entity);
    case "approve": return r.canApprove?.includes(entity);
    case "create": return r.canCreate?.includes(entity);
    default: return false;
  }
}
