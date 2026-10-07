-- ============================================================
-- S3T Platform — Demo Seed Data
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================
-- NOTE: The 4 test users must be created in Supabase Auth first
-- (Authentication → Users → Add user) with the emails below,
-- THEN run this script to insert their profile rows.
-- ============================================================

-- ── 0. Clean up any existing demo data ──────────────────────
DELETE FROM milestones        WHERE project_id IN (SELECT id FROM projects WHERE org_id IN (SELECT id FROM organizations WHERE slug = 'demo-corp'));
DELETE FROM wbs_elements      WHERE project_id IN (SELECT id FROM projects WHERE org_id IN (SELECT id FROM organizations WHERE slug = 'demo-corp'));
DELETE FROM project_members   WHERE project_id IN (SELECT id FROM projects WHERE org_id IN (SELECT id FROM organizations WHERE slug = 'demo-corp'));
DELETE FROM projects          WHERE org_id IN (SELECT id FROM organizations WHERE slug = 'demo-corp');
DELETE FROM organizations     WHERE slug = 'demo-corp';

-- ── 1. Demo Organization ─────────────────────────────────────
INSERT INTO organizations (id, name, slug, created_at, updated_at)
VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'Demo Corp',
  'demo-corp',
  NOW(), NOW()
);

-- ── 2. Profiles (match these IDs to the Supabase Auth user UUIDs) ──
-- IMPORTANT: Replace the UUIDs below with the actual user IDs
-- from Authentication → Users after creating each account.
-- The emails and passwords to create in Supabase Auth are:
--   admin@s3t-demo.com    / S3tAdmin2026!
--   pm@s3t-demo.com       / S3tPM2026!
--   approver@s3t-demo.com / S3tApprove2026!
--   auditor@s3t-demo.com  / S3tAudit2026!

-- UPDATE THESE UUIDs after creating users in Supabase Auth:
DO $$
DECLARE
  admin_id    uuid := 'REPLACE_WITH_ADMIN_UUID';
  pm_id       uuid := 'REPLACE_WITH_PM_UUID';
  approver_id uuid := 'REPLACE_WITH_APPROVER_UUID';
  auditor_id  uuid := 'REPLACE_WITH_AUDITOR_UUID';
  org_id      uuid := 'a1000000-0000-0000-0000-000000000001';
  proj1_id    uuid := 'b1000000-0000-0000-0000-000000000001';
  proj2_id    uuid := 'b1000000-0000-0000-0000-000000000002';
