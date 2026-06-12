export type TestCaseStatus = "Draft" | "Ready" | "In Review" | "Approved" | "Obsolete";
export type TestCaseSeverity = "Minor" | "Major" | "Critical" | "Blocker";
export type TestCasePriority = "Critical" | "High" | "Medium" | "Low";
export type TestCaseType = "Functional" | "Regression" | "Smoke" | "Integration" | "UI" | "Performance" | "Security";

export interface TestStep {
  stepNumber: number;
  action: string;
  expectedResult?: string;
  testData?: string;
  status?: "Passed" | "Failed" | "Blocked" | "Not Run" | "Skipped";
  actualResult?: string;

  id?: string;
  order?: number;
}

export interface TestCase {
  id: string;
  title: string;
  description?: string;
  module: string;
  severity: TestCaseSeverity;
  status: TestCaseStatus;
  type: TestCaseType;
  assignedTo?: string;
  assignedToId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  requirementId?: string;
  steps: TestStep[];
  tags?: string[];
  estimatedTime?: string;

  environment?: "Staging" | "Production" | "UAT" | "Development";
  automationStatus?: "Manual" | "Automated" | "Candidate to Automate";
  preconditions?: string;
  expectedResult?: string;
  notes?: string;
}

export type DefectSeverity = "Critical" | "High" | "Medium" | "Low";
export type DefectStatus = "Open" | "In Progress" | "Resolved" | "Closed" | "Blocked" | "Reopened";
export type DefectType = "Bug" | "Extension" | "Enhancement" | "Task";

export interface Defect {
  id: string;
  realId?: string;
  title: string;
  description?: string;
  severity: DefectSeverity;
  status: DefectStatus;
  type: DefectType;
  priority: TestCasePriority;
  assignedTo?: string;
  reportedBy: string;
  linkedTestCase?: string;
  linkedTestRun?: string;
  environment?: string;
  browser?: string;
  stepsToReproduce?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  tags?: string[];
  comments?: DefectComment[];
}

export interface DefectComment {
  id: string;
  author: string;
  initials: string;
  timestamp: string;
  text: string;
}

export type TestRunStatus = "Not Started" | "In Progress" | "Completed" | "Aborted";

export interface TestRun {
  id: string;
  realId?: string;
  name: string;
  description?: string;
  status: TestRunStatus;
  environment: string;
  release?: string;
  assignedTo: string;
  totalCases: number;
  passed: number;
  failed: number;
  blocked: number;
  notRun: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export type EnvironmentType = "Development" | "Staging" | "Production" | "QA" | "UAT";
export type EnvironmentStatus = "Active" | "Inactive" | "Maintenance";

export interface Environment {
  id: string;
  name: string;
  url: string;
  type: EnvironmentType;
  status: EnvironmentStatus;
  lastDeployed?: string;
  version?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ReleaseStatus = "Planning" | "In Progress" | "Ready" | "Released" | "Cancelled";

export interface Release {
  id: string;
  version: string;
  name: string;
  status: ReleaseStatus;
  startDate: string;
  targetDate: string;
  releaseDate?: string;
  description?: string;
  totalTestCases: number;
  passedTestCases: number;
  totalDefects: number;
  openDefects: number;
  criticalDefects: number;
}

export interface Project {
  id: string;
  name: string;
  prefix: string;
  description?: string;
  priority: TestCasePriority;
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = "Admin" | "QA Lead" | "QA Engineer" | "Developer" | "Viewer";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  initials: string;
}

export type ActivityAction =
  | "created"
  | "updated"
  | "resolved"
  | "reported"
  | "assigned"
  | "commented"
  | "closed"
  | "reopened"
  | "executed";

export interface ActivityItem {
  id: string;
  user: string;
  userInitials: string;
  action: ActivityAction;
  targetType: "defect" | "test-case" | "test-run" | "release";
  targetId: string;
  targetTitle?: string;
  timestamp: string;
  detail?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  disabled?: boolean;
  badge?: number;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export type WorkItemStatus = "To Do" | "In Progress" | "Blocked" | "Completed";
export type WorkItemType = "Task" | "Test Case" | "Defect" | "Test Run";

export interface WorkItem {
  id: string;
  title: string;
  type: WorkItemType;
  status: WorkItemStatus;
  priority: TestCasePriority;
  progress: number;
  scope?: string;
  assignedTo: string;
  testCaseId?: string;
  defectId?: string;
  dueIn?: string;
  createdAt: string;
}
