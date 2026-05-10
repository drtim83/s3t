-- ============================================================
-- E3T Platform — Full Database Migration
-- Project: ucisjikwuulslqgbnwac
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE project_role    AS ENUM ('Admin', 'PM', 'Contributor', 'Viewer');
  CREATE TYPE dependency_type AS ENUM ('FS','SS','FF','SF');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ─── 1. organizations ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── 2. profiles ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id      UUID REFERENCES organizations(id),
  full_name   TEXT,
  avatar_url  TEXT,
  job_title   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── 3. projects ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('draft','active','on_hold','completed','archived')),
  start_date    DATE,
  end_date      DATE,
  budget_hours  NUMERIC(10,2),
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── 4. project_members ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        project_role NOT NULL DEFAULT 'Viewer',
  joined_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- ─── 5. wbs_elements ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wbs_elements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id     UUID REFERENCES wbs_elements(id) ON DELETE SET NULL,
  wbs_code      TEXT NOT NULL,
  level         SMALLINT NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'not_started'
                CHECK (status IN ('not_started','in_progress','blocked','completed','cancelled')),
  phase         TEXT,
  effort_hours  NUMERIC(8,2),
  start_date    DATE,
  end_date      DATE,
  assigned_to   UUID REFERENCES profiles(id),
  sort_order    INT NOT NULL DEFAULT 0,
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wbs_project ON wbs_elements(project_id);
CREATE INDEX IF NOT EXISTS idx_wbs_parent  ON wbs_elements(parent_id);

-- ─── 6. wbs_dependencies ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS wbs_dependencies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predecessor_id  UUID NOT NULL REFERENCES wbs_elements(id) ON DELETE CASCADE,
  successor_id    UUID NOT NULL REFERENCES wbs_elements(id) ON DELETE CASCADE,
  dep_type        dependency_type NOT NULL DEFAULT 'FS',
  lag_days        NUMERIC(5,1) DEFAULT 0,
  UNIQUE(predecessor_id, successor_id)
);

-- ─── 7. scope_documents ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS scope_documents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  sow_text          TEXT,
  version           INT NOT NULL DEFAULT 1,
  signature_status  TEXT NOT NULL DEFAULT 'unsigned'
                    CHECK (signature_status IN ('unsigned','pending','signed','rejected')),
  signed_by         UUID REFERENCES profiles(id),
  signed_at         TIMESTAMPTZ,
  created_by        UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ─── 8. discussions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discussions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wbs_element_id    UUID NOT NULL REFERENCES wbs_elements(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  author_id         UUID NOT NULL REFERENCES profiles(id),
  body              TEXT NOT NULL,
  is_edited         BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disc_wbs ON discussions(wbs_element_id);

-- ─── 9. discussion_attachments ───────────────────────────────
CREATE TABLE IF NOT EXISTS discussion_attachments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id   UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  file_url        TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  file_size_bytes INT,
  uploaded_by     UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── 10. resources ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  wbs_element_id      UUID NOT NULL REFERENCES wbs_elements(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES profiles(id),
  effort_allocated_h  NUMERIC(8,2) NOT NULL DEFAULT 0,
  role_label          TEXT,
  assigned_at         TIMESTAMPTZ DEFAULT now(),
  UNIQUE(wbs_element_id, user_id)
);

-- ─── 11. milestones ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS milestones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  due_date    DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'upcoming'
              CHECK (status IN ('upcoming','reached','missed')),
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── 12. webhooks ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhooks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  trigger_event   TEXT NOT NULL,
  endpoint_url    TEXT NOT NULL,
  secret_token    TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── 13. webhook_logs ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id      UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  triggered_at    TIMESTAMPTZ DEFAULT now(),
  http_status     SMALLINT,
  response_body   TEXT,
  success         BOOLEAN,
  payload_json    JSONB
);

-- ─── 14. ai_jobs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scope_doc_id    UUID REFERENCES scope_documents(id),
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','processing','completed','failed')),
  input_text      TEXT,
  output_json     JSONB,
  reviewed        BOOLEAN DEFAULT false,
  approved        BOOLEAN,
  error_message   TEXT,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

-- ─── 15. audit_log ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID REFERENCES profiles(id),
  action        TEXT NOT NULL,
  target_table  TEXT NOT NULL,
  target_id     UUID,
  diff_json     JSONB,
  ip_address    INET,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_log(target_table, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor  ON audit_log(actor_id);

-- ─── updated_at trigger function ─────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'organizations','profiles','projects','wbs_elements',
    'scope_documents','discussions'
  ] LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_updated_at ON %I;
      CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    ', t, t);
  END LOOP;
