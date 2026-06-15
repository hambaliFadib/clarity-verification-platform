import { query } from "@/lib/server/db";
import { getAccessibleProjectIds, type ProjectAccessContext } from "@/lib/server/qa-repository";

const entityTables = {
  requirement: "requirements",
  test_run: "test_runs",
  release: "releases",
  test_case: "test_cases",
  defect: "defects",
} as const;

type ApprovalEntityType = keyof typeof entityTables;

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeEntityType(value: string | null | undefined): ApprovalEntityType | null {
  if (!value) return null;
  return Object.prototype.hasOwnProperty.call(entityTables, value)
    ? (value as ApprovalEntityType)
    : null;
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

async function tableHasColumn(tableName: string, columnName: string) {
  const result = await query<{ exists: boolean }>(
    `select exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = $1 and column_name = $2
     ) as exists`,
    [tableName, columnName],
  );
  return Boolean(result.rows[0]?.exists);
}

async function approvalTablesReady() {
  return (await tableExists("approval_gates")) && (await tableExists("audit_trail"));
}

async function projectIdsForUser(ctx?: ProjectAccessContext) {
  if (!ctx?.userId || ctx.isGuest || ctx.userId === "guest-user") return [];
  return getAccessibleProjectIds(ctx);
}

async function canAccessEntity(entityType: ApprovalEntityType, entityId: string, ctx?: ProjectAccessContext) {
  if (!isUuid(entityId)) return false;
  const projectIds = await projectIdsForUser(ctx);
  if (projectIds.length === 0) return false;
  const table = entityTables[entityType];
  if (!(await tableExists(table)) || !(await tableHasColumn(table, "project_id"))) return false;

  const result = await query(
    `select 1 from ${table}
     where id = $1::uuid and project_id = any($2::uuid[])
     limit 1`,
    [entityId, projectIds],
  );
  return Boolean(result.rows[0]);
}

function mapGate(row: any) {
  return {
    id: row.id,
    gate_id: row.gate_id,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    gate_name: row.gate_name,
    from_status: row.from_status,
    to_status: row.to_status,
    status: row.status,
    decision_by: row.decision_by,
    decision_at: row.decision_at,
    decision_notes: row.decision_notes,
    ai_recommendation: row.ai_recommendation,
    ai_confidence: row.ai_confidence,
    ai_analysis: row.ai_analysis,
    evidence_ids: row.evidence_ids,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapAudit(row: any) {
  return {
    id: row.id,
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    user_id: row.user_id,
    old_value: row.old_value,
    new_value: row.new_value,
    audit_metadata: row.audit_metadata,
    created_at: row.created_at,
  };
}

export async function listApprovalGatesForEntity(entityTypeValue: string, entityId: string, ctx?: ProjectAccessContext) {
  const entityType = normalizeEntityType(entityTypeValue);
  if (!entityType || !(await approvalTablesReady())) return [];
  if (!(await canAccessEntity(entityType, entityId, ctx))) return [];

  const result = await query(
    `select * from approval_gates
     where entity_type = $1 and entity_id = $2::uuid
     order by created_at asc`,
    [entityType, entityId],
  );
  return result.rows.map(mapGate);
}

export async function listApprovalAuditTrail(searchParams: URLSearchParams, ctx?: ProjectAccessContext) {
  if (!(await approvalTablesReady())) return [];

  const entityType = normalizeEntityType(searchParams.get("entity_type"));
  const entityId = searchParams.get("entity_id");
  const limit = Math.min(Math.max(Number.parseInt(searchParams.get("limit") || "50", 10) || 50, 1), 100);

  if (entityType && entityId) {
    if (!(await canAccessEntity(entityType, entityId, ctx))) return [];
    const result = await query(
      `select * from audit_trail
       where entity_type = $1 and entity_id = $2::uuid
       order by created_at desc
       limit $3`,
      [entityType, entityId, limit],
    );
    return result.rows.map(mapAudit);
  }

  const projectIds = await projectIdsForUser(ctx);
  if (projectIds.length === 0) return [];

  const existingEntries: Array<[ApprovalEntityType, string]> = [];
  for (const [type, table] of Object.entries(entityTables) as Array<[ApprovalEntityType, string]>) {
    if ((await tableExists(table)) && (await tableHasColumn(table, "project_id"))) {
      existingEntries.push([type, table]);
    }
  }
  if (existingEntries.length === 0) return [];

  const unionSql = existingEntries
    .map(([type, table]) => `select '${type}' as entity_type, id as entity_id from ${table} where project_id = any($1::uuid[])`)
    .join(" union all ");

  const result = await query(
    `select audit_trail.*
     from audit_trail
     join (${unionSql}) accessible
       on accessible.entity_type = audit_trail.entity_type
      and accessible.entity_id = audit_trail.entity_id
     order by audit_trail.created_at desc
     limit $2`,
    [projectIds, limit],
  );
  return result.rows.map(mapAudit);
}
