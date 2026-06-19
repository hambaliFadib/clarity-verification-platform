import { randomUUID } from "crypto";
import type {
  ActivityItem,
  Defect,
  Environment,
  Project,
  Release,
  Requirement,
  TeamMember,
  TestCase,
  TestRun,
  WorkItem,
  TcModule,
  TcSubModule,
  TcScenario,
} from "@/lib/types";

type GuestMutations = {
  requirements: Record<string, Partial<Requirement>>;
  testCases: Record<string, Partial<TestCase>>;
  defects: Record<string, Partial<Defect>>;
  testRuns: Record<string, Partial<TestRun>>;
  requirementTestCases: Record<string, string[]>;
};

export const globalGuestStore: GuestMutations = {
  requirements: {},
  testCases: {},
  defects: {},
  testRuns: {},
  requirementTestCases: {},
};

export function clearGuestStore() {
  globalGuestStore.requirements = {};
  globalGuestStore.testCases = {};
  globalGuestStore.defects = {};
  globalGuestStore.testRuns = {};
  globalGuestStore.requirementTestCases = {};
}

const now = "2026-06-12T00:00:00.000Z";

const guestUser: TeamMember = {
  id: "guest-user",
  name: "Guest User",
  email: "guest@clarity.local",
  role: "Viewer",
  initials: "GU",
};

export function guestProjects(): Project[] {
  return [{
    id: "guest-project",
    name: "Guest Demo Project",
    prefix: "DEMO",
    description: "Reset-only sandbox project for guest simulation.",
    priority: "Medium",
    createdAt: now,
    updatedAt: now,
    status: "Active",
    quality_score: 85,
    metrics: {
      requirements: 1,
      test_cases: 2,
      defects: 1,
    },
  }];
}

export function guestTeamMembers(): TeamMember[] {
  return [guestUser];
}

