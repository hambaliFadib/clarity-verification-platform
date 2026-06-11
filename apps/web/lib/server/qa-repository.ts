import { randomUUID } from "crypto";
import { query, transaction, type DbClient } from "@/lib/server/db";

function toInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function emptyToNull(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  return value;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter(Boolean) : null;
}

function isUuid(value: unknown) {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function nextDisplayId(client: DbClient, table: string, prefix: string) {
  const result = await client.query<{ max_number: number }>(
    `select coalesce(max(cast(substring(display_id from $1) as integer)), 0) as max_number from ${table}`,
    [`${prefix}-([0-9]+)$`],
  );
  return `${prefix}-${String((result.rows[0]?.max_number || 0) + 1).padStart(3, "0")}`;
}

function mapTestStep(row: any) {
  return {
    id: row.id,
    stepNumber: row.step_number,
    action: row.action,
    status: row.status || "Not Run",
    actualResult: row.actual_result || undefined,
    order: row.step_number,
  };
}

function mapTestCase(row: any, steps: any[] = []) {
  return {
    id: row.display_id,
    realId: row.id,
    title: row.title,
    description: row.description || undefined,
    module: row.module,
    severity: row.severity,
    status: row.status,
    type: row.type,
    assignedTo: row.assigned_to_name || undefined,
    createdBy: row.created_by_name || "System",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    requirementId: row.requirement_id || undefined,
    estimatedTime: row.estimated_time || undefined,
    tags: row.tags || undefined,
    environment: row.environment || undefined,
    automationStatus: row.automation_status || undefined,
    preconditions: row.preconditions || undefined,
    expectedResult: row.expected_result,
    notes: row.notes || undefined,
    steps: steps.map(mapTestStep),
  };
}

async function getStepsByCaseIds(caseIds: string[]) {
  if (caseIds.length === 0) return new Map<string, any[]>();
  const result = await query(
    "select * from test_steps where test_case_id = any($1::uuid[]) order by test_case_id, step_number asc",
    [caseIds],
  );
  const grouped = new Map<string, any[]>();
  for (const row of result.rows) {
    const key = row.test_case_id;
    grouped.set(key, [...(grouped.get(key) || []), row]);
  }
  return grouped;
}

export async function listTestCases(searchParams: URLSearchParams) {
  const filters = ["tc.deleted_at is null"];
  const values: unknown[] = [];

  const addValue = (value: unknown) => {
    values.push(value);
    return `$${values.length}`;
  };

  const search = searchParams.get("search");
  if (search) {
    const placeholder = addValue(`%${search}%`);
    filters.push(`(tc.title ilike ${placeholder} or tc.module ilike ${placeholder} or tc.display_id ilike ${placeholder})`);
  }
  const status = searchParams.get("status");
  if (status && status.toLowerCase() !== "all") filters.push(`tc.status ilike ${addValue(status)}`);
  const severity = searchParams.get("severity");
  if (severity) filters.push(`tc.severity ilike ${addValue(severity)}`);
  const type = searchParams.get("type");
  if (type) filters.push(`tc.type ilike ${addValue(type)}`);

  const whereSql = filters.join(" and ");
  const count = await query<{ total: string }>(`select count(*) as total from test_cases tc where ${whereSql}`, values);
  const offset = addValue(toInt(searchParams.get("skip"), 0));
  const limit = addValue(toInt(searchParams.get("limit"), 100));
  const result = await query(
    `select tc.*, assignee.name as assigned_to_name, creator.name as created_by_name
     from test_cases tc
     left join users assignee on assignee.id = tc.assigned_to
     left join users creator on creator.id = tc.created_by
     where ${whereSql}
     order by tc.updated_at desc
     offset ${offset} limit ${limit}`,
    values,
  );
  const steps = await getStepsByCaseIds(result.rows.map((row: any) => row.id));
  return {
    items: result.rows.map((row: any) => mapTestCase(row, steps.get(row.id) || [])),
    total: Number(count.rows[0]?.total || 0),
  };
}

export async function createTestCase(payload: any) {
  return transaction(async (client) => {
    const displayId = await nextDisplayId(client, "test_cases", "CLR-TC");
    const steps = payload.testSteps || payload.test_steps || [];
    const expectedResult = payload.expectedResult || payload.expected_result || "";
    const now = new Date();
    const created = await client.query(
      `insert into test_cases (
        id, display_id, title, description, module, type, severity, status,
        assigned_to, requirement_id, estimated_time, tags, environment, automation_status,
        preconditions, expected_result, notes, created_at, updated_at
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
      ) returning *`,
      [
        randomUUID(),
        displayId,
        payload.title,
        emptyToNull(payload.description),
        payload.module,
        payload.type,
        payload.severity || payload.priority || "Medium",
        payload.status || "Draft",
        isUuid(payload.assignedTo || payload.assigned_to) ? (payload.assignedTo || payload.assigned_to) : null,
        emptyToNull(payload.requirementId || payload.requirement_id),
        emptyToNull(payload.estimatedTime || payload.estimated_time),
        stringArray(payload.tags),
        emptyToNull(payload.environment),
        emptyToNull(payload.automationStatus || payload.automation_status),
        emptyToNull(payload.preconditions),
        expectedResult,
        emptyToNull(payload.notes),
        now,
        now,
      ],
    );

    for (const [index, step] of steps.entries()) {
      await client.query(
        `insert into test_steps (id, test_case_id, step_number, action, status, actual_result)
         values ($1,$2,$3,$4,$5,$6)`,
        [
          randomUUID(),
          created.rows[0].id,
          index + 1,
          step.action,
          step.status || "Not Run",
          emptyToNull(step.actualResult || step.actual_result),
        ],
      );
    }

    const stepRows = await client.query("select * from test_steps where test_case_id = $1 order by step_number asc", [created.rows[0].id]);
    return mapTestCase(created.rows[0], stepRows.rows);
  });
}

export async function getTestCase(displayId: string) {
  const result = await query(
    `select tc.*, assignee.name as assigned_to_name, creator.name as created_by_name
     from test_cases tc
     left join users assignee on assignee.id = tc.assigned_to
     left join users creator on creator.id = tc.created_by
     where tc.display_id = $1 and tc.deleted_at is null
     limit 1`,
    [displayId],
  );
  if (!result.rows[0]) return null;
  const steps = await getStepsByCaseIds([result.rows[0].id]);
  return mapTestCase(result.rows[0], steps.get(result.rows[0].id) || []);
}

export async function updateTestCase(displayId: string, payload: any) {
  return transaction(async (client) => {
    const current = await client.query("select * from test_cases where display_id = $1 and deleted_at is null", [displayId]);
    if (!current.rows[0]) return null;

    const fields: Record<string, unknown> = {};
    if (payload.title !== undefined) fields.title = payload.title;
    if (payload.description !== undefined) fields.description = emptyToNull(payload.description);
    if (payload.module !== undefined) fields.module = payload.module;
    if (payload.type !== undefined) fields.type = payload.type;
    if (payload.severity !== undefined || payload.priority !== undefined) fields.severity = payload.severity ?? payload.priority;
    if (payload.status !== undefined) fields.status = payload.status;
    if (payload.assignedTo !== undefined || payload.assigned_to !== undefined) {
      const assignee = payload.assignedTo ?? payload.assigned_to;
      fields.assigned_to = isUuid(assignee) ? assignee : null;
    }
    if (payload.requirementId !== undefined || payload.requirement_id !== undefined) fields.requirement_id = emptyToNull(payload.requirementId ?? payload.requirement_id);
    if (payload.estimatedTime !== undefined || payload.estimated_time !== undefined) fields.estimated_time = emptyToNull(payload.estimatedTime ?? payload.estimated_time);
    if (payload.tags !== undefined) fields.tags = stringArray(payload.tags);
    if (payload.environment !== undefined) fields.environment = emptyToNull(payload.environment);
    if (payload.automationStatus !== undefined || payload.automation_status !== undefined) fields.automation_status = emptyToNull(payload.automationStatus ?? payload.automation_status);
    if (payload.preconditions !== undefined) fields.preconditions = emptyToNull(payload.preconditions);
    if (payload.expectedResult !== undefined || payload.expected_result !== undefined) fields.expected_result = payload.expectedResult ?? payload.expected_result;
    if (payload.notes !== undefined) fields.notes = emptyToNull(payload.notes);

    let row = current.rows[0];
    const entries = Object.entries(fields);
    if (entries.length > 0) {
      const values = entries.map(([, value]) => value);
      const assignments = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ");
      const updated = await client.query(
        `update test_cases set ${assignments}, updated_at = now() where id = $${entries.length + 1} returning *`,
        [...values, row.id],
      );
      row = updated.rows[0];
    }

    const steps = payload.testSteps || payload.test_steps;
    if (steps !== undefined) {
      await client.query("delete from test_steps where test_case_id = $1", [row.id]);
      for (const [index, step] of steps.entries()) {
        await client.query(
          `insert into test_steps (id, test_case_id, step_number, action, status, actual_result)
           values ($1,$2,$3,$4,$5,$6)`,
          [
            randomUUID(),
            row.id,
            index + 1,
            step.action,
            step.status || "Not Run",
            emptyToNull(step.actualResult || step.actual_result),
          ],
        );
      }
    }

    const stepRows = await client.query("select * from test_steps where test_case_id = $1 order by step_number asc", [row.id]);
    return mapTestCase(row, stepRows.rows);
  });
}

export async function deleteTestCase(displayId: string) {
  const result = await query("update test_cases set deleted_at = now(), updated_at = now() where display_id = $1 and deleted_at is null", [displayId]);
  return (result.rowCount || 0) > 0;
}

function mapDefectComment(row: any) {
  return {
    id: row.id,
    author: row.author,
    initials: row.initials,
    timestamp: row.created_at,
    text: row.text,
  };
}

function mapDefect(row: any, comments: any[] = []) {
  return {
    id: row.display_id,
    realId: row.id,
    title: row.title,
    description: row.description || undefined,
    severity: row.severity,
    status: row.status,
    type: row.type,
    priority: row.priority,
    assignedTo: row.assigned_to || undefined,
    reportedBy: row.reported_by || "System",
    linkedTestCase: row.linked_test_case || undefined,
    linkedTestRun: row.linked_test_run || undefined,
    environment: row.environment || undefined,
    browser: row.browser || undefined,
    stepsToReproduce: row.steps_to_reproduce || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at || undefined,
    tags: row.tags || undefined,
    comments: comments.map(mapDefectComment),
  };
}

export async function listDefects(searchParams: URLSearchParams) {
  const filters = ["deleted_at is null"];
  const values: unknown[] = [];
  const addValue = (value: unknown) => {
    values.push(value);
    return `$${values.length}`;
  };

  const search = searchParams.get("search");
  if (search) {
    const placeholder = addValue(`%${search}%`);
    filters.push(`(title ilike ${placeholder} or description ilike ${placeholder} or display_id ilike ${placeholder} or linked_test_case ilike ${placeholder})`);
  }
  const status = searchParams.get("status");
  if (status && status.toLowerCase() !== "all") filters.push(`status ilike ${addValue(status)}`);
  const severity = searchParams.get("severity");
  if (severity) filters.push(`severity ilike ${addValue(severity)}`);
  const type = searchParams.get("type");
  if (type) filters.push(`type ilike ${addValue(type)}`);
  const priority = searchParams.get("priority");
  if (priority) filters.push(`priority ilike ${addValue(priority)}`);

  const whereSql = filters.join(" and ");
  const count = await query<{ total: string }>(`select count(*) as total from defects where ${whereSql}`, values);
  const offset = addValue(toInt(searchParams.get("skip"), 0));
  const limit = addValue(toInt(searchParams.get("limit"), 100));
  const result = await query(`select * from defects where ${whereSql} order by updated_at desc offset ${offset} limit ${limit}`, values);
  return {
    items: result.rows.map((row: any) => mapDefect(row)),
    total: Number(count.rows[0]?.total || 0),
  };
}

export async function createDefect(payload: any) {
  const result = await transaction(async (client) => {
    const displayId = await nextDisplayId(client, "defects", "CLR-DEF");
    const now = new Date();
    return client.query(
      `insert into defects (
        id, display_id, title, description, severity, status, type, priority, assigned_to,
        reported_by, linked_test_case, linked_test_run, environment, browser,
        steps_to_reproduce, tags, created_at, updated_at, resolved_at
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
      ) returning *`,
      [
        randomUUID(),
        displayId,
        payload.title,
        emptyToNull(payload.description),
        payload.severity || "Medium",
        payload.status || "Open",
        payload.type || "Bug",
        payload.priority || payload.severity || "Medium",
        emptyToNull(payload.assignedTo || payload.assigned_to),
        emptyToNull(payload.reportedBy || payload.reported_by),
        emptyToNull(payload.linkedTestCase || payload.linked_test_case),
        emptyToNull(payload.linkedTestRun || payload.linked_test_run),
        emptyToNull(payload.environment),
        emptyToNull(payload.browser),
        emptyToNull(payload.stepsToReproduce || payload.steps_to_reproduce),
        stringArray(payload.tags),
        now,
        now,
        ["Resolved", "Closed"].includes(payload.status) ? new Date() : null,
      ],
    );
  });
  return mapDefect(result.rows[0]);
}

export async function getDefect(displayId: string) {
  const result = await query("select * from defects where display_id = $1 and deleted_at is null limit 1", [displayId]);
  if (!result.rows[0]) return null;
  const comments = await query("select * from defect_comments where defect_id = $1 order by created_at asc", [result.rows[0].id]);
  return mapDefect(result.rows[0], comments.rows);
}

export async function updateDefect(displayId: string, payload: any) {
  const current = await query("select * from defects where display_id = $1 and deleted_at is null limit 1", [displayId]);
  if (!current.rows[0]) return null;
  const fields: Record<string, unknown> = {};
  if (payload.title !== undefined) fields.title = payload.title;
  if (payload.description !== undefined) fields.description = emptyToNull(payload.description);
  if (payload.severity !== undefined) fields.severity = payload.severity;
  if (payload.status !== undefined) {
    fields.status = payload.status;
    fields.resolved_at = ["Resolved", "Closed"].includes(payload.status) ? (current.rows[0].resolved_at || new Date()) : null;
  }
  if (payload.type !== undefined) fields.type = payload.type;
  if (payload.priority !== undefined) fields.priority = payload.priority;
  if (payload.assignedTo !== undefined || payload.assigned_to !== undefined) fields.assigned_to = emptyToNull(payload.assignedTo ?? payload.assigned_to);
  if (payload.reportedBy !== undefined || payload.reported_by !== undefined) fields.reported_by = emptyToNull(payload.reportedBy ?? payload.reported_by);
  if (payload.linkedTestCase !== undefined || payload.linked_test_case !== undefined) fields.linked_test_case = emptyToNull(payload.linkedTestCase ?? payload.linked_test_case);
  if (payload.linkedTestRun !== undefined || payload.linked_test_run !== undefined) fields.linked_test_run = emptyToNull(payload.linkedTestRun ?? payload.linked_test_run);
  if (payload.environment !== undefined) fields.environment = emptyToNull(payload.environment);
  if (payload.browser !== undefined) fields.browser = emptyToNull(payload.browser);
  if (payload.stepsToReproduce !== undefined || payload.steps_to_reproduce !== undefined) fields.steps_to_reproduce = emptyToNull(payload.stepsToReproduce ?? payload.steps_to_reproduce);
  if (payload.tags !== undefined) fields.tags = stringArray(payload.tags);

  const entries = Object.entries(fields);
  if (entries.length === 0) return getDefect(displayId);
  const values = entries.map(([, value]) => value);
  const assignments = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ");
  const updated = await query(
    `update defects set ${assignments}, updated_at = now() where display_id = $${entries.length + 1} and deleted_at is null returning *`,
    [...values, displayId],
  );
  return mapDefect(updated.rows[0]);
}

export async function deleteDefect(displayId: string) {
  const result = await query("update defects set deleted_at = now(), updated_at = now() where display_id = $1 and deleted_at is null", [displayId]);
  return (result.rowCount || 0) > 0;
}

export async function createDefectComment(displayId: string, payload: any) {
  const result = await transaction(async (client) => {
    const defect = await client.query("select * from defects where display_id = $1 and deleted_at is null limit 1", [displayId]);
    if (!defect.rows[0]) return null;
    const comment = await client.query(
      "insert into defect_comments (id, defect_id, author, initials, text, created_at) values ($1,$2,$3,$4,$5,$6) returning *",
      [randomUUID(), defect.rows[0].id, payload.author, payload.initials, payload.text, new Date()],
    );
    await client.query("update defects set updated_at = now() where id = $1", [defect.rows[0].id]);
    return comment.rows[0];
  });
  return result ? mapDefectComment(result) : null;
}

export function mapEnvironment(row: any) {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    type: row.type,
    status: row.status,
    lastDeployed: row.last_deployed || undefined,
    version: row.version || undefined,
    description: row.description || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listEnvironments(searchParams: URLSearchParams) {
  const values: unknown[] = [];
  let whereSql = "deleted_at is null";
  const status = searchParams.get("status");
  if (status && status.toLowerCase() !== "all") {
    values.push(status);
    whereSql += " and status ilike $1";
  }
  const count = await query<{ total: string }>(`select count(*) as total from environments where ${whereSql}`, values);
  values.push(toInt(searchParams.get("skip"), 0), toInt(searchParams.get("limit"), 100));
  const result = await query(`select * from environments where ${whereSql} order by name asc offset $${values.length - 1} limit $${values.length}`, values);
  return { items: result.rows.map(mapEnvironment), total: Number(count.rows[0]?.total || 0) };
}

export async function createEnvironment(payload: any) {
  const result = await query(
    `insert into environments (id, name, url, type, status, last_deployed, version, description, created_at, updated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
    [
      randomUUID(),
      payload.name,
      payload.url,
      payload.type || "Development",
      payload.status || "Active",
      emptyToNull(payload.lastDeployed || payload.last_deployed),
      emptyToNull(payload.version),
      emptyToNull(payload.description),
      new Date(),
      new Date(),
    ],
  );
  return mapEnvironment(result.rows[0]);
}

export async function getEnvironment(id: string) {
  const result = await query("select * from environments where id = $1 and deleted_at is null limit 1", [id]);
  return result.rows[0] ? mapEnvironment(result.rows[0]) : null;
}

export async function updateEnvironment(id: string, payload: any) {
  const fields: Record<string, unknown> = {};
  if (payload.name !== undefined) fields.name = payload.name;
  if (payload.url !== undefined) fields.url = payload.url;
  if (payload.type !== undefined) fields.type = payload.type;
  if (payload.status !== undefined) fields.status = payload.status;
  if (payload.lastDeployed !== undefined || payload.last_deployed !== undefined) fields.last_deployed = emptyToNull(payload.lastDeployed ?? payload.last_deployed);
  if (payload.version !== undefined) fields.version = emptyToNull(payload.version);
  if (payload.description !== undefined) fields.description = emptyToNull(payload.description);
  const entries = Object.entries(fields);
  if (entries.length === 0) return getEnvironment(id);
  const values = entries.map(([, value]) => value);
  const assignments = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ");
  const result = await query(`update environments set ${assignments}, updated_at = now() where id = $${entries.length + 1} and deleted_at is null returning *`, [...values, id]);
  return result.rows[0] ? mapEnvironment(result.rows[0]) : null;
}

export async function deleteEnvironment(id: string) {
  const result = await query("update environments set deleted_at = now(), updated_at = now() where id = $1 and deleted_at is null", [id]);
  return (result.rowCount || 0) > 0;
}

function mapProject(row: any) {
  return {
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    description: row.description || undefined,
    priority: row.default_priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProjects(searchParams: URLSearchParams) {
  const count = await query<{ total: string }>("select count(*) as total from projects where deleted_at is null");
  const result = await query(
    "select * from projects where deleted_at is null order by updated_at desc offset $1 limit $2",
    [toInt(searchParams.get("skip"), 0), toInt(searchParams.get("limit"), 100)],
  );
  return { items: result.rows.map(mapProject), total: Number(count.rows[0]?.total || 0) };
}

export async function createProject(payload: any) {
  const result = await query(
    "insert into projects (id, name, prefix, description, default_priority, created_at, updated_at) values ($1,$2,$3,$4,$5,$6,$7) returning *",
    [randomUUID(), payload.name, payload.prefix, emptyToNull(payload.description), payload.priority || payload.defaultPriority || "Medium", new Date(), new Date()],
  );
  return mapProject(result.rows[0]);
}

export async function getProject(id: string) {
  const result = await query("select * from projects where id = $1 and deleted_at is null limit 1", [id]);
  return result.rows[0] ? mapProject(result.rows[0]) : null;
}

export async function updateProject(id: string, payload: any) {
  const fields: Record<string, unknown> = {};
  if (payload.name !== undefined) fields.name = payload.name;
  if (payload.prefix !== undefined) fields.prefix = payload.prefix;
  if (payload.description !== undefined) fields.description = emptyToNull(payload.description);
  if (payload.priority !== undefined || payload.default_priority !== undefined || payload.defaultPriority !== undefined) {
    fields.default_priority = payload.priority ?? payload.default_priority ?? payload.defaultPriority;
  }
  const entries = Object.entries(fields);
  if (entries.length === 0) return getProject(id);
  const values = entries.map(([, value]) => value);
  const assignments = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ");
  const result = await query(`update projects set ${assignments}, updated_at = now() where id = $${entries.length + 1} and deleted_at is null returning *`, [...values, id]);
  return result.rows[0] ? mapProject(result.rows[0]) : null;
}

export async function deleteProject(id: string) {
  const result = await query("update projects set deleted_at = now(), updated_at = now() where id = $1 and deleted_at is null", [id]);
  return (result.rowCount || 0) > 0;
}

export async function listReleases() {
  const modules = await query<{ module: string }>(
    "select distinct module from test_cases where deleted_at is null order by module asc",
  );
  const items = [];
  for (const [index, row] of modules.rows.entries()) {
    const tests = await query("select display_id, status from test_cases where module = $1 and deleted_at is null", [row.module]);
    const testIds = tests.rows.map((item: any) => item.display_id);
    const defects = testIds.length
      ? await query("select severity, status from defects where deleted_at is null and linked_test_case = any($1::text[])", [testIds])
      : { rows: [] };
    const passed = tests.rows.filter((item: any) => ["Approved", "Ready"].includes(item.status)).length;
    const openDefects = defects.rows.filter((item: any) => ["Open", "In Progress", "Blocked", "Reopened"].includes(item.status)).length;
    const criticalDefects = defects.rows.filter((item: any) => item.severity === "Critical").length;
    items.push({
      id: `module-${index + 1}`,
      version: `${row.module.slice(0, 3).toUpperCase()}-REL`,
      name: `${row.module} Module`,
      status: tests.rows.length > 0 && passed === tests.rows.length ? "Released" : passed > 0 ? "In Progress" : "Planning",
      startDate: new Date().toISOString().slice(0, 10),
      targetDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      description: `Aggregated release readiness for the ${row.module} module based on current test cases.`,
      totalTestCases: tests.rows.length,
      passedTestCases: passed,
      totalDefects: defects.rows.length,
      openDefects,
      criticalDefects,
    });
  }
  return { items: items.sort((a, b) => b.totalTestCases - a.totalTestCases), total: items.length };
}

function mapWorkItem(row: any) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    status: row.status,
    priority: row.priority,
    progress: row.progress,
    scope: row.scope || undefined,
    assignedTo: row.assigned_to,
    dueIn: row.due_in || undefined,
    createdAt: row.created_at,
  };
}

export async function listWorkItems(searchParams: URLSearchParams) {
  const filters = ["deleted_at is null"];
  const values: unknown[] = [];
  const status = searchParams.get("status");
  if (status && status.toLowerCase() !== "all") {
    values.push(status);
    filters.push(`status ilike $${values.length}`);
  }
  const assignedTo = searchParams.get("assigned_to");
  if (assignedTo) {
    values.push(assignedTo);
    filters.push(`assigned_to ilike $${values.length}`);
  }
  const whereSql = filters.join(" and ");
  const count = await query<{ total: string }>(`select count(*) as total from work_items where ${whereSql}`, values);
  values.push(toInt(searchParams.get("skip"), 0), toInt(searchParams.get("limit"), 100));
  const result = await query(`select * from work_items where ${whereSql} order by updated_at desc offset $${values.length - 1} limit $${values.length}`, values);
  return { items: result.rows.map(mapWorkItem), total: Number(count.rows[0]?.total || 0) };
}

function mapActivity(row: any) {
  return {
    id: row.id,
    user: row.user,
    userInitials: row.user_initials,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    targetTitle: row.target_title || undefined,
    timestamp: row.created_at,
    detail: row.detail || undefined,
  };
}

export async function listActivity(searchParams: URLSearchParams) {
  const count = await query<{ total: string }>("select count(*) as total from activity_items");
  const result = await query(
    "select * from activity_items order by created_at desc offset $1 limit $2",
    [toInt(searchParams.get("skip"), 0), toInt(searchParams.get("limit"), 100)],
  );
  return { items: result.rows.map(mapActivity), total: Number(count.rows[0]?.total || 0) };
}

export async function createActivity(payload: any) {
  const result = await query(
    `insert into activity_items (id, "user", user_initials, action, target_type, target_id, target_title, detail, created_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`,
    [
      randomUUID(),
      payload.user,
      payload.userInitials || payload.user_initials,
      payload.action,
      payload.targetType || payload.target_type,
      payload.targetId || payload.target_id,
      emptyToNull(payload.targetTitle || payload.target_title),
      emptyToNull(payload.detail),
      new Date(),
    ],
  );
  return mapActivity(result.rows[0]);
}

function mapTestRun(row: any) {
  return {
    id: row.display_id,
    realId: row.id,
    name: row.name,
    description: row.description || undefined,
    status: row.status,
    environment: row.environment,
    release: row.release || undefined,
    assignedTo: row.assigned_to,
    totalCases: row.total_cases,
    passed: row.passed,
    failed: row.failed,
    blocked: row.blocked,
    notRun: row.not_run,
    startedAt: row.started_at || undefined,
    completedAt: row.completed_at || undefined,
    createdAt: row.created_at,
  };
}

export async function listTestRuns(searchParams: URLSearchParams) {
  const values: unknown[] = [];
  let whereSql = "deleted_at is null";
  const status = searchParams.get("status");
  if (status && status.toLowerCase() !== "all") {
    values.push(status);
    whereSql += ` and status ilike $${values.length}`;
  }
  const count = await query<{ total: string }>(`select count(*) as total from test_runs where ${whereSql}`, values);
  values.push(toInt(searchParams.get("skip"), 0), toInt(searchParams.get("limit"), 100));
  const result = await query(`select * from test_runs where ${whereSql} order by updated_at desc offset $${values.length - 1} limit $${values.length}`, values);
  return { items: result.rows.map(mapTestRun), total: Number(count.rows[0]?.total || 0) };
}

export async function listUsers() {
  const result = await query("select id, name, email, role, avatar, initials from users order by name asc");
  return result.rows;
}
