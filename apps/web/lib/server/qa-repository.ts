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

function normalizeModuleName(moduleName: string | null | undefined) {
  if (!moduleName) return null;
  const cleaned = moduleName.replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;
  return cleaned.replace(/\b\w+\b/g, (word) => {
    if (word === word.toUpperCase() || (/[a-z]/.test(word) && /[A-Z]/.test(word))) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
}

async function getProjectPrefix(client: DbClient, projectId: string | null) {
  if (!projectId) return "CLR";
  const result = await client.query<{ prefix: string }>("select prefix from projects where id = $1 and deleted_at is null", [projectId]);
  return result.rows[0]?.prefix || "CLR";
}

function isUuid(value: unknown) {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export type ProjectAccessContext = {
  userId?: string | null;
  isGuest?: boolean;
};

const scopedTables = [
  "test_cases",
  "defects",
  "environments",
  "releases",
  "test_runs",
  "work_items",
  "activity_items",
  "tc_modules",
  "tc_sub_modules",
  "tc_scenarios",
];

let membershipSchemaReady: Promise<void> | null = null;
let scopedDataSchemaReady: Promise<void> | null = null;
let columnMigrationsReady: Promise<void> | null = null;

function hasSignedInUser(ctx?: ProjectAccessContext) {
  return Boolean(ctx?.userId && !ctx.isGuest && ctx.userId !== "guest-user");
}

/**
 * Idempotent column migrations — safe to run on any DB state.
 * Handles three cases for `severity` on test_cases:
 *   1. Column already named `severity`  → no-op (IF NOT EXISTS guard)
 *   2. Column named `priority`          → rename to severity
 *   3. Neither column exists            → add severity with default
 * Also ensures test_steps has `expected_result` and `test_data`.
 */
async function ensureColumnMigrations() {
  if (!columnMigrationsReady) {
    columnMigrationsReady = (async () => {
      // Create tc_modules table
      await query(`
        CREATE TABLE IF NOT EXISTS tc_modules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(150) NOT NULL,
          description TEXT,
          project_id UUID REFERENCES projects(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          deleted_at TIMESTAMPTZ
        )
      `);
      await query(`CREATE INDEX IF NOT EXISTS ix_tc_modules_project_id ON tc_modules (project_id)`);

      // Create tc_sub_modules table
      await query(`
        CREATE TABLE IF NOT EXISTS tc_sub_modules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(150) NOT NULL,
          description TEXT,
          module_id UUID NOT NULL REFERENCES tc_modules(id) ON DELETE CASCADE,
          project_id UUID REFERENCES projects(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          deleted_at TIMESTAMPTZ
        )
      `);
      await query(`CREATE INDEX IF NOT EXISTS ix_tc_sub_modules_module_id ON tc_sub_modules (module_id)`);
      await query(`CREATE INDEX IF NOT EXISTS ix_tc_sub_modules_project_id ON tc_sub_modules (project_id)`);

      // Create tc_scenarios table
      await query(`
        CREATE TABLE IF NOT EXISTS tc_scenarios (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          module_id UUID REFERENCES tc_modules(id) ON DELETE SET NULL,
          sub_module_id UUID REFERENCES tc_sub_modules(id) ON DELETE SET NULL,
          project_id UUID REFERENCES projects(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          deleted_at TIMESTAMPTZ
        )
      `);
      await query(`CREATE INDEX IF NOT EXISTS ix_tc_scenarios_module_id ON tc_scenarios (module_id)`);
      await query(`CREATE INDEX IF NOT EXISTS ix_tc_scenarios_sub_module_id ON tc_scenarios (sub_module_id)`);
      await query(`CREATE INDEX IF NOT EXISTS ix_tc_scenarios_project_id ON tc_scenarios (project_id)`);

      // Alter test_cases to add FK columns and category
      await query(`ALTER TABLE tc_scenarios ADD COLUMN IF NOT EXISTS sub_module_id UUID REFERENCES tc_sub_modules(id) ON DELETE SET NULL`);
      await query(`ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES tc_modules(id) ON DELETE SET NULL`);
      await query(`ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS sub_module_id UUID REFERENCES tc_sub_modules(id) ON DELETE SET NULL`);
      await query(`ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS scenario_id UUID REFERENCES tc_scenarios(id) ON DELETE SET NULL`);
      await query(`ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'Positive'`);

      // Data migration for existing module data
      await query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'test_cases' AND column_name = 'module'
          ) THEN
            -- Step 1: Insert distinct module names into tc_modules (skip if already exists)
            INSERT INTO tc_modules (id, name, project_id, created_at, updated_at)
            SELECT gen_random_uuid(), TRIM(module), project_id, NOW(), NOW()
            FROM (
              SELECT DISTINCT REGEXP_REPLACE(TRIM(module), '\\s+', ' ', 'g') AS module, project_id
              FROM test_cases
              WHERE module IS NOT NULL AND TRIM(module) <> '' AND deleted_at IS NULL
            ) sub
            WHERE NOT EXISTS (
              SELECT 1 FROM tc_modules m
              WHERE LOWER(m.name) = LOWER(sub.module)
                AND (m.project_id = sub.project_id OR (m.project_id IS NULL AND sub.project_id IS NULL))
            );

            -- Step 2: Backfill module_id on test_cases
            UPDATE test_cases tc
            SET module_id = m.id
            FROM tc_modules m
            WHERE LOWER(REGEXP_REPLACE(TRIM(tc.module), '\\s+', ' ', 'g')) = LOWER(m.name)
              AND (tc.project_id = m.project_id OR (tc.project_id IS NULL AND m.project_id IS NULL))
              AND tc.module_id IS NULL
              AND tc.module IS NOT NULL;

            -- Step 3: Drop legacy module column
            ALTER TABLE test_cases DROP COLUMN IF EXISTS module;
          END IF;
        END $$;
      `);

      // Rename priority → severity if still on old schema
      await query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'test_cases' AND column_name = 'priority'
          ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'test_cases' AND column_name = 'severity'
          ) THEN
            ALTER TABLE test_cases RENAME COLUMN priority TO severity;
          END IF;
        END $$
      `);
      // Add severity fresh if neither priority nor severity exist
      await query(`ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS severity varchar(10) NOT NULL DEFAULT 'Medium'`);
      // Remove DEFAULT after adding so new inserts must supply a value
      await query(`ALTER TABLE test_cases ALTER COLUMN severity DROP DEFAULT`);
      // Drop complexity if still present
      await query(`ALTER TABLE test_cases DROP COLUMN IF EXISTS complexity`);
      // Drop tags column
      await query(`ALTER TABLE test_cases DROP COLUMN IF EXISTS tags`);
      // Ensure test_steps has step detail columns
      await query(`ALTER TABLE test_steps ADD COLUMN IF NOT EXISTS expected_result text`);
      await query(`ALTER TABLE test_steps ADD COLUMN IF NOT EXISTS test_data text`);
    })();
  }
  return columnMigrationsReady;
}

async function ensureScopedDataSchema() {
  if (!scopedDataSchemaReady) {
    scopedDataSchemaReady = (async () => {
      await ensureProjectMembershipSchema();
      await ensureColumnMigrations();
      for (const table of scopedTables) {
        await query(`alter table ${table} add column if not exists project_id uuid references projects(id)`);
        await query(`create index if not exists ix_${table}_project_id on ${table} (project_id)`);
        // NOTE: Do NOT auto-assign NULL project_id rows to the first project.
        // Orphan rows (project_id IS NULL) must stay invisible to all real users.
        // Auto-assignment caused guest-created or seeded data to leak into real user projects.
      }
    })();
  }
  return scopedDataSchemaReady;
}

export async function getAccessibleProjectIds(ctx?: ProjectAccessContext) {
  if (!hasSignedInUser(ctx)) return [];
  await ensureProjectMembershipSchema();
  const result = await query<{ id: string }>(
    `select distinct p.id
     from projects p
     left join project_members pm on pm.project_id = p.id
     where p.deleted_at is null
       and (p.owner_id = $1 or pm.user_id = $1)
     order by p.id asc`,
    [ctx!.userId],
  );
  return result.rows.map((row) => row.id);
}

async function scopedProjectIds(ctx?: ProjectAccessContext) {
  if (!ctx) return null;
  if (!hasSignedInUser(ctx)) return [];
  await ensureScopedDataSchema();
  return getAccessibleProjectIds(ctx);
}

async function primaryProjectId(ctx?: ProjectAccessContext) {
  const ids = await scopedProjectIds(ctx);
  if (!ids || ids.length === 0) {
    throw new Error("Create a project first or ask the project owner for an invitation.");
  }
  return ids[0];
}

function applyProjectScope(filters: string[], values: unknown[], projectIds: string[] | null, column: string) {
  if (projectIds === null) return;
  if (projectIds.length === 0) {
    filters.push("1 = 0");
    return;
  }
  values.push(projectIds);
  filters.push(`${column} = any($${values.length}::uuid[])`);
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
    expectedResult: row.expected_result || undefined,
    testData: row.test_data || undefined,
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
    moduleId: row.module_id || undefined,
    moduleName: row.module_name || undefined,
    subModuleId: row.sub_module_id || undefined,
    subModuleName: row.sub_module_name || undefined,
    scenarioId: row.scenario_id || undefined,
    scenarioName: row.scenario_name || undefined,
    severity: row.severity,
    status: row.status,
    type: row.type,
    assignedTo: row.assigned_to_name || undefined,
    assignedToId: row.assigned_to || undefined,
    createdBy: row.created_by_name || "System",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    requirementId: row.requirement_id || undefined,
    estimatedTime: row.estimated_time || undefined,
    environment: row.environment || undefined,
    automationStatus: row.automation_status || undefined,
    preconditions: row.preconditions || undefined,
    expectedResult: row.expected_result,
    category: row.category || "Positive",
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

export async function listTestCases(searchParams: URLSearchParams, ctx?: ProjectAccessContext) {
  const filters = ["tc.deleted_at is null"];
  const values: unknown[] = [];
  const projectIds = await scopedProjectIds(ctx);
  applyProjectScope(filters, values, projectIds, "tc.project_id");

  const addValue = (value: unknown) => {
    values.push(value);
    return `$${values.length}`;
  };

  const search = searchParams.get("search");
  if (search) {
    const placeholder = addValue(`%${search}%`);
    filters.push(`(tc.title ilike ${placeholder} or m.name ilike ${placeholder} or tc.display_id ilike ${placeholder} or assignee.name ilike ${placeholder})`);
  }
  const status = searchParams.get("status");
  if (status && status.toLowerCase() !== "all") filters.push(`tc.status ilike ${addValue(status)}`);
  const severity = searchParams.get("severity");
  if (severity) filters.push(`tc.severity ilike ${addValue(severity)}`);
  const type = searchParams.get("type");
  if (type) filters.push(`tc.type ilike ${addValue(type)}`);
  const category = searchParams.get("category");
  if (category) filters.push(`tc.category ilike ${addValue(category)}`);
  const assigned = searchParams.get("assigned");
  if (assigned) filters.push(`assignee.name ilike ${addValue(`%${assigned}%`)}`);

  const moduleId = searchParams.get("moduleId") || searchParams.get("module_id");
  if (moduleId) {
    filters.push(`tc.module_id = ${addValue(moduleId)}::uuid`);
  } else {
    const module = searchParams.get("module");
    if (module) filters.push(`m.name ilike ${addValue(module)}`);
  }

  const subModuleId = searchParams.get("subModuleId") || searchParams.get("sub_module_id");
  if (subModuleId) {
    filters.push(`tc.sub_module_id = ${addValue(subModuleId)}::uuid`);
  }
  const scenarioId = searchParams.get("scenarioId") || searchParams.get("scenario_id");
  if (scenarioId) {
    filters.push(`tc.scenario_id = ${addValue(scenarioId)}::uuid`);
  }

  const whereSql = filters.join(" and ");
  const count = await query<{ total: string }>(
    `select count(*) as total 
     from test_cases tc 
     left join tc_modules m on m.id = tc.module_id
     left join users assignee on assignee.id = tc.assigned_to
     where ${whereSql}`, 
    values
  );
  const offset = addValue(toInt(searchParams.get("skip"), 0));
  const limit = addValue(toInt(searchParams.get("limit"), 50));
  const result = await query(
    `select tc.*, 
            assignee.name as assigned_to_name, 
            creator.name as created_by_name,
            m.name as module_name,
            sm.name as sub_module_name,
            sc.name as scenario_name
     from test_cases tc
     left join users assignee on assignee.id = tc.assigned_to
     left join users creator on creator.id = tc.created_by
     left join tc_modules m on m.id = tc.module_id
     left join tc_sub_modules sm on sm.id = tc.sub_module_id
     left join tc_scenarios sc on sc.id = tc.scenario_id
     where ${whereSql}
     order by coalesce(cast(nullif(substring(tc.display_id from 'TC-([0-9]+)$'), '') as integer), 999999) asc, tc.created_at asc
     offset ${offset} limit ${limit}`,
    values,
  );
  const steps = await getStepsByCaseIds(result.rows.map((row: any) => row.id));
  return {
    items: result.rows.map((row: any) => mapTestCase(row, steps.get(row.id) || [])),
    total: Number(count.rows[0]?.total || 0),
  };
}

export async function getTestCaseModules(ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return [];
  const result = await query<{ name: string }>(
    `select name from tc_modules
     where deleted_at is null
       ${projectIds === null ? "" : "and project_id = any($1::uuid[])"}
     order by name asc`,
    projectIds === null ? [] : [projectIds],
  );
  return result.rows.map((row) => row.name);
}



export async function getTestCaseSummary(ctx?: ProjectAccessContext) {
  const filters = ["tc.deleted_at is null"];
  const values: unknown[] = [];
  const projectIds = await scopedProjectIds(ctx);
  applyProjectScope(filters, values, projectIds, "tc.project_id");
  const whereSql = filters.join(" and ");

  const result = await query<{
    total: string;
    approved: string;
    draft: string;
    ready: string;
    in_review: string;
  }>(
    `select
       count(*) as total,
       count(*) filter (where tc.status = 'Approved') as approved,
       count(*) filter (where tc.status = 'Draft') as draft,
       count(*) filter (where tc.status = 'Ready') as ready,
       count(*) filter (where tc.status = 'In Review') as in_review
     from test_cases tc
     where ${whereSql}`,
    values,
  );

  // Count cases that have at least one failed step
  const failedResult = await query<{ has_failures: string }>(
    `select count(distinct tc.id) as has_failures
     from test_cases tc
     inner join test_steps ts on ts.test_case_id = tc.id and ts.status = 'Failed'
     where ${whereSql}`,
    values,
  );

  const row = result.rows[0];
  return {
    total: Number(row?.total || 0),
    approved: Number(row?.approved || 0),
    draft: Number(row?.draft || 0),
    ready: Number(row?.ready || 0),
    inReview: Number(row?.in_review || 0),
    hasFailures: Number(failedResult.rows[0]?.has_failures || 0),
  };
}

export async function createTestCase(payload: any, ctx?: ProjectAccessContext) {
  const projectId = await primaryProjectId(ctx);
  return transaction(async (client) => {
    const prefix = await getProjectPrefix(client, projectId);
    const displayId = await nextDisplayId(client, "test_cases", `${prefix}-TC`);
    const steps = payload.testSteps || payload.test_steps || [];
    const expectedResult = payload.expectedResult || payload.expected_result || "";
    const now = new Date();

    let moduleId = isUuid(payload.moduleId || payload.module_id) ? (payload.moduleId || payload.module_id) : null;
    const moduleName = normalizeModuleName(payload.module);
    if (!moduleId && moduleName) {
      const existing = await client.query("select id from tc_modules where lower(name) = lower($1) and (project_id = $2 or (project_id is null and $2 is null)) and deleted_at is null", [moduleName, projectId]);
      if (existing.rows[0]) {
        moduleId = existing.rows[0].id;
      } else {
        const newModId = randomUUID();
        await client.query("insert into tc_modules (id, name, project_id, created_at, updated_at) values ($1, $2, $3, now(), now())", [newModId, moduleName, projectId]);
        moduleId = newModId;
      }
    }

    let subModuleId = isUuid(payload.subModuleId || payload.sub_module_id) ? (payload.subModuleId || payload.sub_module_id) : null;
    const subModuleName = normalizeModuleName(payload.subModule || payload.sub_module);
    if (!subModuleId && subModuleName && moduleId) {
      const existing = await client.query("select id from tc_sub_modules where lower(name) = lower($1) and module_id = $2 and deleted_at is null", [subModuleName, moduleId]);
      if (existing.rows[0]) {
        subModuleId = existing.rows[0].id;
      } else {
        const newSubId = randomUUID();
        await client.query("insert into tc_sub_modules (id, name, module_id, project_id, created_at, updated_at) values ($1, $2, $3, $4, now(), now())", [newSubId, subModuleName, moduleId, projectId]);
        subModuleId = newSubId;
      }
    }

    let scenarioId = isUuid(payload.scenarioId || payload.scenario_id) ? (payload.scenarioId || payload.scenario_id) : null;
    const scenarioName = normalizeModuleName(payload.scenario || payload.scenario_name);
    if (!scenarioId && scenarioName) {
      const existing = await client.query("select id from tc_scenarios where lower(name) = lower($1) and (project_id = $2 or (project_id is null and $2 is null)) and deleted_at is null", [scenarioName, projectId]);
      if (existing.rows[0]) {
        scenarioId = existing.rows[0].id;
      } else {
        const newScenId = randomUUID();
        await client.query("insert into tc_scenarios (id, name, module_id, project_id, created_at, updated_at) values ($1, $2, $3, $4, now(), now())", [newScenId, scenarioName, moduleId, projectId]);
        scenarioId = newScenId;
      }
    }

    const created = await client.query(
      `insert into test_cases (
        id, display_id, title, description, type, severity, status,
        assigned_to, requirement_id, estimated_time, environment, automation_status,
        preconditions, expected_result, notes, created_at, updated_at, project_id,
        module_id, sub_module_id, scenario_id, category
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
      ) returning *`,
      [
        randomUUID(),
        displayId,
        payload.title,
        emptyToNull(payload.description),
        payload.type,
        payload.severity || payload.priority || "Medium",
        payload.status || "Draft",
        isUuid(payload.assignedTo || payload.assigned_to) ? (payload.assignedTo || payload.assigned_to) : null,
        emptyToNull(payload.requirementId || payload.requirement_id),
        emptyToNull(payload.estimatedTime || payload.estimated_time),
        emptyToNull(payload.environment),
        emptyToNull(payload.automationStatus || payload.automation_status),
        emptyToNull(payload.preconditions),
        expectedResult,
        emptyToNull(payload.notes),
        now,
        now,
        projectId,
        moduleId,
        subModuleId,
        scenarioId,
        payload.category || "Positive",
      ],
    );

    for (const [index, step] of steps.entries()) {
      await client.query(
        `insert into test_steps (id, test_case_id, step_number, action, expected_result, test_data, status, actual_result)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          randomUUID(),
          created.rows[0].id,
          index + 1,
          step.action,
          emptyToNull(step.expectedResult || step.expected_result),
          emptyToNull(step.testData || step.test_data),
          step.status || "Not Run",
          emptyToNull(step.actualResult || step.actual_result),
        ],
      );
    }

    const fullRow = await client.query(
      `select tc.*, 
              assignee.name as assigned_to_name, 
              creator.name as created_by_name,
              m.name as module_name,
              sm.name as sub_module_name,
              sc.name as scenario_name
       from test_cases tc
       left join users assignee on assignee.id = tc.assigned_to
       left join users creator on creator.id = tc.created_by
       left join tc_modules m on m.id = tc.module_id
       left join tc_sub_modules sm on sm.id = tc.sub_module_id
       left join tc_scenarios sc on sc.id = tc.scenario_id
       where tc.id = $1`,
      [created.rows[0].id]
    );

    const stepRows = await client.query("select * from test_steps where test_case_id = $1 order by step_number asc", [created.rows[0].id]);
    return mapTestCase(fullRow.rows[0], stepRows.rows);
  });
}

export async function getTestCase(displayId: string, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return null;
  const result = await query(
    `select tc.*, 
            assignee.name as assigned_to_name, 
            creator.name as created_by_name,
            m.name as module_name,
            sm.name as sub_module_name,
            sc.name as scenario_name
     from test_cases tc
     left join users assignee on assignee.id = tc.assigned_to
     left join users creator on creator.id = tc.created_by
     left join tc_modules m on m.id = tc.module_id
     left join tc_sub_modules sm on sm.id = tc.sub_module_id
     left join tc_scenarios sc on sc.id = tc.scenario_id
     where tc.display_id = $1 and tc.deleted_at is null
       ${projectIds === null ? "" : "and tc.project_id = any($2::uuid[])"}
     limit 1`,
    projectIds === null ? [displayId] : [displayId, projectIds],
  );
  if (!result.rows[0]) return null;
  const steps = await getStepsByCaseIds([result.rows[0].id]);
  return mapTestCase(result.rows[0], steps.get(result.rows[0].id) || []);
}

export async function updateTestCase(displayId: string, payload: any, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return null;
  return transaction(async (client) => {
    const current = await client.query(
      `select * from test_cases
       where display_id = $1 and deleted_at is null
         ${projectIds === null ? "" : "and project_id = any($2::uuid[])"}`,
      projectIds === null ? [displayId] : [displayId, projectIds],
    );
    if (!current.rows[0]) return null;

    let row = current.rows[0];
    const fields: Record<string, unknown> = {};
    if (payload.title !== undefined) fields.title = payload.title;
    if (payload.description !== undefined) fields.description = emptyToNull(payload.description);
    if (payload.type !== undefined) fields.type = payload.type;
    if (payload.severity !== undefined || payload.priority !== undefined) fields.severity = payload.severity ?? payload.priority;
    if (payload.status !== undefined) fields.status = payload.status;
    if (payload.assignedTo !== undefined || payload.assigned_to !== undefined) {
      const assignee = payload.assignedTo ?? payload.assigned_to;
      fields.assigned_to = isUuid(assignee) ? assignee : null;
    }
    if (payload.requirementId !== undefined || payload.requirement_id !== undefined) fields.requirement_id = emptyToNull(payload.requirementId ?? payload.requirement_id);
    if (payload.estimatedTime !== undefined || payload.estimated_time !== undefined) fields.estimated_time = emptyToNull(payload.estimatedTime ?? payload.estimated_time);
    if (payload.environment !== undefined) fields.environment = emptyToNull(payload.environment);
    if (payload.automationStatus !== undefined || payload.automation_status !== undefined) fields.automation_status = emptyToNull(payload.automationStatus ?? payload.automation_status);
    if (payload.preconditions !== undefined) fields.preconditions = emptyToNull(payload.preconditions);
    if (payload.expectedResult !== undefined || payload.expected_result !== undefined) fields.expected_result = payload.expectedResult ?? payload.expected_result;
    if (payload.notes !== undefined) fields.notes = emptyToNull(payload.notes);
    if (payload.category !== undefined) fields.category = payload.category;

    if (payload.moduleId !== undefined || payload.module_id !== undefined) {
      const mId = payload.moduleId ?? payload.module_id;
      fields.module_id = isUuid(mId) ? mId : null;
    }
    if (payload.subModuleId !== undefined || payload.sub_module_id !== undefined) {
      const smId = payload.subModuleId ?? payload.sub_module_id;
      fields.sub_module_id = isUuid(smId) ? smId : null;
    }
    if (payload.scenarioId !== undefined || payload.scenario_id !== undefined) {
      const scId = payload.scenarioId ?? payload.scenario_id;
      fields.scenario_id = isUuid(scId) ? scId : null;
    }

    let moduleId = fields.module_id !== undefined ? fields.module_id : row.module_id;
    if (payload.module !== undefined) {
      const moduleName = normalizeModuleName(payload.module);
      if (moduleName) {
        const existing = await client.query("select id from tc_modules where lower(name) = lower($1) and (project_id = $2 or (project_id is null and $2 is null)) and deleted_at is null", [moduleName, row.project_id]);
        if (existing.rows[0]) {
          moduleId = existing.rows[0].id;
        } else {
          const newModId = randomUUID();
          await client.query("insert into tc_modules (id, name, project_id, created_at, updated_at) values ($1, $2, $3, now(), now())", [newModId, moduleName, row.project_id]);
          moduleId = newModId;
        }
      } else {
        moduleId = null;
      }
      fields.module_id = moduleId;
    }

    let subModuleId = fields.sub_module_id !== undefined ? fields.sub_module_id : row.sub_module_id;
    if (payload.subModule !== undefined || payload.sub_module !== undefined) {
      const subModuleName = normalizeModuleName(payload.subModule ?? payload.sub_module);
      if (subModuleName && moduleId) {
        const existing = await client.query("select id from tc_sub_modules where lower(name) = lower($1) and module_id = $2 and deleted_at is null", [subModuleName, moduleId]);
        if (existing.rows[0]) {
          subModuleId = existing.rows[0].id;
        } else {
          const newSubId = randomUUID();
          await client.query("insert into tc_sub_modules (id, name, module_id, project_id, created_at, updated_at) values ($1, $2, $3, $4, now(), now())", [newSubId, subModuleName, moduleId, row.project_id]);
          subModuleId = newSubId;
        }
      } else {
        subModuleId = null;
      }
      fields.sub_module_id = subModuleId;
    }

    let scenarioId = fields.scenario_id !== undefined ? fields.scenario_id : row.scenario_id;
    if (payload.scenario !== undefined || payload.scenario_name !== undefined) {
      const scenarioName = normalizeModuleName(payload.scenario ?? payload.scenario_name);
      if (scenarioName) {
        const existing = await client.query("select id from tc_scenarios where lower(name) = lower($1) and (project_id = $2 or (project_id is null and $2 is null)) and deleted_at is null", [scenarioName, row.project_id]);
        if (existing.rows[0]) {
          scenarioId = existing.rows[0].id;
        } else {
          const newScenId = randomUUID();
          await client.query("insert into tc_scenarios (id, name, module_id, project_id, created_at, updated_at) values ($1, $2, $3, $4, now(), now())", [newScenId, scenarioName, moduleId, row.project_id]);
          scenarioId = newScenId;
        }
      } else {
        scenarioId = null;
      }
      fields.scenario_id = scenarioId;
    }

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
          `insert into test_steps (id, test_case_id, step_number, action, expected_result, test_data, status, actual_result)
           values ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            randomUUID(),
            row.id,
            index + 1,
            step.action,
            emptyToNull(step.expectedResult || step.expected_result),
            emptyToNull(step.testData || step.test_data),
            step.status || "Not Run",
            emptyToNull(step.actualResult || step.actual_result),
          ],
        );
      }
    }

    const fullRow = await client.query(
      `select tc.*, 
              assignee.name as assigned_to_name, 
              creator.name as created_by_name,
              m.name as module_name,
              sm.name as sub_module_name,
              sc.name as scenario_name
       from test_cases tc
       left join users assignee on assignee.id = tc.assigned_to
       left join users creator on creator.id = tc.created_by
       left join tc_modules m on m.id = tc.module_id
       left join tc_sub_modules sm on sm.id = tc.sub_module_id
       left join tc_scenarios sc on sc.id = tc.scenario_id
       where tc.id = $1`,
      [row.id]
    );

    const stepRows = await client.query("select * from test_steps where test_case_id = $1 order by step_number asc", [row.id]);
    return mapTestCase(fullRow.rows[0], stepRows.rows);
  });
}

