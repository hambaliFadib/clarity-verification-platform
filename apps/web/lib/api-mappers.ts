import type {
  ActivityItem,
  Defect,
  DefectComment,
  Environment,
  Project,
  Release,
  TestRun,
  WorkItem,
} from "@/lib/types";

export const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export function mapDefectFromBackend(defect: any): Defect {
  return {
    id: defect.display_id,
    realId: defect.id,
    title: defect.title,
    description: defect.description || undefined,
    severity: defect.severity,
    status: defect.status,
    type: defect.type,
    priority: defect.priority,
    assignedTo: defect.assigned_to || undefined,
    reportedBy: defect.reported_by || "Unassigned",
    linkedTestCase: defect.linked_test_case || undefined,
    linkedTestRun: defect.linked_test_run || undefined,
    environment: defect.environment || undefined,
    browser: defect.browser || undefined,
    stepsToReproduce: defect.steps_to_reproduce || undefined,
    createdAt: defect.created_at,
    updatedAt: defect.updated_at,
    resolvedAt: defect.resolved_at || undefined,
    tags: defect.tags || undefined,
    comments: (defect.comments || []).map(mapDefectCommentFromBackend),
  };
}

export function mapDefectToBackend(defect: any) {
  return {
    title: defect.title,
    description: defect.description || null,
    severity: defect.severity,
    status: defect.status,
    type: defect.type,
    priority: defect.priority || defect.severity,
    assigned_to: defect.assignedTo || null,
    reported_by: defect.reportedBy || null,
    linked_test_case: defect.linkedTestCase || null,
    linked_test_run: defect.linkedTestRun || null,
    environment: defect.environment || null,
    browser: defect.browser || null,
    steps_to_reproduce: defect.stepsToReproduce || null,
    tags: defect.tags || null,
  };
}

export function mapDefectPatchToBackend(defect: any) {
  const payload: any = {};
  if (defect.title !== undefined) payload.title = defect.title;
  if (defect.description !== undefined) payload.description = defect.description || null;
  if (defect.severity !== undefined) payload.severity = defect.severity;
  if (defect.status !== undefined) payload.status = defect.status;
  if (defect.type !== undefined) payload.type = defect.type;
  if (defect.priority !== undefined) payload.priority = defect.priority;
  if (defect.assignedTo !== undefined) payload.assigned_to = defect.assignedTo || null;
  if (defect.reportedBy !== undefined) payload.reported_by = defect.reportedBy || null;
  if (defect.linkedTestCase !== undefined) payload.linked_test_case = defect.linkedTestCase || null;
  if (defect.linkedTestRun !== undefined) payload.linked_test_run = defect.linkedTestRun || null;
  if (defect.environment !== undefined) payload.environment = defect.environment || null;
  if (defect.browser !== undefined) payload.browser = defect.browser || null;
  if (defect.stepsToReproduce !== undefined) payload.steps_to_reproduce = defect.stepsToReproduce || null;
  if (defect.tags !== undefined) payload.tags = defect.tags || null;
  return payload;
}

export function mapDefectCommentFromBackend(comment: any): DefectComment {
  return {
    id: comment.id,
    author: comment.author,
    initials: comment.initials,
    timestamp: comment.created_at,
    text: comment.text,
  };
}

export function mapEnvironmentFromBackend(environment: any): Environment {
  return {
    id: environment.id,
    name: environment.name,
    url: environment.url,
    type: environment.type,
    status: environment.status,
    lastDeployed: environment.last_deployed || undefined,
    version: environment.version || undefined,
    description: environment.description || undefined,
    createdAt: environment.created_at,
    updatedAt: environment.updated_at,
  };
}

export function mapEnvironmentToBackend(environment: any) {
  return {
    name: environment.name,
    url: environment.url,
    type: environment.type,
    status: environment.status || "Active",
    last_deployed: environment.lastDeployed || null,
    version: environment.version || null,
    description: environment.description || null,
  };
}

export function mapProjectFromBackend(project: any): Project {
  return {
    id: project.id,
    name: project.name,
    prefix: project.prefix,
    description: project.description || undefined,
    priority: project.default_priority,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}

export function mapProjectToBackend(project: any) {
  return {
    name: project.name,
    prefix: project.prefix,
    description: project.description || null,
    default_priority: project.priority || project.defaultPriority || "Medium",
  };
}

export function mapReleaseFromBackend(release: any): Release {
  return {
    id: release.id,
    version: release.version,
    name: release.name,
    status: release.status,
    startDate: release.start_date,
    targetDate: release.target_date,
    releaseDate: release.release_date || undefined,
    description: release.description || undefined,
    totalTestCases: release.total_test_cases,
    passedTestCases: release.passed_test_cases,
    totalDefects: release.total_defects,
    openDefects: release.open_defects,
    criticalDefects: release.critical_defects,
  };
}

export function mapWorkItemFromBackend(item: any): WorkItem {
  return {
    id: item.id,
    title: item.title,
    type: item.type,
    status: item.status,
    priority: item.priority,
    progress: item.progress,
    scope: item.scope || undefined,
    assignedTo: item.assigned_to,
    dueIn: item.due_in || undefined,
    createdAt: item.created_at,
  };
}

export function mapActivityFromBackend(item: any): ActivityItem {
  return {
    id: item.id,
    user: item.user,
    userInitials: item.user_initials,
    action: item.action,
    targetType: item.target_type,
    targetId: item.target_id,
    targetTitle: item.target_title || undefined,
    timestamp: item.created_at,
    detail: item.detail || undefined,
  };
}

export function mapActivityToBackend(item: ActivityItem) {
  return {
    user: item.user,
    user_initials: item.userInitials,
    action: item.action,
    target_type: item.targetType,
    target_id: item.targetId,
    target_title: item.targetTitle || null,
    detail: item.detail || null,
  };
}

export function mapTestRunFromBackend(run: any): TestRun {
  return {
    id: run.display_id,
    realId: run.id,
    name: run.name,
    description: run.description || undefined,
    status: run.status,
    environment: run.environment,
    release: run.release || undefined,
    assignedTo: run.assigned_to,
    totalCases: run.total_cases,
    passed: run.passed,
    failed: run.failed,
    blocked: run.blocked,
    notRun: run.not_run,
    startedAt: run.started_at || undefined,
    completedAt: run.completed_at || undefined,
    createdAt: run.created_at,
  };
}
