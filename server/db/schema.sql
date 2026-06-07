create table if not exists projects (
  id text primary key,
  name text not null,
  status text not null default 'In Progress',
  progress integer not null default 0,
  owner text not null,
  priority text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists requirements (
  id text primary key,
  title text not null,
  priority text not null,
  status text not null default 'Draft',
  creator text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists test_cases (
  id text primary key,
  title text not null,
  suite text not null,
  status text not null default 'Draft',
  priority text not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists test_runs (
  id text primary key,
  test_case_id text references test_cases(id) on delete set null,
  name text not null,
  environment text not null,
  tester text not null,
  status text not null,
  progress integer not null default 0,
  pass_count integer,
  fail_count integer,
  started_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists defects (
  id text primary key,
  test_case_id text references test_cases(id) on delete set null,
  title text not null,
  description text,
  severity text not null,
  status text not null default 'Open',
  owner text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists comments (
  id bigserial primary key,
  test_case_id text references test_cases(id) on delete cascade,
  author text not null,
  body text not null,
  created_at timestamptz not null default now()
);