export async function deleteTestCase(displayId: string, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return false;
  const result = await query(
    `update test_cases
     set deleted_at = now(), updated_at = now()
     where display_id = $1 and deleted_at is null
       ${projectIds === null ? "" : "and project_id = any($2::uuid[])"}`,
    projectIds === null ? [displayId] : [displayId, projectIds],
  );
  return (result.rowCount || 0) > 0;
}

// --- MODULES CRUD ---

export async function listModules(ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return [];
  
  const result = await query(
    `select m.id, m.name, m.description,
            (select count(*)::integer from tc_sub_modules sm where sm.module_id = m.id and sm.deleted_at is null) as "subModuleCount",
            (select count(*)::integer from test_cases tc where tc.module_id = m.id and tc.deleted_at is null) as "testCaseCount",
            coalesce(
              round(
                (select count(*)::float from test_cases tc 
                 where tc.module_id = m.id and tc.deleted_at is null
                   and not exists (select 1 from test_steps ts where ts.test_case_id = tc.id and ts.status = 'Failed')
                ) / nullif((select count(*)::float from test_cases tc where tc.module_id = m.id and tc.deleted_at is null), 0) * 100
              )::integer,
              100
            ) as "passRate"
     from tc_modules m
     where m.deleted_at is null
       ${projectIds === null ? "" : "and m.project_id = any($1::uuid[])"}
     order by m.name asc`,
    projectIds === null ? [] : [projectIds]
  );
  return result.rows;
}

