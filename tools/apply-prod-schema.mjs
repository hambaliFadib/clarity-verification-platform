import pg from "pg";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL or POSTGRES_URL is required.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("sslmode=") || databaseUrl.includes(".neon.tech")
    ? { rejectUnauthorized: false }
    : undefined,
});

const statements = [
  `create extension if not exists pgcrypto`,
  `create table if not exists users (
    id uuid primary key,
    name varchar(100) not null,
    email varchar(255) not null,
    role varchar(20) not null,
    avatar varchar(500),
    initials varchar(5) not null,
    created_at timestamptz not null
  )`,
  `create unique index if not exists ix_users_email on users (email)`,
  `create table if not exists test_cases (
    id uuid primary key,
    display_id varchar(20) not null,
    title varchar(255) not null,
    description text,
    module varchar(100) not null,
    type varchar(20) not null,
    severity varchar(10) not null,
    status varchar(20) not null,
    assigned_to uuid references users(id),
    created_by uuid references users(id),
    requirement_id varchar(50),
    estimated_time varchar(30),
    tags text[],
    environment varchar(20),
    automation_status varchar(30),
    preconditions text,
    expected_result text not null,
    notes text,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    deleted_at timestamptz
  )`,
  `create unique index if not exists ix_test_cases_display_id on test_cases (display_id)`,
  `create table if not exists test_steps (
    id uuid primary key,
    test_case_id uuid not null references test_cases(id) on delete cascade,
    step_number integer not null,
    action text not null,
    test_data text,
    expected_result text,
    status varchar(10),
    actual_result text
  )`,
  `create table if not exists defects (
    id uuid primary key,
    display_id varchar(20) not null,
    title varchar(255) not null,
    description text,
    severity varchar(10) not null,
    status varchar(20) not null,
    type varchar(20) not null,
    priority varchar(10) not null,
    assigned_to varchar(100),
    reported_by varchar(100),
    linked_test_case varchar(20),
    linked_test_run varchar(120),
    environment varchar(120),
    browser varchar(120),
    steps_to_reproduce text,
    tags text[],
    created_at timestamptz not null,
    updated_at timestamptz not null,
    resolved_at timestamptz,
    deleted_at timestamptz
  )`,
  `create unique index if not exists ix_defects_display_id on defects (display_id)`,
  `create index if not exists ix_defects_linked_test_case on defects (linked_test_case)`,
  `create table if not exists defect_comments (
    id uuid primary key,
    defect_id uuid not null references defects(id) on delete cascade,
    author varchar(100) not null,
    initials varchar(5) not null,
    text text not null,
    created_at timestamptz not null
  )`,
  `create table if not exists environments (
    id uuid primary key,
    name varchar(120) not null,
    url varchar(500) not null,
    type varchar(20) not null,
    status varchar(20) not null,
    last_deployed timestamptz,
    version varchar(50),
    description text,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    deleted_at timestamptz
  )`,
  `create table if not exists projects (
    id uuid primary key,
    name varchar(150) not null,
    prefix varchar(12) not null,
    description text,
    default_priority varchar(10) not null,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    deleted_at timestamptz
  )`,
  `create unique index if not exists ix_projects_prefix on projects (prefix)`,
  `create table if not exists releases (
    id uuid primary key,
    version varchar(50) not null,
    name varchar(150) not null,
    status varchar(20) not null,
    start_date date not null,
    target_date date not null,
    release_date date,
    description text,
    total_test_cases integer not null,
    passed_test_cases integer not null,
    total_defects integer not null,
    open_defects integer not null,
    critical_defects integer not null,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    deleted_at timestamptz
  )`,
  `create unique index if not exists ix_releases_version on releases (version)`,
  `create table if not exists test_runs (
    id uuid primary key,
    display_id varchar(20) not null,
    name varchar(150) not null,
    description text,
    status varchar(20) not null,
    environment varchar(120) not null,
    release varchar(80),
    assigned_to varchar(100) not null,
    total_cases integer not null,
    passed integer not null,
    failed integer not null,
    blocked integer not null,
    not_run integer not null,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    deleted_at timestamptz
  )`,
  `create unique index if not exists ix_test_runs_display_id on test_runs (display_id)`,
  `create table if not exists work_items (
    id uuid primary key,
    title varchar(255) not null,
    type varchar(20) not null,
    status varchar(20) not null,
    priority varchar(10) not null,
    progress integer not null,
    scope varchar(120),
    assigned_to varchar(100) not null,
    due_in varchar(40),
    created_at timestamptz not null,
    updated_at timestamptz not null,
    deleted_at timestamptz
  )`,
  `create table if not exists activity_items (
    id uuid primary key,
    "user" varchar(100) not null,
    user_initials varchar(5) not null,
    action varchar(20) not null,
    target_type varchar(20) not null,
    target_id varchar(50) not null,
    target_title varchar(255),
    detail text,
    created_at timestamptz not null
  )`,
  `create index if not exists ix_activity_items_target_id on activity_items (target_id)`,
  `create table if not exists alembic_version (
    version_num varchar(32) primary key
  )`,
  `insert into alembic_version (version_num)
   values ('20260610_0001')
   on conflict (version_num) do nothing`,
];

const client = await pool.connect();

try {
  await client.query("begin");
  for (const statement of statements) {
    await client.query(statement);
  }
  await client.query("commit");
  console.log(`Applied ${statements.length} schema statements.`);
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  client.release();
  await pool.end();
}