export function guestEnvironments(): Environment[] {
  return [
    {
      id: "guest-env-dev",
      name: "Demo Development",
      url: "https://dev.example.test",
      type: "Development",
      status: "Active",
      description: "Guest-only sample environment.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "guest-env-staging",
      name: "Demo Staging",
      url: "https://staging.example.test",
      type: "Staging",
      status: "Active",
      description: "Guest-only staging simulation.",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function guestModules(): TcModule[] {
  return [
    {
      id: "guest-mod-auth",
      name: "Authentication",
      description: "User sign-in and authorization flows.",
      subModuleCount: 1,
      testCaseCount: 1,
    },
    {
      id: "guest-mod-defects",
      name: "Defect Management",
      description: "Bug tracking and management.",
      subModuleCount: 1,
      testCaseCount: 1,
    },
  ];
}

export function guestSubModules(): TcSubModule[] {
  return [
    {
      id: "guest-submod-login",
      name: "Login Flow",
      description: "Username/Password login screens.",
      moduleId: "guest-mod-auth",
      testCaseCount: 1,
    },
    {
      id: "guest-submod-triage",
      name: "Defect Triage",
      description: "Triage workflows and boards.",
      moduleId: "guest-mod-defects",
      testCaseCount: 1,
    },
  ];
}

export function guestScenarios(): TcScenario[] {
  return [
    {
      id: "guest-scen-valid-login",
      name: "Successful Login Scenario",
      description: "Verification of normal login flow.",
      moduleId: "guest-mod-auth",
      moduleName: "Authentication",
      subModuleId: "guest-submod-login",
      subModuleName: "Login Flow",
      testCaseCount: 1,
    },
    {
      id: "guest-scen-defect-creation",
      name: "Defect Creation Scenario",
      description: "Verification of reporting bugs.",
      moduleId: "guest-mod-defects",
      moduleName: "Defect Management",
      subModuleId: "guest-submod-triage",
      subModuleName: "Defect Triage",
      testCaseCount: 1,
    },
  ];
}

export function guestTestCases(): TestCase[] {
  const base = [
    {
      id: "GUEST-TC-001",
      title: "Verify login with valid credentials",
      description: "Guest sample for a successful login flow.",
      moduleId: "guest-mod-auth",
      moduleName: "Authentication",
      subModuleId: "guest-submod-login",
      subModuleName: "Login Flow",
      scenarioId: "guest-scen-valid-login",
      scenarioName: "Successful Login Scenario",
      severity: "Major",
      status: "Ready",
      type: "Functional",
      category: "Positive",
      assignedTo: "Guest User",
      createdBy: "Guest User",
      createdAt: now,
      updatedAt: now,
      estimatedTime: "5 min",
      environment: "Development",
      automationStatus: "Manual",
      preconditions: "User account exists in the demo system.",
      expectedResult: "User lands on the dashboard.",
      steps: [
        { id: "guest-step-1", stepNumber: 1, order: 1, action: "Open the login page", expectedResult: "Login page is displayed", status: "Not Run" },
        { id: "guest-step-2", stepNumber: 2, order: 2, action: "Enter valid credentials", expectedResult: "Credentials are accepted", status: "Not Run" },
      ],
    },
    {
      id: "GUEST-TC-002",
      title: "Create a defect from failed validation",
      description: "Guest sample for defect reporting.",
      moduleId: "guest-mod-defects",
      moduleName: "Defect Management",
      subModuleId: "guest-submod-triage",
      subModuleName: "Defect Triage",
      scenarioId: "guest-scen-defect-creation",
      scenarioName: "Defect Creation Scenario",
      severity: "Critical",
      status: "Draft",
      type: "Regression",
      category: "Positive",
      assignedTo: "Guest User",
      createdBy: "Guest User",
      createdAt: now,
      updatedAt: now,
      estimatedTime: "8 min",
      environment: "Staging",
      automationStatus: "Candidate to Automate",
      expectedResult: "A defect can be reported with linked context.",
      steps: [
        { id: "guest-step-3", stepNumber: 1, order: 1, action: "Open a failed test result", expectedResult: "Failure details are visible", status: "Not Run" },
      ],
    },
  ] as TestCase[];
  
  return base.map(tc => ({
    ...tc,
    ...globalGuestStore.testCases[tc.id],
    ...globalGuestStore.testCases[tc.displayId || tc.id]
  }));
}

export function guestRequirements(): Requirement[] {
  const base = [
    {
      id: "GUEST-REQ-001",
      displayId: "GUEST-REQ-001",
      title: "Guest users can explore QA workflow safely",
      description: "Guest mode must provide a realistic demo without reading from or writing to production project data.",
      acceptanceCriteria: "Guest data is reset on each session and remains isolated from signed-in user projects.",
      businessRules: "Guest actions use local demo fixtures only.",
      module: "Guest Workspace",
      type: "Functional",
      priority: "Critical",
      status: "Draft",
      createdById: "guest-user",
      createdAt: now,
      updatedAt: now,
    },
  ] as Requirement[];
  
  return base.map(req => ({
    ...req,
    ...globalGuestStore.requirements[req.id],
    ...globalGuestStore.requirements[req.displayId!]
  }));
}

export function guestDefects(): Defect[] {
  const base = [{
    id: "GUEST-DEF-001",
    title: "Sample visual issue in guest workspace",
    description: "Guest-only defect data. This is never loaded from NeonDB.",
    severity: "High",
    status: "Open",
    type: "Bug",
    priority: "High",
    assignedTo: "Guest User",
    reportedBy: "Guest User",
    linkedTestCase: "GUEST-TC-002",
    environment: "Demo Staging",
    browser: "Chrome",
    stepsToReproduce: "1. Open guest demo\n2. Inspect sample defect",
    createdAt: now,
    updatedAt: now,
    comments: [],
  }] as Defect[];
  
  return base.map(def => ({
    ...def,
    ...globalGuestStore.defects[def.id],
    ...globalGuestStore.defects[(def as any).displayId || def.id]
  }));
}

export function guestTestRuns(): TestRun[] {
  const base = [{
    id: "GUEST-RUN-001",
    displayId: "GUEST-RUN-001",
    name: "Guest Smoke Run",
    type: "Manual",
    triggerType: "Manual",
    status: "Not Started",
    environment: "Demo Staging",
    release: "Guest Release",
    assignedTo: "Guest User",
    totalCases: 2,
    passed: 0,
    failed: 0,
    blocked: 0,
    notRun: 2,
    createdAt: now,
  }] as TestRun[];
  
  return base.map(run => ({
    ...run,
    ...globalGuestStore.testRuns[run.id],
    ...globalGuestStore.testRuns[run.displayId || run.id]
  }));
}

export function guestWorkItems(): WorkItem[] {
  return [
    {
      id: "guest-work-1",
      title: "Review sample login test",
      type: "Test Case",
      status: "To Do",
      priority: "Medium",
      progress: 0,
      scope: "TC: GUEST-TC-001",
      assignedTo: "Guest User",
      testCaseId: "GUEST-TC-001",
      dueIn: "3 days",
      createdAt: now,
    },
    {
      id: "guest-work-2",
      title: "Triage sample defect",
      type: "Defect",
      status: "Blocked",
      priority: "High",
      progress: 25,
      scope: "DEF: GUEST-DEF-001",
      assignedTo: "Guest User",
      defectId: "GUEST-DEF-001",
      dueIn: "1 day",
      createdAt: now,
    },
  ];
}

export function guestReleases(): Release[] {
  return [{
    id: "guest-release-1",
    version: "DEMO-REL",
    name: "Guest Demo Release",
    status: "Planning",
    startDate: "2026-06-12",
    targetDate: "2026-06-30",
    description: "Guest-only release simulation.",
    totalTestCases: 2,
    passedTestCases: 0,
    totalDefects: 1,
    openDefects: 1,
    criticalDefects: 0,
  }];
}

export function guestActivity(): ActivityItem[] {
  return [{
    id: "guest-act-1",
    user: "Guest User",
    userInitials: "GU",
    action: "created",
    targetType: "test-case",
    targetId: "GUEST-TC-001",
    targetTitle: "Verify login with valid credentials",
    timestamp: now,
    detail: "Guest demo data resets on each guest sign-in.",
  }];
}

export function guestApprovalGates(entityType?: string, entityId?: string) {
  const gates = [
    {
      id: "guest-gate-req-1",
      gate_id: "GUEST-GATE-REQ-001",
      entity_type: "requirement",
      entity_id: "11111111-1111-1111-1111-111111111111",
      gate_name: "QA Review",
      from_status: "Draft",
      to_status: "Ready",
      status: "pending",
      ai_recommendation: "go",
      ai_confidence: 85,
      created_at: now,
      updated_at: now,
    },
    {
      id: "guest-gate-run-1",
      gate_id: "GUEST-GATE-RUN-001",
      entity_type: "test_run",
      entity_id: "22222222-2222-2222-2222-222222222222",
      gate_name: "Execution Sign-off",
      from_status: "Running",
      to_status: "Completed",
      status: "pending",
      ai_recommendation: "conditional",
      ai_confidence: 72,
      created_at: now,
      updated_at: now,
    },
  ];

  return gates.filter((gate) =>
    (!entityType || gate.entity_type === entityType)
    && (!entityId || gate.entity_id === entityId),
  );
}

export function guestAuditTrail(entityType?: string, entityId?: string) {
  const entries = [
    {
      id: "guest-audit-1",
      action: "created",
      entity_type: "requirement",
      entity_id: "11111111-1111-1111-1111-111111111111",
      user_id: "guest-user",
      old_value: null,
      new_value: { gate_name: "QA Review", status: "pending" },
      audit_metadata: null,
      created_at: now,
    },
    {
      id: "guest-audit-2",
      action: "created",
      entity_type: "test_run",
      entity_id: "22222222-2222-2222-2222-222222222222",
      user_id: "guest-user",
      old_value: null,
      new_value: { gate_name: "Execution Sign-off", status: "pending" },
      audit_metadata: null,
      created_at: now,
    },
  ];

  return entries.filter((entry) =>
    (!entityType || entry.entity_type === entityType)
    && (!entityId || entry.entity_id === entityId),
  );
}

export function guestCreated<T extends Record<string, any>>(payload: T, fallback: T) {
  return {
    ...fallback,
    ...payload,
    id: payload.id || `guest-${randomUUID()}`,
    createdAt: now,
    updatedAt: now,
  };
}