export async function getModule(id: string, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return null;

  const result = await query(
    `select * from tc_modules 
     where id = $1 and deleted_at is null
       ${projectIds === null ? "" : "and project_id = any($2::uuid[])"}`,
    projectIds === null ? [id] : [id, projectIds]
  );
  return result.rows[0] || null;
}

export async function createModule(payload: { name: string; description?: string }, ctx?: ProjectAccessContext) {
  const projectId = await primaryProjectId(ctx);
  const name = normalizeModuleName(payload.name);
  if (!name) throw new Error("Module name is required");

  const result = await query(
    `insert into tc_modules (id, name, description, project_id, created_at, updated_at)
     values ($1, $2, $3, $4, now(), now())
     returning *`,
    [randomUUID(), name, emptyToNull(payload.description), projectId]
  );
  return result.rows[0];
}

export async function updateModule(id: string, payload: { name?: string; description?: string }, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return null;

  const fields: Record<string, unknown> = {};
  if (payload.name !== undefined) {
    const name = normalizeModuleName(payload.name);
    if (!name) throw new Error("Module name cannot be empty");
    fields.name = name;
  }
  if (payload.description !== undefined) fields.description = emptyToNull(payload.description);

  const entries = Object.entries(fields);
  if (entries.length === 0) return getModule(id, ctx);

  const values = entries.map(([, val]) => val);
  const assignments = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ");
  
  const result = await query(
    `update tc_modules 
     set ${assignments}, updated_at = now() 
     where id = $${entries.length + 1} and deleted_at is null
       ${projectIds === null ? "" : `and project_id = any($${entries.length + 2}::uuid[])`}
     returning *`,
    projectIds === null ? [...values, id] : [...values, id, projectIds]
  );
  return result.rows[0] || null;
}