BEGIN

  -- Profiles
  INSERT INTO profiles (id, org_id, full_name, job_title, created_at, updated_at)
  VALUES
    (admin_id,    org_id, 'Alex Admin',    'Admin',    NOW(), NOW()),
    (pm_id,       org_id, 'Patricia Moore', 'PM',       NOW(), NOW()),
    (approver_id, org_id, 'Aaron Wright',  'Approver', NOW(), NOW()),
    (auditor_id,  org_id, 'Amy Chen',      'Auditor',  NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    org_id     = EXCLUDED.org_id,
    job_title  = EXCLUDED.job_title,
    updated_at = NOW();

  -- ── 3. Projects ──────────────────────────────────────────────
  INSERT INTO projects (id, org_id, name, description, status, start_date, end_date, budget_hours, created_by, created_at, updated_at)
  VALUES
    (
      proj1_id, org_id,
      'ERP System Modernization',
      'Full replacement of legacy ERP system with cloud-native solution including data migration, integration, and training.',
      'active',
      '2026-01-15', '2026-12-31',
      4800,
      pm_id, NOW(), NOW()
    ),
    (
      proj2_id, org_id,
      'Mobile App v2.0',
      'Redesign and rebuild of the customer-facing mobile application with new UX, offline mode, and push notifications.',
      'draft',
      '2026-06-01', '2026-11-30',
      2400,
      pm_id, NOW(), NOW()
    );

  -- ── 4. Project Members ────────────────────────────────────────
  INSERT INTO project_members (id, project_id, user_id, role, joined_at)
  VALUES
    (gen_random_uuid(), proj1_id, admin_id,    'Admin',       NOW()),
    (gen_random_uuid(), proj1_id, pm_id,       'PM',          NOW()),
    (gen_random_uuid(), proj1_id, approver_id, 'Approver',    NOW()),
    (gen_random_uuid(), proj1_id, auditor_id,  'Viewer',      NOW()),
    (gen_random_uuid(), proj2_id, pm_id,       'PM',          NOW()),
    (gen_random_uuid(), proj2_id, approver_id, 'Approver',    NOW());

  -- ── 5. WBS Elements (Project 1) ──────────────────────────────
  INSERT INTO wbs_elements (id, project_id, parent_id, wbs_code, level, name, status, effort_hours, start_date, end_date, sort_order, created_by, created_at, updated_at)
  VALUES
    -- Phase 1: Discovery
    ('c1000000-0000-0000-0000-000000000001', proj1_id, NULL, '1', 1, 'Discovery & Planning', 'completed', 320, '2026-01-15', '2026-02-28', 1, pm_id, NOW(), NOW()),
      ('c1000000-0000-0000-0000-000000000101', proj1_id, 'c1000000-0000-0000-0000-000000000001', '1.1', 2, 'Requirements Gathering', 'completed', 160, '2026-01-15', '2026-02-01', 1, pm_id, NOW(), NOW()),
      ('c1000000-0000-0000-0000-000000000102', proj1_id, 'c1000000-0000-0000-0000-000000000001', '1.2', 2, 'Current State Analysis', 'completed', 160, '2026-02-02', '2026-02-28', 2, pm_id, NOW(), NOW()),
    
    -- Phase 2: Design
    ('c1000000-0000-0000-0000-000000000002', proj1_id, NULL, '2', 1, 'System Design & Architecture', 'in_progress', 800, '2026-03-01', '2026-05-31', 2, pm_id, NOW(), NOW()),
      ('c1000000-0000-0000-0000-000000000201', proj1_id, 'c1000000-0000-0000-0000-000000000002', '2.1', 2, 'High Level Design', 'completed', 300, '2026-03-01', '2026-03-31', 1, pm_id, NOW(), NOW()),
      ('c1000000-0000-0000-0000-000000000202', proj1_id, 'c1000000-0000-0000-0000-000000000002', '2.2', 2, 'Detailed API Specs', 'in_progress', 500, '2026-04-01', '2026-05-31', 2, pm_id, NOW(), NOW()),

    -- Phase 3: Dev
    ('c1000000-0000-0000-0000-000000000003', proj1_id, NULL, '3', 1, 'Development & Integration', 'not_started', 2400, '2026-06-01', '2026-10-31', 3, pm_id, NOW(), NOW()),
    
    -- Phase 4: QA
    ('c1000000-0000-0000-0000-000000000004', proj1_id, NULL, '4', 1, 'Testing & QA', 'not_started', 800, '2026-11-01', '2026-11-30', 4, pm_id, NOW(), NOW()),
    
    -- Phase 5: Deploy
    ('c1000000-0000-0000-0000-000000000005', proj1_id, NULL, '5', 1, 'Deployment & Training', 'not_started', 480, '2026-12-01', '2026-12-31', 5, pm_id, NOW(), NOW());

  -- ── 6. Milestones (Project 1) ─────────────────────────────────
  INSERT INTO milestones (id, project_id, name, due_date, status, created_by, created_at)
  VALUES
    (gen_random_uuid(), proj1_id, 'Discovery Sign-off',      '2026-02-28', 'reached',  pm_id, NOW()),
    (gen_random_uuid(), proj1_id, 'Architecture Approved',   '2026-05-31', 'upcoming', pm_id, NOW()),
    (gen_random_uuid(), proj1_id, 'Development Complete',    '2026-10-31', 'upcoming', pm_id, NOW()),
    (gen_random_uuid(), proj1_id, 'UAT Sign-off',            '2026-11-30', 'upcoming', pm_id, NOW()),
    (gen_random_uuid(), proj1_id, 'Go Live',                 '2026-12-31', 'upcoming', pm_id, NOW());

  RAISE NOTICE 'S3T Demo seed completed successfully!';

END $$;
