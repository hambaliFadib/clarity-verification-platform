-- ============================================================
-- CLEANUP: Remove orphan/guest-created data from all scoped tables
-- Run this against the Vercel production database
-- ============================================================

-- 1. Delete defects created by guest or with NULL project_id
DELETE FROM defects
WHERE reported_by = 'Guest User'
   OR reported_by ILIKE '%guest%'
   OR project_id IS NULL;

-- 2. Delete test_cases with NULL project_id (orphan)
DELETE FROM test_steps
WHERE test_case_id IN (
    SELECT id FROM test_cases WHERE project_id IS NULL
);
DELETE FROM test_cases WHERE project_id IS NULL;

-- 3. Delete test_runs with NULL project_id (orphan)
DELETE FROM test_run_test_cases
WHERE test_run_id IN (
    SELECT id FROM test_runs WHERE project_id IS NULL
);
DELETE FROM test_run_executions
WHERE test_run_id IN (
    SELECT id FROM test_runs WHERE project_id IS NULL
);
DELETE FROM test_runs WHERE project_id IS NULL;

-- 4. Delete environments with NULL project_id
DELETE FROM environments WHERE project_id IS NULL;

-- 5. Delete releases with NULL project_id
DELETE FROM releases WHERE project_id IS NULL;

-- 6. Delete work_items with NULL project_id
DELETE FROM work_items WHERE project_id IS NULL;

-- 7. Delete activity_items with NULL project_id
DELETE FROM activity_items WHERE project_id IS NULL;

-- 8. Verify: count remaining rows with NULL project_id per table
SELECT 'defects' as tbl, COUNT(*) as orphans FROM defects WHERE project_id IS NULL
UNION ALL SELECT 'test_cases', COUNT(*) FROM test_cases WHERE project_id IS NULL
UNION ALL SELECT 'test_runs', COUNT(*) FROM test_runs WHERE project_id IS NULL
UNION ALL SELECT 'environments', COUNT(*) FROM environments WHERE project_id IS NULL
UNION ALL SELECT 'releases', COUNT(*) FROM releases WHERE project_id IS NULL
UNION ALL SELECT 'work_items', COUNT(*) FROM work_items WHERE project_id IS NULL
UNION ALL SELECT 'activity_items', COUNT(*) FROM activity_items WHERE project_id IS NULL;