export async function deleteModule(id: string, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return false;

  const result = await query(
    `update tc_modules 
     set deleted_at = now(), updated_at = now() 
     where id = $1 and deleted_at is null
       ${projectIds === null ? "" : "and project_id = any($2::uuid[])"}`,
    projectIds === null ? [id] : [id, projectIds]
  );
  return (result.rowCount || 0) > 0;
}

// --- SUB-MODULES CRUD ---

export async function getSubModule(id: string, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return null;

  const result = await query(
    `select id, name, description, module_id as "moduleId" 
     from tc_sub_modules 
     where id = $1 and deleted_at is null
       ${projectIds === null ? "" : "and project_id = any($2::uuid[])"}`,
    projectIds === null ? [id] : [id, projectIds]
  );
  return result.rows[0] || null;
}

export async function listSubModules(moduleId: string, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return [];

  const result = await query(
    `select sm.id, sm.name, sm.description, sm.module_id as "moduleId",
            (select count(*)::integer from test_cases tc where tc.sub_module_id = sm.id and tc.deleted_at is null) as "testCaseCount",
            coalesce(
              round(
                (select count(*)::float from test_cases tc 
                 where tc.sub_module_id = sm.id and tc.deleted_at is null
                   and not exists (select 1 from test_steps ts where ts.test_case_id = tc.id and ts.status = 'Failed')
                ) / nullif((select count(*)::float from test_cases tc where tc.sub_module_id = sm.id and tc.deleted_at is null), 0) * 100
              )::integer,
              100
            ) as "passRate"
     from tc_sub_modules sm
     where sm.module_id = $1 and sm.deleted_at is null
       ${projectIds === null ? "" : "and sm.project_id = any($2::uuid[])"}
     order by sm.name asc`,
    projectIds === null ? [moduleId] : [moduleId, projectIds]
  );
  return result.rows;
}

export async function createSubModule(payload: { name: string; description?: string; moduleId: string }, ctx?: ProjectAccessContext) {
  const projectId = await primaryProjectId(ctx);
  const name = normalizeModuleName(payload.name);
  if (!name) throw new Error("Sub-module name is required");
  if (!isUuid(payload.moduleId)) throw new Error("Valid parent moduleId is required");

  const result = await query(
    `insert into tc_sub_modules (id, name, description, module_id, project_id, created_at, updated_at)
     values ($1, $2, $3, $4, $5, now(), now())
     returning id, name, description, module_id as "moduleId"`,
    [randomUUID(), name, emptyToNull(payload.description), payload.moduleId, projectId]
  );
  return result.rows[0];
}

export async function updateSubModule(id: string, payload: { name?: string; description?: string }, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return null;

  const fields: Record<string, unknown> = {};
  if (payload.name !== undefined) {
    const name = normalizeModuleName(payload.name);
    if (!name) throw new Error("Sub-module name cannot be empty");
    fields.name = name;
  }
  if (payload.description !== undefined) fields.description = emptyToNull(payload.description);

  const entries = Object.entries(fields);
  if (entries.length === 0) {
    const existing = await query(`select id, name, description, module_id as "moduleId" from tc_sub_modules where id = $1`, [id]);
    return existing.rows[0] || null;
  }

  const values = entries.map(([, val]) => val);
  const assignments = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ");

  const result = await query(
    `update tc_sub_modules 
     set ${assignments}, updated_at = now() 
     where id = $${entries.length + 1} and deleted_at is null
       ${projectIds === null ? "" : `and project_id = any($${entries.length + 2}::uuid[])`}
     returning id, name, description, module_id as "moduleId"`,
    projectIds === null ? [...values, id] : [...values, id, projectIds]
  );
  return result.rows[0] || null;
}

export async function deleteSubModule(id: string, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return false;

  const result = await query(
    `update tc_sub_modules 
     set deleted_at = now(), updated_at = now() 
     where id = $1 and deleted_at is null
       ${projectIds === null ? "" : "and project_id = any($2::uuid[])"}`,
    projectIds === null ? [id] : [id, projectIds]
  );
  return (result.rowCount || 0) > 0;
}

// --- SCENARIOS CRUD ---

export async function listScenarios(ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return [];

  const result = await query(
    `select sc.id, sc.name, sc.description, 
            sc.module_id as "moduleId", m.name as "moduleName",
            sc.sub_module_id as "subModuleId", sm.name as "subModuleName",
            (select count(*)::integer from test_cases tc where tc.scenario_id = sc.id and tc.deleted_at is null) as "testCaseCount",
            coalesce(
              round(
                (select count(*)::float from test_cases tc 
                 where tc.scenario_id = sc.id and tc.deleted_at is null
                   and not exists (select 1 from test_steps ts where ts.test_case_id = tc.id and ts.status = 'Failed')
                ) / nullif((select count(*)::float from test_cases tc where tc.scenario_id = sc.id and tc.deleted_at is null), 0) * 100
              )::integer,
              100
            ) as "passRate"
     from tc_scenarios sc
     left join tc_modules m on m.id = sc.module_id
     left join tc_sub_modules sm on sm.id = sc.sub_module_id
     where sc.deleted_at is null
       ${projectIds === null ? "" : "and sc.project_id = any($1::uuid[])"}
     order by sc.name asc`,
    projectIds === null ? [] : [projectIds]
  );
  return result.rows;
}

export async function createScenario(payload: { name: string; description?: string; moduleId?: string; subModuleId?: string }, ctx?: ProjectAccessContext) {
  const projectId = await primaryProjectId(ctx);
  const name = normalizeModuleName(payload.name);
  if (!name) throw new Error("Scenario name is required");

  const moduleId = isUuid(payload.moduleId) ? payload.moduleId : null;
  const subModuleId = isUuid(payload.subModuleId) ? payload.subModuleId : null;

  const result = await query(
    `insert into tc_scenarios (id, name, description, module_id, sub_module_id, project_id, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, now(), now())
     returning id, name, description, module_id as "moduleId", sub_module_id as "subModuleId"`,
    [randomUUID(), name, emptyToNull(payload.description), moduleId, subModuleId, projectId]
  );
  return result.rows[0];
}

export async function updateScenario(id: string, payload: { name?: string; description?: string; moduleId?: string | null; subModuleId?: string | null }, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return null;

  const fields: Record<string, unknown> = {};
  if (payload.name !== undefined) {
    const name = normalizeModuleName(payload.name);
    if (!name) throw new Error("Scenario name cannot be empty");
    fields.name = name;
  }
  if (payload.description !== undefined) fields.description = emptyToNull(payload.description);
  if (payload.moduleId !== undefined) {
    fields.module_id = isUuid(payload.moduleId) ? payload.moduleId : null;
  }
  if (payload.subModuleId !== undefined) {
    fields.sub_module_id = isUuid(payload.subModuleId) ? payload.subModuleId : null;
  }

  const entries = Object.entries(fields);
  if (entries.length === 0) {
    const existing = await query(`select id, name, description, module_id as "moduleId", sub_module_id as "subModuleId" from tc_scenarios where id = $1`, [id]);
    return existing.rows[0] || null;
  }

  const values = entries.map(([, val]) => val);
  const assignments = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ");

  const result = await query(
    `update tc_scenarios 
     set ${assignments}, updated_at = now() 
     where id = $${entries.length + 1} and deleted_at is null
       ${projectIds === null ? "" : `and project_id = any($${entries.length + 2}::uuid[])`}
     returning id, name, description, module_id as "moduleId", sub_module_id as "subModuleId"`,
    projectIds === null ? [...values, id] : [...values, id, projectIds]
  );
  return result.rows[0] || null;
}

