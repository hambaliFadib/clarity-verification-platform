import {
  initialComments,
  initialDefects,
  initialNotifications,
  initialProjects,
  initialRequirements,
  initialTestRuns,
  initialWorkItems,
} from "../data/mockData";

export function getInitialDemoState() {
  return {
    comments: initialComments,
    defects: initialDefects,
    notifications: initialNotifications,
    projects: initialProjects,
    requirements: initialRequirements,
    testRuns: initialTestRuns,
    workItems: initialWorkItems,
  };
}

export function createProjectDraft(input, totalProjects) {
  return {
    id: `AWA-PRJ-${String(totalProjects + 13).padStart(3, "0")}`,
    name: input.name || "New Demo Project",
    status: "In Progress",
    progress: Number(input.progress || 0),
    owner: input.owner || "Hambali Fadib",
    ownerInitials: "HF",
    priority: input.priority || "Major",
    sync: "Just now",
  };
}

export function createRequirementDraft(input, totalRequirements) {
  return {
    id: `REQ-${String(totalRequirements + 1).padStart(3, "0")}`,
    title: input.title || "New demo requirement",
    priority: input.priority || "Medium",
    status: input.status || "Draft",
    creator: "Hambali Fadib",
    initials: "HF",
  };
}

export function createTestRunDraft(input) {
  return {
    id: `RUN-${Math.floor(900 + Math.random() * 80)}`,
    name: input.name || "New Test Run",
    date: "Jun 04, 2026",
    time: "11:30",
    environment: input.environment || "Staging",
    tester: "Hambali Fadib",
    status: "Scheduled",
    progress: 0,
    pass: "-",
    fail: "-",
    module: input.module || "All Modules",
  };
}

export function createDefectDraft(input) {
  return {
    id: `DEF-${Math.floor(410 + Math.random() * 40)}`,
    title: input.title || "New reported defect",
    description: input.description || "Demo defect created from UI.",
    severity: input.severity || "High",
    status: "Open",
    group: "Debug Test Run",
    age: "Just now",
    owner: "Hambali Fadib",
  };
}

export function createWorkItemDraft(input, totalWorkItems) {
  return {
    id: `WORK-${String(totalWorkItems + 1).padStart(3, "0")}`,
    title: input.title || "New demo work item",
    type: "Task",
    status: "To Do",
    priority: input.priority || "High",
    progress: 0,
    scope: input.scope || "ENERGY / Migration",
    owner: "Hambali Fadib",
    lane: input.lane || "Not Started",
    days: "10d remaining",
  };
}

export function createCommentDraft(body) {
  return {
    id: Date.now(),
    author: "Hambali Fadib",
    initials: "HF",
    time: "Just now",
    body,
  };
}