END $$;

-- ─── Row Level Security ───────────────────────────────────────
ALTER TABLE organizations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE wbs_elements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE wbs_dependencies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources            ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones           ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log            ENABLE ROW LEVEL SECURITY;

-- profiles: users see/edit own row
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());

-- projects: visible to project members
DROP POLICY IF EXISTS "projects_select_members" ON projects;
DROP POLICY IF EXISTS "projects_insert_auth"    ON projects;
DROP POLICY IF EXISTS "projects_update_pm"      ON projects;
CREATE POLICY "projects_select_members" ON projects
  FOR SELECT USING (
    id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
    OR created_by = auth.uid()
  );
CREATE POLICY "projects_insert_auth" ON projects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "projects_update_pm" ON projects
  FOR UPDATE USING (
    id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role IN ('Admin','PM'))
  );

-- project_members
DROP POLICY IF EXISTS "pm_select_members" ON project_members;
DROP POLICY IF EXISTS "pm_insert_admin"   ON project_members;
CREATE POLICY "pm_select_members" ON project_members
  FOR SELECT USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );
CREATE POLICY "pm_insert_admin" ON project_members
  FOR INSERT WITH CHECK (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role = 'Admin')
    OR auth.uid() = user_id
  );

-- wbs_elements
DROP POLICY IF EXISTS "wbs_select_members"    ON wbs_elements;
DROP POLICY IF EXISTS "wbs_insert_pm"         ON wbs_elements;
DROP POLICY IF EXISTS "wbs_update_contributor" ON wbs_elements;
DROP POLICY IF EXISTS "wbs_delete_admin"      ON wbs_elements;
CREATE POLICY "wbs_select_members" ON wbs_elements
  FOR SELECT USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );
CREATE POLICY "wbs_insert_pm" ON wbs_elements
  FOR INSERT WITH CHECK (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role IN ('Admin','PM'))
  );
CREATE POLICY "wbs_update_contributor" ON wbs_elements
  FOR UPDATE USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role IN ('Admin','PM','Contributor'))
  );
CREATE POLICY "wbs_delete_admin" ON wbs_elements
  FOR DELETE USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role = 'Admin')
  );

-- discussions
DROP POLICY IF EXISTS "disc_select_members" ON discussions;
DROP POLICY IF EXISTS "disc_insert_auth"    ON discussions;
DROP POLICY IF EXISTS "disc_update_own"     ON discussions;
DROP POLICY IF EXISTS "disc_delete_own"     ON discussions;
CREATE POLICY "disc_select_members" ON discussions
  FOR SELECT USING (
    wbs_element_id IN (
      SELECT id FROM wbs_elements WHERE
        project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "disc_insert_auth" ON discussions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());
CREATE POLICY "disc_update_own"  ON discussions
  FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "disc_delete_own"  ON discussions
  FOR DELETE USING (author_id = auth.uid());

-- scope_documents
DROP POLICY IF EXISTS "scope_select_members" ON scope_documents;
DROP POLICY IF EXISTS "scope_insert_pm"      ON scope_documents;
CREATE POLICY "scope_select_members" ON scope_documents
  FOR SELECT USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );
CREATE POLICY "scope_insert_pm" ON scope_documents
  FOR INSERT WITH CHECK (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role IN ('Admin','PM'))
  );

-- milestones / resources / webhooks / ai_jobs / audit_log
DROP POLICY IF EXISTS "milestones_select" ON milestones;
DROP POLICY IF EXISTS "resources_select"  ON resources;
DROP POLICY IF EXISTS "ai_jobs_select"    ON ai_jobs;
DROP POLICY IF EXISTS "webhooks_select"   ON webhooks;
DROP POLICY IF EXISTS "audit_select"      ON audit_log;
CREATE POLICY "milestones_select" ON milestones FOR SELECT USING (
  project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
);
CREATE POLICY "resources_select" ON resources FOR SELECT USING (
  project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
);
CREATE POLICY "ai_jobs_select" ON ai_jobs FOR SELECT USING (
  project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role IN ('Admin','PM'))
);
CREATE POLICY "webhooks_select" ON webhooks FOR SELECT USING (
  project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role IN ('Admin','PM'))
);
CREATE POLICY "audit_select" ON audit_log FOR SELECT USING (
  actor_id = auth.uid()
);