export async function deleteScenario(id: string, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return false;

  const result = await query(
    `update tc_scenarios 
     set deleted_at = now(), updated_at = now() 
     where id = $1 and deleted_at is null
       ${projectIds === null ? "" : "and project_id = any($2::uuid[])"}`,
    projectIds === null ? [id] : [id, projectIds]
  );
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

export async function listDefects(searchParams: URLSearchParams, ctx?: ProjectAccessContext) {
  const filters = ["deleted_at is null"];
  const values: unknown[] = [];
  const projectIds = await scopedProjectIds(ctx);
  applyProjectScope(filters, values, projectIds, "project_id");
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
  const tags = searchParams.get("tags");
  if (tags) {
    const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (tagsArray.length > 0) {
      const tagConditions = tagsArray.map(tag => {
        const tagPlaceholder = addValue(`%${tag}%`);
        return `EXISTS (SELECT 1 FROM unnest(tags) t WHERE t ilike ${tagPlaceholder})`;
      });
      filters.push(`(${tagConditions.join(' OR ')})`);
    }
  }

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

export async function createDefect(payload: any, ctx?: ProjectAccessContext) {
  const projectId = await primaryProjectId(ctx);
  const result = await transaction(async (client) => {
    const displayId = await nextDisplayId(client, "defects", "CLR-DEF");
    const now = new Date();
    return client.query(
      `insert into defects (
        id, display_id, title, description, severity, status, type, priority, assigned_to,
        reported_by, linked_test_case, linked_test_run, environment, browser,
        steps_to_reproduce, tags, created_at, updated_at, resolved_at, project_id
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20
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
        projectId,
      ],
    );
  });
  return mapDefect(result.rows[0]);
}

export async function getDefect(displayId: string, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return null;
  const result = await query(
    `select * from defects
     where display_id = $1 and deleted_at is null
       ${projectIds === null ? "" : "and project_id = any($2::uuid[])"}
     limit 1`,
    projectIds === null ? [displayId] : [displayId, projectIds],
  );
  if (!result.rows[0]) return null;
  const comments = await query("select * from defect_comments where defect_id = $1 order by created_at asc", [result.rows[0].id]);
  return mapDefect(result.rows[0], comments.rows);
}

export async function updateDefect(displayId: string, payload: any, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return null;
  const current = await query(
    `select * from defects
     where display_id = $1 and deleted_at is null
       ${projectIds === null ? "" : "and project_id = any($2::uuid[])"}
     limit 1`,
    projectIds === null ? [displayId] : [displayId, projectIds],
  );
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
  if (entries.length === 0) return getDefect(displayId, ctx);
  const values = entries.map(([, value]) => value);
  const assignments = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ");
  const updated = await query(
    `update defects set ${assignments}, updated_at = now()
     where display_id = $${entries.length + 1} and deleted_at is null
       ${projectIds === null ? "" : `and project_id = any($${entries.length + 2}::uuid[])`}
     returning *`,
    projectIds === null ? [...values, displayId] : [...values, displayId, projectIds],
  );
  return mapDefect(updated.rows[0]);
}

export async function deleteDefect(displayId: string, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return false;
  const result = await query(
    `update defects
     set deleted_at = now(), updated_at = now()
     where display_id = $1 and deleted_at is null
       ${projectIds === null ? "" : "and project_id = any($2::uuid[])"}`,
    projectIds === null ? [displayId] : [displayId, projectIds],
  );
  return (result.rowCount || 0) > 0;
}

export async function createDefectComment(displayId: string, payload: any, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return null;
  const result = await transaction(async (client) => {
    const defect = await client.query(
      `select * from defects
       where display_id = $1 and deleted_at is null
         ${projectIds === null ? "" : "and project_id = any($2::uuid[])"}
       limit 1`,
      projectIds === null ? [displayId] : [displayId, projectIds],
    );
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

export async function listEnvironments(searchParams: URLSearchParams, ctx?: ProjectAccessContext) {
  const values: unknown[] = [];
  const filters = ["deleted_at is null"];
  const projectIds = await scopedProjectIds(ctx);
  applyProjectScope(filters, values, projectIds, "project_id");
  const status = searchParams.get("status");
  if (status && status.toLowerCase() !== "all") {
    values.push(status);
    filters.push(`status ilike $${values.length}`);
  }
  const whereSql = filters.join(" and ");
  const count = await query<{ total: string }>(`select count(*) as total from environments where ${whereSql}`, values);
  values.push(toInt(searchParams.get("skip"), 0), toInt(searchParams.get("limit"), 100));
  const result = await query(`select * from environments where ${whereSql} order by name asc offset $${values.length - 1} limit $${values.length}`, values);
  return { items: result.rows.map(mapEnvironment), total: Number(count.rows[0]?.total || 0) };
}

export async function createEnvironment(payload: any, ctx?: ProjectAccessContext) {
  const projectId = await primaryProjectId(ctx);
  const result = await query(
    `insert into environments (id, name, url, type, status, last_deployed, version, description, created_at, updated_at, project_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning *`,
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
      projectId,
    ],
  );
  return mapEnvironment(result.rows[0]);
}

export async function getEnvironment(id: string, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return null;
  const result = await query(
    `select * from environments
     where id = $1 and deleted_at is null
       ${projectIds === null ? "" : "and project_id = any($2::uuid[])"}
     limit 1`,
    projectIds === null ? [id] : [id, projectIds],
  );
  return result.rows[0] ? mapEnvironment(result.rows[0]) : null;
}

export async function updateEnvironment(id: string, payload: any, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return null;
  const fields: Record<string, unknown> = {};
  if (payload.name !== undefined) fields.name = payload.name;
  if (payload.url !== undefined) fields.url = payload.url;
  if (payload.type !== undefined) fields.type = payload.type;
  if (payload.status !== undefined) fields.status = payload.status;
  if (payload.lastDeployed !== undefined || payload.last_deployed !== undefined) fields.last_deployed = emptyToNull(payload.lastDeployed ?? payload.last_deployed);
  if (payload.version !== undefined) fields.version = emptyToNull(payload.version);
  if (payload.description !== undefined) fields.description = emptyToNull(payload.description);
  const entries = Object.entries(fields);
  if (entries.length === 0) return getEnvironment(id, ctx);
  const values = entries.map(([, value]) => value);
  const assignments = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ");
  const result = await query(
    `update environments set ${assignments}, updated_at = now()
     where id = $${entries.length + 1} and deleted_at is null
       ${projectIds === null ? "" : `and project_id = any($${entries.length + 2}::uuid[])`}
     returning *`,
    projectIds === null ? [...values, id] : [...values, id, projectIds],
  );
  return result.rows[0] ? mapEnvironment(result.rows[0]) : null;
}

export async function deleteEnvironment(id: string, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return false;
  const result = await query(
    `update environments
     set deleted_at = now(), updated_at = now()
     where id = $1 and deleted_at is null
       ${projectIds === null ? "" : "and project_id = any($2::uuid[])"}`,
    projectIds === null ? [id] : [id, projectIds],
  );
  return (result.rowCount || 0) > 0;
}

function mapProject(row: any) {
  const requirements = row.requirements_count !== undefined ? Number(row.requirements_count) : 0;
  const testCases = row.test_cases_count !== undefined ? Number(row.test_cases_count) : 0;
  const defects = row.defects_count !== undefined ? Number(row.defects_count) : 0;

  // Dynamic quality score calculation
  let qualityScore = 100;
  if (testCases > 0) {
    qualityScore = Math.max(50, Math.min(100, Math.round(((testCases - defects) / testCases) * 100)));
  } else if (defects > 0) {
    qualityScore = Math.max(50, 100 - defects * 10);
  }

  return {
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    description: row.description || undefined,
    priority: row.default_priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status || "Active",
    quality_score: qualityScore,
    metrics: {
      requirements,
      test_cases: testCases,
      defects,
    },
  };
}

async function ensureProjectMembershipSchema() {
  if (!membershipSchemaReady) {
    membershipSchemaReady = (async () => {
      await query("alter table projects add column if not exists owner_id uuid references users(id)");
      await query("drop index if exists ix_projects_prefix");
      await query(
        `create unique index if not exists ix_projects_owner_prefix
         on projects (owner_id, prefix)
         where owner_id is not null and deleted_at is null`,
      );
      await query(
        `create table if not exists project_members (
          project_id uuid not null references projects(id) on delete cascade,
          user_id uuid not null references users(id) on delete cascade,
          role varchar(20) not null default 'Contributor',
          created_at timestamptz not null default now(),
          primary key (project_id, user_id)
        )`,
      );
      await query(
        `with owner_candidate as (
           select id from users
           where lower(email) <> 'guest@clarity.local'
           order by created_at asc
           limit 1
         )
         update projects
         set owner_id = (select id from owner_candidate),
             updated_at = now()
         where owner_id is null
           and exists (select 1 from owner_candidate)`,
      );
      await query(
        `insert into project_members (project_id, user_id, role, created_at)
         select id, owner_id, 'Contributor', now()
         from projects
         where owner_id is not null
         on conflict (project_id, user_id) do nothing`,
      );
    })();
  }
  return membershipSchemaReady;
}

async function addProjectMember(projectId: string, userId: string, role = "Contributor") {
  await query(
    `insert into project_members (project_id, user_id, role, created_at)
     values ($1, $2, $3, now())
     on conflict (project_id, user_id) do update set role = excluded.role`,
    [projectId, userId, role],
  );
}

async function claimProjectForUser(projectId: string, userId: string) {
  const current = await query("select owner_id from projects where id = $1 and deleted_at is null limit 1", [projectId]);
  if (!current.rows[0]) return false;
  if (!current.rows[0].owner_id) {
    await query("update projects set owner_id = $1, updated_at = now() where id = $2 and owner_id is null", [userId, projectId]);
  }
  await addProjectMember(projectId, userId);
  return true;
}

async function claimFirstUnownedProject(userId: string) {
  await query(
    `insert into project_members (project_id, user_id, role, created_at)
     select id, owner_id, 'Contributor', now()
     from projects
     where owner_id = $1 and deleted_at is null
     on conflict (project_id, user_id) do nothing`,
    [userId],
  );
}

async function canAccessProject(projectId: string, userId?: string | null, isGuest = false) {
  if (isGuest || !userId || userId === "guest-user") return false;
  await ensureProjectMembershipSchema();
  const result = await query<{ exists: boolean }>(
    `select exists (
      select 1
      from projects p
      left join project_members pm on pm.project_id = p.id
      where p.id = $1
        and p.deleted_at is null
        and (p.owner_id = $2 or pm.user_id = $2)
    ) as exists`,
    [projectId, userId],
  );
  if (result.rows[0]?.exists) {
    await claimProjectForUser(projectId, userId);
    return true;
  }
  return false;
}

export async function listProjects(searchParams: URLSearchParams, userId?: string | null, isGuest = false) {
  if (!userId || isGuest || userId === "guest-user") {
    return { items: [], total: 0 };
  }

  await ensureProjectMembershipSchema();
  await claimFirstUnownedProject(userId);

  const count = await query<{ total: string }>(
    `select count(distinct p.id) as total
     from projects p
     left join project_members pm on pm.project_id = p.id
     where p.deleted_at is null
       and (p.owner_id = $1 or pm.user_id = $1)`,
    [userId],
  );
  const result = await query(
    `select distinct p.*,
       (select count(*) from requirements r where r.project_id = p.id and r.deleted_at is null) as requirements_count,
       (select count(*) from test_cases tc where tc.project_id = p.id and tc.deleted_at is null) as test_cases_count,
       (select count(*) from defects d where d.project_id = p.id and d.deleted_at is null) as defects_count
     from projects p
     left join project_members pm on pm.project_id = p.id
     where p.deleted_at is null
       and (p.owner_id = $1 or pm.user_id = $1)
     order by p.updated_at desc
     offset $2 limit $3`,
    [userId, toInt(searchParams.get("skip"), 0), toInt(searchParams.get("limit"), 100)],
  );
  return { items: result.rows.map(mapProject), total: Number(count.rows[0]?.total || 0) };
}

export async function createProject(payload: any, userId?: string | null, isGuest = false) {
  const now = new Date();
  const shouldOwn = Boolean(userId && !isGuest && userId !== "guest-user");
  if (shouldOwn) await ensureProjectMembershipSchema();

  const fields: Record<string, unknown> = {
    id: randomUUID(),
    name: payload.name,
    prefix: payload.prefix,
    description: emptyToNull(payload.description),
    default_priority: payload.priority || payload.defaultPriority || "Medium",
    created_at: now,
    updated_at: now,
  };
  if (shouldOwn) fields.owner_id = userId;

  const entries = Object.entries(fields);
  const result = await query(
    `insert into projects (${entries.map(([key]) => key).join(", ")})
     values (${entries.map((_, index) => `$${index + 1}`).join(", ")})
     returning *`,
    entries.map(([, value]) => value),
  );
  if (shouldOwn) await addProjectMember(result.rows[0].id, userId!);
  return mapProject(result.rows[0]);
}

export async function getProject(id: string, userId?: string | null, isGuest = false) {
  if (!(await canAccessProject(id, userId, isGuest))) return null;
  const result = await query("select * from projects where id = $1 and deleted_at is null limit 1", [id]);
  return result.rows[0] ? mapProject(result.rows[0]) : null;
}

export async function updateProject(id: string, payload: any, userId?: string | null, isGuest = false) {
  if (!(await canAccessProject(id, userId, isGuest))) return null;
  const fields: Record<string, unknown> = {};
  if (payload.name !== undefined) fields.name = payload.name;
  if (payload.prefix !== undefined) fields.prefix = payload.prefix;
  if (payload.description !== undefined) fields.description = emptyToNull(payload.description);
  if (payload.priority !== undefined || payload.default_priority !== undefined || payload.defaultPriority !== undefined) {
    fields.default_priority = payload.priority ?? payload.default_priority ?? payload.defaultPriority;
  }
  const entries = Object.entries(fields);
  if (entries.length === 0) return getProject(id, userId, isGuest);
  const values = entries.map(([, value]) => value);
  const assignments = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ");
  const result = await query(`update projects set ${assignments}, updated_at = now() where id = $${entries.length + 1} and deleted_at is null returning *`, [...values, id]);
  return result.rows[0] ? mapProject(result.rows[0]) : null;
}

export async function deleteProject(id: string, userId?: string | null, isGuest = false) {
  if (!(await canAccessProject(id, userId, isGuest))) return false;
  const result = await query("update projects set deleted_at = now(), updated_at = now() where id = $1 and deleted_at is null", [id]);
  return (result.rowCount || 0) > 0;
}

export async function listProjectMembers(projectId: string, userId?: string | null, isGuest = false) {
  if (isGuest || !userId || userId === "guest-user") return [];
  if (!(await canAccessProject(projectId, userId, isGuest))) return [];
  const result = await query(
    `select distinct u.id, u.name, u.email, coalesce(pm.role, u.role) as role, u.avatar, u.initials
     from users u
     join (
       select owner_id as user_id, 'Contributor'::varchar as role
       from projects
       where id = $1 and owner_id is not null
       union
       select user_id, role from project_members where project_id = $1
     ) pm on pm.user_id = u.id
     order by u.name asc`,
    [projectId],
  );
  return result.rows;
}

export async function inviteProjectMember(projectId: string, email: string, userId?: string | null) {
  if (!userId || userId === "guest-user" || !(await canAccessProject(projectId, userId, false))) {
    throw new Error("Project not found");
  }
  const member = await query(
    "select id, name, email, role, avatar, initials from users where lower(email) = lower($1) limit 1",
    [email.trim()],
  );
  if (!member.rows[0]) {
    throw new Error("User must sign in to this platform before they can be invited.");
  }
  await addProjectMember(projectId, member.rows[0].id);
  return { ...member.rows[0], role: "Contributor" };
}

export async function listReleases(ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return { items: [], total: 0 };

  const tests = await query<{ id: string, display_id: string, module: string, status: string }>(
    `select id, display_id, module, status from test_cases
     where deleted_at is null
       ${projectIds === null ? "" : "and project_id = any($1::uuid[])"}`,
    projectIds === null ? [] : [projectIds],
  );

  const moduleGroups = new Map<string, { display_name: string; test_ids: string[]; passed_count: number; total_count: number }>();
  for (const tc of tests.rows) {
    const modName = normalizeModuleName(tc.module) || "General";
    const modKey = modName.toLowerCase();
    if (!moduleGroups.has(modKey)) {
      moduleGroups.set(modKey, { display_name: modName, test_ids: [], passed_count: 0, total_count: 0 });
    }
    const group = moduleGroups.get(modKey)!;
    group.test_ids.push(tc.display_id);
    group.total_count++;
    if (["Approved", "Ready"].includes(tc.status)) group.passed_count++;
  }

  const items = [];
  let index = 0;
  for (const group of moduleGroups.values()) {
    const testIds = group.test_ids;
    const defects = testIds.length
      ? await query(
          `select severity, status from defects
           where deleted_at is null and linked_test_case = any($1::text[])
             ${projectIds === null ? "" : "and project_id = any($2::uuid[])"}`,
          projectIds === null ? [testIds] : [testIds, projectIds],
        )
      : { rows: [] };
    const openDefects = defects.rows.filter((item: any) => ["Open", "In Progress", "Blocked", "Reopened"].includes(item.status)).length;
    const criticalDefects = defects.rows.filter((item: any) => item.severity === "Critical").length;

    items.push({
      id: `module-${++index}`,
      version: `${group.display_name.slice(0, 3).toUpperCase()}-REL`,
      name: `${group.display_name} Module`,
      status: group.total_count > 0 && group.passed_count === group.total_count ? "Released" : group.passed_count > 0 ? "In Progress" : "Planning",
      startDate: new Date().toISOString().slice(0, 10),
      targetDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      description: `Aggregated release readiness for the ${group.display_name} module based on current test cases.`,
      totalTestCases: group.total_count,
      passedTestCases: group.passed_count,
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
    testCaseId: row.test_case_id || undefined,
    defectId: row.defect_id || undefined,
    dueIn: row.due_in || undefined,
    createdAt: row.created_at,
  };
}

export async function listWorkItems(searchParams: URLSearchParams, ctx?: ProjectAccessContext) {
  const filters = ["deleted_at is null"];
  const values: unknown[] = [];
  const projectIds = await scopedProjectIds(ctx);
  applyProjectScope(filters, values, projectIds, "project_id");
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

async function getWorkItemColumns() {
  const result = await query<{ column_name: string }>(
    `select column_name
     from information_schema.columns
     where table_name = 'work_items'
       and column_name in ('test_case_id', 'defect_id')`,
  );
  return new Set(result.rows.map((row) => row.column_name));
}

function workItemFields(payload: any, relationColumns: Set<string>, partial = false) {
  const fields: Record<string, unknown> = {};
  const has = (...keys: string[]) => keys.some((key) => Object.prototype.hasOwnProperty.call(payload, key));
  const add = (key: string, value: unknown, fallback?: unknown) => {
    if (value !== undefined) fields[key] = value;
    else if (!partial && fallback !== undefined) fields[key] = fallback;
  };

  add("title", payload.title);
  add("type", payload.type, "Task");
  add("status", payload.status, "To Do");
  add("priority", payload.priority, "Medium");
  add("progress", payload.progress, 0);
  if (has("scope") || !partial) fields.scope = emptyToNull(payload.scope);
  add("assigned_to", payload.assignedTo ?? payload.assigned_to, "Unassigned");
  if (has("dueIn", "due_in") || !partial) fields.due_in = emptyToNull(payload.dueIn ?? payload.due_in);

  const testCaseId = payload.testCaseId ?? payload.test_case_id;
  const hasTestCaseId = has("testCaseId", "test_case_id");
  if (relationColumns.has("test_case_id") && (isUuid(testCaseId) || (hasTestCaseId && testCaseId === null) || (!partial && testCaseId === undefined))) {
    fields.test_case_id = emptyToNull(testCaseId);
  }

  const defectId = payload.defectId ?? payload.defect_id;
  const hasDefectId = has("defectId", "defect_id");
  if (relationColumns.has("defect_id") && (isUuid(defectId) || (hasDefectId && defectId === null) || (!partial && defectId === undefined))) {
    fields.defect_id = emptyToNull(defectId);
  }

  return fields;
}

export async function createWorkItem(payload: any, ctx?: ProjectAccessContext) {
  if (!payload.title || String(payload.title).trim().length < 2) {
    throw new Error("Work item title is required.");
  }

  const projectId = await primaryProjectId(ctx);
  const relationColumns = await getWorkItemColumns();
  const now = new Date();
  const fields = {
    id: randomUUID(),
    ...workItemFields(payload, relationColumns),
    project_id: projectId,
    created_at: now,
    updated_at: now,
  };
  const entries = Object.entries(fields);
  const columns = entries.map(([key]) => key).join(", ");
  const placeholders = entries.map((_, index) => `$${index + 1}`).join(", ");
  const values = entries.map(([, value]) => value);
  const result = await query(
    `insert into work_items (${columns}) values (${placeholders}) returning *`,
    values,
  );
  return mapWorkItem(result.rows[0]);
}

export async function getWorkItem(id: string, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return null;
  const result = await query(
    `select * from work_items
     where id = $1 and deleted_at is null
       ${projectIds === null ? "" : "and project_id = any($2::uuid[])"}
     limit 1`,
    projectIds === null ? [id] : [id, projectIds],
  );
  return result.rows[0] ? mapWorkItem(result.rows[0]) : null;
}

export async function updateWorkItem(id: string, payload: any, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return null;
  const relationColumns = await getWorkItemColumns();
  const fields = workItemFields(payload, relationColumns, true);
  const entries = Object.entries(fields);
  if (entries.length === 0) return getWorkItem(id, ctx);

  const values = entries.map(([, value]) => value);
  const assignments = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ");
  const result = await query(
    `update work_items
     set ${assignments}, updated_at = now()
     where id = $${entries.length + 1} and deleted_at is null
       ${projectIds === null ? "" : `and project_id = any($${entries.length + 2}::uuid[])`}
     returning *`,
    projectIds === null ? [...values, id] : [...values, id, projectIds],
  );
  return result.rows[0] ? mapWorkItem(result.rows[0]) : null;
}

export async function deleteWorkItem(id: string, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return false;
  const result = await query(
    `update work_items
     set deleted_at = now(), updated_at = now()
     where id = $1 and deleted_at is null
       ${projectIds === null ? "" : "and project_id = any($2::uuid[])"}`,
    projectIds === null ? [id] : [id, projectIds],
  );
  return (result.rowCount || 0) > 0;
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

export async function listActivity(searchParams: URLSearchParams, ctx?: ProjectAccessContext) {
  const filters = ["1 = 1"];
  const values: unknown[] = [];
  const projectIds = await scopedProjectIds(ctx);
  applyProjectScope(filters, values, projectIds, "project_id");
  const whereSql = filters.join(" and ");
  const count = await query<{ total: string }>(`select count(*) as total from activity_items where ${whereSql}`, values);
  values.push(toInt(searchParams.get("skip"), 0), toInt(searchParams.get("limit"), 100));
  const result = await query(
    `select * from activity_items
     where ${whereSql}
     order by created_at desc offset $${values.length - 1} limit $${values.length}`,
    values,
  );
  return { items: result.rows.map(mapActivity), total: Number(count.rows[0]?.total || 0) };
}

export async function createActivity(payload: any, ctx?: ProjectAccessContext) {
  const projectId = await primaryProjectId(ctx);
  const result = await query(
    `insert into activity_items (id, "user", user_initials, action, target_type, target_id, target_title, detail, created_at, project_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
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
      projectId,
    ],
  );
  return mapActivity(result.rows[0]);
}

let requirementsSchemaReady: Promise<void> | null = null;

async function ensureRequirementsSchema() {
  if (!requirementsSchemaReady) {
    requirementsSchemaReady = (async () => {
      await ensureProjectMembershipSchema();
      await query(
        `create table if not exists requirements (
          id uuid primary key,
          display_id varchar(20) not null unique,
          title varchar(200) not null,
          description text,
          acceptance_criteria text,
          business_rules text,
          module varchar(100) not null,
          type varchar(50) not null,
          priority varchar(20) not null,
          status varchar(20) not null default 'Draft',
          created_by_id uuid references users(id),
          project_id uuid references projects(id) on delete cascade,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )`,
      );
      await query("alter table requirements add column if not exists acceptance_criteria text");
      await query("alter table requirements add column if not exists business_rules text");
      await query("alter table requirements add column if not exists created_by_id uuid references users(id)");
      await query("alter table requirements add column if not exists project_id uuid references projects(id) on delete cascade");
      await query("create index if not exists ix_requirements_project_id on requirements (project_id)");
      await query("create index if not exists ix_requirements_status on requirements (status)");
      await query(
        `create table if not exists requirement_test_cases (
          requirement_id uuid not null references requirements(id) on delete cascade,
          test_case_id uuid not null references test_cases(id) on delete cascade,
          created_at timestamptz not null default now(),
          primary key (requirement_id, test_case_id)
        )`,
      );
      await query(
        `create table if not exists requirement_comments (
          id uuid primary key,
          requirement_id uuid not null references requirements(id) on delete cascade,
          user_id uuid not null references users(id),
          content text not null,
          created_at timestamptz not null default now()
        )`,
      );
    })();
  }
  return requirementsSchemaReady;
}

async function tableExists(tableName: string) {
  const result = await query<{ exists: boolean }>(
    `select exists (
       select 1 from information_schema.tables
       where table_schema = 'public' and table_name = $1
     ) as exists`,
    [tableName],
  );
  return Boolean(result.rows[0]?.exists);
}

function mapRequirement(row: any) {
  return {
    id: row.display_id,
    realId: row.id,
    displayId: row.display_id,
    title: row.title,
    description: row.description || undefined,
    acceptanceCriteria: row.acceptance_criteria || undefined,
    businessRules: row.business_rules || undefined,
    module: row.module,
    type: row.type,
    priority: row.priority,
    status: row.status,
    createdById: row.created_by_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function requirementFields(payload: any, partial = false) {
  const fields: Record<string, unknown> = {};
  const has = (...keys: string[]) => keys.some((key) => Object.prototype.hasOwnProperty.call(payload, key));
  const add = (key: string, value: unknown, fallback?: unknown) => {
    if (value !== undefined) fields[key] = value;
    else if (!partial && fallback !== undefined) fields[key] = fallback;
  };

  add("title", payload.title);
  if (has("description") || !partial) fields.description = emptyToNull(payload.description);
  if (has("acceptanceCriteria", "acceptance_criteria") || !partial) fields.acceptance_criteria = emptyToNull(payload.acceptanceCriteria ?? payload.acceptance_criteria);
  if (has("businessRules", "business_rules") || !partial) fields.business_rules = emptyToNull(payload.businessRules ?? payload.business_rules);

  const mod = normalizeModuleName(payload.module);
  if (mod !== null || !partial) add("module", mod);

  add("type", payload.type, "Functional");
  add("priority", payload.priority, "Medium");
  add("status", payload.status, "Draft");
  return fields;
}

export async function listRequirements(searchParams: URLSearchParams, ctx?: ProjectAccessContext) {
  await ensureRequirementsSchema();
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return { items: [], total: 0 };

  const filters = ["1 = 1"];
  const values: unknown[] = [];
  applyProjectScope(filters, values, projectIds, "project_id");
  const addValue = (value: unknown) => {
    values.push(value);
    return `$${values.length}`;
  };

  const search = searchParams.get("search");
  if (search) {
    const placeholder = addValue(`%${search}%`);
    filters.push(`(title ilike ${placeholder} or module ilike ${placeholder} or display_id ilike ${placeholder})`);
  }
  const status = searchParams.get("status");
  if (status && status.toLowerCase() !== "all") filters.push(`status ilike ${addValue(status)}`);

  const whereSql = filters.join(" and ");
  const count = await query<{ total: string }>(`select count(*) as total from requirements where ${whereSql}`, values);
  const offset = addValue(toInt(searchParams.get("skip"), 0));
  const limit = addValue(toInt(searchParams.get("limit"), 100));
  const result = await query(
    `select * from requirements
     where ${whereSql}
     order by updated_at desc
     offset ${offset} limit ${limit}`,
    values,
  );
  return { items: result.rows.map(mapRequirement), total: Number(count.rows[0]?.total || 0) };
}

export async function createRequirement(payload: any, ctx?: ProjectAccessContext) {
  if (!payload.title || String(payload.title).trim().length < 2) {
    throw new Error("Requirement title is required.");
  }
  await ensureRequirementsSchema();
  const projectId = await primaryProjectId(ctx);
  const now = new Date();
  const prefix = await getProjectPrefix({ query } as DbClient, projectId);
  const displayId = await nextDisplayId({ query } as DbClient, "requirements", `${prefix}-REQ`);
  const fields = {
    id: randomUUID(),
    display_id: displayId,
    ...requirementFields(payload),
    created_by_id: ctx?.userId && ctx.userId !== "guest-user" ? ctx.userId : null,
    project_id: projectId,
    created_at: now,
    updated_at: now,
  };
  const entries = Object.entries(fields);
  const result = await query(
    `insert into requirements (${entries.map(([key]) => key).join(", ")})
     values (${entries.map((_, index) => `$${index + 1}`).join(", ")})
     returning *`,
    entries.map(([, value]) => value),
  );
  return mapRequirement(result.rows[0]);
}

export async function getRequirement(id: string, ctx?: ProjectAccessContext) {
  await ensureRequirementsSchema();
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return null;
  const result = await query(
    `select * from requirements
     where (display_id = $1 or id::text = $1)
       ${projectIds === null ? "" : "and project_id = any($2::uuid[])"}
     limit 1`,
    projectIds === null ? [id] : [id, projectIds],
  );
  return result.rows[0] ? mapRequirement(result.rows[0]) : null;
}

export async function updateRequirement(id: string, payload: any, ctx?: ProjectAccessContext) {
  await ensureRequirementsSchema();
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return null;
  const fields = requirementFields(payload, true);
  const entries = Object.entries(fields);
  if (entries.length === 0) return getRequirement(id, ctx);

  const values = entries.map(([, value]) => value);
  const assignments = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ");
  const result = await query(
    `update requirements
     set ${assignments}, updated_at = now()
     where (display_id = $${entries.length + 1} or id::text = $${entries.length + 1})
       ${projectIds === null ? "" : `and project_id = any($${entries.length + 2}::uuid[])`}
     returning *`,
    projectIds === null ? [...values, id] : [...values, id, projectIds],
  );
  return result.rows[0] ? mapRequirement(result.rows[0]) : null;
}

export async function listRequirementTestCases(id: string, ctx?: ProjectAccessContext) {
  await ensureRequirementsSchema();
  const requirement = await getRequirement(id, ctx);
  if (!requirement?.realId) return null;
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return [];
  const result = await query(
    `select tc.id, tc.display_id, tc.title, tc.module, tc.severity, tc.status, tc.type
     from test_cases tc
     join requirement_test_cases rtc on rtc.test_case_id = tc.id
     where rtc.requirement_id = $1
       and tc.deleted_at is null
       ${projectIds === null ? "" : "and tc.project_id = any($2::uuid[])"}
     order by tc.display_id asc`,
    projectIds === null ? [requirement.realId] : [requirement.realId, projectIds],
  );
  return result.rows.map((row: any) => ({
    id: row.display_id,
    realId: row.id,
    displayId: row.display_id,
    title: row.title,
    module: row.module,
    severity: row.severity,
    status: row.status,
    type: row.type,
  }));
}

export async function linkRequirementTestCase(requirementId: string, testCaseId: string, ctx?: ProjectAccessContext) {
  await ensureRequirementsSchema();
  const requirement = await getRequirement(requirementId, ctx);
  if (!requirement?.realId) return null;
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return null;
  const testCase = await query(
    `select id from test_cases
     where (display_id = $1 or id::text = $1)
       and deleted_at is null
       ${projectIds === null ? "" : "and project_id = any($2::uuid[])"}
     limit 1`,
    projectIds === null ? [testCaseId] : [testCaseId, projectIds],
  );
  if (!testCase.rows[0]) return null;
  await query(
    `insert into requirement_test_cases (requirement_id, test_case_id, created_at)
     values ($1, $2, now())
     on conflict (requirement_id, test_case_id) do nothing`,
    [requirement.realId, testCase.rows[0].id],
  );
  return { requirementId: requirement.displayId, testCaseId };
}

export async function unlinkRequirementTestCase(requirementId: string, testCaseId: string, ctx?: ProjectAccessContext) {
  await ensureRequirementsSchema();
  const requirement = await getRequirement(requirementId, ctx);
  if (!requirement?.realId) return false;
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return false;
  const testCase = await query(
    `select id from test_cases
     where (display_id = $1 or id::text = $1)
       ${projectIds === null ? "" : "and project_id = any($2::uuid[])"}
     limit 1`,
    projectIds === null ? [testCaseId] : [testCaseId, projectIds],
  );
  if (!testCase.rows[0]) return false;
  const result = await query(
    "delete from requirement_test_cases where requirement_id = $1 and test_case_id = $2",
    [requirement.realId, testCase.rows[0].id],
  );
  return (result.rowCount || 0) > 0;
}

export async function listRequirementComments(id: string, ctx?: ProjectAccessContext) {
  await ensureRequirementsSchema();
  const requirement = await getRequirement(id, ctx);
  if (!requirement?.realId) return null;
  const result = await query(
    `select rc.id, rc.user_id, rc.content, rc.created_at, u.name as user_name
     from requirement_comments rc
     left join users u on u.id = rc.user_id
     where rc.requirement_id = $1
     order by rc.created_at desc`,
    [requirement.realId],
  );
  return result.rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || undefined,
    content: row.content,
    createdAt: row.created_at,
  }));
}

export async function createRequirementComment(id: string, content: string, ctx?: ProjectAccessContext) {
  await ensureRequirementsSchema();
  if (!ctx?.userId || ctx.isGuest || ctx.userId === "guest-user") return null;
  const requirement = await getRequirement(id, ctx);
  if (!requirement?.realId) return null;
  const result = await query(
    `insert into requirement_comments (id, requirement_id, user_id, content, created_at)
     values ($1, $2, $3, $4, now())
     returning id, user_id, content, created_at`,
    [randomUUID(), requirement.realId, ctx.userId, content],
  );
  return {
    id: result.rows[0].id,
    userId: result.rows[0].user_id,
    content: result.rows[0].content,
    createdAt: result.rows[0].created_at,
  };
}

function mapTestRun(row: any) {
  return {
    id: row.display_id,
    realId: row.id,
    displayId: row.display_id,
    name: row.name,
    description: row.description || undefined,
    type: row.type || "Manual",
    triggerType: row.trigger_type || "Manual",
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
    updatedAt: row.updated_at,
  };
}

export async function listTestRuns(searchParams: URLSearchParams, ctx?: ProjectAccessContext) {
  const values: unknown[] = [];
  const filters = ["deleted_at is null"];
  const projectIds = await scopedProjectIds(ctx);
  applyProjectScope(filters, values, projectIds, "project_id");
  const status = searchParams.get("status");
  if (status && status.toLowerCase() !== "all") {
    values.push(status);
    filters.push(`status ilike $${values.length}`);
  }
  const whereSql = filters.join(" and ");
  const count = await query<{ total: string }>(`select count(*) as total from test_runs where ${whereSql}`, values);
  values.push(toInt(searchParams.get("skip"), 0), toInt(searchParams.get("limit"), 100));
  const result = await query(`select * from test_runs where ${whereSql} order by updated_at desc offset $${values.length - 1} limit $${values.length}`, values);
  return { items: result.rows.map(mapTestRun), total: Number(count.rows[0]?.total || 0) };
}

export async function createTestRun(payload: any, ctx?: ProjectAccessContext) {
  const projectId = await primaryProjectId(ctx);
  return transaction(async (client) => {
    const prefix = await getProjectPrefix(client, projectId);
    const displayId = await nextDisplayId(client, "test_runs", `${prefix}-RUN`);
    
    // Count how many test cases we have in the project
    const tcCountResult = await client.query(
      "select count(*)::integer as count from test_cases where project_id = $1 and deleted_at is null",
      [projectId]
    );
    const totalCases = tcCountResult.rows[0]?.count || 0;
    
    const id = randomUUID();
    const result = await client.query(
      `insert into test_runs (
        id, display_id, name, description, status, environment, release, 
        assigned_to, total_cases, passed, failed, blocked, not_run, 
        created_at, updated_at, project_id
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, 0, 0, $9, now(), now(), $10)
      returning *`,
      [
        id,
        displayId,
        payload.name || "Unnamed Run",
        payload.description || "",
        "Not Started",
        payload.environment || "Staging",
        payload.release || "",
        payload.assignedTo || "Guest User",
        totalCases,
        projectId
      ]
    );
    return mapTestRun(result.rows[0]);
  });
}

export async function getTestRun(id: string, ctx?: ProjectAccessContext) {
  const projectIds = await scopedProjectIds(ctx);
  if (projectIds !== null && projectIds.length === 0) return null;
  const result = await query(
    `select * from test_runs
     where (display_id = $1 or id::text = $1)
       and deleted_at is null
       ${projectIds === null ? "" : "and project_id = any($2::uuid[])"}
     limit 1`,
    projectIds === null ? [id] : [id, projectIds],
  );
  return result.rows[0] ? mapTestRun(result.rows[0]) : null;
}

export async function updateTestRunStatus(id: string, status: "Running" | "Aborted" | "Completed", ctx?: ProjectAccessContext) {
  const testRun = await getTestRun(id, ctx);
  if (!testRun?.realId) return null;
  const fields: Record<string, unknown> = { status };
  if (status === "Running") {
    fields.started_at = testRun.startedAt || new Date();
    fields.completed_at = null;
  }
  if (status === "Aborted" || status === "Completed") fields.completed_at = new Date();
  const entries = Object.entries(fields);
  const result = await query(
    `update test_runs
     set ${entries.map(([key], index) => `${key} = $${index + 1}`).join(", ")}, updated_at = now()
     where id = $${entries.length + 1}
     returning *`,
    [...entries.map(([, value]) => value), testRun.realId],
  );
  return result.rows[0] ? mapTestRun(result.rows[0]) : null;
}

export async function updateTestRun(id: string, payload: any, ctx?: ProjectAccessContext) {
  const testRun = await getTestRun(id, ctx);
  if (!testRun?.realId) return null;
  
  const fields: Record<string, unknown> = {};
  if (payload.status !== undefined) fields.status = payload.status;
  if (payload.passed !== undefined) fields.passed = payload.passed;
  if (payload.failed !== undefined) fields.failed = payload.failed;
  if (payload.blocked !== undefined) fields.blocked = payload.blocked;
  if (payload.notRun !== undefined || payload.not_run !== undefined) fields.not_run = payload.notRun ?? payload.not_run;
  if (payload.totalCases !== undefined || payload.total_cases !== undefined) fields.total_cases = payload.totalCases ?? payload.total_cases;
  if (payload.completedAt !== undefined || payload.completed_at !== undefined) fields.completed_at = payload.completedAt ?? payload.completed_at;
  
  if (Object.keys(fields).length === 0) return testRun;
  
  const entries = Object.entries(fields);
  const assignments = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ");
  const result = await query(
    `update test_runs
     set ${assignments}, updated_at = now()
     where id = $${entries.length + 1}
     returning *`,
    [...entries.map(([, value]) => value), testRun.realId],
  );
  return result.rows[0] ? mapTestRun(result.rows[0]) : null;
}

export async function listTestRunEvidence(id: string, ctx?: ProjectAccessContext) {
  const testRun = await getTestRun(id, ctx);
  if (!testRun?.realId) return null;
  if (!(await tableExists("test_run_evidence"))) return [];
  const result = await query(
    `select id, type, file_url, details, created_at
     from test_run_evidence
     where test_run_id = $1
     order by created_at desc`,
    [testRun.realId],
  );
  return result.rows.map((row: any) => ({
    id: row.id,
    type: row.type,
    fileUrl: row.file_url,
    details: row.details || undefined,
    createdAt: row.created_at,
  }));
}

export async function listUsers() {
  const result = await query("select id, name, email, role, avatar, initials from users order by name asc");
  return result.rows;
}

function initialsFromIdentity(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = (parts[0]?.[0] || email[0] || "U") + (parts.length > 1 ? parts[parts.length - 1][0] : "");
  return initials.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 2) || "U";
}

async function getUserColumns() {
  const result = await query<{ column_name: string }>(
    `select column_name
     from information_schema.columns
     where table_name = 'users'`,
  );
  return new Set(result.rows.map((row) => row.column_name));
}

export async function syncGoogleUser(payload: {
  googleId: string;
  email: string;
  name: string;
  avatar?: string | null;
}) {
  if (!payload.googleId || !payload.email || !payload.name) {
    throw new Error("Google profile is incomplete.");
  }

  const columns = await getUserColumns();
  const now = new Date();
  const existingSql = columns.has("google_id")
    ? "select * from users where email = $1 or google_id = $2 limit 1"
    : "select * from users where email = $1 limit 1";
  const existingValues = columns.has("google_id")
    ? [payload.email, payload.googleId]
    : [payload.email];
  const existing = await query(existingSql, existingValues);

  if (existing.rows[0]) {
    const fields: Record<string, unknown> = {
      name: payload.name,
      role: "Contributor",
      avatar: null,
      initials: initialsFromIdentity(payload.name, payload.email),
    };
    if (columns.has("google_id")) fields.google_id = payload.googleId;
    if (columns.has("email_verified")) fields.email_verified = true;
    if (columns.has("is_active")) fields.is_active = true;
    if (columns.has("last_login")) fields.last_login = now;
    if (columns.has("updated_at")) fields.updated_at = now;

    const entries = Object.entries(fields);
    const assignments = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ");
    const updated = await query(
      `update users set ${assignments} where id = $${entries.length + 1} returning id, name, email, role, avatar, initials`,
      [...entries.map(([, value]) => value), existing.rows[0].id],
    );
    return updated.rows[0];
  }

  const fields: Record<string, unknown> = {
    id: randomUUID(),
    name: payload.name,
    email: payload.email,
    role: "Contributor",
    avatar: null,
    initials: initialsFromIdentity(payload.name, payload.email),
    created_at: now,
  };
  if (columns.has("google_id")) fields.google_id = payload.googleId;
  if (columns.has("email_verified")) fields.email_verified = true;
  if (columns.has("is_active")) fields.is_active = true;
  if (columns.has("last_login")) fields.last_login = now;
  if (columns.has("updated_at")) fields.updated_at = now;

  const entries = Object.entries(fields);
  const insertColumns = entries.map(([key]) => key).join(", ");
  const placeholders = entries.map((_, index) => `$${index + 1}`).join(", ");
  const inserted = await query(
    `insert into users (${insertColumns}) values (${placeholders}) returning id, name, email, role, avatar, initials`,
    entries.map(([, value]) => value),
  );
  return inserted.rows[0];
}

export async function ensureGuestSeedData() {
  return {
    seeded: false,
    message: "Guest data is served from isolated fixtures and is never written to NeonDB.",
  };
}

