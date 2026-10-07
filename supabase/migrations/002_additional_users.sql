-- ============================================================
-- S3T: Create Additional Users (approver + audit)
-- Run in Supabase SQL Editor
-- ============================================================

DO $$
DECLARE
  v_org_id      UUID;
  v_proj1_id    UUID;
  v_proj2_id    UUID;
  v_approver_id UUID := gen_random_uuid();
  v_auditor_id  UUID := gen_random_uuid();
BEGIN

  SELECT id INTO v_org_id    FROM organizations WHERE slug = 's3t-enterprise' LIMIT 1;
  SELECT id INTO v_proj1_id  FROM projects WHERE name = 'Digital Transformation Programme' LIMIT 1;
  SELECT id INTO v_proj2_id  FROM projects WHERE name = 'S3T Tool Implementation' LIMIT 1;

  -- ── Approver user ──────────────────────────────────────────
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_approver_id,
    'authenticated', 'authenticated', 'approver@s3t.app',
    crypt('approver', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"S3T Approver"}',
    '', '', '', ''
  );

  INSERT INTO profiles (id, org_id, full_name, job_title)
  VALUES (v_approver_id, v_org_id, 'S3T Approver', 'Senior Manager');

  -- Approver is a Contributor on both projects (can review & approve gates)
  INSERT INTO project_members (project_id, user_id, role) VALUES (v_proj1_id, v_approver_id, 'Contributor') ON CONFLICT DO NOTHING;
  INSERT INTO project_members (project_id, user_id, role) VALUES (v_proj2_id, v_approver_id, 'Contributor') ON CONFLICT DO NOTHING;

  -- ── Audit user ─────────────────────────────────────────────
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_auditor_id,
    'authenticated', 'authenticated', 'audit@s3t.app',
    crypt('audit', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"S3T Auditor"}',
    '', '', '', ''
  );

  INSERT INTO profiles (id, org_id, full_name, job_title)
  VALUES (v_auditor_id, v_org_id, 'S3T Auditor', 'Internal Auditor');

  -- Auditor is read-only Viewer on both projects
  INSERT INTO project_members (project_id, user_id, role) VALUES (v_proj1_id, v_auditor_id, 'Viewer') ON CONFLICT DO NOTHING;
  INSERT INTO project_members (project_id, user_id, role) VALUES (v_proj2_id, v_auditor_id, 'Viewer') ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Done. Users created:
  approver@s3t.app / approver  (Contributor on both projects)
  audit@s3t.app    / audit      (Viewer on both projects)';
END $$;
